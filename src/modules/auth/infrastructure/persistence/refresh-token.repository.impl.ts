import { eq } from 'drizzle-orm';
import { refresh_tokens } from 'src/shared/core/infrastructure/database/schema';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { IRefreshTokenRepository } from './refresh-token.repository';
import * as crypto from 'crypto';

/**
 * Refresh token repository implementation using PostgreSQL
 * Tokens are hashed before storage
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Database) {}

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async save(token: string, userId: string, expiresAt: Date): Promise<void> {
    const tokenHash = this.hashToken(token);

    await this.db.insert(refresh_tokens).values({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  }

  async exists(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const result = await this.db
      .select()
      .from(refresh_tokens)
      .where(eq(refresh_tokens.token_hash, tokenHash))
      .limit(1);

    return result.length > 0;
  }

  async deleteByToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.db.delete(refresh_tokens).where(eq(refresh_tokens.token_hash, tokenHash));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(refresh_tokens).where(eq(refresh_tokens.user_id, userId));
  }
}
