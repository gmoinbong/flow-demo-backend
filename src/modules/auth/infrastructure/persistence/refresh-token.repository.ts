/**
 * Refresh token repository interface
 */
export interface IRefreshTokenRepository {
  /**
   * Save refresh token by jti
   */
  save(jti: string, userId: string, expiresAt: Date): Promise<void>;

  /**
   * Check if token exists by jti
   */
  exists(jti: string): Promise<boolean>;

  /**
   * Delete token by jti
   */
  deleteByJti(jti: string): Promise<void>;

  /**
   * Delete all tokens for user
   */
  deleteByUserId(userId: string): Promise<void>;
}


