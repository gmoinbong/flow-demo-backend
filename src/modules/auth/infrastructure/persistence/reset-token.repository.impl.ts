import { IResetTokenRepository, ResetTokenData } from './reset-token.repository';
import { RedisClient } from '../../application/services/redis-lockout.service';

/**
 * Reset token repository implementation using Redis
 * Tokens expire after 15 minutes
 */
export class ResetTokenRepository implements IResetTokenRepository {
  private readonly namespace = 'auth:reset';

  constructor(private readonly redis: RedisClient) {}

  private getKey(token: string): string {
    return `${this.namespace}:${token}`;
  }

  async save(token: string, userId: string, expiresAt: Date): Promise<void> {
    const key = this.getKey(token);
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (ttlSeconds <= 0) {
      throw new Error('Token expiry date must be in the future');
    }

    const data: ResetTokenData = {
      userId,
      expiresAt,
    };

    await this.redis.set(key, JSON.stringify(data), { EX: ttlSeconds } as any);
  }

  async get(token: string): Promise<ResetTokenData | null> {
    const key = this.getKey(token);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as { userId: string; expiresAt: string };
    return {
      userId: parsed.userId,
      expiresAt: new Date(parsed.expiresAt),
    };
  }

  async delete(token: string): Promise<void> {
    const key = this.getKey(token);
    await this.redis.del(key).then(() => undefined);
  }
}

