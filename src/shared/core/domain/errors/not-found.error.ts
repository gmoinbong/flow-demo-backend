import { DomainError } from './domain-error.base';

/**
 * Not found error - when requested resource doesn't exist
 */
export class NotFoundError extends DomainError {
  readonly code = 404;
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string, context?: Record<string, any>) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, {
      resource,
      identifier,
      ...context,
    });
  }
}