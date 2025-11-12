import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SHARED_DI_TOKENS } from 'src/shared/core/infrastructure/constants/tokens';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { OAuthAccountRepository } from './infrastructure/persistence/oauth-account.repository';
import { RefreshTokenRepository } from './infrastructure/persistence/refresh-token.repository.impl';
import { ResetTokenRepository } from './infrastructure/persistence/reset-token.repository.impl';
import { PasswordService } from './application/services/password.service';
import { JwtService } from './application/services/jwt.service';
import { RedisLockoutService } from './application/services/redis-lockout.service';
import { OAuthProviderService } from './application/services/oauth-provider.service';
import { loadJwtConfig } from './infrastructure/config/jwt.config';
import { loadOAuthConfig } from './infrastructure/config/oauth.config';
import { loadRedisConfig } from './infrastructure/config/redis.config';
import { TikTokOAuthProvider } from './infrastructure/oauth-providers/tiktok-oauth.provider';
import { InstagramOAuthProvider } from './infrastructure/oauth-providers/instagram-oauth.provider';
import { OAuthProvider } from './domain/entities/oauth-account.entity';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { VerifyResetTokenUseCase } from './application/use-cases/verify-reset-token.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { OAuthInitiateUseCase } from './application/use-cases/oauth-initiate.use-case';
import { OAuthCallbackUseCase } from './application/use-cases/oauth-callback.use-case';
import { AuthController } from './presentation/controllers/auth.controller';
import { OAuthController } from './presentation/controllers/oauth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt.guard';
import { createClient } from 'redis';
import { IRefreshTokenRepository } from './infrastructure/persistence/refresh-token.repository';
import { IResetTokenRepository } from './infrastructure/persistence/reset-token.repository';
import { AUTH_DI_TOKENS } from './auth.tokens';
import { GoogleOAuthProvider } from './infrastructure/oauth-providers/google-oauth.provider';
import { OAuthStateService } from './application/services/oauth-state.service';
import { OAuthTokenService } from './application/services/oauth-token.service';
import { RoleService } from './application/services/role.service';
import type { IUserRepository } from './domain/repositories/user.repository.interface';

@Module({
  controllers: [AuthController, OAuthController],
  providers: [
    // Redis Client
    {
      provide: AUTH_DI_TOKENS.REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const config = loadRedisConfig(configService);
        const client = createClient({ url: config.url });
        await client.connect();
        return {
          get: (key: string) => client.get(key),
          set: (key: string, value: string, options?: { EX?: number }) =>
            client.set(key, value, options as any),
          del: (key: string) => client.del(key),
        };
      },
    },
    // Password Service
    {
      provide: AUTH_DI_TOKENS.PASSWORD_SERVICE,
      useClass: PasswordService,
    },
    // JWT Service
    {
      provide: AUTH_DI_TOKENS.JWT_SERVICE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = loadJwtConfig(configService);
        return new JwtService(config);
      },
    },
    // Redis Lockout Service
    {
      provide: AUTH_DI_TOKENS.REDIS_LOCKOUT_SERVICE,
      inject: [AUTH_DI_TOKENS.REDIS_CLIENT, ConfigService],
      useFactory: (redis: any, configService: ConfigService) => {
        const config = loadRedisConfig(configService);
        return new RedisLockoutService(redis, {
          maxAttempts: config.lockoutMaxAttempts,
          lockoutDurationMinutes: config.lockoutDurationMinutes,
        });
      },
    },
    // Repositories (factories that create repository instances)
    {
      provide: AUTH_DI_TOKENS.USER_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new UserRepository(db),
    },
    {
      provide: AUTH_DI_TOKENS.OAUTH_ACCOUNT_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new OAuthAccountRepository(db),
    },
    {
      provide: AUTH_DI_TOKENS.REFRESH_TOKEN_REPOSITORY,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new RefreshTokenRepository(db),
    },
    {
      provide: AUTH_DI_TOKENS.RESET_TOKEN_REPOSITORY,
      inject: [AUTH_DI_TOKENS.REDIS_CLIENT],
      useFactory: (redis: any) => new ResetTokenRepository(redis),
    },
    // OAuth Token Service
    {
      provide: AUTH_DI_TOKENS.OAUTH_TOKEN_SERVICE,
      inject: [AUTH_DI_TOKENS.REDIS_CLIENT],
      useFactory: (redis: any) => new OAuthTokenService(redis),
    },
    // OAuth Provider Service
    {
      provide: AUTH_DI_TOKENS.OAUTH_PROVIDER_SERVICE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = loadOAuthConfig(configService);
        const providers = new Map<OAuthProvider, any>();

        if (config.google) {
          providers.set(
            'google',
            new GoogleOAuthProvider(
              config.google.clientId,
              config.google.clientSecret,
              config.google.redirectUri,
            ),
          );
        }

        if (config.tiktok) {
          providers.set(
            'tiktok',
            new TikTokOAuthProvider(
              config.tiktok.clientId,
              config.tiktok.clientSecret,
              config.tiktok.redirectUri,
            ),
          );
        }

        if (config.instagram) {
          providers.set(
            'instagram',
            new InstagramOAuthProvider(
              config.instagram.clientId,
              config.instagram.clientSecret,
              config.instagram.redirectUri,
            ),
          );
        }

        return new OAuthProviderService(providers);
      },
    },
    // Role Service
    {
      provide: AUTH_DI_TOKENS.ROLE_SERVICE,
      inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
      useFactory: (db: Database) => new RoleService(db),
    },
    // Use Cases
    {
      provide: RegisterUseCase,
      inject: [
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.PASSWORD_SERVICE,
        AUTH_DI_TOKENS.ROLE_SERVICE,
        SHARED_DI_TOKENS.DATABASE_CLIENT,
      ],
      useFactory: (
        userRepo: any,
        passwordService: PasswordService,
        roleService: RoleService,
        db: Database,
      ) => new RegisterUseCase(userRepo, passwordService, roleService, db),
    },
    {
      provide: LoginUseCase,
      inject: [
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.PASSWORD_SERVICE,
        AUTH_DI_TOKENS.JWT_SERVICE,
        AUTH_DI_TOKENS.REDIS_LOCKOUT_SERVICE,
      ],
      useFactory: (
        userRepo: any,
        passwordService: PasswordService,
        jwtService: JwtService,
        lockoutService: RedisLockoutService,
      ) =>
        new LoginUseCase(userRepo, passwordService, jwtService, lockoutService),
    },
    {
      provide: LogoutUseCase,
      inject: [AUTH_DI_TOKENS.REFRESH_TOKEN_REPOSITORY],
      useFactory: (refreshTokenRepo: IRefreshTokenRepository) =>
        new LogoutUseCase(refreshTokenRepo),
    },
    {
      provide: RefreshTokenUseCase,
      inject: [
        AUTH_DI_TOKENS.JWT_SERVICE,
        AUTH_DI_TOKENS.REFRESH_TOKEN_REPOSITORY,
        AUTH_DI_TOKENS.USER_REPOSITORY,
      ],
      useFactory: (
        jwtService: JwtService,
        refreshTokenRepo: IRefreshTokenRepository,
        userRepo: any,
      ) => new RefreshTokenUseCase(jwtService, refreshTokenRepo, userRepo),
    },
    {
      provide: RequestPasswordResetUseCase,
      inject: [
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.RESET_TOKEN_REPOSITORY,
      ],
      useFactory: (userRepo: any, resetTokenRepo: IResetTokenRepository) =>
        new RequestPasswordResetUseCase(userRepo, resetTokenRepo),
    },
    {
      provide: VerifyResetTokenUseCase,
      inject: [AUTH_DI_TOKENS.RESET_TOKEN_REPOSITORY],
      useFactory: (resetTokenRepo: IResetTokenRepository) =>
        new VerifyResetTokenUseCase(resetTokenRepo),
    },
    {
      provide: ResetPasswordUseCase,
      inject: [
        AUTH_DI_TOKENS.RESET_TOKEN_REPOSITORY,
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.PASSWORD_SERVICE,
      ],
      useFactory: (
        resetTokenRepo: IResetTokenRepository,
        userRepo: any,
        passwordService: PasswordService,
      ) => new ResetPasswordUseCase(resetTokenRepo, userRepo, passwordService),
    },
    // OAuth State Service
    {
      provide: AUTH_DI_TOKENS.OAUTH_STATE_SERVICE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = loadJwtConfig(configService);
        // Use JWT secret for signing OAuth state tokens
        return new OAuthStateService(jwtConfig.secret);
      },
    },
    {
      provide: OAuthInitiateUseCase,
      inject: [
        AUTH_DI_TOKENS.OAUTH_PROVIDER_SERVICE,
        AUTH_DI_TOKENS.OAUTH_STATE_SERVICE,
      ],
      useFactory: (
        oauthProviderService: OAuthProviderService,
        oauthStateService: OAuthStateService,
      ) => new OAuthInitiateUseCase(oauthProviderService, oauthStateService),
    },
    {
      provide: OAuthCallbackUseCase,
      inject: [
        AUTH_DI_TOKENS.OAUTH_PROVIDER_SERVICE,
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.OAUTH_ACCOUNT_REPOSITORY,
        AUTH_DI_TOKENS.JWT_SERVICE,
        AUTH_DI_TOKENS.OAUTH_STATE_SERVICE,
        AUTH_DI_TOKENS.OAUTH_TOKEN_SERVICE,
      ],
      useFactory: (
        oauthProviderService: OAuthProviderService,
        userRepo: any,
        oauthAccountRepo: any,
        jwtService: JwtService,
        oauthStateService: OAuthStateService,
        oauthTokenService: OAuthTokenService,
      ) =>
        new OAuthCallbackUseCase(
          oauthProviderService,
          userRepo,
          oauthAccountRepo,
          jwtService,
          oauthStateService,
          oauthTokenService,
        ),
    },
    // Guards
    {
      provide: JwtAuthGuard,
      inject: [
        AUTH_DI_TOKENS.JWT_SERVICE,
        AUTH_DI_TOKENS.USER_REPOSITORY,
        AUTH_DI_TOKENS.ROLE_SERVICE,
      ],
      useFactory: (
        jwtService: JwtService,
        userRepository: IUserRepository,
        roleService: RoleService,
      ) => new JwtAuthGuard(jwtService, userRepository, roleService),
    },
  ],
  exports: [
    AUTH_DI_TOKENS.JWT_SERVICE,
    AUTH_DI_TOKENS.USER_REPOSITORY,
    AUTH_DI_TOKENS.ROLE_SERVICE,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
