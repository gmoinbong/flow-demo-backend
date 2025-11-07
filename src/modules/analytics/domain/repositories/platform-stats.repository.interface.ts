import { PlatformStats } from '../entities/platform-stats.entity';

/**
 * Platform stats repository interface (domain layer)
 */
export interface IPlatformStatsRepository {
  /**
   * Find stats by ID
   */
  findById(id: string): Promise<PlatformStats | null>;

  /**
   * Find latest stats for social account
   */
  findLatestBySocialAccountId(socialAccountId: string): Promise<PlatformStats | null>;

  /**
   * Find stats by social account ID with date range
   */
  findBySocialAccountId(
    socialAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PlatformStats[]>;

  /**
   * Save stats (create or update)
   */
  save(stats: PlatformStats): Promise<PlatformStats>;

  /**
   * Delete stats
   */
  delete(id: string): Promise<void>;
}

