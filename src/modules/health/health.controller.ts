import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Pool } from 'pg';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @Inject('DATABASE_POOL') private databasePool: Pool | null,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          if (!this.databasePool) {
            return {
              database: {
                status: 'down',
                error: 'Database not configured',
                note: 'Application continues without database',
              },
            };
          }
          await this.databasePool.query('SELECT 1');
          return { database: { status: 'up' } };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            database: {
              status: 'down',
              error: errorMessage,
              note: 'Application continues without database',
            },
          };
        }
      },
      async (): Promise<HealthIndicatorResult> => {
        try {
          const redisClient = this.healthService.getRedisClient();
          if (!redisClient) {
            return {
              redis: {
                status: 'down',
                error: 'Redis not configured',
              },
            };
          }
          await redisClient.ping();
          return { redis: { status: 'up' } };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            redis: {
              status: 'down',
              error: errorMessage,
            },
          };
        }
      },
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  ready() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

