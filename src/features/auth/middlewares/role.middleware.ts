import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getCurrentUserId, getCurrentUserRoles } from './auth.middleware';
import { isAdmin, isSuperAdmin } from './optional-auth.middleware';

/**
 * Role-based access control middleware
 */
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userRoles = getCurrentUserRoles(req);
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Check if user has any of the required roles
    const hasRequiredRole = rolesArray.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: `Access denied. Required roles: ${rolesArray.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 */
export const requirePermission = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userPermissions = req.permissions || [];
    const permissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    // Check if user has all required permissions
    const hasAllPermissions = permissionsArray.every(permission =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: `Access denied. Required permissions: ${permissionsArray.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only access middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!isAdmin(req)) {
    res.status(StatusCodes.FORBIDDEN).json({
      error: 'forbidden',
      message: 'Administrator access required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Super admin only access middleware
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!isSuperAdmin(req)) {
    res.status(StatusCodes.FORBIDDEN).json({
      error: 'forbidden',
      message: 'Super administrator access required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Resource owner validation (user can only access their own resources)
 */
export const requireResourceOwner = (userIdParam = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const resourceUserId = parseInt(req.params[userIdParam]);
    const currentUserId = getCurrentUserId(req);

    // Allow if user is accessing their own resource or is admin
    if (currentUserId !== resourceUserId && !isAdmin(req)) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: 'You can only access your own resources',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Client-specific access control
 */
export const requireClientAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // If route has clientId parameter, validate access
  const routeClientId = req.params.clientId ? parseInt(req.params.clientId) : null;

  if (routeClientId) {
    const userClientId = req.user.clientId;

    // Super admins can access any client, others only their own
    if (!isSuperAdmin(req) && userClientId !== routeClientId) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: 'Access denied for this client',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  next();
};

/**
 * Flexible role and permission checker
 */
export const requireAccess = (config: {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean; // true = AND logic, false = OR logic (default)
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { roles = [], permissions = [], requireAll = false } = config;
    const userRoles = getCurrentUserRoles(req);
    const userPermissions = req.permissions || [];

    let hasAccess = false;

    if (requireAll) {
      // AND logic - user must have ALL specified roles AND permissions
      const hasAllRoles = roles.length === 0 || roles.every(role => userRoles.includes(role));
      const hasAllPermissions =
        permissions.length === 0 ||
        permissions.every(permission => userPermissions.includes(permission));

      hasAccess = hasAllRoles && hasAllPermissions;
    } else {
      // OR logic - user must have ANY of the specified roles OR permissions
      const hasAnyRole = roles.length === 0 || roles.some(role => userRoles.includes(role));
      const hasAnyPermission =
        permissions.length === 0 ||
        permissions.some(permission => userPermissions.includes(permission));

      hasAccess = hasAnyRole || hasAnyPermission;
    }

    if (!hasAccess) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: 'Insufficient privileges',
        details: {
          requiredRoles: roles,
          requiredPermissions: permissions,
          requireAll,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Check if user owns the resource (helper function)
 */
export const isResourceOwner = (req: Request, userIdParam = 'userId'): boolean => {
  if (!req.user) return false;

  const resourceUserId = parseInt(req.params[userIdParam]);
  const currentUserId = getCurrentUserId(req);

  return currentUserId === resourceUserId;
};

/**
 * Check if user has admin access to resource (owner or admin)
 */
export const hasResourceAccess = (req: Request, userIdParam = 'userId'): boolean => {
  return isResourceOwner(req, userIdParam) || isAdmin(req);
};
