import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { campaign_allocations } from 'src/shared/core/infrastructure/database/schema';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { ICampaignAllocationRepository } from '../../domain/repositories/campaign-allocation.repository.interface';
import { CampaignAllocation } from '../../domain/entities/campaign-allocation.entity';

/**
 * Campaign allocation repository implementation using Drizzle ORM
 */
@Injectable()
export class CampaignAllocationRepository
  implements ICampaignAllocationRepository
{
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<CampaignAllocation | null> {
    const result = await this.db
      .select()
      .from(campaign_allocations)
      .where(eq(campaign_allocations.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return CampaignAllocation.fromPersistence(
      row.id,
      row.campaign_id,
      row.creator_id,
      row.allocated_budget!,
      row.current_budget!,
      row.reach || 0,
      row.engagement || 0,
      row.conversions || 0,
      Number(row.ctr) || 0,
      Number(row.avg_engagement_rate) || 0,
      row.posts_count || 0,
      row.status!,
      row.tracking_link,
      row.contract_accepted || false,
      row.contract_accepted_at,
      row.last_collected_at,
      row.created_at!,
      row.updated_at!,
    );
  }

  async findByCampaignId(campaignId: string): Promise<CampaignAllocation[]> {
    const result = await this.db
      .select()
      .from(campaign_allocations)
      .where(eq(campaign_allocations.campaign_id, campaignId));

    return result.map((row) =>
      CampaignAllocation.fromPersistence(
        row.id,
        row.campaign_id,
        row.creator_id,
        row.allocated_budget!,
        row.current_budget!,
        row.reach || 0,
        row.engagement || 0,
        row.conversions || 0,
        Number(row.ctr) || 0,
        Number(row.avg_engagement_rate) || 0,
        row.posts_count || 0,
        row.status!,
        row.tracking_link,
        row.contract_accepted || false,
        row.contract_accepted_at,
        row.last_collected_at,
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async findByCreatorId(creatorId: string): Promise<CampaignAllocation[]> {
    const result = await this.db
      .select()
      .from(campaign_allocations)
      .where(eq(campaign_allocations.creator_id, creatorId));

    return result.map((row) =>
      CampaignAllocation.fromPersistence(
        row.id,
        row.campaign_id,
        row.creator_id,
        row.allocated_budget!,
        row.current_budget!,
        row.reach || 0,
        row.engagement || 0,
        row.conversions || 0,
        Number(row.ctr) || 0,
        Number(row.avg_engagement_rate) || 0,
        row.posts_count || 0,
        row.status!,
        row.tracking_link,
        row.contract_accepted || false,
        row.contract_accepted_at,
        row.last_collected_at,
        row.created_at!,
        row.updated_at!,
      ),
    );
  }

  async findByCampaignAndCreator(
    campaignId: string,
    creatorId: string,
  ): Promise<CampaignAllocation | null> {
    const result = await this.db
      .select()
      .from(campaign_allocations)
      .where(
        and(
          eq(campaign_allocations.campaign_id, campaignId),
          eq(campaign_allocations.creator_id, creatorId),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return CampaignAllocation.fromPersistence(
      row.id,
      row.campaign_id,
      row.creator_id,
      row.allocated_budget!,
      row.current_budget!,
      row.reach || 0,
      row.engagement || 0,
      row.conversions || 0,
      Number(row.ctr) || 0,
      Number(row.avg_engagement_rate) || 0,
      row.posts_count || 0,
      row.status!,
      row.tracking_link,
      row.contract_accepted || false,
      row.contract_accepted_at,
      row.last_collected_at,
      row.created_at!,
      row.updated_at!,
    );
  }

  async save(allocation: CampaignAllocation): Promise<CampaignAllocation> {
    const allocationData = {
      id: allocation.id,
      campaign_id: allocation.campaignId,
      creator_id: allocation.creatorId,
      allocated_budget: allocation.allocatedBudget,
      current_budget: allocation.currentBudget,
      reach: allocation.reach,
      engagement: allocation.engagement,
      conversions: allocation.conversions,
      ctr: allocation.ctr.toString(),
      avg_engagement_rate: allocation.avgEngagementRate.toString(),
      posts_count: allocation.postsCount,
      status: allocation.status.value,
      tracking_link: allocation.trackingLink,
      contract_accepted: allocation.contractAccepted,
      contract_accepted_at: allocation.contractAcceptedAt,
      last_collected_at: allocation.lastCollectedAt,
      updated_at: allocation.updatedAt,
    };

    const existing = await this.findById(allocation.id);

    if (existing) {
      // Update
      await this.db
        .update(campaign_allocations)
        .set(allocationData)
        .where(eq(campaign_allocations.id, allocation.id));
    } else {
      // Insert
      await this.db.insert(campaign_allocations).values({
        ...allocationData,
        created_at: allocation.createdAt,
      });
    }

    return allocation;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(campaign_allocations)
      .where(eq(campaign_allocations.id, id));
  }
}

