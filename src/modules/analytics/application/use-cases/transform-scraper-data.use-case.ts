import { PlatformStats } from '../../domain/entities/platform-stats.entity';

export interface TransformScraperDataCommand {
  socialAccountId: string;
  platform: string;
  rawData: Record<string, any>;
  provider: string;
}

export class TransformScraperDataUseCase {
  // Will inject data transformer service
  constructor() {}

  async execute(command: TransformScraperDataCommand): Promise<PlatformStats> {
    // Transform raw data based on platform
    // This will use DataTransformerService to normalize data from different platforms
    
    // Placeholder transformation logic
    const normalizedData = {
      followersCount: command.rawData.followers || command.rawData.follower_count || null,
      followingCount: command.rawData.following || command.rawData.following_count || null,
      totalPosts: command.rawData.posts || command.rawData.post_count || null,
      totalViews: command.rawData.views || command.rawData.total_views || null,
      engagementRate: null, // Will be calculated separately
    };

    const stats = PlatformStats.create(
      crypto.randomUUID(),
      command.socialAccountId,
      normalizedData.followersCount,
      normalizedData.followingCount,
      normalizedData.totalPosts,
      normalizedData.totalViews,
      normalizedData.engagementRate,
      command.rawData,
      command.provider,
    );

    return stats;
  }
}

