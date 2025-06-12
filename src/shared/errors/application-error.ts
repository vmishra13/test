import { StatusCodes } from 'http-status-codes';

/**
 * Custom error interface
 */
export interface CustomError extends Error {
  statusCode: number;
  details?: any;
}

/**
 * Create authentication error
 */
export function createAuthError(message: string): CustomError {
  const error = new Error(message) as CustomError;
  error.name = 'AuthenticationError';
  error.statusCode = StatusCodes.UNAUTHORIZED;
  return error;
}

/**
 * Create authorization error
 */
export function createAuthorizationError(message: string): CustomError {
  const error = new Error(message) as CustomError;
  error.name = 'AuthorizationError';
  error.statusCode = StatusCodes.FORBIDDEN;
  return error;
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  details: Array<{ field: string; message: string }>,
): CustomError {
  const error = new Error(message) as CustomError;
  error.name = 'ValidationError';
  error.statusCode = StatusCodes.BAD_REQUEST;
  error.details = details;
  return error;
}
