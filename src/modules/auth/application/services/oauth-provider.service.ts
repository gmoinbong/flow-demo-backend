import { OAuthProvider } from '../../domain/entities/oauth-account.entity';

/**
 * OAuth user data returned from provider
 */
export interface OAuthUserData {
  providerUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
}

/**
 * Base OAuth provider interface
 */
export interface IOAuthProvider {
  /**
   * Get authorization URL
   */
  getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResponse>;

  /**
   * Get user data using access token
   */
  getUserData(accessToken: string): Promise<OAuthUserData>;

  /**
   * Get provider name
   */
  getProvider(): OAuthProvider;
}

/**
 * OAuth provider service - manages multiple OAuth providers
 */
export class OAuthProviderService {
  constructor(private readonly providers: Map<OAuthProvider, IOAuthProvider>) {}

  /**
   * Get provider by name
   */
  getProvider(provider: OAuthProvider): IOAuthProvider {
    const oauthProvider = this.providers.get(provider);
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not configured`);
    }
    return oauthProvider;
  }

  /**
   * Check if provider is available
   */
  hasProvider(provider: OAuthProvider): boolean {
    return this.providers.has(provider);
  }
}

