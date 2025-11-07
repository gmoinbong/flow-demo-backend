import { DomainError } from './domain-error.base';

/**
 * Forbidden error - when user doesn't have permission to perform action
 */
export class ForbiddenError extends DomainError {
  readonly code = 403;
  readonly statusCode = 403;

  constructor(
    message: string = 'Access forbidden',
    action?: string,
    resource?: string,
    context?: Record<string, any>
  ) {
    super(message, {
      action,
      resource,
      ...context,
    });
  }

  /**
   * Create forbidden error for specific action on resource
   */
  static forAction(action: string, resource?: string): ForbiddenError {
    const message = resource
      ? `Not allowed to ${action} ${resource}`
      : `Not allowed to ${action}`;
    
    return new ForbiddenError(message, action, resource);
  }

  /**
   * Create forbidden error for insufficient permissions
   */
  static insufficientPermissions(requiredPermission?: string): ForbiddenError {
    const message = requiredPermission
      ? `Insufficient permissions. Required: ${requiredPermission}`
      : 'Insufficient permissions';
    
    return new ForbiddenError(message, undefined, undefined, {
      requiredPermission,
    });
  }
}