import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@utils/api-response';
import logger from '@config/logger';
import { ENV } from '@config/env';

// Error type definitions
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

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
    userId: (req as any).user?.id || 'unauthenticated',
    requestId: req.headers['x-request-id'] || 'unknown',
    timestamp: new Date().toISOString(),
  };

  // Log the error
  logger.error('Unhandled error', errorContext);

  // Handle custom application errors
  if ((err as AppError).statusCode && (err as AppError).code) {
    const appErr = err as AppError;
    // Using non-null assertion since we've already checked that statusCode exists
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

    case 'SyntaxError':
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid request format', 'BAD_REQUEST', StatusCodes.BAD_REQUEST));
      break;

    case 'JsonWebTokenError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Invalid token', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED));
      break;

    case 'TokenExpiredError':
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Token expired', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED));
      break;

    default:
      // Default to 500 Internal Server Error for unhandled errors
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
