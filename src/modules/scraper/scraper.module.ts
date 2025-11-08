import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { getApifyConfig, ApifyConfig } from './infrastructure/config/apify.config';
import { ApifyScraperService } from './infrastructure/services/apify-scraper.service';
import { FetchPostsUseCase } from './application/use-cases/fetch-posts.use-case';
import { ScraperController } from './presentation/controllers/scraper.controller';
import { SCRAPER_DI_TOKENS } from './scraper.tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ScraperController],
  providers: [
    // Apify Configuration
    {
      provide: 'APIFY_CONFIG',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getApifyConfig(configService),
    },
    // Apify Scraper Service
    {
      provide: SCRAPER_DI_TOKENS.APIFY_SCRAPER_SERVICE,
      inject: ['APIFY_CONFIG'],
      useFactory: (config: ApifyConfig) => new ApifyScraperService(config),
    },
    // Use Cases
    {
      provide: FetchPostsUseCase,
      inject: [
        SCRAPER_DI_TOKENS.APIFY_SCRAPER_SERVICE,
        SHARED_DI_TOKENS.DATABASE_CLIENT,
      ],
      useFactory: (apifyScraper: ApifyScraperService, db: Database) =>
        new FetchPostsUseCase(apifyScraper, db),
    },
  ],
  exports: [FetchPostsUseCase],
})
export class ScraperModule {}

