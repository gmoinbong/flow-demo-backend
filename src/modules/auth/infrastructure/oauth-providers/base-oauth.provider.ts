import { IOAuthProvider, OAuthUserData, OAuthTokenResponse } from '../../application/services/oauth-provider.service';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';

/**
 * Base OAuth provider with common functionality
 */
export abstract class BaseOAuthProvider implements IOAuthProvider {
  protected abstract readonly baseAuthUrl: string;
  protected abstract readonly baseTokenUrl: string;
  protected abstract readonly baseUserInfoUrl: string;
  protected abstract readonly scopes: string[];

  constructor(
    protected readonly clientId: string,
    protected readonly clientSecret: string,
    protected readonly redirectUri: string,
  ) {}

  abstract getProvider(): OAuthProvider;

  abstract getAuthorizationUrl(state: string, redirectUri: string): string;

  abstract exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResponse>;

  abstract getUserData(accessToken: string): Promise<OAuthUserData>;

  /**
   * Build query string from params
   */
  protected buildQueryString(params: Record<string, string>): string {
    return new URLSearchParams(params).toString();
  }
}


