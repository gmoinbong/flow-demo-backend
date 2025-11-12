import { eq, and, sql } from 'drizzle-orm';
import { profile, users, user_role } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';

/**
 * Creator repository implementation using Drizzle ORM
 * Creators are profiles with role_id pointing to user_role with name='creator'
 */
export class CreatorRepository implements ICreatorRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Creator | null> {
    const result = await this.db
      .select({
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
      .from(profile)
      .innerJoin(users, eq(users.id, profile.user_id))
      .innerJoin(user_role, eq(user_role.id, users.role_id))
      .where(and(eq(profile.id, id), eq(user_role.name, 'creator')))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Creator.fromPersistence(
      row.id,
      row.user_id!,
      row.display_name || null,
      row.bio || null,
      row.avatar_url || null,
      row.status || 'pending',
      row.created_at!,
      row.updated_at!,
    );
  }

  async findByUserId(userId: string): Promise<Creator | null> {
    const result = await this.db
      .select({
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
      .from(profile)
      .innerJoin(users, eq(users.id, profile.user_id))
      .innerJoin(user_role, eq(user_role.id, users.role_id))
      .where(and(eq(profile.user_id, userId), eq(user_role.name, 'creator')))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Creator.fromPersistence(
      row.id,
      row.user_id!,
      row.display_name || null,
      row.bio || null,
      row.avatar_url || null,
      row.status || 'pending',
      row.created_at!,
      row.updated_at!,
    );
  }

  async findAll(limit: number, offset: number): Promise<Creator[]> {
    const result = await this.db
      .select({
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
      .from(profile)
      .innerJoin(users, eq(users.id, profile.user_id))
      .innerJoin(user_role, eq(user_role.id, users.role_id))
      .where(eq(user_role.name, 'creator'))
      .limit(limit)
      .offset(offset)
      .orderBy(profile.created_at);

    return result.map((row) =>
      Creator.fromPersistence(
        row.id,
        row.user_id!,
        row.display_name || null,
        row.bio || null,
        row.avatar_url || null,
        row.status || 'pending',
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async findByStatus(
    status: string,
    limit: number,
    offset: number,
  ): Promise<Creator[]> {
    const result = await this.db
      .select({
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })
      .from(profile)
      .innerJoin(users, eq(users.id, profile.user_id))
      .innerJoin(user_role, eq(user_role.id, users.role_id))
      .where(and(eq(user_role.name, 'creator'), eq(profile.status, status)))
      .limit(limit)
      .offset(offset)
      .orderBy(profile.created_at);

    return result.map((row) =>
      Creator.fromPersistence(
        row.id,
        row.user_id!,
        row.display_name || null,
        row.bio || null,
        row.avatar_url || null,
        row.status || 'pending',
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async save(creator: Creator): Promise<Creator> {
    const existing = await this.findById(creator.id);

    const profileData = {
      id: creator.id,
      user_id: creator.userId,
      display_name: creator.displayName,
      bio: creator.bio,
      avatar_url: creator.avatarUrl,
      status: creator.status.value,
      updated_at: creator.updatedAt,
    };

    if (existing) {
      // Update
      await this.db
        .update(profile)
        .set(profileData)
        .where(eq(profile.id, creator.id));
    } else {
      // Insert
      await this.db.insert(profile).values({
        ...profileData,
        created_at: creator.createdAt,
      });
    }

    return creator;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(profile).where(eq(profile.id, id));
  }
}

