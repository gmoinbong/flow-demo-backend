/**
 * Domain error codes for the entire application
 * Each module should use a specific range to avoid conflicts
 */
const STORAGE_OBJECT_ERROR_CODES = {
  STORAGE_NOT_FOUND: 1001, // Storage not found
  STORAGE_VALIDATION_FAILED: 1002, // Storage validation failed
} as const;

const ANNOTATION_ERROR_CODES = {
  ANNOTATION_NOT_FOUND: 2001, // Annotation not found
  ANNOTATION_VALIDATION_FAILED: 2002, // Annotation validation failed
} as const;

const RULE_BUNDLE_ERROR_CODES = {
  RULE_BUNDLE_NOT_FOUND: 3001, // Rule bundle not found
  RULE_BUNDLE_VALIDATION_FAILED: 3002, // Rule bundle validation failed
} as const;

const RULE_ERROR_CODES = {
  RULE_NOT_FOUND: 4001, // Rule not found
  RULE_VALIDATION_FAILED: 4002, // Rule validation failed
} as const;

const WORKFLOW_ERROR_CODES = {
  WORKFLOW_EXECUTION_NOT_FOUND: 5001, // Workflow execution not found
  WORKFLOW_EXECUTION_VALIDATION_FAILED: 5002, // Workflow execution validation failed
  VALIDATION_RESULT_VALIDATION_FAILED: 5003, // Validation result validation failed
} as const;

const COMMENT_ERROR_CODES = {
  COMMENT_NOT_FOUND: 6001, // Comment not found
  ALREADY_HIDDEN: 6002, // Comment already hidden
  ALREADY_ACTIVE: 6003, // Comment already active
} as const;

const DOCUMENT_ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 7001, // Document not found
  DOCUMENT_VALIDATION_FAILED: 7002, // Document validation failed
} as const;

const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: 8001, // User not found
  INVALID_PASSWORD: 8002, // Invalid password
  USER_ALREADY_EXISTS: 8003, // User already exists
  TOO_MANY_LOGIN_ATTEMPTS: 8004, // Too many login attempts
  INVALID_RESET_TOKEN: 8005, // Invalid reset token
  OAUTH_PROVIDER_ERROR: 8006, // OAuth provider error
} as const;

export const DOMAIN_ERROR_CODES = {
  ...STORAGE_OBJECT_ERROR_CODES,
  ...ANNOTATION_ERROR_CODES,
  ...RULE_BUNDLE_ERROR_CODES,
  ...RULE_ERROR_CODES,
  ...WORKFLOW_ERROR_CODES,
  ...COMMENT_ERROR_CODES,
  ...DOCUMENT_ERROR_CODES,
  ...AUTH_ERROR_CODES,
} as const;

/**
 * Error messages corresponding to error codes
 */
export const ERROR_MESSAGES = {
  [DOMAIN_ERROR_CODES.STORAGE_NOT_FOUND]: 'Storage not found',
  [DOMAIN_ERROR_CODES.STORAGE_VALIDATION_FAILED]: 'Storage validation failed',
  [DOMAIN_ERROR_CODES.ANNOTATION_NOT_FOUND]: 'Annotation not found',
  [DOMAIN_ERROR_CODES.ANNOTATION_VALIDATION_FAILED]: 'Annotation validation failed',
  [DOMAIN_ERROR_CODES.RULE_BUNDLE_NOT_FOUND]: 'Rule bundle not found',
  [DOMAIN_ERROR_CODES.RULE_BUNDLE_VALIDATION_FAILED]: 'Rule bundle validation failed',
  [DOMAIN_ERROR_CODES.RULE_NOT_FOUND]: 'Rule not found',
  [DOMAIN_ERROR_CODES.RULE_VALIDATION_FAILED]: 'Rule validation failed',
  [DOMAIN_ERROR_CODES.WORKFLOW_EXECUTION_NOT_FOUND]: 'Workflow execution not found',
  [DOMAIN_ERROR_CODES.WORKFLOW_EXECUTION_VALIDATION_FAILED]: 'Workflow execution validation failed',
  [DOMAIN_ERROR_CODES.VALIDATION_RESULT_VALIDATION_FAILED]: 'Validation result validation failed',
  [DOMAIN_ERROR_CODES.COMMENT_NOT_FOUND]: 'Comment not found',
  [DOMAIN_ERROR_CODES.ALREADY_HIDDEN]: 'Comment already hidden',
  [DOMAIN_ERROR_CODES.ALREADY_ACTIVE]: 'Comment already active',
  [DOMAIN_ERROR_CODES.DOCUMENT_NOT_FOUND]: 'Document not found',
  [DOMAIN_ERROR_CODES.DOCUMENT_VALIDATION_FAILED]: 'Document validation failed',
  [DOMAIN_ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [DOMAIN_ERROR_CODES.INVALID_PASSWORD]: 'Invalid password',
  [DOMAIN_ERROR_CODES.USER_ALREADY_EXISTS]: 'User already exists',
  [DOMAIN_ERROR_CODES.TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts',
  [DOMAIN_ERROR_CODES.INVALID_RESET_TOKEN]: 'Invalid reset token',
  [DOMAIN_ERROR_CODES.OAUTH_PROVIDER_ERROR]: 'OAuth provider error',
} as const;

/**
 * Type for domain error codes
 */
export type DomainErrorCode = typeof DOMAIN_ERROR_CODES[keyof typeof DOMAIN_ERROR_CODES];

/**
 * Helper function to get error message by code
 */
export function getErrorMessage(code: DomainErrorCode): string {
  return ERROR_MESSAGES[code] || 'Unknown error';
}