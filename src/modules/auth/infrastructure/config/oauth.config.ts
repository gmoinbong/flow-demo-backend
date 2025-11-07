import { z } from 'zod';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';

const OAuthProviderConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().url(),
});

export type OAuthProviderConfig = z.infer<typeof OAuthProviderConfigSchema>;

export type OAuthConfig = Partial<Record<OAuthProvider, OAuthProviderConfig>>;

export function loadOAuthConfig(configService: ConfigService): OAuthConfig {
  const config: OAuthConfig = {};

  // Google
  const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID');
  const googleClientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
  if (googleClientId && googleClientSecret) {
    config.google = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri:
        configService.get<string>('GOOGLE_REDIRECT_URI') ||
        'http://localhost:3000/auth/oauth/google/callback',
    };
  }

  // TikTok
  const tiktokClientId = configService.get<string>('TIKTOK_CLIENT_ID');
  const tiktokClientSecret = configService.get<string>('TIKTOK_CLIENT_SECRET');
  if (tiktokClientId && tiktokClientSecret) {
    config.tiktok = {
      clientId: tiktokClientId,
      clientSecret: tiktokClientSecret,
      redirectUri:
        configService.get<string>('TIKTOK_REDIRECT_URI') ||
        'http://localhost:3000/auth/oauth/tiktok/callback',
    };
  }

  // Instagram
  const instagramClientId = configService.get<string>('INSTAGRAM_CLIENT_ID');
  const instagramClientSecret = configService.get<string>('INSTAGRAM_CLIENT_SECRET');
  if (instagramClientId && instagramClientSecret) {
    config.instagram = {
      clientId: instagramClientId,
      clientSecret: instagramClientSecret,
      redirectUri:
        configService.get<string>('INSTAGRAM_REDIRECT_URI') ||
        'http://localhost:3000/auth/oauth/instagram/callback',
    };
  }

  return config;
}

