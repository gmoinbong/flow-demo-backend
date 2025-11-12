import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt.guard';
import { CreateCampaignUseCase } from '../../application/use-cases/create-campaign.use-case';
import { ActivateCampaignUseCase } from '../../application/use-cases/activate-campaign.use-case';
import { FindCreatorForCampaignUseCase } from '../../application/use-cases/find-creator-for-campaign.use-case';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import {
  CampaignResponseDto,
  CampaignDetailResponseDto,
  AllocationResponseDto,
  ActivateCampaignResponseDto,
} from '../dto/campaign-response.dto';
import { CAMPAIGNS_DI_TOKENS } from '../../campaigns.tokens';
import type { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import type { ICampaignAllocationRepository } from '../../domain/repositories/campaign-allocation.repository.interface';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { eq, inArray } from 'drizzle-orm';
import { profile, brands, creator_social_profiles } from 'src/shared/core/infrastructure/database/schema';

@Controller('campaigns')
@ApiTags('Campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
export class CampaignController {
  constructor(
    private readonly createCampaignUseCase: CreateCampaignUseCase,
    private readonly activateCampaignUseCase: ActivateCampaignUseCase,
    private readonly findCreatorUseCase: FindCreatorForCampaignUseCase,
    @Inject(CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: ICampaignRepository,
    @Inject(CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY)
    private readonly allocationRepository: ICampaignAllocationRepository,
    @Inject(SHARED_DI_TOKENS.DATABASE_CLIENT)
    private readonly db: Database,
  ) {}

  private async getBrandIdByUserId(userId: string, userRole?: string): Promise<string> {
    // Check if user has brand role
    if (userRole && userRole !== 'brand') {
      throw new ForbiddenException(
        'Only users with brand role can manage campaigns. Your role: ' + userRole
      );
    }

    // Get profile by user_id
    const userProfile = await this.db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);

    if (!userProfile || userProfile.length === 0) {
      throw new NotFoundException('Profile not found for user. Please complete your profile setup.');
    }

    // Get brand by profile_id
    const brand = await this.db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.profile_id, userProfile[0].id))
      .limit(1);

    if (!brand || brand.length === 0) {
      throw new BadRequestException(
        'Brand not found for your profile. ' +
        'If you registered as a brand, please ensure your company information was provided during registration. ' +
        'Otherwise, you need to register with brand role to create campaigns.'
      );
    }

    return brand[0].id;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new campaign',
    description: `
      Create a new campaign by brand.
      
      **Process:**
      1. Campaign is created with status 'draft'
      2. Optionally creates tracking config for post detection
      3. Campaign is ready for activation
      
      **Budget:** specified in cents (1000000 = $10,000)
      
      **Platforms:** array of platforms ['instagram', 'tiktok', 'youtube']
      
      **Tracking Config:** rules for automatic detection of campaign posts
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation error, invalid dates, budget <= 0)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);

    const result = await this.createCampaignUseCase.execute({
      brandId,
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      goals: dto.goals,
      targetAudience: dto.targetAudience,
      platforms: dto.platforms,
      audienceSize: dto.audienceSize,
      targetLocation: dto.targetLocation,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      trackingConfig: dto.trackingConfig,
    });

    return {
      id: result.campaign.id,
      name: result.campaign.name,
      status: result.campaign.status.value,
      createdAt: result.campaign.createdAt,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all campaigns for brand',
    description: `
      Get list of all campaigns for the brand.
      
      **Filtering:** automatically by brandId from token
      
      **Response:** array of campaigns with basic information
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns',
    type: [CampaignResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getCampaigns(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);
    const campaigns = await this.campaignRepository.findByBrandId(brandId);

    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status.value,
      budget: campaign.budget,
      currentBudget: campaign.currentBudget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get campaign details',
    description: `
      Get detailed information about a campaign.
      
      **Authorization:** only campaign owner can get details
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign details',
    type: CampaignDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - campaign belongs to different brand',
  })
  async getCampaign(@Param('id') id: string, @Request() req: any) {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);
    if (campaign.brandId !== brandId) {
      throw new ForbiddenException('You do not have permission to access this campaign');
    }

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status.value,
      budget: campaign.budget,
      currentBudget: campaign.currentBudget,
      goals: campaign.goals,
      platforms: campaign.platforms,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate campaign and assign creator',
    description: `
      Activate campaign and assign creator.
      
      **Process:**
      1. Search for suitable creator in DB by campaign criteria
      2. Create allocation (budget distribution)
      3. Activate campaign (status: 'active')
      4. Add jobs to Apify queue for creator data collection
      
      **Creator Search:**
      - By campaign platforms
      - By audience size (micro/mid-tier/macro/mega)
      - By location (if specified)
      - Priority: verified data > declared data
      
      **Automatically added jobs:**
      - profile_scrape - collect creator profile
      - posts_scrape - collect historical posts
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign activated and creator assigned',
    type: ActivateCampaignResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Campaign already active or no suitable creator found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - campaign belongs to different brand',
  })
  async activateCampaign(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);
    const result = await this.activateCampaignUseCase.execute({
      campaignId: id,
      brandId,
    });

    return {
      campaign: {
        id: result.campaign.id,
        status: result.campaign.status.value,
      },
      allocation: {
        id: result.allocation.id,
        creatorId: result.allocation.creatorId,
        allocatedBudget: result.allocation.allocatedBudget,
        status: result.allocation.status.value,
      },
      creator: result.creator,
    };
  }

  @Get(':id/allocations')
  @ApiOperation({
    summary: 'Get campaign allocations',
    description: `
      Get list of allocations (budget distributions) for campaign.
      
      **Allocation contains:**
      - creatorId - creator ID
      - allocatedBudget - initially allocated budget
      - currentBudget - current budget (after reallocation)
      - status - allocation status
      - Metrics: reach, engagement, postsCount
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of allocations',
    type: [AllocationResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - campaign belongs to different brand',
  })
  async getAllocations(@Param('id') id: string, @Request() req: any) {
    const campaign = await this.campaignRepository.findById(id);

    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.brandId !== brandId) {
      throw new ForbiddenException('You do not have permission to access this campaign');
    }

    const allocations = await this.allocationRepository.findByCampaignId(id);

    return allocations.map((allocation) => ({
      id: allocation.id,
      creatorId: allocation.creatorId,
      allocatedBudget: allocation.allocatedBudget,
      currentBudget: allocation.currentBudget,
      status: allocation.status.value,
      reach: allocation.reach,
      engagement: allocation.engagement,
      postsCount: allocation.postsCount,
    }));
  }

  @Get(':id/test-creator-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test creator search for campaign (DEBUG)',
    description: `
      Тестовый endpoint для проверки поиска креатора для кампании.
      
      Показывает:
      - Параметры кампании (platforms, audienceSize, location)
      - Найден ли подходящий креатор
      - Если не найден - почему (какие условия не выполнены)
      - Список всех доступных креаторов с их данными
      
      **Требования для креатора:**
      1. profile.status = 'active'
      2. creator_social_profiles.platform должен совпадать с platforms кампании
      3. Должны быть заполнены followers_declared ИЛИ followers_verified
      4. Если указан audienceSize - followers должны попадать в диапазон
      5. Если указан targetLocation - location должен совпадать
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Creator search test results',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  async testCreatorSearch(@Param('id') id: string, @Request() req: any) {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const brandId = await this.getBrandIdByUserId(userId, userRole);

    if (campaign.brandId !== brandId) {
      throw new ForbiddenException('You do not have permission to access this campaign');
    }

    // Try to find creator
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

    // Get all creators with social profiles for debugging
    const allCreators = await this.db
      .select({
        creatorId: creator_social_profiles.creator_id,
        socialProfileId: creator_social_profiles.id,
        platform: creator_social_profiles.platform,
        username: creator_social_profiles.username,
        followersDeclared: creator_social_profiles.followers_declared,
        followersVerified: creator_social_profiles.followers_verified,
        engagementRateDeclared: creator_social_profiles.engagement_rate_declared,
        engagementRateVerified: creator_social_profiles.engagement_rate_verified,
        location: creator_social_profiles.location,
        profileStatus: profile.status,
      })
      .from(creator_social_profiles)
      .innerJoin(profile, eq(profile.id, creator_social_profiles.creator_id))
      .where(inArray(creator_social_profiles.platform, campaign.platforms))
      .limit(50);

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platforms: campaign.platforms,
        audienceSize: campaign.audienceSize,
        targetLocation: campaign.targetLocation,
      },
      searchCriteria: {
        platforms: campaign.platforms,
        audienceSize: campaign.audienceSize,
        targetLocation: campaign.targetLocation || null,
      },
      found: !!creatorMatch,
      creatorMatch: creatorMatch
        ? {
            creatorId: creatorMatch.creatorId,
            socialProfileId: creatorMatch.socialProfileId,
            platform: creatorMatch.platform,
            username: creatorMatch.username,
            followers: creatorMatch.followers,
            engagementRate: creatorMatch.engagementRate,
            location: creatorMatch.location,
          }
        : null,
      allAvailableCreators: allCreators.map((c) => {
        const followers = c.followersVerified || c.followersDeclared || 0;
        let matchesAudienceSize = true;
        if (campaign.audienceSize) {
          switch (campaign.audienceSize) {
            case 'micro':
              matchesAudienceSize = followers >= 1000 && followers <= 10000;
              break;
            case 'mid-tier':
              matchesAudienceSize = followers >= 10000 && followers <= 100000;
              break;
            case 'macro':
              matchesAudienceSize = followers >= 100000 && followers <= 1000000;
              break;
            case 'mega':
              matchesAudienceSize = followers > 1000000;
              break;
          }
        }
        
        const matchesLocation = !campaign.targetLocation || 
          (c.location && c.location.toLowerCase().includes(campaign.targetLocation.toLowerCase()));
        
        return {
          creatorId: c.creatorId,
          platform: c.platform,
          username: c.username,
          profileStatus: c.profileStatus,
          followersDeclared: c.followersDeclared,
          followersVerified: c.followersVerified,
          totalFollowers: followers,
          hasFollowers: !!(c.followersDeclared || c.followersVerified),
          location: c.location,
          matchesPlatform: campaign.platforms.includes(c.platform),
          matchesStatus: c.profileStatus === 'active',
          matchesAudienceSize,
          matchesLocation,
          matchesAll:
            campaign.platforms.includes(c.platform) &&
            c.profileStatus === 'active' &&
            !!(c.followersDeclared || c.followersVerified) &&
            matchesAudienceSize &&
            matchesLocation,
          issues: [
            !campaign.platforms.includes(c.platform) && 'Platform mismatch',
            c.profileStatus !== 'active' && `Status is "${c.profileStatus}", need "active"`,
            !(c.followersDeclared || c.followersVerified) && 'No followers data',
            !matchesAudienceSize && `Followers ${followers} don't match ${campaign.audienceSize} range`,
            !matchesLocation && `Location "${c.location}" doesn't match "${campaign.targetLocation}"`,
          ].filter(Boolean),
        };
      }),
      requirements: {
        profileStatus: 'active',
        platform: `Must be one of: ${campaign.platforms.join(', ')}`,
        followers: 'Must have followers_declared OR followers_verified',
        audienceSize: campaign.audienceSize
          ? `Must match audience size: ${campaign.audienceSize}`
          : 'No audience size filter',
        location: campaign.targetLocation
          ? `Must match location: ${campaign.targetLocation}`
          : 'No location filter',
      },
    };
  }
}

