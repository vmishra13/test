import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from '../services/auth.service';
import { AuthenticatedUser } from '../dto/auth.dto';
import type { CoreRole } from '@/shared/constants';

// Extend Express Request interface to include user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser; // Use the DTO interface
      clientId?: number;
      permissions?: string[];
      deviceInfo?: {
        userAgent?: string;
        ipAddress?: string;
      };
    }
  }
}

/**
 * Main authentication middleware
 * Validates JWT token and injects user context into request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);

    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate token using auth service
    const authenticatedUser = await authService.validateAuthToken(token);

    // Inject user context into request using the existing DTO structure
    req.user = authenticatedUser;

    // Set client ID for easy access
    req.clientId = authenticatedUser.clientId;
    req.permissions = authenticatedUser.permissions || [];

    // Extract device information
    req.deviceInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: getClientIpAddress(req),
    };

    // Continue to next middleware
    next();
  } catch (error) {

    // Handle different types of authentication errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'token_expired',
          message: 'Authentication token has expired',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.message.includes('invalid')) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'invalid_token',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.message.includes('revoked')) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'token_revoked',
          message: 'Authentication token has been revoked',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Generic authentication error
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'authentication_failed',
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer TOKEN" and "TOKEN" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // If no Bearer prefix, assume the entire header is the token
  return authHeader;
}

/**
 * Get client IP address from request
 */
function getClientIpAddress(req: Request): string {
  return (
    (req.get('X-Forwarded-For') || '').split(',')[0].trim() ||
    req.get('X-Real-IP') ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Middleware for endpoints that require authentication but handle their own errors
 */
export const authenticateStrict = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await authenticate(req, res, next);
  } catch (error) {
    // Don't call next() on error - let authenticate handle the response
    return;
  }
};

/**
 * Check if current user has required permissions
 */
export function hasPermission(requiredPermission: string): (req: Request) => boolean {
  return (req: Request): boolean => {
    const userPermissions = req.permissions || [];
    return userPermissions.includes(requiredPermission);
  };
}

/**
 * Check if current user has any of the required roles
 */
export function hasRole(requiredRoles: string | string[]): (req: Request) => boolean {
  return (req: Request): boolean => {
    if (!req.user) return false;

    const userRoles = req.user.roles || [];
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    return rolesArray.some(role => userRoles.includes(role as CoreRole));
  };
}

/**
 * Check if user belongs to specific client
 */
export function belongsToClient(clientId: number): (req: Request) => boolean {
  return (req: Request): boolean => {
    return req.clientId === clientId;
  };
}

/**
 * Middleware to validate client access
 */
export const validateClientAccess = (requiredClientId?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // If specific client required, validate it
    if (requiredClientId && req.clientId !== requiredClientId) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: 'Access denied for this client',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Enhanced authentication middleware with custom error handling
 */
export const authenticateWithErrorHandler = (
  onError?: (error: Error, req: Request, res: Response) => void,
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authenticate(req, res, next);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error, req, res);
      } else {
        // Default error response
        res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'authentication_failed',
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        });
      }
    }
  };
};

// Helper functions to access user properties with the DTO structure
export const getCurrentUserId = (req: Request): number | undefined => {
  return req.user?.userId;
};

export const getCurrentUserLoginName = (req: Request): string | undefined => {
  return req.user?.loginName;
};

export const getCurrentUserRoles = (req: Request): string[] => {
  return req.user?.roles || [];
};

export const getCurrentUserPermissions = (req: Request): string[] => {
  return req.permissions || [];
};

export const getCurrentClientId = (req: Request): number | undefined => {
  return req.clientId;
};

export const getCurrentUserTypeId = (req: Request): number | undefined => {
  return req.user?.userTypeId;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.user;
};

/**
 * Get user's full context for logging/auditing
 */
export const getUserContext = (req: Request) => {
  return {
    user: req.user,
    clientId: req.clientId,
    permissions: req.permissions,
    deviceInfo: req.deviceInfo,
  };
};
