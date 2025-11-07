import { ScraperStatusVO } from '../value-objects/scraper-status.vo';
import { PlatformTypeVO } from '../value-objects/platform-type.vo';

/**
 * Scraper job domain entity
 */
export class ScraperJob {
  private constructor(
    public readonly id: string,
    public readonly socialAccountId: string,
    public readonly status: ScraperStatusVO,
    public readonly provider: string,
    public readonly platform: PlatformTypeVO,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly errorMessage: string | null,
    public readonly resultData: Record<string, any> | null,
    public readonly retryCount: number,
    public readonly maxRetries: number,
    public readonly priority: number,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    socialAccountId: string,
    provider: string,
    platform: PlatformTypeVO,
    maxRetries: number = 3,
    priority: number = 0,
    createdAt: Date = new Date(),
  ): ScraperJob {
    return new ScraperJob(
      id,
      socialAccountId,
      ScraperStatusVO.pending(),
      provider,
      platform,
      null,
      null,
      null,
      null,
      0,
      maxRetries,
      priority,
      createdAt,
    );
  }

  static fromPersistence(
    id: string,
    socialAccountId: string,
    status: string,
    provider: string,
    platform: string,
    startedAt: Date | null,
    completedAt: Date | null,
    errorMessage: string | null,
    resultData: Record<string, any> | null,
    retryCount: number,
    maxRetries: number,
    priority: number,
    createdAt: Date,
  ): ScraperJob {
    return new ScraperJob(
      id,
      socialAccountId,
      ScraperStatusVO.create(status),
      provider,
      PlatformTypeVO.create(platform),
      startedAt,
      completedAt,
      errorMessage,
      resultData,
      retryCount,
      maxRetries,
      priority,
      createdAt,
    );
  }

  /**
   * Start job execution
   */
  start(): ScraperJob {
    return new ScraperJob(
      this.id,
      this.socialAccountId,
      ScraperStatusVO.running(),
      this.provider,
      this.platform,
      new Date(),
      null,
      null,
      null,
      this.retryCount,
      this.maxRetries,
      this.priority,
      this.createdAt,
    );
  }

  /**
   * Complete job successfully
   */
  complete(resultData: Record<string, any>): ScraperJob {
    return new ScraperJob(
      this.id,
      this.socialAccountId,
      ScraperStatusVO.completed(),
      this.provider,
      this.platform,
      this.startedAt,
      new Date(),
      null,
      resultData,
      this.retryCount,
      this.maxRetries,
      this.priority,
      this.createdAt,
    );
  }

  /**
   * Fail job execution
   */
  fail(errorMessage: string): ScraperJob {
    return new ScraperJob(
      this.id,
      this.socialAccountId,
      ScraperStatusVO.failed(),
      this.provider,
      this.platform,
      this.startedAt,
      new Date(),
      errorMessage,
      null,
      this.retryCount,
      this.maxRetries,
      this.priority,
      this.createdAt,
    );
  }

  /**
   * Increment retry count
   */
  incrementRetry(): ScraperJob {
    const newRetryCount = this.retryCount + 1;
    return new ScraperJob(
      this.id,
      this.socialAccountId,
      ScraperStatusVO.pending(),
      this.provider,
      this.platform,
      null,
      null,
      null,
      null,
      newRetryCount,
      this.maxRetries,
      this.priority,
      this.createdAt,
    );
  }

  /**
   * Check if job can be retried
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.status.isFailed();
  }
}

