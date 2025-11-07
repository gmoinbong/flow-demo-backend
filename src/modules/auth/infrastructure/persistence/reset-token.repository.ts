/**
 * Reset token data
 */
export interface ResetTokenData {
  userId: string;
  expiresAt: Date;
}

/**
 * Reset token repository interface
 */
export interface IResetTokenRepository {
  /**
   * Save reset token
   */
  save(token: string, userId: string, expiresAt: Date): Promise<void>;

  /**
   * Get reset token data
   */
  get(token: string): Promise<ResetTokenData | null>;

  /**
   * Delete reset token
   */
  delete(token: string): Promise<void>;
}


