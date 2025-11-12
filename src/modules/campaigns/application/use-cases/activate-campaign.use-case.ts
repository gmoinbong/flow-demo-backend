import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import type { ICampaignAllocationRepository } from '../../domain/repositories/campaign-allocation.repository.interface';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignAllocation } from '../../domain/entities/campaign-allocation.entity';
import { AllocationStatusVO } from '../../domain/value-objects/allocation-status.vo';
import { FindCreatorForCampaignUseCase } from './find-creator-for-campaign.use-case';
import { CollectCreatorDataUseCase } from './collect-creator-data.use-case';

export interface ActivateCampaignCommand {
  campaignId: string;
  brandId: string; // for authorization check
}

export interface ActivateCampaignResult {
  campaign: Campaign;
  allocation: CampaignAllocation;
  creator: {
    id: string;
    username: string;
    platform: string;
  };
}

@Injectable()
export class ActivateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly allocationRepository: ICampaignAllocationRepository,
    private readonly findCreatorUseCase: FindCreatorForCampaignUseCase,
    private readonly collectCreatorDataUseCase: CollectCreatorDataUseCase,
  ) {}

  async execute(
    command: ActivateCampaignCommand,
  ): Promise<ActivateCampaignResult> {
    // Find campaign
    const campaign = await this.campaignRepository.findById(command.campaignId);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check authorization
    if (campaign.brandId !== command.brandId) {
      throw new Error('Unauthorized: Campaign belongs to different brand');
    }

    // Check if already active
    if (campaign.status.isActive()) {
      throw new Error('Campaign is already active');
    }

    // Find creator for campaign
    const creatorMatch = await this.findCreatorUseCase.execute({
      platforms: campaign.platforms,
      audienceSize: campaign.audienceSize as
        | 'micro'
        | 'mid-tier'
        | 'macro'
        | 'mega'
        | undefined,
      targetLocation: campaign.targetLocation || undefined,
    });

    if (!creatorMatch) {
      throw new BadRequestException(
        `No suitable creator found for campaign. ` +
        `Requirements: status='active', platform in [${campaign.platforms.join(', ')}], ` +
        `audienceSize=${campaign.audienceSize || 'any'}, ` +
        `location=${campaign.targetLocation || 'any'}. ` +
        `Use GET /campaigns/${command.campaignId}/test-creator-search to debug.`
      );
    }

    // Check if allocation already exists
    const existingAllocation =
      await this.allocationRepository.findByCampaignAndCreator(
        campaign.id,
        creatorMatch.creatorId,
      );

    if (existingAllocation) {
      throw new Error('Allocation already exists for this creator');
    }

    // Create allocation (for MVP: entire budget goes to one creator)
    const allocation = CampaignAllocation.create(
      randomUUID(),
      campaign.id,
      creatorMatch.creatorId,
      campaign.currentBudget, // entire budget for MVP
      AllocationStatusVO.pending(),
    );

    // Save allocation
    const savedAllocation = await this.allocationRepository.save(allocation);

    // Activate campaign
    const activatedCampaign = campaign.activate();
    await this.campaignRepository.save(activatedCampaign);

    // Add jobs to queue for initial data collection
    await this.collectCreatorDataUseCase.execute({
      allocationId: savedAllocation.id,
      socialProfileId: creatorMatch.socialProfileId,
      username: creatorMatch.username,
      platform: creatorMatch.platform,
    });

    return {
      campaign: activatedCampaign,
      allocation: savedAllocation,
      creator: {
        id: creatorMatch.creatorId,
        username: creatorMatch.username,
        platform: creatorMatch.platform,
      },
    };
  }
}
