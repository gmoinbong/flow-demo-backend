import { z } from 'zod';
import { ConfigService } from '@nestjs/config';

const RedisConfigSchema = z.object({
  url: z.string().url(),
  lockoutMaxAttempts: z.number().int().positive().default(5),
  lockoutDurationMinutes: z.number().int().positive().default(15),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export function loadRedisConfig(configService: ConfigService): RedisConfig {
  return RedisConfigSchema.parse({
    url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    lockoutMaxAttempts: configService.get<string>('AUTH_LOCKOUT_MAX_ATTEMPTS')
      ? parseInt(configService.get<string>('AUTH_LOCKOUT_MAX_ATTEMPTS')!, 10)
      : 5,
    lockoutDurationMinutes: configService.get<string>('AUTH_LOCKOUT_DURATION_MINUTES')
      ? parseInt(configService.get<string>('AUTH_LOCKOUT_DURATION_MINUTES')!, 10)
      : 15,
  });
}

