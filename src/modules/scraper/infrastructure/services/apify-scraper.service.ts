import { Injectable } from '@nestjs/common';
import { ApifyClient } from 'apify-client';
import { PlatformTypeVO } from '../../domain/value-objects/platform-type.vo';
import type { ApifyConfig } from '../config/apify.config';

export interface ScrapePostsOptions {
  username: string;
  platform: PlatformTypeVO;
  startDate?: Date; // Filter posts from this date
  limit?: number;
}

export interface PostData {
  id: string;
  text?: string;
  url: string;
  timestamp: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  mediaUrls?: string[];
  rawData: Record<string, any>;
}

export interface ScrapeProfileOptions {
  username: string;
  platform: PlatformTypeVO;
}

export interface CreatorProfileData {
  username: string;
  followers: number;
  following?: number;
  postsCount?: number;
  engagementRate?: number;
  bio?: string;
  isVerified?: boolean;
  profileUrl?: string;
  rawData: Record<string, any>;
}

@Injectable()
export class ApifyScraperService {
  private client: ApifyClient;

  constructor(private readonly config: ApifyConfig) {
    this.client = new ApifyClient({
      token: config.token,
      // Only set baseUrl if explicitly provided (without /v2 suffix)
      ...(config.baseUrl && { baseUrl: config.baseUrl }),
    });
  }

  /**
   * Get actor ID for platform
   * Format: USERNAME~ACTOR_NAME (e.g., apify~instagram-scraper)
   * Note: Check Apify Store for correct actor IDs
   * Common actors:
   * - Instagram: apify~instagram-scraper
   * - TikTok: apify~tiktok-scraper
   * - YouTube: apify~youtube-scraper
   */
  private getActorId(platform: PlatformTypeVO): string {
    const actorMap: Record<string, string> = {
      instagram: 'apify~instagram-scraper', // Format: username~actor-name
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
   * Scrape posts from social platform
   */
  async scrapePosts(options: ScrapePostsOptions): Promise<PostData[]> {
    const actorId = this.getActorId(options.platform);
    
    // Prepare input for Apify actor
    const input = this.prepareInput(options);

    // Run actor
    const run = await this.client.actor(actorId).call(input);

    // Wait for run to finish (polling)
    let currentRun = run;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds (1 second per attempt)

    while (currentRun.status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const runInfo = await this.client.run(run.id).get();
      if (!runInfo) {
        throw new Error('Failed to get run status from Apify');
      }
      currentRun = runInfo;
      attempts++;
    }

    // Check if run was successful
    if (currentRun.status !== 'SUCCEEDED') {
      throw new Error(`Apify actor run failed with status: ${currentRun.status}`);
    }

    // Get dataset ID from completed run
    const datasetId = currentRun.defaultDatasetId;
    if (!datasetId) {
      throw new Error('No dataset ID returned from Apify run');
    }

    // Get items from dataset
    const { items } = await this.client.dataset(datasetId).listItems({
      limit: options.limit || 50,
    });

    // Transform Apify results to PostData format
    return this.transformResults(items, options.platform);
  }

  /**
   * Prepare input for Apify actor based on platform
   */
  private prepareInput(options: ScrapePostsOptions): Record<string, any> {
    // Platform-specific input format
    switch (options.platform.value) {
      case 'instagram':
        return {
          directUrls: [`https://www.instagram.com/${options.username}/`],
          resultsLimit: options.limit || 50,
          resultsType: 'posts',
          ...(options.startDate && {
            startDate: options.startDate.toISOString().split('T')[0], // YYYY-MM-DD format
          }),
        };
      case 'tiktok':
        return {
          usernames: [options.username],
          resultsLimit: options.limit || 30,
          ...(options.startDate && {
            startDate: options.startDate.toISOString(),
          }),
        };
      case 'youtube':
        return {
          searchKeywords: [options.username],
          resultsLimit: options.limit || 50,
          ...(options.startDate && {
            publishedAfter: options.startDate.toISOString(),
          }),
        };
      default:
        return {
          startUrls: [
            {
              url: `https://www.${options.platform.value}.com/${options.username}`,
            },
          ],
          resultsLimit: options.limit || 50,
          ...(options.startDate && {
            startDate: options.startDate.toISOString(),
          }),
        };
    }
  }

  /**
   * Transform Apify results to PostData format
   */
  private transformResults(items: any[], platform: PlatformTypeVO): PostData[] {
    return items.map((item) => {
      switch (platform.value) {
        case 'instagram':
          return this.transformInstagramPost(item);
        case 'tiktok':
          return this.transformTikTokPost(item);
        case 'youtube':
          return this.transformYouTubePost(item);
        default:
          throw new Error(`Unsupported platform: ${platform.value}`);
      }
    });
  }

  private transformInstagramPost(item: any): PostData {
    return {
      id: item.id || item.shortCode || item.url,
      text: item.caption || item.text,
      url: item.url || item.permalink,
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      likes: item.likesCount || item.likes,
      comments: item.commentsCount || item.comments,
      shares: item.sharesCount,
      views: item.videoViewCount || item.views,
      mediaUrls: item.images || item.videos || [],
      rawData: item,
    };
  }

  private transformTikTokPost(item: any): PostData {
    return {
      id: item.id || item.awemeId,
      text: item.text || item.description,
      url: item.webVideoUrl || item.url,
      timestamp: item.createTime
        ? new Date(item.createTime * 1000)
        : new Date(),
      likes: item.stats?.diggCount || item.likesCount,
      comments: item.stats?.commentCount || item.commentsCount,
      shares: item.stats?.shareCount || item.sharesCount,
      views: item.stats?.playCount || item.viewsCount,
      mediaUrls: item.video?.downloadAddr ? [item.video.downloadAddr] : [],
      rawData: item,
    };
  }

  private transformYouTubePost(item: any): PostData {
    return {
      id: item.id || item.videoId,
      text: item.title || item.description,
      url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
      timestamp: item.uploadDate ? new Date(item.uploadDate) : new Date(),
      likes: item.likesCount || item.likes,
      comments: item.commentsCount || item.comments,
      shares: item.sharesCount,
      views: item.viewCount || item.views,
      mediaUrls: item.thumbnailUrl ? [item.thumbnailUrl] : [],
      rawData: item,
    };
  }

  /**
   * Scrape creator profile from social platform
   */
  async scrapeProfile(
    options: ScrapeProfileOptions,
  ): Promise<CreatorProfileData> {
    const actorId = this.getActorId(options.platform);

    // Prepare input for Apify actor (profile-specific)
    const input = this.prepareProfileInput(options);

    // Run actor
    const run = await this.client.actor(actorId).call(input);

    // Wait for run to finish (polling)
    let currentRun = run;
    let attempts = 0;
    const maxAttempts = 60;

    while (currentRun.status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const runInfo = await this.client.run(run.id).get();
      if (!runInfo) {
        throw new Error('Failed to get run status from Apify');
      }
      currentRun = runInfo;
      attempts++;
    }

    if (currentRun.status !== 'SUCCEEDED') {
      throw new Error(`Apify actor run failed with status: ${currentRun.status}`);
    }

    // Get dataset ID from completed run
    const datasetId = currentRun.defaultDatasetId;
    if (!datasetId) {
      throw new Error('No dataset ID returned from Apify run');
    }

    // Get items from dataset (profile data is usually first item)
    const { items } = await this.client.dataset(datasetId).listItems({
      limit: 1,
    });

    if (items.length === 0) {
      throw new Error('No profile data returned from Apify');
    }

    // Transform Apify results to CreatorProfileData format
    return this.transformProfileResult(items[0], options.platform, options.username);
  }

  /**
   * Prepare input for Apify actor for profile scraping
   */
  private prepareProfileInput(options: ScrapeProfileOptions): Record<string, any> {
    switch (options.platform.value) {
      case 'instagram':
        return {
          directUrls: [`https://www.instagram.com/${options.username}/`],
          resultsType: 'profile',
        };
      case 'tiktok':
        return {
          usernames: [options.username],
          resultsType: 'profile',
        };
      case 'youtube':
        return {
          searchKeywords: [options.username],
          resultsType: 'channel',
        };
      default:
        return {
          startUrls: [
            {
              url: `https://www.${options.platform.value}.com/${options.username}`,
            },
          ],
        };
    }
  }

  /**
   * Transform Apify profile result to CreatorProfileData format
   */
  private transformProfileResult(
    item: any,
    platform: PlatformTypeVO,
    username: string,
  ): CreatorProfileData {
    switch (platform.value) {
      case 'instagram':
        return {
          username,
          followers: item.followersCount || item.followers || 0,
          following: item.followsCount || item.following,
          postsCount: item.postsCount || item.mediaCount,
          engagementRate: item.engagementRate
            ? parseFloat(item.engagementRate.replace('%', ''))
            : undefined,
          bio: item.biography || item.bio,
          isVerified: item.isVerified || false,
          profileUrl: item.url || `https://www.instagram.com/${username}/`,
          rawData: item,
        };
      case 'tiktok':
        return {
          username,
          followers: item.followerCount || item.followers || 0,
          following: item.followingCount || item.following,
          postsCount: item.videoCount || item.postsCount,
          engagementRate: item.engagementRate
            ? parseFloat(item.engagementRate.replace('%', ''))
            : undefined,
          bio: item.signature || item.bio,
          isVerified: item.isVerified || false,
          profileUrl: item.url || `https://www.tiktok.com/@${username}`,
          rawData: item,
        };
      case 'youtube':
        return {
          username,
          followers: item.subscriberCount || item.subscribers || 0,
          postsCount: item.videoCount || item.videosCount,
          engagementRate: item.engagementRate
            ? parseFloat(item.engagementRate.replace('%', ''))
            : undefined,
          bio: item.description || item.bio,
          isVerified: item.isVerified || false,
          profileUrl: item.url || item.channelUrl,
          rawData: item,
        };
      default:
        return {
          username,
          followers: item.followers || item.followersCount || 0,
          following: item.following || item.followingCount,
          postsCount: item.postsCount || item.posts,
          bio: item.bio || item.description,
          isVerified: item.isVerified || false,
          profileUrl: item.url,
          rawData: item,
        };
    }
  }
}
