import { CampaignStatusVO } from '../value-objects/campaign-status.vo';

/**
 * Campaign domain entity
 */
export class Campaign {
  private constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly budget: number, // in cents
    public readonly currentBudget: number, // current budget after reallocation
    public readonly goals: string[],
    public readonly targetAudience: string | null,
    public readonly platforms: string[],
    public readonly audienceSize: string | null,
    public readonly targetLocation: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: CampaignStatusVO,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    brandId: string,
    name: string,
    description: string | null,
    budget: number,
    goals: string[],
    targetAudience: string | null,
    platforms: string[],
    audienceSize: string | null,
    targetLocation: string | null,
    startDate: Date,
    endDate: Date,
    status: CampaignStatusVO = CampaignStatusVO.draft(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Campaign {
    return new Campaign(
      id,
      brandId,
      name,
      description,
      budget,
      budget, // currentBudget = budget initially
      goals,
      targetAudience,
      platforms,
      audienceSize,
      targetLocation,
      startDate,
      endDate,
      status,
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    brandId: string,
    name: string,
    description: string | null,
    budget: number,
    currentBudget: number,
    goals: string[],
    targetAudience: string | null,
    platforms: string[],
    audienceSize: string | null,
    targetLocation: string | null,
    startDate: Date,
    endDate: Date,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): Campaign {
    return new Campaign(
      id,
      brandId,
      name,
      description,
      budget,
      currentBudget,
      goals,
      targetAudience,
      platforms,
      audienceSize,
      targetLocation,
      startDate,
      endDate,
      CampaignStatusVO.create(status),
      createdAt,
      updatedAt,
    );
  }

  /**
   * Activate campaign
   */
  activate(): Campaign {
    return new Campaign(
      this.id,
      this.brandId,
      this.name,
      this.description,
      this.budget,
      this.currentBudget,
      this.goals,
      this.targetAudience,
      this.platforms,
      this.audienceSize,
      this.targetLocation,
      this.startDate,
      this.endDate,
      CampaignStatusVO.active(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Pause campaign
   */
  pause(): Campaign {
    return new Campaign(
      this.id,
      this.brandId,
      this.name,
      this.description,
      this.budget,
      this.currentBudget,
      this.goals,
      this.targetAudience,
      this.platforms,
      this.audienceSize,
      this.targetLocation,
      this.startDate,
      this.endDate,
      CampaignStatusVO.paused(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Complete campaign
   */
  complete(): Campaign {
    return new Campaign(
      this.id,
      this.brandId,
      this.name,
      this.description,
      this.budget,
      this.currentBudget,
      this.goals,
      this.targetAudience,
      this.platforms,
      this.audienceSize,
      this.targetLocation,
      this.startDate,
      this.endDate,
      CampaignStatusVO.completed(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update current budget (after reallocation)
   */
  updateCurrentBudget(newBudget: number): Campaign {
    return new Campaign(
      this.id,
      this.brandId,
      this.name,
      this.description,
      this.budget,
      newBudget,
      this.goals,
      this.targetAudience,
      this.platforms,
      this.audienceSize,
      this.targetLocation,
      this.startDate,
      this.endDate,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Check if campaign is currently active
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    return (
      this.status.isActive() &&
      now >= this.startDate &&
      now <= this.endDate
    );
  }
}

