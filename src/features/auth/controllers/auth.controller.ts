import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import * as authService from '../services/auth.service';
import { LoginResponse, RefreshTokenRequest } from '../dto/auth.dto';
import { getCurrentUserId, getCurrentClientId } from '../middlewares';

import {
  PasswordGrantRequestSchema as loginSchema,
  RefreshTokenGrantRequestSchema as refreshTokenSchema,
  TokenRequestSchema as oauth2TokenSchema,
} from '../validators/auth.validators';
import { ApiResponse } from '@shared/utils/api-response';

/**
 * User login endpoint
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body with OAuth 2.0 schema
    const requestData = loginSchema.parse(req.body);

    // Extract OAuth 2.0 standard fields
    const credentials = {
      username: requestData.username,
      password: requestData.password,
      clientId: requestData.clientId || undefined,
    };

    // Device information
    const deviceInfo = {
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip || 'unknown',
    };

    // Authenticate user
    const result: LoginResponse = await authService.authenticateUser(credentials, deviceInfo);

    // Return OAuth 2.0 compatible response
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          // OAuth 2.0 standard fields
          access_token: result.data.tokens.accessToken,
          token_type: 'Bearer',
          expires_in: result.data.tokens.expiresIn,
          refresh_token: result.data.tokens.refreshToken,
          refresh_expires_in: result.data.tokens.refreshExpiresIn,
          scope: requestData.scope || 'read write',
          user: result.data.user,
          permissions: result.data.permissions,
        },
        result.message,
      ),
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'invalid_request',
        error_description: 'Invalid request format or missing required parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('invalid_credentials')) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          error: 'invalid_grant',
          error_description:
            'The provided authorization grant is invalid, expired, revoked, or does not match the redirection URI',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.message.includes('account_locked')) {
        res.status(StatusCodes.LOCKED).json({
          error: 'account_locked',
          error_description: 'User account is temporarily locked due to multiple failed attempts',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.message.includes('account_disabled')) {
        res.status(StatusCodes.FORBIDDEN).json({
          error: 'access_denied',
          error_description: 'User account is disabled',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    console.error('Login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'server_error',
      error_description: 'An unexpected error occurred during authentication',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Token refresh endpoint
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body with Zod
    const { refresh_token }: RefreshTokenRequest = refreshTokenSchema.parse(req.body);

    // Device information
    const deviceInfo = {
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip || 'unknown',
    };

    const result = await authService.refreshToken(
      { refresh_token }, // ✅ Wrap in RefreshTokenRequest object
      deviceInfo,
    );

    // Return the result directly (it already matches RefreshTokenResponse)
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'validation_failed',
        message: 'Invalid refresh token format',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof Error && error.message.includes('Token refresh failed')) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'invalid_refresh_token',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Token refresh error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to refresh token',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * User logout endpoint
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    const clientId = getCurrentClientId(req);

    if (!userId || !clientId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract refresh token from body (optional)
    const { refreshToken } = req.body || {};

    // ✅ Use correct service function
    const result = await authService.logoutUser(userId, clientId, refreshToken, false);

    res.status(StatusCodes.OK).json(ApiResponse.success(null, result.message));
  } catch (error) {
    console.error('Logout error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to logout',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    const clientId = getCurrentClientId(req);

    if (!userId || !clientId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await authService.logoutUser(userId, clientId, undefined, true);

    res.status(StatusCodes.OK).json(ApiResponse.success(null, result.message));
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to logout from all devices',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get current user session info
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    const clientId = getCurrentClientId(req);

    if (!userId || !clientId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ✅ Use correct service function
    const sessionInfo = await authService.getUserTokenSummary(userId, clientId);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(sessionInfo, 'Session information retrieved successfully'));
  } catch (error) {
    console.error('Get session error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to retrieve session information',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Validate current token
 */
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // If we reach here, the token is valid (checked by authenticate middleware)
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          valid: true,
          user: req.user,
          permissions: req.permissions,
          clientId: req.clientId,
        },
        'Token is valid',
      ),
    );
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to validate token',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Check authentication status (works with optional auth)
 */
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const isAuthenticated = !!req.user;

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          authenticated: isAuthenticated,
          user: req.user || null,
          permissions: req.permissions || [],
          clientId: req.clientId || null,
        },
        isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
      ),
    );
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'Failed to check authentication status',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Dedicated OAuth 2.0 token endpoint
 */
export const oauth2Token = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate OAuth 2.0 token request
    const tokenRequest = oauth2TokenSchema.parse(req.body);

    // Device information
    const deviceInfo = {
      userAgent: req.get('User-Agent') || 'unknown',
      ipAddress: req.ip || 'unknown',
    };

    // Process OAuth 2.0 request using service
    const result = await authService.processOAuth2TokenRequest(tokenRequest, deviceInfo);

    // Check if it's an error response
    if ('error' in result) {
      res.status(StatusCodes.BAD_REQUEST).json(result);
      return;
    }

    // Success response - already OAuth 2.0 compatible
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'invalid_request',
        error_description: 'Invalid request format or missing required parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    // Generic OAuth 2.0 error response
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'server_error',
      error_description: 'An unexpected error occurred',
    });
  }
};
