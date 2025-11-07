import { BaseOAuthProvider } from './base-oauth.provider';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { IOAuthProvider, OAuthUserData, OAuthTokenResponse } from '../../application/services/oauth-provider.service';
import axios from 'axios';

/**
 * TikTok OAuth provider
 */
export class TikTokOAuthProvider extends BaseOAuthProvider {
  protected readonly baseAuthUrl = 'https://www.tiktok.com/v1/oauth/authorize';
  protected readonly baseTokenUrl = 'https://open.tiktokapis.com/v2/oauth/token';
  protected readonly baseUserInfoUrl = 'https://open.tiktokapis.com/v2/user/info';
  protected readonly scopes = ['user.info.basic'];

  getProvider(): OAuthProvider {
    return 'tiktok';
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = {
      client_key: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scopes.join(','),
      state,
    };

    return `${this.baseAuthUrl}?${this.buildQueryString(params)}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const response = await axios.post(
      this.baseTokenUrl,
      {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return {
      accessToken: response.data.data.access_token,
      refreshToken: response.data.data.refresh_token,
      expiresIn: response.data.data.expires_in,
    };
  }

  async getUserData(accessToken: string): Promise<OAuthUserData> {
    const response = await axios.get(
      `${this.baseUserInfoUrl}?fields=open_id,union_id,avatar_url,display_name,email`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const user = response.data.data.user;
    return {
      providerUserId: user.open_id || user.union_id,
      email: user.email,
      name: user.display_name,
      avatarUrl: user.avatar_url,
    };
  }
}


