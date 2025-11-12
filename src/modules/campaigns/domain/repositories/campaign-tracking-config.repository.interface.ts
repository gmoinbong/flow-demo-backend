import { CampaignTrackingConfig } from '../entities/campaign-tracking-config.entity';

/**
 * Campaign tracking config repository interface
 */
export interface ICampaignTrackingConfigRepository {
  findByCampaignId(campaignId: string): Promise<CampaignTrackingConfig | null>;
  save(config: CampaignTrackingConfig): Promise<CampaignTrackingConfig>;
  delete(campaignId: string): Promise<void>;
}

