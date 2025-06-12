import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ApiResponse } from '@utils/api-response';
import logger from '@config/logger';
import { ENV } from '@config/env';

// Error type definitions
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_FAMILY_COMPROMISED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_REFRESH_TOKEN'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'JWT_CONFIGURATION_ERROR';

interface AppError extends Error {
  statusCode?: number;
  code?: ErrorCode;
  details?: any;
}

/**
 * Handles all errors that occur in the application
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Create a structured error object for logging
  const errorContext = {
    message: err.message,
    stack: err.stack,
    path: `${req.method} ${req.path}`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'unauthenticated',
    clientId: (req as any).user?.clientId,
    requestId: req.headers['x-request-id'] || 'unknown',
    body: ENV.isDevelopment ? req.body : '[REDACTED]',
    query: req.query,
    timestamp: new Date().toISOString(),
  };

  logger.error('Unhandled error', errorContext);

  // ✅ Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  });

  // ✅ Handle Zod validation errors first
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json(
      ApiResponse.error(
        'Request validation failed',
        'VALIDATION_ERROR',
        StatusCodes.BAD_REQUEST,
        err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      ),
    );
    return;
  }

  // Handle custom application errors
  if ((err as AppError).statusCode && (err as AppError).code) {
    const appErr = err as AppError;
    res
      .status(appErr.statusCode!)
      .json(ApiResponse.error(appErr.message, appErr.code!, appErr.statusCode!, appErr.details));
    return;
  }

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ApiResponse.error(
            'Validation failed',
            'VALIDATION_ERROR',
            StatusCodes.BAD_REQUEST,
            ENV.isDevelopment ? err.message : undefined,
          ),
        );
      break;

    // ✅ Add auth-specific errors
    case 'AuthenticationError':
    case 'InvalidCredentialsError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication failed',
            'INVALID_CREDENTIALS',
            StatusCodes.UNAUTHORIZED,
          ),
        );
      break;

    case 'TokenFamilyCompromisedError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Token family compromised. Please login again.',
            'TOKEN_FAMILY_COMPROMISED',
            StatusCodes.UNAUTHORIZED,
          ),
        );
      break;

    case 'AccountLockedError':
      res
        .status(StatusCodes.LOCKED)
        .json(
          ApiResponse.error(
            'Account temporarily locked due to failed login attempts',
            'ACCOUNT_LOCKED',
            StatusCodes.LOCKED,
          ),
        );
      break;

    case 'AccountDisabledError':
      res
        .status(StatusCodes.FORBIDDEN)
        .json(ApiResponse.error('Account is disabled', 'ACCOUNT_DISABLED', StatusCodes.FORBIDDEN));
      break;

    case 'SyntaxError':
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid request format', 'BAD_REQUEST', StatusCodes.BAD_REQUEST));
      break;

    case 'JsonWebTokenError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Invalid token', 'INVALID_TOKEN', StatusCodes.UNAUTHORIZED));
      break;

    case 'TokenExpiredError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Token expired', 'TOKEN_EXPIRED', StatusCodes.UNAUTHORIZED));
      break;

    default:
      const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      const message = ENV.isDevelopment ? err.message : 'Internal server error';
      res.status(statusCode).json(ApiResponse.error(message, 'INTERNAL_ERROR', statusCode));
      break;
  }
};

/**
 * Handles 404 Not Found errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.info(`Route not found: ${req.method} ${req.path}`);

  res
    .status(StatusCodes.NOT_FOUND)
    .json(
      ApiResponse.error(
        `Route ${req.method} ${req.path} not found`,
        'NOT_FOUND',
        StatusCodes.NOT_FOUND,
      ),
    );
};

/**
 * Create a custom error with status code and error code
 */
export function createError(
  message: string,
  code: ErrorCode,
  statusCode: number,
  details?: any,
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

// Convenience functions for common errors
export const badRequest = (message: string, details?: any) =>
  createError(message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST, details);

export const unauthorized = (message: string = 'Authentication required') =>
  createError(message, 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED);

export const forbidden = (message: string = 'Insufficient permissions') =>
  createError(message, 'FORBIDDEN', StatusCodes.FORBIDDEN);

export const notFound = (resource: string = 'Resource') =>
  createError(`${resource} not found`, 'NOT_FOUND', StatusCodes.NOT_FOUND);

export const conflict = (message: string) => createError(message, 'CONFLICT', StatusCodes.CONFLICT);

export const serverError = (message: string = 'Internal server error') =>
  createError(message, 'INTERNAL_ERROR', StatusCodes.INTERNAL_SERVER_ERROR);

// ✅ Add OAuth 2.0 error helper
export const oauthError = (
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'unauthorized_client'
    | 'unsupported_grant_type',
  description?: string,
) => {
  const statusCode =
    error === 'invalid_client' ? StatusCodes.UNAUTHORIZED : StatusCodes.BAD_REQUEST;

  const errorResponse = {
    error,
    error_description: description || getDefaultOAuthDescription(error),
  };

  return { statusCode, response: errorResponse };
};

function getDefaultOAuthDescription(error: string): string {
  const descriptions = {
    invalid_request: 'The request is missing a required parameter or is otherwise malformed.',
    invalid_client: 'Client authentication failed.',
    invalid_grant: 'The provided authorization grant is invalid, expired, or revoked.',
    unauthorized_client: 'The client is not authorized to request an access token.',
    unsupported_grant_type: 'The authorization grant type is not supported.',
  };
  return descriptions[error as keyof typeof descriptions] || 'An error occurred.';
}

// ✅ Add auth-specific error helpers
export const invalidCredentials = (message: string = 'Invalid username or password') =>
  createError(message, 'INVALID_CREDENTIALS', StatusCodes.UNAUTHORIZED);

export const invalidToken = (message: string = 'Invalid or expired token') =>
  createError(message, 'INVALID_TOKEN', StatusCodes.UNAUTHORIZED);

export const tokenFamilyCompromised = (message: string = 'Token family compromised') =>
  createError(message, 'TOKEN_FAMILY_COMPROMISED', StatusCodes.UNAUTHORIZED);

export const accountLocked = (message: string = 'Account temporarily locked') =>
  createError(message, 'ACCOUNT_LOCKED', StatusCodes.LOCKED);

export const accountDisabled = (message: string = 'Account is disabled') =>
  createError(message, 'ACCOUNT_DISABLED', StatusCodes.FORBIDDEN);
