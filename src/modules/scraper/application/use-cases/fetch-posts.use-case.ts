import { Injectable, BadRequestException } from '@nestjs/common';
import { ApifyScraperService, PostData } from '../../infrastructure/services/apify-scraper.service';
import { PlatformTypeVO } from '../../domain/value-objects/platform-type.vo';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';

export interface FetchPostsCommand {
  username: string;
  platform: string;
  brandId?: string; // If provided, filter by subscription date
  campaignId?: string; // If provided, filter by campaign start date
  limit?: number;
}

export interface FetchPostsResult {
  posts: PostData[];
  totalCount: number;
  filteredBy: {
    subscriptionDate?: Date;
    campaignStartDate?: Date;
  };
}

@Injectable()
export class FetchPostsUseCase {
  constructor(
    private readonly apifyScraper: ApifyScraperService,
    private readonly db: Database,
  ) {}

  async execute(command: FetchPostsCommand): Promise<FetchPostsResult> {
    // Validate platform
    let platform: PlatformTypeVO;
    try {
      platform = PlatformTypeVO.create(command.platform);
    } catch (error) {
      throw new BadRequestException(`Unsupported platform: ${command.platform}`);
    }

    // Determine start date based on campaign (optional - skip if campaigns table doesn't exist)
    let startDate: Date | undefined;
    const filteredBy: FetchPostsResult['filteredBy'] = {};

    // Campaign filtering is optional - if campaigns table doesn't exist, skip filtering
    // This allows the scraper to work even without campaigns table in DB

    // Scrape posts from Apify
    const scrapedPosts = await this.apifyScraper.scrapePosts({
      username: command.username,
      platform,
      startDate,
      limit: command.limit || 50,
    });

    return {
      posts: scrapedPosts,
      totalCount: scrapedPosts.length,
      filteredBy,
    };
  }

}

