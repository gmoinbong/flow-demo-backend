/**
 * Campaign status value object
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export class CampaignStatusVO {
  private constructor(public readonly value: CampaignStatus) {}

  static create(status: string): CampaignStatusVO {
    const validStatus = Object.values(CampaignStatus).find(
      (s) => s === status.toLowerCase(),
    );
    if (!validStatus) {
      throw new Error(`Invalid campaign status: ${status}`);
    }
    return new CampaignStatusVO(validStatus);
  }

  static draft(): CampaignStatusVO {
    return new CampaignStatusVO(CampaignStatus.DRAFT);
  }

  static active(): CampaignStatusVO {
    return new CampaignStatusVO(CampaignStatus.ACTIVE);
  }

  static paused(): CampaignStatusVO {
    return new CampaignStatusVO(CampaignStatus.PAUSED);
  }

  static completed(): CampaignStatusVO {
    return new CampaignStatusVO(CampaignStatus.COMPLETED);
  }

  isActive(): boolean {
    return this.value === CampaignStatus.ACTIVE;
  }

  isDraft(): boolean {
    return this.value === CampaignStatus.DRAFT;
  }
}

