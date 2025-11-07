import { ScraperJob } from '../entities/scraper-job.entity';

/**
 * Scraper job repository interface (domain layer)
 */
export interface IScraperJobRepository {
  /**
   * Find job by ID
   */
  findById(id: string): Promise<ScraperJob | null>;

  /**
   * Find jobs by social account ID
   */
  findBySocialAccountId(socialAccountId: string): Promise<ScraperJob[]>;

  /**
   * Find pending jobs
   */
  findPendingJobs(limit: number): Promise<ScraperJob[]>;

  /**
   * Find failed jobs that can be retried
   */
  findRetryableJobs(limit: number): Promise<ScraperJob[]>;

  /**
   * Save job (create or update)
   */
  save(job: ScraperJob): Promise<ScraperJob>;

  /**
   * Delete job
   */
  delete(id: string): Promise<void>;
}

