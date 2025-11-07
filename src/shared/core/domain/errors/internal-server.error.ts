import { DomainError } from './domain-error.base';

/**
 * Internal server error - when unexpected system error occurs
 */
export class InternalServerError extends DomainError {
  readonly code = 500;
  readonly statusCode = 500;

  constructor(
    message: string = 'Internal server error',
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, {
      originalError: originalError?.message,
      originalStack: originalError?.stack,
      ...context,
    });
  }

  /**
   * Create internal server error from caught exception
   */
  static fromError(error: Error, context?: Record<string, any>): InternalServerError {
    return new InternalServerError(
      'An unexpected error occurred',
      error,
      context
    );
  }

  /**
   * Create internal server error for database operation failure
   */
  static databaseError(operation: string, error?: Error): InternalServerError {
    return new InternalServerError(
      `Database operation failed: ${operation}`,
      error,
      { operation }
    );
  }

  /**
   * Create internal server error for external service failure
   */
  static externalServiceError(service: string, error?: Error): InternalServerError {
    return new InternalServerError(
      `External service error: ${service}`,
      error,
      { service }
    );
  }
}