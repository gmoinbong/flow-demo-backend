import { DomainError } from './domain-error.base';

/**
 * Validation error - when input data doesn't meet validation requirements
 */
export class ValidationError extends DomainError {
  readonly code = 400;
  readonly statusCode = 400;

  constructor(
    message: string = 'Validation failed',
    validationErrors?: Record<string, string | string[]>,
    context?: Record<string, any>
  ) {
    super(message, {
      validationErrors,
      ...context,
    });
  }

  /**
   * Create validation error from field-specific errors
   */
  static fromFields(fieldErrors: Record<string, string | string[]>): ValidationError {
    const errorCount = Object.keys(fieldErrors).length;
    const message = `Validation failed for ${errorCount} field${errorCount > 1 ? 's' : ''}`;
    
    return new ValidationError(message, fieldErrors);
  }

  /**
   * Create validation error for a single field
   */
  static forField(field: string, error: string | string[]): ValidationError {
    return new ValidationError(
      `Validation failed for field '${field}'`,
      { [field]: error }
    );
  }
}