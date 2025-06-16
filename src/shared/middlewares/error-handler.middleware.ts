import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
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
  | 'JWT_CONFIGURATION_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'FILE_UPLOAD_ERROR'
  | 'PERMISSION_DENIED';

interface AppError extends Error {
  statusCode?: number;
  code?: ErrorCode;
  details?: any;
}

/**
 * Helper function to get correlation ID from request headers
 */
function getCorrelationId(req: Request): string {
  return (
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-trace-id'] as string) ||
    uuidv4()
  );
}

/**
 * Create error fingerprint for monitoring and grouping similar errors
 */
function createErrorFingerprint(error: Error): string {
  const key = `${error.name}:${error.message.substring(0, 100)}`.toLowerCase();
  return Buffer.from(key).toString('base64').substring(0, 16);
}

/**
 * Sanitize headers for logging (remove sensitive information)
 */
function sanitizeHeaders(headers: any): Record<string, any> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const allowedHeaders = [
    'user-agent',
    'content-type',
    'accept',
    'x-forwarded-for',
    'origin',
    'referer',
  ];

  const sanitized: Record<string, any> = {};

  allowedHeaders.forEach(header => {
    if (headers[header]) {
      sanitized[header] = headers[header];
    }
  });

  // Mark sensitive headers as redacted if they exist
  sensitiveHeaders.forEach(header => {
    if (headers[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Create enhanced error context for better debugging
 */
function createErrorContext(err: Error, req: Request, correlationId: string) {
  return {
    correlationId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as AppError).code,
      statusCode: (err as AppError).statusCode,
      fingerprint: createErrorFingerprint(err),
    },
    request: {
      method: req.method,
      path: req.path,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: sanitizeHeaders(req.headers),
      body: ENV.isDevelopment ? req.body : '[REDACTED]',
      ip: req.ip,
    },
    user: {
      id: (req as any).user?.id || 'unauthenticated',
      clientId: (req as any).user?.clientId || null,
      roles: (req as any).user?.roles || [],
    },
    timestamp: new Date().toISOString(),
    environment: ENV.nodeEnv,
    service: 'reliacare-api',
  };
}

/**
 * Handles all errors that occur in the application
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Generate correlation ID for request tracing
  const correlationId = getCorrelationId(req);

  // Create enhanced error context for logging
  const errorContext = createErrorContext(err, req, correlationId);

  // Log error with full context and stack trace
  logger.error('Unhandled application error', errorContext);

  // Add correlation ID and security headers to response
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Correlation-ID': correlationId,
  });
  // ✅ Handle Zod validation errors first
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json(
      ApiResponse.error('Request validation failed', 'VALIDATION_ERROR', {
        correlationId,
        timestamp: new Date().toISOString(),
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      }),
    );
    return;
  }

  // Handle custom application errors
  if ((err as AppError).statusCode && (err as AppError).code) {
    const appErr = err as AppError;
    res.status(appErr.statusCode!).json(
      ApiResponse.error(appErr.message, appErr.code!, {
        correlationId,
        timestamp: new Date().toISOString(),
        ...(appErr.details && { details: appErr.details }),
      }),
    );
    return;
  }
  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Validation failed', 'VALIDATION_ERROR', {
          correlationId,
          timestamp: new Date().toISOString(),
          ...(ENV.isDevelopment && { details: err.message }),
        }),
      );
      break;

    // ✅ Add auth-specific errors
    case 'AuthenticationError':
    case 'InvalidCredentialsError':
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error('Authentication failed', 'INVALID_CREDENTIALS', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    case 'TokenFamilyCompromisedError':
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Token family compromised. Please login again.',
          'TOKEN_FAMILY_COMPROMISED',
          {
            correlationId,
            timestamp: new Date().toISOString(),
          },
        ),
      );
      break;

    case 'AccountLockedError':
      res.status(StatusCodes.LOCKED).json(
        ApiResponse.error(
          'Account temporarily locked due to failed login attempts',
          'ACCOUNT_LOCKED',
          {
            correlationId,
            timestamp: new Date().toISOString(),
          },
        ),
      );
      break;

    case 'AccountDisabledError':
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Account is disabled', 'ACCOUNT_DISABLED', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    case 'SyntaxError':
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Invalid request format', 'BAD_REQUEST', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    case 'JsonWebTokenError':
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error('Invalid token', 'INVALID_TOKEN', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    case 'TokenExpiredError':
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error('Token expired', 'TOKEN_EXPIRED', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    // Add database-specific errors
    case 'PrismaClientKnownRequestError':
    case 'PrismaClientValidationError':
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Database validation error', 'BAD_REQUEST', {
          correlationId,
          timestamp: new Date().toISOString(),
          ...(ENV.isDevelopment && { details: err.message }),
        }),
      );
      break;

    case 'PrismaClientUnknownRequestError':
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Database connection error', 'INTERNAL_ERROR', {
          correlationId,
          timestamp: new Date().toISOString(),
        }),
      );
      break;

    default:
      const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      const message = ENV.isDevelopment ? err.message : 'Internal server error';
      res.status(statusCode).json(
        ApiResponse.error(message, 'INTERNAL_ERROR', {
          correlationId,
          timestamp: new Date().toISOString(),
          ...(ENV.isDevelopment && { stack: err.stack?.split('\n').slice(0, 10) }), // Limit stack trace lines
        }),
      );
      break;
  }
};

/**
 * Handles 404 Not Found errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const correlationId = getCorrelationId(req);

  logger.info(`Route not found: ${req.method} ${req.path}`, {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.set('X-Correlation-ID', correlationId);

  res.status(StatusCodes.NOT_FOUND).json(
    ApiResponse.error(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND', {
      correlationId,
      timestamp: new Date().toISOString(),
    }),
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
