import { Router, Response, NextFunction, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@shared/utils/api-response';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser as AuthUser } from '@features/auth/dto/auth.dto';

interface IAuthenticatedRequest extends Omit<Request, 'user'> {
  user?: RbacUser;
}

export interface RbacUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  user: RbacUser;
  token: string;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  THERAPIST = 'therapist',
  RECEPTIONIST = 'receptionist',
  PATIENT = 'patient'
}

export const Permissions = {
  // Any authenticated user
  ANY_AUTHENTICATED: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.THERAPIST,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ],

  // Admin and super admin only
  ADMINS_ONLY: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ],

  // Medical staff (doctors, nurses, therapists)
  MEDICAL_STAFF: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.THERAPIST
  ],

  // Doctors only
  DOCTORS_ONLY: [
    UserRole.SUPER_ADMIN,
    UserRole.DOCTOR
  ],

  // Super admin only
  SUPER_ADMIN_ONLY: [
    UserRole.SUPER_ADMIN
  ],

  // Medical staff + receptionist
  STAFF_ONLY: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.THERAPIST,
    UserRole.RECEPTIONIST
  ]
} as const;

export type PermissionGroup = keyof typeof Permissions;

export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('User not authenticated', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED)
        );
      }

      const userRole = req.user.role as UserRole;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error('Insufficient permissions', 'FORBIDDEN', StatusCodes.FORBIDDEN)
        );
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Role validation failed', 'INTERNAL_SERVER_ERROR', StatusCodes.INTERNAL_SERVER_ERROR)
      );
    }
  };
};

export const authenticate = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error('Authorization token required', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED)
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error('Authorization token required', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED)
      );
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    // Set user in request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      permissions: decoded.permissions
    } as RbacUser;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(StatusCodes.UNAUTHORIZED).json(
      ApiResponse.error('Invalid or expired token', 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED)
    );
  }
};

const rbacRouter = Router();

export default rbacRouter;
