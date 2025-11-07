/**
 * Scraper job status value object
 */
export enum ScraperStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class ScraperStatusVO {
  private constructor(public readonly value: ScraperStatus) {}

  static create(status: string): ScraperStatusVO {
    const validStatus = Object.values(ScraperStatus).find(
      (s) => s === status.toLowerCase(),
    );
    if (!validStatus) {
      throw new Error(`Invalid scraper status: ${status}`);
    }
    return new ScraperStatusVO(validStatus);
  }

  static pending(): ScraperStatusVO {
    return new ScraperStatusVO(ScraperStatus.PENDING);
  }

  static running(): ScraperStatusVO {
    return new ScraperStatusVO(ScraperStatus.RUNNING);
  }

  static completed(): ScraperStatusVO {
    return new ScraperStatusVO(ScraperStatus.COMPLETED);
  }

  static failed(): ScraperStatusVO {
    return new ScraperStatusVO(ScraperStatus.FAILED);
  }

  isPending(): boolean {
    return this.value === ScraperStatus.PENDING;
  }

  isRunning(): boolean {
    return this.value === ScraperStatus.RUNNING;
  }

  isCompleted(): boolean {
    return this.value === ScraperStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.value === ScraperStatus.FAILED;
  }
}

