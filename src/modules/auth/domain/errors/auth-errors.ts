import { DomainError } from 'src/shared/core/domain/errors/domain-error.base';

/**
 * Auth-specific error codes: 8000-8099
 */
export const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: 8001,
  INVALID_PASSWORD: 8002,
  USER_ALREADY_EXISTS: 8003,
  TOO_MANY_LOGIN_ATTEMPTS: 8004,
  INVALID_RESET_TOKEN: 8005,
  OAUTH_PROVIDER_ERROR: 8006,
  INVALID_OAUTH_STATE: 8007,
} as const;

export class UserNotFoundError extends DomainError {
  readonly code = AUTH_ERROR_CODES.USER_NOT_FOUND;
  readonly statusCode = 404;

  constructor(identifier?: string, context?: Record<string, any>) {
    super(
      identifier ? `User with identifier '${identifier}' not found` : 'User not found',
      { identifier, ...context },
    );
  }
}

export class InvalidPasswordError extends DomainError {
  readonly code = AUTH_ERROR_CODES.INVALID_PASSWORD;
  readonly statusCode = 401;

  constructor(context?: Record<string, any>) {
    super('Invalid password', context);
  }
}

export class UserAlreadyExistsError extends DomainError {
  readonly code = AUTH_ERROR_CODES.USER_ALREADY_EXISTS;
  readonly statusCode = 409;

  constructor(email?: string, context?: Record<string, any>) {
    super(
      email ? `User with email '${email}' already exists` : 'User already exists',
      { email, ...context },
    );
  }
}

export class TooManyLoginAttemptsError extends DomainError {
  readonly code = AUTH_ERROR_CODES.TOO_MANY_LOGIN_ATTEMPTS;
  readonly statusCode = 429;

  constructor(lockedUntil?: Date, context?: Record<string, any>) {
    super('Too many login attempts. Account temporarily locked', {
      lockedUntil,
      ...context,
    });
  }
}

export class InvalidResetTokenError extends DomainError {
  readonly code = AUTH_ERROR_CODES.INVALID_RESET_TOKEN;
  readonly statusCode = 400;

  constructor(context?: Record<string, any>) {
    super('Invalid or expired reset token', context);
  }
}

export class OAuthProviderError extends DomainError {
  readonly code = AUTH_ERROR_CODES.OAUTH_PROVIDER_ERROR;
  readonly statusCode = 502;

  constructor(provider: string, message?: string, context?: Record<string, any>) {
    super(
      message || `OAuth provider '${provider}' error`,
      { provider, ...context },
    );
  }
}

export class InvalidOAuthStateError extends DomainError {
  readonly code = AUTH_ERROR_CODES.INVALID_OAUTH_STATE;
  readonly statusCode = 400;

  constructor(message?: string, context?: Record<string, any>) {
    super(
      message || 'Invalid or tampered OAuth state token',
      context,
    );
  }
}


