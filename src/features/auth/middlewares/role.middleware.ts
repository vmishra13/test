import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Role } from '../models/user.model';
import { IAuthenticatedRequest } from './auth.middleware';
import { ApiResponse } from '../../../shared/utils/api-response';

/**
 * Middleware to check if the authenticated user has one of the allowed roles
 * @param allowedRoles Array of roles that can access the resource
 */
export const checkRole = (allowedRoles: Role[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
    // First ensure user is authenticated
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required', 
          'UNAUTHORIZED', 
          StatusCodes.UNAUTHORIZED
        )
      );
      return;
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error(
          'Access denied', 
          'FORBIDDEN', 
          StatusCodes.FORBIDDEN
        )
      );
      return;
    }

    next();
  };
};

/**
 * Predefined permission groups for common access patterns
 */
export const Permissions = {
  // Access for all authenticated users
  ANY_AUTHENTICATED: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT],

  // Administrative access
  ADMINS_ONLY: [Role.SUPER_ADMIN, Role.CLIENT_ADMIN],

  // Medical staff access
  MEDICAL_STAFF: [Role.DOCTOR, Role.NURSE],

  // Doctor-specific access
  DOCTORS_ONLY: [Role.DOCTOR],

  // Doctor + admin for sensitive operations
  DOCTOR_OR_ADMIN: [Role.DOCTOR, Role.SUPER_ADMIN, Role.CLIENT_ADMIN],

  // Super admin restricted operations
  SUPER_ADMIN_ONLY: [Role.SUPER_ADMIN],
};
