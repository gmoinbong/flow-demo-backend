import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import type { ICampaignTrackingConfigRepository } from '../../domain/repositories/campaign-tracking-config.repository.interface';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignTrackingConfig } from '../../domain/entities/campaign-tracking-config.entity';
import { CampaignStatusVO } from '../../domain/value-objects/campaign-status.vo';

export interface CreateCampaignCommand {
  brandId: string;
  name: string;
  description?: string;
  budget: number; // in cents
  goals: string[];
  targetAudience?: string;
  platforms: string[];
  audienceSize?: 'micro' | 'mid-tier' | 'macro' | 'mega';
  targetLocation?: string;
  startDate: Date;
  endDate: Date;
  trackingConfig?: {
    requiredHashtags?: string[];
    optionalHashtags?: string[];
    requiredMentions?: string[];
    trackingLinkPattern?: string;
    minMatchConfidence?: number;
  };
}

export interface CreateCampaignResult {
  campaign: Campaign;
  trackingConfig?: CampaignTrackingConfig;
}

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly trackingConfigRepository: ICampaignTrackingConfigRepository,
  ) {}

  async execute(command: CreateCampaignCommand): Promise<CreateCampaignResult> {
    // Validate dates
    if (command.startDate >= command.endDate) {
      throw new Error('Start date must be before end date');
    }

    if (command.startDate < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    // Validate budget
    if (command.budget <= 0) {
      throw new Error('Budget must be greater than 0');
    }

    // Create campaign
    const campaign = Campaign.create(
      randomUUID(),
      command.brandId,
      command.name,
      command.description || null,
      command.budget,
      command.goals,
      command.targetAudience || null,
      command.platforms,
      command.audienceSize || null,
      command.targetLocation || null,
      command.startDate,
      command.endDate,
      CampaignStatusVO.draft(),
    );

    // Save campaign
    const savedCampaign = await this.campaignRepository.save(campaign);

    // Create tracking config if provided
    let trackingConfig: CampaignTrackingConfig | undefined;
    if (command.trackingConfig) {
      trackingConfig = CampaignTrackingConfig.create(
        randomUUID(),
        savedCampaign.id,
        command.trackingConfig.requiredHashtags || [],
        command.trackingConfig.optionalHashtags || [],
        command.trackingConfig.requiredMentions || [],
        command.trackingConfig.trackingLinkPattern || null,
        command.trackingConfig.minMatchConfidence || 0.7,
      );

      await this.trackingConfigRepository.save(trackingConfig);
    }

    return {
      campaign: savedCampaign,
      trackingConfig,
    };
  }
}
