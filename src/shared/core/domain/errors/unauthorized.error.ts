import { DomainError } from './domain-error.base';

/**
 * Unauthorized error - when authentication is required or invalid
 */
export class UnauthorizedError extends DomainError {
  readonly code = 401;
  readonly statusCode = 401;

  constructor(
    message: string = 'Authentication required',
    reason?: string,
    context?: Record<string, any>
  ) {
    super(message, {
      reason,
      ...context,
    });
  }

  /**
   * Create unauthorized error for missing authentication
   */
  static missingAuthentication(): UnauthorizedError {
    return new UnauthorizedError(
      'Authentication required',
      'missing_authentication'
    );
  }

  /**
   * Create unauthorized error for invalid credentials
   */
  static invalidCredentials(): UnauthorizedError {
    return new UnauthorizedError(
      'Invalid credentials',
      'invalid_credentials'
    );
  }

  /**
   * Create unauthorized error for expired token
   */
  static expiredToken(): UnauthorizedError {
    return new UnauthorizedError(
      'Authentication token has expired',
      'expired_token'
    );
  }

  /**
   * Create unauthorized error for invalid token
   */
  static invalidToken(): UnauthorizedError {
    return new UnauthorizedError(
      'Invalid authentication token',
      'invalid_token'
    );
  }
}