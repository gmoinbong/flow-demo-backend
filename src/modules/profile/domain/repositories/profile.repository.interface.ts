import { Profile } from '../entities/profile.entity';

/**
 * Profile repository interface (domain layer)
 */
export interface IProfileRepository {
  /**
   * Find profile by user ID
   */
  findByUserId(userId: string): Promise<Profile | null>;

  /**
   * Find profile by ID
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Save profile (create or update)
   */
  save(profile: Profile): Promise<Profile>;
}

