/**
 * Refresh token repository interface
 */
export interface IRefreshTokenRepository {
  /**
   * Save refresh token
   */
  save(token: string, userId: string, expiresAt: Date): Promise<void>;

  /**
   * Check if token exists
   */
  exists(token: string): Promise<boolean>;

  /**
   * Delete token by token value
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Delete all tokens for user
   */
  deleteByUserId(userId: string): Promise<void>;
}


