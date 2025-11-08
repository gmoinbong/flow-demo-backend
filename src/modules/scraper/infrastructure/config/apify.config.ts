import { ConfigService } from '@nestjs/config';

export interface ApifyConfig {
  token: string;
  baseUrl?: string;
}

export function getApifyConfig(configService: ConfigService): ApifyConfig {
  const token = configService.get<string>('APIFY_TOKEN');
  
  if (!token) {
    throw new Error('APIFY_TOKEN environment variable is required');
  }

  return {
    token,
    // Don't set baseUrl - ApifyClient uses correct URL by default
    // If custom baseUrl needed, use full URL without /v2 suffix
    baseUrl: configService.get<string>('APIFY_BASE_URL'), // Optional, defaults to https://api.apify.com/v2
  };
}

