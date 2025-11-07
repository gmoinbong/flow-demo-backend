import { BaseOAuthProvider } from './base-oauth.provider';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { IOAuthProvider, OAuthUserData, OAuthTokenResponse } from '../../application/services/oauth-provider.service';
import axios from 'axios';

/**
 * Google OAuth provider
 */
export class GoogleOAuthProvider extends BaseOAuthProvider {
  protected readonly baseAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  protected readonly baseTokenUrl = 'https://oauth2.googleapis.com/token';
  protected readonly baseUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  protected readonly scopes = ['profile', 'email'];

  getProvider(): OAuthProvider {
    return 'google';
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    };

    return `${this.baseAuthUrl}?${this.buildQueryString(params)}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    try {
      const response = await axios.post(
        this.baseTokenUrl,
        {
          client_id: this.clientId,
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

      if (!response.data.access_token) {
        throw new Error(
          `Google OAuth: Missing access_token in response. Response: ${JSON.stringify(response.data)}`,
        );
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error_description ||
          error.response?.data?.error ||
          error.message;
        throw new Error(
          `Google OAuth token exchange failed: ${errorMessage}. Status: ${error.response?.status}`,
        );
      }
      throw error;
    }
  }

  async getUserData(accessToken: string): Promise<OAuthUserData> {
    const response = await axios.get(this.baseUserInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      providerUserId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      avatarUrl: response.data.picture,
    };
  }
}

