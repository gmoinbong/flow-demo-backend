import { DomainError } from './domain-error.base';

/**
 * Conflict error - when operation conflicts with current state
 */
export class ConflictError extends DomainError {
  readonly code = 409;
  readonly statusCode = 409;

  constructor(
    message: string = 'Resource conflict',
    resource?: string,
    identifier?: string,
    context?: Record<string, any>
  ) {
    super(message, {
      resource,
      identifier,
      ...context,
    });
  }

  /**
   * Create conflict error for resource already exists
   */
  static alreadyExists(resource: string, identifier?: string): ConflictError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' already exists`
      : `${resource} already exists`;
    
    return new ConflictError(message, resource, identifier);
  }

  /**
   * Create conflict error for concurrent modification
   */
  static concurrentModification(resource: string, identifier?: string): ConflictError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' was modified by another process`
      : `${resource} was modified by another process`;
    
    return new ConflictError(message, resource, identifier);
  }
}