import { eq } from 'drizzle-orm';
import { profile } from 'src/shared/core/infrastructure/database/schema';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';

/**
 * Profile repository implementation using Drizzle ORM
 */
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly db: Database) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const result = await this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Profile.fromPersistence(
      row.id,
      row.user_id!,
      row.first_name || null,
      row.last_name || null,
      row.display_name || null,
      row.bio || null,
      row.avatar_url || null,
      row.status || 'pending',
      row.created_at!,
      row.updated_at!,
    );
  }

  async findById(id: string): Promise<Profile | null> {
    const result = await this.db
      .select()
      .from(profile)
      .where(eq(profile.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Profile.fromPersistence(
      row.id,
      row.user_id!,
      row.first_name || null,
      row.last_name || null,
      row.display_name || null,
      row.bio || null,
      row.avatar_url || null,
      row.status || 'pending',
      row.created_at!,
      row.updated_at!,
    );
  }

  async save(profileEntity: Profile): Promise<Profile> {
    const existing = await this.findById(profileEntity.id);

    const profileData = {
      id: profileEntity.id,
      user_id: profileEntity.userId,
      first_name: profileEntity.firstName,
      last_name: profileEntity.lastName,
      display_name: profileEntity.displayName,
      bio: profileEntity.bio,
      avatar_url: profileEntity.avatarUrl,
      status: profileEntity.status.value,
      updated_at: profileEntity.updatedAt,
    };

    if (existing) {
      // Update
      await this.db
        .update(profile)
        .set(profileData)
        .where(eq(profile.id, profileEntity.id));
    } else {
      // Insert
      await this.db.insert(profile).values({
        ...profileData,
        created_at: profileEntity.createdAt,
      });
    }

    return profileEntity;
  }
}

