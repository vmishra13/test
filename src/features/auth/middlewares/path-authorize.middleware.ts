import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Role } from '../models/user.model';
import { IAuthenticatedRequest } from './auth.middleware';
import logger from '../../../config/logger';
import { ApiResponse } from '../../../shared/utils/api-response';

// Define the resource permission type with an index signature
interface ResourcePermissionMap {
  [path: string]: {
    [method: string]: Role[];
  };
}

// Define a simple permission mapping with the proper type
const resourcePermissions: ResourcePermissionMap = {
  // Test endpoints with method-based permissions
  '/api/rbac-path/resource': {
    GET: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT],
    POST: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.DOCTOR],
    PUT: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],
    DELETE: [Role.SUPER_ADMIN],
  },

  // Role-specific test endpoints
  '/api/rbac-path/admins': {
    GET: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],
  },

  '/api/rbac-path/medical': {
    GET: [Role.DOCTOR, Role.NURSE],
  },

  '/api/rbac-path/doctors': {
    GET: [Role.DOCTOR],
  },

  '/api/rbac-path/super-admin': {
    GET: [Role.SUPER_ADMIN],
  },
};

/**
 * Alternative authorization middleware that determines access
 * based on request path, method, and user role
 */
export const pathAuthorize = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  // First ensure user is authenticated
  if (!req.user) {
    logger.warn('Authorization attempt without authentication', {
      path: req.baseUrl + req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(StatusCodes.UNAUTHORIZED).json(
      ApiResponse.error(
        'Authentication required', 
        'UNAUTHORIZED', 
        StatusCodes.UNAUTHORIZED
      )
    );
    return;
  }

  const { role, username } = req.user;
  const method = req.method;
  const path = req.baseUrl + req.path;

  // Find the exact path in our permission map
  const resourcePermission = resourcePermissions[path];

  if (resourcePermission) {
    // Check if the HTTP method is allowed for this path
    const allowedRoles = resourcePermission[method];

    if (allowedRoles && allowedRoles.includes(role as Role)) {
      // User has permission, proceed to the next middleware
      logger.debug('Access granted', {
        path,
        method,
        username,
        role,
      });

      next();
      return;
    }
  }

  // Log the attempted access for security monitoring
  logger.warn('Access denied: permission check failed', {
    path,
    method,
    username,
    role,
    requiredRoles: resourcePermission?.[method] || 'Method not allowed',
  });

  // If we reached here, permission is denied
  res.status(StatusCodes.FORBIDDEN).json(
    ApiResponse.error(
      'Access denied',
      'FORBIDDEN',
      StatusCodes.FORBIDDEN,
      {
        path,
        method,
        userRole: role,
        requiredPermission: resourcePermissions[path]
          ? `One of: ${resourcePermissions[path][method] || 'Method not allowed'}`
          : 'Resource not defined in permissions map',
      }
    )
  );
};
