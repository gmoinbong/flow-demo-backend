import { BaseOAuthProvider } from './base-oauth.provider';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { IOAuthProvider, OAuthUserData, OAuthTokenResponse } from '../../application/services/oauth-provider.service';
import axios from 'axios';

/**
 * Instagram OAuth provider (Meta Graph API v18)
 */
export class InstagramOAuthProvider extends BaseOAuthProvider {
  protected readonly baseAuthUrl = 'https://api.instagram.com/oauth/authorize';
  protected readonly baseTokenUrl = 'https://api.instagram.com/oauth/access_token';
  protected readonly baseUserInfoUrl = 'https://graph.instagram.com/me';
  protected readonly scopes = ['instagram_basic'];

  getProvider(): OAuthProvider {
    return 'instagram';
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: this.scopes.join(','),
      response_type: 'code',
      state,
    };

    return `${this.baseAuthUrl}?${this.buildQueryString(params)}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const response = await axios.post(
      this.baseTokenUrl,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: undefined,
      expiresIn: response.data.expires_in,
    };
  }

  async getUserData(accessToken: string): Promise<OAuthUserData> {
    const response = await axios.get(
      `${this.baseUserInfoUrl}?fields=id,username&access_token=${accessToken}`,
    );

    return {
      providerUserId: response.data.id,
      email: `${response.data.username}@instagram.local`, // Instagram doesn't provide email
      name: response.data.username,
      avatarUrl: undefined,
    };
  }
}


