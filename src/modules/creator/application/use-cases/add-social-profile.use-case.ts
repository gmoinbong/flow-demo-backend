import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import { creator_social_profiles } from 'src/shared/core/infrastructure/database/schema';
import { and, eq } from 'drizzle-orm';

export interface AddSocialProfileCommand {
  creatorId: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  username: string;
  profileUrl?: string;
  followersDeclared?: number;
  engagementRateDeclared?: number;
  location?: string;
  niches?: string[];
  isPrimary?: boolean;
}

@Injectable()
export class AddSocialProfileUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
    @Inject(SHARED_DI_TOKENS.DATABASE_CLIENT)
    private readonly db: Database,
  ) {}

  async execute(command: AddSocialProfileCommand): Promise<void> {
    // Check if creator exists
    const creator = await this.creatorRepository.findById(command.creatorId);
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Check if social profile already exists
    const existing = await this.db
      .select()
      .from(creator_social_profiles)
      .where(
        and(
          eq(creator_social_profiles.creator_id, command.creatorId),
          eq(creator_social_profiles.platform, command.platform),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing profile
      await this.db
        .update(creator_social_profiles)
        .set({
          username: command.username,
          profile_url: command.profileUrl || null,
          followers_declared: command.followersDeclared || null,
          engagement_rate_declared: command.engagementRateDeclared
            ? String(command.engagementRateDeclared)
            : null,
          location: command.location || null,
          niches: command.niches || null,
          is_primary: command.isPrimary || false,
          updated_at: new Date(),
        })
        .where(eq(creator_social_profiles.id, existing[0].id));
    } else {
      // Create new profile
      await this.db.insert(creator_social_profiles).values({
        creator_id: command.creatorId,
        platform: command.platform,
        username: command.username,
        profile_url: command.profileUrl || null,
        followers_declared: command.followersDeclared || null,
        engagement_rate_declared: command.engagementRateDeclared
          ? String(command.engagementRateDeclared)
          : null,
        location: command.location || null,
        niches: command.niches || null,
        is_primary: command.isPrimary || false,
      });
    }
  }
}

