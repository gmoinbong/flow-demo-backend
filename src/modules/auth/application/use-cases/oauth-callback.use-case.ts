import { UseCase } from 'src/shared/core/application/use-cases/base';
import { OAuthProviderService } from '../services/oauth-provider.service';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IOAuthAccountRepository } from '../../domain/repositories/oauth-account.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { JwtService } from '../services/jwt.service';
import { OAuthAccount } from '../../domain/entities/oauth-account.entity';
import { User } from '../../domain/entities/user.entity';
import {
  OAuthProviderError,
  UserNotFoundError,
  InvalidOAuthStateError,
} from '../../domain/errors/auth-errors';
import { OAuthStateService } from '../services/oauth-state.service';
import { OAuthTokenService } from '../services/oauth-token.service';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';
import { randomUUID } from 'crypto';

export interface OAuthCallbackInput {
  provider: OAuthProvider;
  code: string;
  state: string;
  redirectUri: string;
}

export interface OAuthCallbackOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
  isNewUser: boolean;
}

/**
 * OAuth callback use case - handle OAuth callback and create/link account
 */
export class OAuthCallbackUseCase
  implements UseCase<OAuthCallbackInput, OAuthCallbackOutput>
{
  constructor(
    private readonly oauthProviderService: OAuthProviderService,
    private readonly userRepository: IUserRepository,
    private readonly oauthAccountRepository: IOAuthAccountRepository,
    private readonly jwtService: JwtService,
    private readonly oauthStateService: OAuthStateService,
    private readonly oauthTokenService: OAuthTokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: OAuthCallbackInput): Promise<OAuthCallbackOutput> {
    // Validate state token (CSRF protection)
    const validatedState = this.oauthStateService.validateState(input.state);
    if (!validatedState) {
      throw new InvalidOAuthStateError('Invalid or tampered state token');
    }

    const provider = this.oauthProviderService.getProvider(input.provider);

    try {
      // Exchange code for tokens
      const tokenResponse = await provider.exchangeCode(
        input.code,
        input.redirectUri,
      );

      // Get user data from provider
      const userData = await provider.getUserData(tokenResponse.accessToken);

      // Check if OAuth account already exists
      let oauthAccount = await this.oauthAccountRepository.findByProvider(
        input.provider,
        userData.providerUserId,
      );

      let user;
      let isNewUser = false;

      if (oauthAccount) {
        // OAuth account exists - get user
        user = await this.userRepository.findById(oauthAccount.userId);
        if (!user) {
          throw new UserNotFoundError(oauthAccount.userId);
        }

        // Store tokens in Redis
        await this.oauthTokenService.storeTokens(
          oauthAccount.id,
          tokenResponse.accessToken,
          tokenResponse.refreshToken || null,
          tokenResponse.expiresIn || null,
        );

        // Update account if needed (e.g., mark as verified)
        await this.oauthAccountRepository.save(oauthAccount);
      } else {
        // New OAuth account - find or create user
        const email = Email.create(userData.email);
        user = await this.userRepository.findByEmail(email);

        if (!user) {
          // Create new user (no password for OAuth users)
          const newUser = User.create(randomUUID(), email, null);
          user = await this.userRepository.save(newUser);
          isNewUser = true;
        }

        // Create OAuth account
        oauthAccount = OAuthAccount.create(
          randomUUID(),
          user.id,
          input.provider,
          userData.providerUserId,
          false, // isVerified
        );
        await this.oauthAccountRepository.save(oauthAccount);

        // Store tokens in Redis
        await this.oauthTokenService.storeTokens(
          oauthAccount.id,
          tokenResponse.accessToken,
          tokenResponse.refreshToken || null,
          tokenResponse.expiresIn || null,
        );
      }

      // Generate JWT tokens
      const refreshToken = this.jwtService.generateRefreshToken(
        user.id,
        user.email.getValue(),
      );
      const refreshJti = this.jwtService.getJti(refreshToken.getValue());
      
      if (!refreshJti) {
        throw new Error('Failed to generate refresh token jti');
      }

      // Save refresh token to Redis
      await this.refreshTokenRepository.save(
        refreshJti,
        user.id,
        refreshToken.getExpiresAt(),
      );

      const accessToken = this.jwtService.generateAccessToken(
        user.id,
        user.email.getValue(),
      );

      return {
        accessToken: accessToken.getValue(),
        refreshToken: refreshToken.getValue(),
        user: {
          id: user.id,
          email: user.email.getValue(),
        },
        isNewUser,
      };
    } catch (error) {
      if (error instanceof OAuthProviderError) {
        throw error;
      }
      throw new OAuthProviderError(
        input.provider,
        'Failed to process OAuth callback',
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }
}

