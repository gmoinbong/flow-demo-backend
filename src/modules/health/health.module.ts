import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { Pool } from 'pg';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    // Database Pool provider for healthcheck
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString =
          configService.get<string>('DATABASE_WRITE_URL') ||
          configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          return null;
        }
        return new Pool({ connectionString });
      },
    },
    HealthService,
  ],
  exports: ['DATABASE_POOL', HealthService],
})
export class HealthModule {}

