import { DomainError } from './domain-error.base';

/**
 * Bad request error - when request is malformed or invalid
 */
export class BadRequestError extends DomainError {
  readonly code = 400;
  readonly statusCode = 400;

  constructor(
    message: string = 'Bad request',
    field?: string,
    context?: Record<string, any>
  ) {
    super(message, {
      field,
      ...context,
    });
  }

  /**
   * Create bad request error for invalid parameter
   */
  static invalidParameter(parameter: string, value?: any): BadRequestError {
    const message = value !== undefined
      ? `Invalid parameter '${parameter}': ${value}`
      : `Invalid parameter '${parameter}'`;
    
    return new BadRequestError(message, parameter, { value });
  }

  /**
   * Create bad request error for missing required parameter
   */
  static missingParameter(parameter: string): BadRequestError {
    return new BadRequestError(
      `Missing required parameter '${parameter}'`,
      parameter
    );
  }

  /**
   * Create bad request error for invalid format
   */
  static invalidFormat(field: string, expectedFormat: string): BadRequestError {
    return new BadRequestError(
      `Invalid format for '${field}'. Expected: ${expectedFormat}`,
      field,
      { expectedFormat }
    );
  }
}