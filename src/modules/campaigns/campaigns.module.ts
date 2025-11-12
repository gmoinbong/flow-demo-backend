import { Module } from '@nestjs/common';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { AuthModule } from '../auth/auth.module';
import { ScraperModule } from '../scraper/scraper.module';
import { SCRAPER_DI_TOKENS } from '../scraper/scraper.tokens';
import { ApifyScraperService } from '../scraper/infrastructure/services/apify-scraper.service';
import { CAMPAIGNS_DI_TOKENS } from './campaigns.tokens';

// Repositories
import { CampaignRepository } from './infrastructure/persistence/campaign.repository';
import { CampaignAllocationRepository } from './infrastructure/persistence/campaign-allocation.repository';
import { CampaignTrackingConfigRepository } from './infrastructure/persistence/campaign-tracking-config.repository';

// Services
import { ApifyJobsQueueService } from './infrastructure/services/apify-jobs-queue.service';

// Use Cases
import { CreateCampaignUseCase } from './application/use-cases/create-campaign.use-case';
import { ActivateCampaignUseCase } from './application/use-cases/activate-campaign.use-case';
import { FindCreatorForCampaignUseCase } from './application/use-cases/find-creator-for-campaign.use-case';
import { CollectCreatorDataUseCase } from './application/use-cases/collect-creator-data.use-case';

// Controllers
import { CampaignController } from './presentation/controllers/campaign.controller';

@Module({
  imports: [AuthModule, ScraperModule],
  controllers: [CampaignController],
  providers: [
    // Repositories
    {
      provide: CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new CampaignRepository(db),
    },
    {
      provide: CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new CampaignAllocationRepository(db),
    },
    {
      provide: CAMPAIGNS_DI_TOKENS.CAMPAIGN_TRACKING_CONFIG_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new CampaignTrackingConfigRepository(db),
    },
    // Services
    {
      provide: CAMPAIGNS_DI_TOKENS.APIFY_JOBS_QUEUE_SERVICE,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new ApifyJobsQueueService(db),
    },
    // Use Cases
    {
      provide: CreateCampaignUseCase,
      inject: [
        CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY,
        CAMPAIGNS_DI_TOKENS.CAMPAIGN_TRACKING_CONFIG_REPOSITORY,
      ],
      useFactory: (
        campaignRepo: CampaignRepository,
        trackingConfigRepo: CampaignTrackingConfigRepository,
      ) =>
        new CreateCampaignUseCase(campaignRepo, trackingConfigRepo),
    },
    {
      provide: ActivateCampaignUseCase,
      inject: [
        CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY,
        CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY,
        FindCreatorForCampaignUseCase,
        CollectCreatorDataUseCase,
      ],
      useFactory: (
        campaignRepo: CampaignRepository,
        allocationRepo: CampaignAllocationRepository,
        findCreatorUseCase: FindCreatorForCampaignUseCase,
        collectCreatorDataUseCase: CollectCreatorDataUseCase,
      ) =>
        new ActivateCampaignUseCase(
          campaignRepo,
          allocationRepo,
          findCreatorUseCase,
          collectCreatorDataUseCase,
        ),
    },
    {
      provide: FindCreatorForCampaignUseCase,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new FindCreatorForCampaignUseCase(db),
    },
    {
      provide: CollectCreatorDataUseCase,
      inject: [
        SCRAPER_DI_TOKENS.APIFY_SCRAPER_SERVICE,
        CAMPAIGNS_DI_TOKENS.APIFY_JOBS_QUEUE_SERVICE,
        CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY,
        SHARED_DI_TOKENS.DATABASE_CLIENT,
      ],
      useFactory: (
        apifyScraper: ApifyScraperService,
        jobsQueue: ApifyJobsQueueService,
        allocationRepo: CampaignAllocationRepository,
        db: Database,
      ) =>
        new CollectCreatorDataUseCase(
          apifyScraper,
          jobsQueue,
          allocationRepo,
          db,
        ),
    },
  ],
  exports: [
    CreateCampaignUseCase,
    ActivateCampaignUseCase,
    CollectCreatorDataUseCase,
    CAMPAIGNS_DI_TOKENS.CAMPAIGN_REPOSITORY,
    CAMPAIGNS_DI_TOKENS.CAMPAIGN_ALLOCATION_REPOSITORY,
  ],
})
export class CampaignsModule {}

