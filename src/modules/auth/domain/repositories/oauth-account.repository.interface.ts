import { OAuthAccount, OAuthProvider } from '../entities/oauth-account.entity';

/**
 * OAuth Account repository interface (domain layer)
 */
export interface IOAuthAccountRepository {
  /**
   * Find OAuth account by provider and provider user ID
   */
  findByProvider(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<OAuthAccount | null>;

  /**
   * Find OAuth accounts by user ID
   */
  findByUserId(userId: string): Promise<OAuthAccount[]>;

  /**
   * Find OAuth account by user ID and provider
   */
  findByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccount | null>;

  /**
   * Save OAuth account (create or update)
   */
  save(account: OAuthAccount): Promise<OAuthAccount>;

  /**
   * Delete OAuth account
   */
  delete(id: string): Promise<void>;
}


