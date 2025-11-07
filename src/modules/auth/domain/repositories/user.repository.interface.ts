import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

/**
 * User repository interface (domain layer)
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Save user (create or update)
   */
  save(user: User): Promise<User>;
}


