import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser } from '../services/registration.service';
import type { ExtendedRequest } from '../types/extended-request';
import type { RegisterUserRequest } from '../dto/registration.dto';

/**
 * Register a new user
 * POST /api/users/register
 */
export async function registerUserController(
  req: ExtendedRequest<any, RegisterUserRequest>,
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await registerUser(req);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.CREATED).json(result);
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

    // Handle specific error types (existing logic)
    if (error.message.includes('already exists')) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'User already exists',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('permission') || error.message.includes('Insufficient')) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('Invalid')) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid request data',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Registration error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Registration failed',
      details: 'An unexpected error occurred during user registration',
      timestamp: new Date().toISOString(),
    });
  }
}
