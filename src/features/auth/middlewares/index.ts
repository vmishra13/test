import { authenticate } from './auth.middleware';
import {
  requireRole,
  requirePermission,
  requireAccess,
  requireAdmin,
  requireSuperAdmin,
  requireResourceOwner,
  requireClientAccess,
} from './role.middleware';
import {
  optionalAuthenticate,
  conditionalAuthenticate,
  isAuthenticated,
  isAnonymous,
  getCurrentUserId,
  getCurrentUserLoginName,
  getCurrentUserRoles,
  getCurrentUserPermissions,
  getCurrentClientId,
  getCurrentUserTypeId,
  hasRole,
  hasAnyRole,
  hasPermission,
  isAdmin,
  isSuperAdmin,
  getUserContext,
} from './optional-auth.middleware';

// Import types from DTO files (not middleware files)
import type { AuthenticatedUser } from '../dto/auth.dto';

// Export the type for other files to use
export type { AuthenticatedUser };

// Export middleware functions
export {
  authenticate,
  optionalAuthenticate,
  conditionalAuthenticate,
  requireRole,
  requirePermission,
  requireAccess,
  requireAdmin,
  requireSuperAdmin,
  requireResourceOwner,
  requireClientAccess,
};

// Export helper functions for easier access
export {
  isAuthenticated,
  isAnonymous,
  getCurrentUserId,
  getCurrentUserLoginName,
  getCurrentUserRoles,
  getCurrentUserPermissions,
  getCurrentClientId,
  getCurrentUserTypeId,
  hasRole,
  hasAnyRole,
  hasPermission,
  isAdmin,
  isSuperAdmin,
  getUserContext,
};

// Middleware composition helpers
export const auth = {
  // Basic authentication
  required: [authenticate],
  optional: [optionalAuthenticate],

  // Role-based access
  admin: [authenticate, requireAdmin],
  superAdmin: [authenticate, requireSuperAdmin],

  // Resource ownership
  owner: (userIdParam = 'userId') => [authenticate, requireResourceOwner(userIdParam)],

  // Client access
  client: [authenticate, requireClientAccess],
};

// Utility functions for building complex middleware chains
export const combineMiddleware = (...middlewares: any[]) => {
  return middlewares.flat();
};

export const createRoleMiddleware = (roles: string | string[]) => {
  return [authenticate, requireRole(roles)];
};

export const createPermissionMiddleware = (permissions: string | string[]) => {
  return [authenticate, requirePermission(permissions)];
};

export const createAccessMiddleware = (config: {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
}) => {
  return [authenticate, requireAccess(config)];
};

// Helper functions for common patterns
export const createUserOwnershipMiddleware = (userIdParam = 'userId') => {
  return [authenticate, requireResourceOwner(userIdParam)];
};

export const createClientAccessMiddleware = () => {
  return [authenticate, requireClientAccess];
};

export const createConditionalAuthMiddleware = (condition: (req: any) => boolean) => {
  return conditionalAuthenticate(condition);
};

// Validation helpers
export const validateAuthenticated = (req: any): boolean => {
  return isAuthenticated(req);
};

export const validateRole = (req: any, role: string): boolean => {
  return hasRole(req, role);
};

export const validatePermission = (req: any, permission: string): boolean => {
  return hasPermission(req, permission);
};

export const validateAdminAccess = (req: any): boolean => {
  return isAdmin(req);
};

export const validateSuperAdminAccess = (req: any): boolean => {
  return isSuperAdmin(req);
};

// User info extractors
export const extractUserId = (req: any): number | undefined => {
  return getCurrentUserId(req);
};

export const extractClientId = (req: any): number | undefined => {
  return getCurrentClientId(req);
};

export const extractUserRoles = (req: any): string[] => {
  return getCurrentUserRoles(req);
};

export const extractUserPermissions = (req: any): string[] => {
  return getCurrentUserPermissions(req);
};

export const extractUserContext = (req: any) => {
  return getUserContext(req);
};
