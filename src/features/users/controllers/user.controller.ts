import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getUsers } from '../services/user.service';

/**
 * Get all users based on role permissions
 * GET /api/users
 */
export async function getUsersController(req: Request, res: Response): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await getUsers(req);

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
