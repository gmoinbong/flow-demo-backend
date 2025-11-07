/**
 * Platform stats domain entity
 */
export class PlatformStats {
  private constructor(
    public readonly id: string,
    public readonly socialAccountId: string,
    public readonly followersCount: number | null,
    public readonly followingCount: number | null,
    public readonly totalPosts: number | null,
    public readonly totalViews: number | null,
    public readonly engagementRate: string | null,
    public readonly rawData: Record<string, any> | null,
    public readonly scrapedAt: Date,
    public readonly provider: string,
    public readonly ttlExpiresAt: Date | null,
  ) {}

  static create(
    id: string,
    socialAccountId: string,
    followersCount: number | null,
    followingCount: number | null,
    totalPosts: number | null,
    totalViews: number | null,
    engagementRate: string | null,
    rawData: Record<string, any> | null,
    provider: string,
    ttlExpiresAt: Date | null = null,
    scrapedAt: Date = new Date(),
  ): PlatformStats {
    return new PlatformStats(
      id,
      socialAccountId,
      followersCount,
      followingCount,
      totalPosts,
      totalViews,
      engagementRate,
      rawData,
      scrapedAt,
      provider,
      ttlExpiresAt,
    );
  }

  static fromPersistence(
    id: string,
    socialAccountId: string,
    followersCount: number | null,
    followingCount: number | null,
    totalPosts: number | null,
    totalViews: number | null,
    engagementRate: string | null,
    rawData: Record<string, any> | null,
    scrapedAt: Date,
    provider: string,
    ttlExpiresAt: Date | null,
  ): PlatformStats {
    return new PlatformStats(
      id,
      socialAccountId,
      followersCount,
      followingCount,
      totalPosts,
      totalViews,
      engagementRate,
      rawData,
      scrapedAt,
      provider,
      ttlExpiresAt,
    );
  }

  /**
   * Check if stats are expired
   */
  isExpired(): boolean {
    if (!this.ttlExpiresAt) {
      return false;
    }
    return new Date() > this.ttlExpiresAt;
  }
}

