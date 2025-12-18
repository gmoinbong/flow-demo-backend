import { NotFoundException } from '@nestjs/common';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { brands, users, user_role } from 'src/shared/core/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface UpdateProfileCommand {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  status?: 'pending' | 'active' | 'suspended';
  // Brand-specific fields
  companySize?: string | null;
  userRole?: string | null;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly db: Database,
  ) { }

  async execute(command: UpdateProfileCommand): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(command.userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // If status is provided, create updated profile with new status
    if (command.status) {
      const updatedProfile = Profile.fromPersistence(
        profile.id,
        profile.userId,
        command.firstName !== undefined ? command.firstName : profile.firstName,
        command.lastName !== undefined ? command.lastName : profile.lastName,
        command.displayName !== undefined ? command.displayName : profile.displayName,
        command.bio !== undefined ? command.bio : profile.bio,
        command.avatarUrl !== undefined ? command.avatarUrl : profile.avatarUrl,
        command.status,
        profile.createdAt,
        new Date(),
      );
      const savedProfile = await this.profileRepository.save(updatedProfile);

      // If status is being set to 'active' and user is brand, ensure brand record exists
      if (command.status === 'active') {
        // Check user role
        const userWithRole = await this.db
          .select({
            roleName: user_role.name,
          })
          .from(users)
          .innerJoin(user_role, eq(user_role.id, users.role_id))
          .where(eq(users.id, command.userId))
          .limit(1);

        if (userWithRole.length > 0 && userWithRole[0].roleName === 'brand') {
          // Check if brand already exists
          const existingBrand = await this.db
            .select({ id: brands.id })
            .from(brands)
            .where(eq(brands.profile_id, profile.id))
            .limit(1);

          if (existingBrand.length === 0) {
            // Create brand record
            const brandId = randomUUID();
            const now = new Date();
            const brandName = savedProfile.displayName ||
              (savedProfile.firstName && savedProfile.lastName
                ? `${savedProfile.firstName} ${savedProfile.lastName}`.trim()
                : null) ||
              'My Brand';

            await this.db.insert(brands).values({
              id: brandId,
              name: brandName,
              description: savedProfile.bio || null,
              website_url: null,
              logo_url: savedProfile.avatarUrl || null,
              brand_type: null,
              company_size: command.companySize || null,
              user_role: command.userRole || null,
              profile_id: profile.id,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      return savedProfile;
    }

    // Otherwise just update basic fields
    const updatedProfile = profile.update(
      command.firstName !== undefined ? command.firstName : profile.firstName,
      command.lastName !== undefined ? command.lastName : profile.lastName,
      command.displayName !== undefined ? command.displayName : profile.displayName,
      command.bio !== undefined ? command.bio : profile.bio,
      command.avatarUrl !== undefined ? command.avatarUrl : profile.avatarUrl,
    );

    return await this.profileRepository.save(updatedProfile);
  }
}

