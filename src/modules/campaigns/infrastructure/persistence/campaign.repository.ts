import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { campaigns } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import { Campaign } from '../../domain/entities/campaign.entity';

/**
 * Campaign repository implementation using Drizzle ORM
 */
@Injectable()
export class CampaignRepository implements ICampaignRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Campaign | null> {
    const result = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Campaign.fromPersistence(
      row.id,
      row.brand_id,
      row.name,
      row.description,
      row.budget!,
      row.current_budget!,
      (row.goals as string[]) || [],
      row.target_audience,
      (row.platforms as string[]) || [],
      row.audience_size,
      row.target_location,
      row.start_date!,
      row.end_date!,
      row.status!,
      row.created_at!,
      row.updated_at!,
    );
  }

  async findByBrandId(brandId: string): Promise<Campaign[]> {
    const result = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brand_id, brandId));

    return result.map((row) =>
      Campaign.fromPersistence(
        row.id,
        row.brand_id,
        row.name,
        row.description,
        row.budget!,
        row.current_budget!,
        (row.goals as string[]) || [],
        row.target_audience,
        (row.platforms as string[]) || [],
        row.audience_size,
        row.target_location,
        row.start_date!,
        row.end_date!,
        row.status!,
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async findActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          lte(campaigns.start_date, now),
          gte(campaigns.end_date, now),
        ),
      );

    return result.map((row) =>
      Campaign.fromPersistence(
        row.id,
        row.brand_id,
        row.name,
        row.description,
        row.budget!,
        row.current_budget!,
        (row.goals as string[]) || [],
        row.target_audience,
        (row.platforms as string[]) || [],
        row.audience_size,
        row.target_location,
        row.start_date!,
        row.end_date!,
        row.status!,
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async save(campaign: Campaign): Promise<Campaign> {
    const campaignData = {
      id: campaign.id,
      brand_id: campaign.brandId,
      name: campaign.name,
      description: campaign.description,
      budget: campaign.budget,
      current_budget: campaign.currentBudget,
      goals: campaign.goals,
      target_audience: campaign.targetAudience,
      platforms: campaign.platforms,
      audience_size: campaign.audienceSize,
      target_location: campaign.targetLocation,
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      status: campaign.status.value,
      updated_at: campaign.updatedAt,
    };

    const existing = await this.findById(campaign.id);

    if (existing) {
      // Update
      await this.db
        .update(campaigns)
        .set(campaignData)
        .where(eq(campaigns.id, campaign.id));
    } else {
      // Insert
      await this.db.insert(campaigns).values({
        ...campaignData,
        created_at: campaign.createdAt,
      });
    }

    return campaign;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(campaigns).where(eq(campaigns.id, id));
  }
}

