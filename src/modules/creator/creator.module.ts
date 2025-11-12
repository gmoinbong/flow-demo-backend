import { Module } from '@nestjs/common';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import type { Database } from 'src/shared/core/infrastructure/database/database.types';
import { AuthModule } from '../auth/auth.module';
import { CreatorRepository } from './infrastructure/persistence/creator.repository';
import { CreatorValidatorService } from './application/services/creator-validator.service';
// import { BrandValidatorService } from './application/services/brand-validator.service';
import { CreateCreatorUseCase } from './application/use-cases/create-creator.use-case';
import { GetCreatorByIdUseCase } from './application/use-cases/get-creator-by-id.use-case';
import { GetCreatorsUseCase } from './application/use-cases/get-creators.use-case';
import { AddSocialProfileUseCase } from './application/use-cases/add-social-profile.use-case';
import { UpdateCreatorStatusUseCase } from './application/use-cases/update-creator-status.use-case';
import { UpdateCreatorUseCase } from './application/use-cases/update-creator.use-case';
// import { CreateBrandUseCase } from './application/use-cases/create-brand.use-case';
// import { LinkCreatorToBrandUseCase } from './application/use-cases/link-creator-to-brand.use-case';
import { CreatorController } from './presentation/controllers/creator.controller';
import { CREATOR_DI_TOKENS } from './creator.tokens';

@Module({
  imports: [AuthModule],
  controllers: [CreatorController],
  providers: [
    // Repositories
    {
      provide: CREATOR_DI_TOKENS.CREATOR_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new CreatorRepository(db),
    },
    // Services
    CreatorValidatorService,
    {
      provide: CREATOR_DI_TOKENS.CREATOR_VALIDATOR_SERVICE,
      useExisting: CreatorValidatorService,
    },
    // {
    //   provide: CREATOR_DI_TOKENS.BRAND_VALIDATOR_SERVICE,
    //   useClass: BrandValidatorService,
    // },
    // Use Cases
    CreateCreatorUseCase,
    GetCreatorByIdUseCase,
    GetCreatorsUseCase,
    AddSocialProfileUseCase,
    UpdateCreatorStatusUseCase,
    UpdateCreatorUseCase,
    // Brand use cases - commented out until repositories are implemented
    // {
    //   provide: CreateBrandUseCase,
    //   inject: [
    //     CREATOR_DI_TOKENS.BRAND_REPOSITORY,
    //     CREATOR_DI_TOKENS.BRAND_VALIDATOR_SERVICE,
    //   ],
    //   useFactory: (brandRepo: any, validator: BrandValidatorService) =>
    //     new CreateBrandUseCase(brandRepo, validator),
    // },
    // {
    //   provide: LinkCreatorToBrandUseCase,
    //   inject: [
    //     CREATOR_DI_TOKENS.CREATOR_REPOSITORY,
    //     CREATOR_DI_TOKENS.BRAND_REPOSITORY,
    //     CREATOR_DI_TOKENS.CREATOR_BRAND_REPOSITORY,
    //   ],
    //   useFactory: (
    //     creatorRepo: any,
    //     brandRepo: any,
    //     creatorBrandRepo: any,
    //   ) =>
    //     new LinkCreatorToBrandUseCase(creatorRepo, brandRepo, creatorBrandRepo),
    // },
  ],
  exports: [
    CREATOR_DI_TOKENS.CREATOR_REPOSITORY,
    GetCreatorsUseCase,
    GetCreatorByIdUseCase,
  ],
})
export class CreatorModule {}

