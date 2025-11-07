import { z } from 'zod';
import { ConfigService } from '@nestjs/config';

const JwtConfigSchema = z.object({
  secret: z.string().min(32),
  accessTokenExpiry: z.string().default('15m'),
  refreshTokenExpiry: z.string().default('7d'),
});

export type JwtConfig = z.infer<typeof JwtConfigSchema>;

export function loadJwtConfig(configService: ConfigService): JwtConfig {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Please set it in your .env file.',
    );
  }

  return JwtConfigSchema.parse({
    secret,
    accessTokenExpiry: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY') || '15m',
    refreshTokenExpiry: configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY') || '7d',
  });
}

