/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  /**
   * Error code (numeric)
   */
  abstract readonly code: number;

  /**
   * HTTP status code
   */
  abstract readonly statusCode: number;

  /**
   * Additional context information
   */
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON representation
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}