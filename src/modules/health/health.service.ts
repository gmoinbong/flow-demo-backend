import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
    } catch (error) {
      this.redisClient = null;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  getRedisClient(): RedisClientType | null {
    return this.redisClient;
  }
}

