import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { campaign_tracking_config } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { ICampaignTrackingConfigRepository } from '../../domain/repositories/campaign-tracking-config.repository.interface';
import { CampaignTrackingConfig } from '../../domain/entities/campaign-tracking-config.entity';

/**
 * Campaign tracking config repository implementation using Drizzle ORM
 */
@Injectable()
export class CampaignTrackingConfigRepository
  implements ICampaignTrackingConfigRepository
{
  constructor(private readonly db: Database) {}

  async findByCampaignId(
    campaignId: string,
  ): Promise<CampaignTrackingConfig | null> {
    const result = await this.db
      .select()
      .from(campaign_tracking_config)
      .where(eq(campaign_tracking_config.campaign_id, campaignId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return CampaignTrackingConfig.fromPersistence(
      row.id,
      row.campaign_id,
      (row.required_hashtags as string[]) || [],
      (row.optional_hashtags as string[]) || [],
      (row.required_mentions as string[]) || [],
      row.tracking_link_pattern,
      Number(row.min_match_confidence) || 0.7,
      row.created_at!,
      row.updated_at!,
    );
  }

  async save(
    config: CampaignTrackingConfig,
  ): Promise<CampaignTrackingConfig> {
    const configData = {
      id: config.id,
      campaign_id: config.campaignId,
      required_hashtags: config.requiredHashtags,
      optional_hashtags: config.optionalHashtags,
      required_mentions: config.requiredMentions,
      tracking_link_pattern: config.trackingLinkPattern,
      min_match_confidence: config.minMatchConfidence.toString(),
      updated_at: config.updatedAt,
    };

    const existing = await this.findByCampaignId(config.campaignId);

    if (existing) {
      // Update
      await this.db
        .update(campaign_tracking_config)
        .set(configData)
        .where(eq(campaign_tracking_config.campaign_id, config.campaignId));
    } else {
      // Insert
      await this.db.insert(campaign_tracking_config).values({
        ...configData,
        created_at: config.createdAt,
      });
    }

    return config;
  }

  async delete(campaignId: string): Promise<void> {
    await this.db
      .delete(campaign_tracking_config)
      .where(eq(campaign_tracking_config.campaign_id, campaignId));
  }
}

