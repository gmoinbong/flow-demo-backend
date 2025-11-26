import { CampaignAllocation } from '../entities/campaign-allocation.entity';

/**
 * Campaign allocation repository interface
 */
export interface ICampaignAllocationRepository {
  findById(id: string): Promise<CampaignAllocation | null>;
  findByCampaignId(campaignId: string): Promise<CampaignAllocation[]>;
  findByCreatorId(creatorId: string): Promise<CampaignAllocation[]>;
  findByCampaignAndCreator(
    campaignId: string,
    creatorId: string,
  ): Promise<CampaignAllocation | null>;
  save(allocation: CampaignAllocation): Promise<CampaignAllocation>;
  delete(id: string): Promise<void>;
}

