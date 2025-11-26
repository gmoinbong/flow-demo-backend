import { Campaign } from '../entities/campaign.entity';

/**
 * Campaign repository interface
 */
export interface ICampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findByBrandId(brandId: string): Promise<Campaign[]>;
  findActiveCampaigns(): Promise<Campaign[]>;
  save(campaign: Campaign): Promise<Campaign>;
  delete(id: string): Promise<void>;
}

