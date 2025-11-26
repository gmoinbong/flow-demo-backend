import { IRefreshTokenRepository } from './refresh-token.repository';
import { RedisClient } from '../../application/services/redis-lockout.service';

/**
 * Refresh token repository implementation using Redis
 * Tokens are stored by jti (JWT ID) for efficient lookup and rotation
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly namespace = 'auth:refresh';
  private readonly userIndexNamespace = 'auth:refresh:user';

  constructor(private readonly redis: RedisClient) {}

  /**
   * Get token key by jti
   */
  private getTokenKey(jti: string): string {
    return `${this.namespace}:${jti}`;
  }

  /**
   * Get user index key
   */
  private getUserIndexKey(userId: string): string {
    return `${this.userIndexNamespace}:${userId}`;
  }

  async save(jti: string, userId: string, expiresAt: Date): Promise<void> {
    const tokenKey = this.getTokenKey(jti);
    const userIndexKey = this.getUserIndexKey(userId);
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (ttlSeconds <= 0) {
      throw new Error('Token expiry date must be in the future');
    }

    const tokenData = {
      userId,
      expiresAt: expiresAt.toISOString(),
    };

    // Save token data
    await this.redis.set(tokenKey, JSON.stringify(tokenData), {
      EX: ttlSeconds,
    } as any);

    // Add jti to user's token index (for bulk deletion)
    // Store as set with expiration
    const existing = await this.redis.get(userIndexKey);
    const jtis = existing ? JSON.parse(existing) : [];
    if (!jtis.includes(jti)) {
      jtis.push(jti);
      await this.redis.set(userIndexKey, JSON.stringify(jtis), {
        EX: ttlSeconds, // Same TTL as token
      } as any);
    }
  }

  async exists(jti: string): Promise<boolean> {
    const tokenKey = this.getTokenKey(jti);
    const data = await this.redis.get(tokenKey);
    return data !== null;
  }

  async deleteByJti(jti: string): Promise<void> {
    const tokenKey = this.getTokenKey(jti);
    
    // Get token data to find userId
    const data = await this.redis.get(tokenKey);
    if (data) {
      const tokenData = JSON.parse(data) as { userId: string };
      const userIndexKey = this.getUserIndexKey(tokenData.userId);
      
      // Remove from user index
      const existing = await this.redis.get(userIndexKey);
      if (existing) {
        const jtis = JSON.parse(existing) as string[];
        const updated = jtis.filter((id) => id !== jti);
        if (updated.length > 0) {
          // Get TTL of one remaining token to preserve index TTL
          const remainingKey = this.getTokenKey(updated[0]);
          const remainingData = await this.redis.get(remainingKey);
          if (remainingData) {
            const remainingToken = JSON.parse(remainingData) as { expiresAt: string };
            const ttl = Math.floor(
              (new Date(remainingToken.expiresAt).getTime() - Date.now()) / 1000,
            );
            if (ttl > 0) {
              await this.redis.set(userIndexKey, JSON.stringify(updated), {
                EX: ttl,
              } as any);
            } else {
              await this.redis.del(userIndexKey);
            }
          } else {
            await this.redis.del(userIndexKey);
          }
        } else {
          await this.redis.del(userIndexKey);
        }
      }
    }
    
    // Delete token
    await this.redis.del(tokenKey);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const userIndexKey = this.getUserIndexKey(userId);
    const existing = await this.redis.get(userIndexKey);
    
    if (existing) {
      const jtis = JSON.parse(existing) as string[];
      
      // Delete all tokens
      for (const jti of jtis) {
        const tokenKey = this.getTokenKey(jti);
        await this.redis.del(tokenKey);
      }
      
      // Delete user index
      await this.redis.del(userIndexKey);
    }
  }
}
