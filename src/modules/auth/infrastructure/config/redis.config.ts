import { z } from 'zod';
import { ConfigService } from '@nestjs/config';

const RedisConfigSchema = z.object({
  url: z.string().url().default('redis://localhost:6379'),
  lockoutMaxAttempts: z.number().int().positive().default(5),
  lockoutDurationMinutes: z.number().int().positive().default(15),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export function loadRedisConfig(configService: ConfigService): RedisConfig {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  // Validate URL format if provided
  let validUrl = 'redis://localhost:6379';
  if (redisUrl && redisUrl.trim()) {
    try {
      new URL(redisUrl);
      validUrl = redisUrl;
    } catch {
      // Invalid URL, use default
      console.warn(`Invalid REDIS_URL format: ${redisUrl}, using default redis://localhost:6379`);
    }
  }

  return RedisConfigSchema.parse({
    url: validUrl,
    lockoutMaxAttempts: configService.get<string>('AUTH_LOCKOUT_MAX_ATTEMPTS')
      ? parseInt(configService.get<string>('AUTH_LOCKOUT_MAX_ATTEMPTS')!, 10)
      : 5,
    lockoutDurationMinutes: configService.get<string>('AUTH_LOCKOUT_DURATION_MINUTES')
      ? parseInt(configService.get<string>('AUTH_LOCKOUT_DURATION_MINUTES')!, 10)
      : 15,
  });
}

