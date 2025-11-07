/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'tiktok' | 'instagram';

/**
 * OAuth Account entity - represents linked OAuth account
 * Tokens are stored in Redis, not in the entity
 */
export class OAuthAccount {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: OAuthProvider,
    public readonly providerUserId: string,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    provider: OAuthProvider,
    providerUserId: string,
    isVerified: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): OAuthAccount {
    return new OAuthAccount(
      id,
      userId,
      provider,
      providerUserId,
      isVerified,
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    userId: string,
    provider: OAuthProvider,
    providerUserId: string,
    isVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): OAuthAccount {
    return new OAuthAccount(
      id,
      userId,
      provider,
      providerUserId,
      isVerified,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Mark account as verified
   */
  markAsVerified(): OAuthAccount {
    return new OAuthAccount(
      this.id,
      this.userId,
      this.provider,
      this.providerUserId,
      true,
      this.createdAt,
      new Date(),
    );
  }
}
