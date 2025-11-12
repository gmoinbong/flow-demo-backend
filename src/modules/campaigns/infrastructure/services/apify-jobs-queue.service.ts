import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { eq, and, lte } from 'drizzle-orm';
import { apify_jobs_queue } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';

export interface CreateApifyJobCommand {
  jobType: 'profile_scrape' | 'posts_scrape';
  socialProfileId: string;
  campaignId?: string;
  allocationId?: string;
  parameters: {
    username: string;
    platform: string;
    actorId: string;
    startDate?: Date;
    limit?: number;
  };
  priority?: number; // 0-100, higher = more urgent
  estimatedCost?: number;
}

@Injectable()
export class ApifyJobsQueueService {
  constructor(private readonly db: Database) {}

  /**
   * Add job to queue
   */
  async addJob(command: CreateApifyJobCommand): Promise<string> {
    const jobId = randomUUID();

    await this.db.insert(apify_jobs_queue).values({
      id: jobId,
      job_type: command.jobType,
      social_profile_id: command.socialProfileId,
      campaign_id: command.campaignId || null,
      allocation_id: command.allocationId || null,
      parameters: command.parameters as any,
      priority: command.priority || 50,
      status: 'pending',
      estimated_cost: command.estimatedCost || 1,
      scheduled_at: new Date(),
      created_at: new Date(),
    });

    return jobId;
  }

  /**
   * Get next pending job (for worker)
   */
  async getNextPendingJob(): Promise<{
    id: string;
    jobType: string;
    parameters: any;
    socialProfileId: string;
    campaignId: string | null;
    allocationId: string | null;
  } | null> {
    const result = await this.db
      .select({
        id: apify_jobs_queue.id,
        jobType: apify_jobs_queue.job_type,
        parameters: apify_jobs_queue.parameters,
        socialProfileId: apify_jobs_queue.social_profile_id,
        campaignId: apify_jobs_queue.campaign_id,
        allocationId: apify_jobs_queue.allocation_id,
      })
      .from(apify_jobs_queue)
      .where(
        and(
          eq(apify_jobs_queue.status, 'pending'),
          lte(apify_jobs_queue.scheduled_at, new Date()),
        ),
      )
      .orderBy(apify_jobs_queue.priority, apify_jobs_queue.scheduled_at)
      .limit(1)
      .for('update', { skipLocked: true });

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      jobType: result[0].jobType || '',
      parameters: result[0].parameters,
      socialProfileId: result[0].socialProfileId || '',
      campaignId: result[0].campaignId,
      allocationId: result[0].allocationId,
    };
  }

  /**
   * Mark job as running
   */
  async markJobAsRunning(jobId: string): Promise<void> {
    await this.db
      .update(apify_jobs_queue)
      .set({
        status: 'running',
        started_at: new Date(),
      })
      .where(eq(apify_jobs_queue.id, jobId));
  }

  /**
   * Mark job as completed
   */
  async markJobAsCompleted(
    jobId: string,
    resultData: any,
  ): Promise<void> {
    await this.db
      .update(apify_jobs_queue)
      .set({
        status: 'completed',
        completed_at: new Date(),
        result_data: resultData as any,
      })
      .where(eq(apify_jobs_queue.id, jobId));
  }

  /**
   * Mark job as failed
   */
  async markJobAsFailed(jobId: string, errorMessage: string): Promise<void> {
    // Get current retry count
    const job = await this.db
      .select()
      .from(apify_jobs_queue)
      .where(eq(apify_jobs_queue.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return;
    }

    const retryCount = (job[0].retry_count || 0) + 1;
    const maxRetries = job[0].max_retries || 3;

    await this.db
      .update(apify_jobs_queue)
      .set({
        status: retryCount < maxRetries ? 'pending' : 'failed',
        retry_count: retryCount,
        error_message: errorMessage,
        completed_at: retryCount >= maxRetries ? new Date() : null,
      })
      .where(eq(apify_jobs_queue.id, jobId));
  }
}

