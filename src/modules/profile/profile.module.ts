import { Module } from '@nestjs/common';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { ProfileRepository } from './infrastructure/persistence/profile.repository';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { ProfileController } from './presentation/controllers/profile.controller';
import { PROFILE_DI_TOKENS } from './profile.tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [
    // Repositories
    {
      provide: PROFILE_DI_TOKENS.PROFILE_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new ProfileRepository(db),
    },
    // Use Cases
    {
      provide: GetProfileUseCase,
      inject: [
        PROFILE_DI_TOKENS.PROFILE_REPOSITORY,
        SHARED_DI_TOKENS.DATABASE_CLIENT,
      ],
      useFactory: (profileRepo: any, db: Database) =>
        new GetProfileUseCase(profileRepo, db),
    },
    {
      provide: UpdateProfileUseCase,
      inject: [PROFILE_DI_TOKENS.PROFILE_REPOSITORY],
      useFactory: (profileRepo: any) => new UpdateProfileUseCase(profileRepo),
    },
  ],
  exports: [],
})
export class ProfileModule {}

