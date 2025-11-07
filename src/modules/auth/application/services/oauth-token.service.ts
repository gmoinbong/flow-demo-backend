/**
 * OAuth Token Service - stores OAuth provider tokens in Redis as JWT
 */
export interface OAuthTokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // timestamp in milliseconds
}

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Service for managing OAuth provider tokens in Redis
 */
export class OAuthTokenService {
  private readonly keyPrefix = 'oauth:token:';

  constructor(private readonly redis: IRedisClient) {}

  /**
   * Store OAuth tokens for an account
   */
  async storeTokens(
    accountId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresIn: number | null, // seconds
  ): Promise<void> {
    const key = `${this.keyPrefix}${accountId}`;

    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

    const tokenData: OAuthTokenData = {
      accessToken,
      refreshToken,
      expiresAt: expiresAt || 0,
    };

    const jsonData = JSON.stringify(tokenData);

    // Set TTL to expire_at + 1 day buffer, or 7 days if no expiry
    const ttlSeconds = expiresIn
      ? expiresIn + 24 * 60 * 60 // expiresIn + 1 day
      : 7 * 24 * 60 * 60; // 7 days default

    await this.redis.set(key, jsonData, { EX: ttlSeconds });
  }

  /**
   * Get OAuth tokens for an account
   */
  async getTokens(accountId: string): Promise<OAuthTokenData | null> {
    const key = `${this.keyPrefix}${accountId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as OAuthTokenData;
    } catch {
      return null;
    }
  }

  /**
   * Delete OAuth tokens for an account
   */
  async deleteTokens(accountId: string): Promise<void> {
    const key = `${this.keyPrefix}${accountId}`;
    await this.redis.del(key);
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(tokenData: OAuthTokenData): boolean {
    if (!tokenData.expiresAt || tokenData.expiresAt === 0) {
      return false;
    }
    return tokenData.expiresAt < Date.now();
  }
}


