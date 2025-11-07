import { eq } from 'drizzle-orm';
import { users } from 'src/shared/core/infrastructure/database/schema';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

/**
 * User repository implementation using Drizzle ORM
 */
export class UserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return User.fromPersistence(
      row.id,
      row.email!,
      row.password_hash || null,
      row.role_id || null,
      row.created_at!,
      row.updated_at!,
    );
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.getValue()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return User.fromPersistence(
      row.id,
      row.email!,
      row.password_hash || null,
      row.role_id || null,
      row.created_at!,
      row.updated_at!,
    );
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.getValue()))
      .limit(1);

    return result.length > 0;
  }

  async save(user: User): Promise<User> {
    const userData = {
      id: user.id,
      email: user.email.getValue(),
      password_hash: user.getPasswordHash(),
      role_id: user.roleId,
      updated_at: user.updatedAt,
    };

    const existing = await this.findById(user.id);

    if (existing) {
      // Update
      await this.db.update(users).set(userData).where(eq(users.id, user.id));
    } else {
      // Insert
      await this.db.insert(users).values({
        ...userData,
        created_at: user.createdAt,
      });
    }

    return user;
  }
}
