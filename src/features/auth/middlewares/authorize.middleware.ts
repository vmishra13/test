import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getCurrentUserRoles, getCurrentClientId, getCurrentUserId } from './auth.middleware';
import { CoreRole, ROLE_HIERARCHY } from '@shared/constants/roles';

// Define route-role mapping interface
interface RouteAuthConfig {
  path: string;
  method: string;
  allowedRoles: CoreRole[];
  requireAllRoles?: boolean; // Default: false (OR logic)
  clientScopeRequired?: boolean; // Default: true
  description?: string;
}

// Route authorization configuration
const ROUTE_AUTH_CONFIG: RouteAuthConfig[] = [
  // POC Routes
  {
    path: '/poc/public',
    method: 'GET',
    allowedRoles: [], // No roles required (public)
    clientScopeRequired: false,
    description: 'Public endpoint - no authentication required',
  },
  {
    path: '/poc/authenticated',
    method: 'GET',
    allowedRoles: [
      CoreRole.SUPER_ADMIN,
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    clientScopeRequired: false,
    description: 'Any authenticated user can access',
  },
  {
    path: '/poc/super-admin',
    method: 'GET',
    allowedRoles: [CoreRole.SUPER_ADMIN],
    clientScopeRequired: false,
    description: 'Super admin only',
  },
  {
    path: '/poc/client-admin',
    method: 'GET',
    allowedRoles: [CoreRole.CLIENT_ADMIN],
    clientScopeRequired: true,
    description: 'Client admin only',
  },
  {
    path: '/poc/clinical-staff',
    method: 'GET',
    allowedRoles: [CoreRole.CLINICAL_STAFF],
    clientScopeRequired: true,
    description: 'Clinical staff only',
  },
  {
    path: '/poc/office-staff',
    method: 'GET',
    allowedRoles: [CoreRole.OFFICE_STAFF],
    clientScopeRequired: true,
    description: 'Office staff only',
  },
  {
    path: '/poc/patient',
    method: 'GET',
    allowedRoles: [CoreRole.PATIENT],
    clientScopeRequired: true,
    description: 'Patient only',
  },
  {
    path: '/poc/staff-only',
    method: 'GET',
    allowedRoles: [CoreRole.CLINICAL_STAFF, CoreRole.OFFICE_STAFF],
    clientScopeRequired: true,
    description: 'Clinical or office staff only',
  },
  {
    path: '/poc/admin-only',
    method: 'GET',
    allowedRoles: [CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN],
    clientScopeRequired: false, // Super admin can access any client
    description: 'Super admin or client admin only',
  },
  {
    path: '/poc/user-info',
    method: 'GET',
    allowedRoles: [
      CoreRole.SUPER_ADMIN,
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    clientScopeRequired: true,
    description: 'Any authenticated user can access their own info',
  },

  // Todo Routes
  {
    path: '/todos',
    method: 'GET',
    allowedRoles: [
      CoreRole.SUPER_ADMIN,
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    clientScopeRequired: true,
    description: 'Any authenticated user can view todos',
  },
  {
    path: '/todos',
    method: 'POST',
    allowedRoles: [
      CoreRole.SUPER_ADMIN,
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    clientScopeRequired: true,
    description: 'Any authenticated user can create todos',
  },
  {
    path: '/todos/:id',
    method: 'PUT',
    allowedRoles: [
      CoreRole.SUPER_ADMIN,
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    clientScopeRequired: true,
    description: 'Any authenticated user can update their todos',
  },
  {
    path: '/todos/:id',
    method: 'DELETE',
    allowedRoles: [CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN],
    clientScopeRequired: true,
    description: 'Only admins can delete todos',
  },
];

/**
 * Parameterless authorization middleware
 * Determines allowed roles based on route path and method
 */
export const authorize = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract route information
    const routePath = getRoutePath(req);
    const method = req.method.toUpperCase();

    // Find matching route configuration
    const routeConfig = findRouteConfig(routePath, method);

    if (!routeConfig) {
      // No specific auth config found - allow access (fallback behavior)
      console.warn(`No authorization config found for ${method} ${routePath}`);
      next();
      return;
    }

    // Public route - no authentication required
    if (routeConfig.allowedRoles.length === 0) {
      next();
      return;
    }

    // Check if user is authenticated (should be handled by authenticate middleware first)
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get user information
    const userRoles = getCurrentUserRoles(req);
    const userClientId = getCurrentClientId(req);
    const userId = getCurrentUserId(req);

    // Check role authorization
    const hasAllowedRole = checkRoleAccess(userRoles, routeConfig);

    if (!hasAllowedRole) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: 'forbidden',
        message: `Access denied. Required roles: ${routeConfig.allowedRoles.join(', ')}`,
        details: {
          userRoles,
          requiredRoles: routeConfig.allowedRoles,
          route: `${method} ${routePath}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check client scope if required
    if (routeConfig.clientScopeRequired) {
      const hasClientAccess = checkClientAccess(userRoles, userClientId, req);

      if (!hasClientAccess) {
        res.status(StatusCodes.FORBIDDEN).json({
          error: 'forbidden',
          message: 'Access denied for this client scope',
          details: {
            userClientId,
            route: `${method} ${routePath}`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Authorization successful
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'authorization_error',
      message: 'Failed to process authorization',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Extract clean route path from request (remove API version prefix)
 */
function getRoutePath(req: Request): string {
  let path = '';

  // Method 1: Combine baseUrl + route.path (most reliable)
  if (req.baseUrl && req.route?.path) {
    path = req.baseUrl + req.route.path;
  }
  // Method 2: Fallback to req.path
  else if (req.path) {
    path = req.path;
  }
  // Method 3: Last resort - use route.path only
  else {
    path = req.route?.path || '';
  }

  console.log('🔍 Path extraction debug:', {
    'req.baseUrl': req.baseUrl,
    'req.route?.path': req.route?.path,
    'req.path': req.path,
    combined: path,
  });

  // Remove API version prefix if present
  if (path.startsWith('/api/v1')) {
    path = path.substring(7);
  }

  console.log('🎯 Final extracted path:', path);

  return path;
}

/**
 * Find route configuration by path and method
 */
function findRouteConfig(path: string, method: string): RouteAuthConfig | undefined {
  return ROUTE_AUTH_CONFIG.find(config => {
    // Exact match first
    if (config.path === path && config.method === method) {
      return true;
    }

    // Pattern matching for dynamic routes (e.g., /todos/:id)
    const configPathRegex = config.path.replace(/:[\w]+/g, '[^/]+');
    const pathRegex = new RegExp(`^${configPathRegex}$`);

    return pathRegex.test(path) && config.method === method;
  });
}

/**
 * Check if user has any of the allowed roles
 */
function checkRoleAccess(userRoles: string[], routeConfig: RouteAuthConfig): boolean {
  if (routeConfig.allowedRoles.length === 0) {
    return true; // Public route
  }

  if (routeConfig.requireAllRoles) {
    // AND logic - user must have ALL required roles
    return routeConfig.allowedRoles.every(role => userRoles.includes(role));
  } else {
    // OR logic - user must have ANY of the required roles
    return routeConfig.allowedRoles.some(role => userRoles.includes(role));
  }
}

/**
 * Check client scope access
 */
function checkClientAccess(
  userRoles: string[],
  userClientId: number | undefined,
  req: Request,
): boolean {
  // SUPER_ADMIN can access any client
  if (userRoles.includes(CoreRole.SUPER_ADMIN)) {
    return true;
  }

  // For other roles, they should only access their own client
  // This is a basic check - you might want to add more sophisticated client validation

  // Extract client ID from route parameters if present
  const routeClientId = req.params.clientId ? parseInt(req.params.clientId) : null;

  if (routeClientId && routeClientId !== userClientId) {
    return false; // Trying to access different client
  }

  return true; // Same client or no client specified in route
}

/**
 * Optional authorization middleware - doesn't fail if authorization fails
 */
export const optionalAuthorize = (req: Request, res: Response, next: NextFunction): void => {
  try {
    authorize(req, res, (err?: any) => {
      // Always continue, even if authorization would fail
      next();
    });
  } catch (error) {
    // Continue even on error
    next();
  }
};

/**
 * Helper function to add route configuration dynamically
 */
export const addRouteAuthConfig = (config: RouteAuthConfig): void => {
  ROUTE_AUTH_CONFIG.push(config);
};

/**
 * Helper function to get all route configurations (for debugging)
 */
export const getRouteAuthConfigs = (): RouteAuthConfig[] => {
  return [...ROUTE_AUTH_CONFIG];
};

/**
 * Validate route authorization configuration
 */
export const validateAuthConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for duplicate route definitions
  const routeKeys = ROUTE_AUTH_CONFIG.map(config => `${config.method}:${config.path}`);
  const duplicates = routeKeys.filter((key, index) => routeKeys.indexOf(key) !== index);

  if (duplicates.length > 0) {
    errors.push(`Duplicate route configurations found: ${duplicates.join(', ')}`);
  }

  // Check for invalid roles
  ROUTE_AUTH_CONFIG.forEach(config => {
    config.allowedRoles.forEach(role => {
      if (!Object.values(CoreRole).includes(role)) {
        errors.push(`Invalid role '${role}' in route ${config.method} ${config.path}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default authorize;
