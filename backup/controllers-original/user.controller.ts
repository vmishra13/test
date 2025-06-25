import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword,
} from '../services/user.service';
import type { ExtendedRequest, UserQuery } from '../types/extended-request';

/**
 * Get all users based on role permissions
 * GET /api/users
 */
export async function getUsersController(
  req: ExtendedRequest<UserQuery>,
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await getUsers(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle specific error types
    if (error.message.includes('Failed to retrieve')) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Data retrieval failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Get users error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to retrieve users',
      details: 'An unexpected error occurred while retrieving users',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get user by ID based on role permissions
 * GET /api/users/:userId
 */
export async function getUserByIdController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await getUserById(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle specific error types
    if (error.message.includes('Failed to retrieve')) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Data retrieval failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Get user by ID error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to retrieve user',
      details: 'An unexpected error occurred while retrieving user',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Update user based on role permissions
 * PUT /api/users/:userId
 */
export async function updateUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await updateUser(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Update user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to update user',
      details: 'An unexpected error occurred while updating user',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Delete user based on role permissions
 * DELETE /api/users/:userId
 */
export async function deleteUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await deleteUser(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for user deletion',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Delete user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to delete user',
      details: 'An unexpected error occurred while deleting user',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Update user status based on role permissions
 * PATCH /api/users/:userId
 */
export async function updateUserStatusController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await updateUserStatus(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for status change',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Update user status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to update user status',
      details: 'An unexpected error occurred while updating user status',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Update user password based on role permissions
 * PUT /api/users/:userId/password
 */
export async function updateUserPasswordController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await updateUserPassword(req as any);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - You can only update passwords within your organization',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Update password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to update password',
      details: 'An unexpected error occurred while updating password',
      timestamp: new Date().toISOString(),
    });
  }
}
