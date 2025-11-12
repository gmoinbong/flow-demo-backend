/**
 * Campaign tracking configuration entity
 * Rules for detecting campaign posts
 */
export class CampaignTrackingConfig {
  private constructor(
    public readonly id: string,
    public readonly campaignId: string,
    public readonly requiredHashtags: string[],
    public readonly optionalHashtags: string[],
    public readonly requiredMentions: string[],
    public readonly trackingLinkPattern: string | null,
    public readonly minMatchConfidence: number, // 0-1
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    campaignId: string,
    requiredHashtags: string[] = [],
    optionalHashtags: string[] = [],
    requiredMentions: string[] = [],
    trackingLinkPattern: string | null = null,
    minMatchConfidence: number = 0.7,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): CampaignTrackingConfig {
    return new CampaignTrackingConfig(
      id,
      campaignId,
      requiredHashtags,
      optionalHashtags,
      requiredMentions,
      trackingLinkPattern,
      minMatchConfidence,
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    campaignId: string,
    requiredHashtags: string[],
    optionalHashtags: string[],
    requiredMentions: string[],
    trackingLinkPattern: string | null,
    minMatchConfidence: number,
    createdAt: Date,
    updatedAt: Date,
  ): CampaignTrackingConfig {
    return new CampaignTrackingConfig(
      id,
      campaignId,
      requiredHashtags,
      optionalHashtags,
      requiredMentions,
      trackingLinkPattern,
      minMatchConfidence,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Update tracking config
   */
  update(
    requiredHashtags: string[],
    optionalHashtags: string[],
    requiredMentions: string[],
    trackingLinkPattern: string | null,
    minMatchConfidence: number,
  ): CampaignTrackingConfig {
    return new CampaignTrackingConfig(
      this.id,
      this.campaignId,
      requiredHashtags,
      optionalHashtags,
      requiredMentions,
      trackingLinkPattern,
      minMatchConfidence,
      this.createdAt,
      new Date(),
    );
  }
}

