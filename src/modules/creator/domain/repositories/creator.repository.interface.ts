import { Creator } from '../entities/creator.entity';

/**
 * Creator repository interface (domain layer)
 */
export interface ICreatorRepository {
  /**
   * Find creator by ID
   */
  findById(id: string): Promise<Creator | null>;

  /**
   * Find creator by user ID
   */
  findByUserId(userId: string): Promise<Creator | null>;

  /**
   * Find all creators with pagination
   */
  findAll(limit: number, offset: number): Promise<Creator[]>;

  /**
   * Find creators by status
   */
  findByStatus(status: string, limit: number, offset: number): Promise<Creator[]>;

  /**
   * Save creator (create or update)
   */
  save(creator: Creator): Promise<Creator>;

  /**
   * Delete creator
   */
  delete(id: string): Promise<void>;
}

