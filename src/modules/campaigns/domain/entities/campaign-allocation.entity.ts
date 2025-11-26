import { AllocationStatusVO } from '../value-objects/allocation-status.vo';

/**
 * Campaign allocation domain entity
 * Represents budget allocation to a creator
 */
export class CampaignAllocation {
  private constructor(
    public readonly id: string,
    public readonly campaignId: string,
    public readonly creatorId: string,
    public readonly allocatedBudget: number, // initially allocated budget in cents
    public readonly currentBudget: number, // current budget after reallocation
    public readonly reach: number,
    public readonly engagement: number,
    public readonly conversions: number,
    public readonly ctr: number, // click-through rate in percentage
    public readonly avgEngagementRate: number,
    public readonly postsCount: number,
    public readonly status: AllocationStatusVO,
    public readonly trackingLink: string | null,
    public readonly contractAccepted: boolean,
    public readonly contractAcceptedAt: Date | null,
    public readonly lastCollectedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    campaignId: string,
    creatorId: string,
    allocatedBudget: number,
    status: AllocationStatusVO = AllocationStatusVO.pending(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): CampaignAllocation {
    return new CampaignAllocation(
      id,
      campaignId,
      creatorId,
      allocatedBudget,
      allocatedBudget, // currentBudget = allocatedBudget initially
      0, // reach
      0, // engagement
      0, // conversions
      0, // ctr
      0, // avgEngagementRate
      0, // postsCount
      status,
      null, // trackingLink
      false, // contractAccepted
      null, // contractAcceptedAt
      null, // lastCollectedAt
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    campaignId: string,
    creatorId: string,
    allocatedBudget: number,
    currentBudget: number,
    reach: number,
    engagement: number,
    conversions: number,
    ctr: number,
    avgEngagementRate: number,
    postsCount: number,
    status: string,
    trackingLink: string | null,
    contractAccepted: boolean,
    contractAcceptedAt: Date | null,
    lastCollectedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): CampaignAllocation {
    return new CampaignAllocation(
      id,
      campaignId,
      creatorId,
      allocatedBudget,
      currentBudget,
      reach,
      engagement,
      conversions,
      ctr,
      avgEngagementRate,
      postsCount,
      AllocationStatusVO.create(status),
      trackingLink,
      contractAccepted,
      contractAcceptedAt,
      lastCollectedAt,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Accept allocation (creator accepts)
   */
  accept(trackingLink: string | null = null): CampaignAllocation {
    return new CampaignAllocation(
      this.id,
      this.campaignId,
      this.creatorId,
      this.allocatedBudget,
      this.currentBudget,
      this.reach,
      this.engagement,
      this.conversions,
      this.ctr,
      this.avgEngagementRate,
      this.postsCount,
      AllocationStatusVO.accepted(),
      trackingLink,
      true, // contractAccepted
      new Date(), // contractAcceptedAt
      this.lastCollectedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Activate allocation
   */
  activate(): CampaignAllocation {
    return new CampaignAllocation(
      this.id,
      this.campaignId,
      this.creatorId,
      this.allocatedBudget,
      this.currentBudget,
      this.reach,
      this.engagement,
      this.conversions,
      this.ctr,
      this.avgEngagementRate,
      this.postsCount,
      AllocationStatusVO.active(),
      this.trackingLink,
      this.contractAccepted,
      this.contractAcceptedAt,
      this.lastCollectedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Decline allocation
   */
  decline(): CampaignAllocation {
    return new CampaignAllocation(
      this.id,
      this.campaignId,
      this.creatorId,
      this.allocatedBudget,
      this.currentBudget,
      this.reach,
      this.engagement,
      this.conversions,
      this.ctr,
      this.avgEngagementRate,
      this.postsCount,
      AllocationStatusVO.declined(),
      this.trackingLink,
      this.contractAccepted,
      this.contractAcceptedAt,
      this.lastCollectedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update metrics
   */
  updateMetrics(
    reach: number,
    engagement: number,
    conversions: number,
    ctr: number,
    avgEngagementRate: number,
    postsCount: number,
  ): CampaignAllocation {
    return new CampaignAllocation(
      this.id,
      this.campaignId,
      this.creatorId,
      this.allocatedBudget,
      this.currentBudget,
      reach,
      engagement,
      conversions,
      ctr,
      avgEngagementRate,
      postsCount,
      this.status,
      this.trackingLink,
      this.contractAccepted,
      this.contractAcceptedAt,
      new Date(), // lastCollectedAt
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update current budget (after reallocation)
   */
  updateCurrentBudget(newBudget: number): CampaignAllocation {
    return new CampaignAllocation(
      this.id,
      this.campaignId,
      this.creatorId,
      this.allocatedBudget,
      newBudget,
      this.reach,
      this.engagement,
      this.conversions,
      this.ctr,
      this.avgEngagementRate,
      this.postsCount,
      this.status,
      this.trackingLink,
      this.contractAccepted,
      this.contractAcceptedAt,
      this.lastCollectedAt,
      this.createdAt,
      new Date(),
    );
  }
}

