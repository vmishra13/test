import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { authenticate } from './auth.middleware';

/**
 * Optional authentication middleware
 * Attempts to authenticate user but doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      // No token provided - continue without authentication
      next();
      return;
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      // Empty token - continue without authentication
      next();
      return;
    }

    // Validate token using auth service
    const authenticatedUser = await authService.validateAuthToken(token);

    // Inject user context into request using the DTO structure
    req.user = authenticatedUser; // Direct assignment since validateAuthToken returns AuthenticatedUser

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
    // If token validation fails, continue without authentication
    // This allows the endpoint to handle anonymous access
    next();
  }
};

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
 * Conditional authentication based on request data
 */
export const conditionalAuthenticate = (condition: (req: Request) => boolean) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if authentication is required based on condition
    if (condition(req)) {
      // Use the statically imported authenticate middleware
      return authenticate(req, res, next);
    } else {
      // Use optional authentication
      return optionalAuthenticate(req, res, next);
    }
  };
};

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}

/**
 * Helper to check if user is anonymous
 */
export function isAnonymous(req: Request): boolean {
  return !req.user;
}

/**
 * Helper to get current user ID using the DTO structure
 */
export function getCurrentUserId(req: Request): number | undefined {
  return req.user?.userId;
}

/**
 * Helper to get current user login name
 */
export function getCurrentUserLoginName(req: Request): string | undefined {
  return req.user?.loginName;
}

/**
 * Helper to get current user roles
 */
export function getCurrentUserRoles(req: Request): string[] {
  return req.user?.roles || [];
}

/**
 * Helper to get current user permissions
 */
export function getCurrentUserPermissions(req: Request): string[] {
  return req.permissions || [];
}

/**
 * Helper to get current client ID
 */
export function getCurrentClientId(req: Request): number | undefined {
  return req.clientId;
}

/**
 * Helper to get current user type ID
 */
export function getCurrentUserTypeId(req: Request): number | undefined {
  return req.user?.userTypeId;
}

/**
 * Check if user has specific role
 */
export function hasRole(req: Request, role: string): boolean {
  const userRoles = getCurrentUserRoles(req);
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(req: Request, roles: string[]): boolean {
  const userRoles = getCurrentUserRoles(req);
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has specific permission
 */
export function hasPermission(req: Request, permission: string): boolean {
  const userPermissions = getCurrentUserPermissions(req);
  return userPermissions.includes(permission);
}

/**
 * Check if user is admin
 */
export function isAdmin(req: Request): boolean {
  return hasAnyRole(req, ['admin', 'super_admin']);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(req: Request): boolean {
  return hasRole(req, 'super_admin');
}

/**
 * Get full user context for logging/auditing
 */
export function getUserContext(req: Request) {
  return {
    user: req.user,
    clientId: req.clientId,
    permissions: req.permissions,
    deviceInfo: req.deviceInfo,
    isAuthenticated: isAuthenticated(req),
  };
}
