import { Injectable } from '@nestjs/common';
import { ApifyScraperService } from '../../../scraper/infrastructure/services/apify-scraper.service';
import { PlatformTypeVO } from '../../../scraper/domain/value-objects/platform-type.vo';
import { ApifyJobsQueueService } from '../../infrastructure/services/apify-jobs-queue.service';
import type { ICampaignAllocationRepository } from '../../domain/repositories/campaign-allocation.repository.interface';
import { eq } from 'drizzle-orm';
import { creator_social_profiles } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';

export interface CollectCreatorDataCommand {
  allocationId: string;
  socialProfileId: string;
  username: string;
  platform: string;
}

@Injectable()
export class CollectCreatorDataUseCase {
  constructor(
    private readonly apifyScraper: ApifyScraperService,
    private readonly jobsQueue: ApifyJobsQueueService,
    private readonly allocationRepository: ICampaignAllocationRepository,
    private readonly db: Database,
  ) {}

  /**
   * Add jobs to queue for initial data collection
   */
  async execute(command: CollectCreatorDataCommand): Promise<{
    profileJobId: string;
    postsJobId: string;
  }> {
    // Validate platform
    const platform = PlatformTypeVO.create(command.platform);

    // Get allocation to find campaign
    const allocation = await this.allocationRepository.findById(
      command.allocationId,
    );

    if (!allocation) {
      throw new Error('Allocation not found');
    }

    // Get actor ID for platform
    const actorId = this.getActorId(platform);

    // Add profile scrape job
    const profileJobId = await this.jobsQueue.addJob({
      jobType: 'profile_scrape',
      socialProfileId: command.socialProfileId,
      campaignId: allocation.campaignId,
      allocationId: command.allocationId,
      parameters: {
        username: command.username,
        platform: command.platform,
        actorId,
      },
      priority: 80, // high priority for initial collection
      estimatedCost: 1,
    });

    // Add posts scrape job
    const postsJobId = await this.jobsQueue.addJob({
      jobType: 'posts_scrape',
      socialProfileId: command.socialProfileId,
      campaignId: allocation.campaignId,
      allocationId: command.allocationId,
      parameters: {
        username: command.username,
        platform: command.platform,
        actorId,
        limit: 50, // last 50 posts
      },
      priority: 70, // medium-high priority
      estimatedCost: 1,
    });

    return {
      profileJobId,
      postsJobId,
    };
  }

  private getActorId(platform: PlatformTypeVO): string {
    const actorMap: Record<string, string> = {
      instagram: 'apify~instagram-scraper',
      tiktok: 'apify~tiktok-scraper',
      youtube: 'apify~youtube-scraper',
    };

    const actorId = actorMap[platform.value];
    if (!actorId) {
      throw new Error(`Unsupported platform: ${platform.value}`);
    }

    return actorId;
  }

  /**
   * Process profile scrape result and update creator_social_profiles
   */
  async processProfileResult(
    socialProfileId: string,
    profileData: {
      followers: number;
      following?: number;
      postsCount?: number;
      engagementRate?: number;
      bio?: string;
      isVerified?: boolean;
    },
  ): Promise<void> {
    await this.db
      .update(creator_social_profiles)
      .set({
        followers_verified: profileData.followers,
        following_count: profileData.following || null,
        posts_count: profileData.postsCount || null,
        engagement_rate_verified: profileData.engagementRate
          ? profileData.engagementRate.toString()
          : null,
        bio: profileData.bio || null,
        is_verified: profileData.isVerified || false,
        last_verified_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(creator_social_profiles.id, socialProfileId));
  }
}

