import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IProfileRepository } from '../../../profile/domain/repositories/profile.repository.interface';
import { PROFILE_DI_TOKENS } from '../../../profile/profile.tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import { creator_social_profiles, profile, users, user_role } from 'src/shared/core/infrastructure/database/schema';
import { and, eq } from 'drizzle-orm';
import { Profile } from '../../../profile/domain/entities/profile.entity';
import { randomUUID } from 'crypto';

export interface CompleteCreatorOnboardingCommand {
    userId: string;
    instagramHandle?: string;
    instagramFollowers?: number;
    tiktokHandle?: string;
    tiktokFollowers?: number;
    youtubeHandle?: string;
    youtubeSubscribers?: number;
    niche?: string[];
    bio?: string;
    audienceLocation?: string;
}

@Injectable()
export class CompleteCreatorOnboardingUseCase {
    constructor(
        @Inject(PROFILE_DI_TOKENS.PROFILE_REPOSITORY)
        private readonly profileRepository: IProfileRepository,
        @Inject(SHARED_DI_TOKENS.DATABASE_CLIENT)
        private readonly db: Database,
    ) { }

    async execute(command: CompleteCreatorOnboardingCommand): Promise<void> {
        // Verify user has creator role
        const userWithRole = await this.db
            .select({
                roleName: user_role.name,
                userEmail: users.email,
            })
            .from(users)
            .innerJoin(user_role, eq(user_role.id, users.role_id))
            .where(eq(users.id, command.userId))
            .limit(1);

        if (userWithRole.length === 0 || userWithRole[0].roleName !== 'creator') {
            throw new BadRequestException('User is not a creator');
        }

        // Get or create profile by userId
        let profileEntity = await this.profileRepository.findByUserId(command.userId);

        if (!profileEntity) {
            // Create profile if it doesn't exist (e.g., for OAuth users)
            const profileId = randomUUID();
            const now = new Date();

            // Extract name from email if available (for OAuth users)
            const email = userWithRole[0].userEmail;
            const emailName = email.split('@')[0];

            await this.db.insert(profile).values({
                id: profileId,
                user_id: command.userId,
                first_name: null,
                last_name: null,
                display_name: emailName || null,
                bio: null,
                avatar_url: null,
                status: 'pending',
                created_at: now,
                updated_at: now,
            });

            // Fetch the created profile
            profileEntity = await this.profileRepository.findByUserId(command.userId);
            if (!profileEntity) {
                throw new NotFoundException('Failed to create profile');
            }
        }

        // Update profile status to 'active' and bio if provided
        const updatedProfile = Profile.fromPersistence(
            profileEntity.id,
            profileEntity.userId,
            profileEntity.firstName,
            profileEntity.lastName,
            profileEntity.displayName,
            command.bio || profileEntity.bio,
            profileEntity.avatarUrl,
            'active', // Set status to active
            profileEntity.createdAt,
            new Date(),
        );

        await this.profileRepository.save(updatedProfile);

        // Create or update social profiles
        const creatorId = profileEntity.id; // creator_id in creator_social_profiles is profile.id

        // Instagram
        if (command.instagramHandle) {
            await this.upsertSocialProfile({
                creatorId,
                platform: 'instagram',
                username: command.instagramHandle,
                followersDeclared: command.instagramFollowers,
                niches: command.niche,
                location: command.audienceLocation,
                isPrimary: true, // Set first platform as primary
            });
        }

        // TikTok
        if (command.tiktokHandle) {
            await this.upsertSocialProfile({
                creatorId,
                platform: 'tiktok',
                username: command.tiktokHandle,
                followersDeclared: command.tiktokFollowers,
                niches: command.niche,
                location: command.audienceLocation,
                isPrimary: !command.instagramHandle, // Primary if Instagram not provided
            });
        }

        // YouTube
        if (command.youtubeHandle) {
            await this.upsertSocialProfile({
                creatorId,
                platform: 'youtube',
                username: command.youtubeHandle,
                followersDeclared: command.youtubeSubscribers,
                niches: command.niche,
                location: command.audienceLocation,
                isPrimary: !command.instagramHandle && !command.tiktokHandle, // Primary if others not provided
            });
        }
    }

    private async upsertSocialProfile(params: {
        creatorId: string;
        platform: 'instagram' | 'tiktok' | 'youtube';
        username: string;
        followersDeclared?: number;
        niches?: string[];
        location?: string;
        isPrimary: boolean;
    }): Promise<void> {
        // Check if social profile already exists
        const existing = await this.db
            .select()
            .from(creator_social_profiles)
            .where(
                and(
                    eq(creator_social_profiles.creator_id, params.creatorId),
                    eq(creator_social_profiles.platform, params.platform),
                ),
            )
            .limit(1);

        const profileUrl = this.buildProfileUrl(params.platform, params.username);

        if (existing.length > 0) {
            // Update existing profile
            await this.db
                .update(creator_social_profiles)
                .set({
                    username: params.username,
                    profile_url: profileUrl,
                    followers_declared: params.followersDeclared || null,
                    niches: params.niches || null,
                    location: params.location || null,
                    is_primary: params.isPrimary,
                    updated_at: new Date(),
                })
                .where(eq(creator_social_profiles.id, existing[0].id));
        } else {
            // Create new profile
            await this.db.insert(creator_social_profiles).values({
                creator_id: params.creatorId,
                platform: params.platform,
                username: params.username,
                profile_url: profileUrl,
                followers_declared: params.followersDeclared || null,
                niches: params.niches || null,
                location: params.location || null,
                is_primary: params.isPrimary,
            });
        }
    }

    private buildProfileUrl(platform: 'instagram' | 'tiktok' | 'youtube', username: string): string {
        const cleanUsername = username.replace('@', '').trim();
        switch (platform) {
            case 'instagram':
                return `https://instagram.com/${cleanUsername}`;
            case 'tiktok':
                return `https://tiktok.com/@${cleanUsername}`;
            case 'youtube':
                return `https://youtube.com/@${cleanUsername}`;
            default:
                return '';
        }
    }
}

