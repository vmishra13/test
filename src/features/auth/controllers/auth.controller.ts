import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/auth.service';
import { LoginRequestDto, RefreshTokenRequestDto, RegisterRequestDto } from '../dto/auth.dto';
import { authLogger } from '../utils/auth-logger';
import { ApiResponse } from '@shared/utils/api-response';

export const login: RequestHandler = async (req, res) => {
  try {
    const loginDto = req.body as LoginRequestDto;
    const result = await authService.login(loginDto);

    // Log successful login
    authLogger.login(result.user.id, result.user.username, true, req.ip);

    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'Login successful'));
  } catch (error) {
    // Log failed login
    authLogger.login('unknown', req.body?.username || 'unknown', false, req.ip);

    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ApiResponse.error('Authentication failed', 'AUTH_FAILED', StatusCodes.UNAUTHORIZED));
  }
};

export const register: RequestHandler = async (req, res) => {
  try {
    const registerDto = req.body as RegisterRequestDto;
    const result = await authService.register(registerDto);

    // Log successful registration
    authLogger.register(result.user.id, result.user.username, true);

    res.status(StatusCodes.CREATED).json(ApiResponse.success(result, 'Registration successful'));
  } catch (error) {
    // Log failed registration
    authLogger.register('unknown', req.body?.username || 'unknown', false);

    if (error instanceof Error) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error(error.message, 'REGISTRATION_FAILED', StatusCodes.BAD_REQUEST));
    } else {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ApiResponse.error(
            'Registration failed',
            'SERVER_ERROR',
            StatusCodes.INTERNAL_SERVER_ERROR,
          ),
        );
    }
  }
};

export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequestDto;

    if (!refreshToken) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ApiResponse.error('Refresh token is required', 'MISSING_TOKEN', StatusCodes.BAD_REQUEST),
        );
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    // Get the user ID from the req object if available through middleware
    const userId = (req as any).user?.id || 'unknown';

    // Log successful token refresh
    authLogger.tokenRefresh(userId, true);

    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'Token refreshed'));
  } catch (error) {
    // Log failed token refresh
    authLogger.tokenRefresh('unknown', false);

    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ApiResponse.error('Invalid refresh token', 'INVALID_TOKEN', StatusCodes.UNAUTHORIZED));
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequestDto;

    if (!refreshToken) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ApiResponse.error('Refresh token is required', 'MISSING_TOKEN', StatusCodes.BAD_REQUEST),
        );
      return;
    }

    // Extract user ID from the authenticated request
    const userId = (req as any).user?.id || 'unknown';

    await authService.logout(refreshToken);

    // Log logout
    authLogger.logout(userId);

    // For logout, we can return a 200 success instead of 204 No Content to include a message
    res.status(StatusCodes.OK).json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Logout failed', 'LOGOUT_FAILED', StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const token: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { grant_type, username, password, refresh_token } = req.body;

    // Handle different grant types
    switch (grant_type) {
      case 'password': {
        // Password grant type - traditional login
        if (!username || !password) {
          res.status(StatusCodes.BAD_REQUEST).json({
            error: 'invalid_request',
            error_description: 'Missing username or password parameter',
          });
          return;
        }

        const result = await authService.login({ username, password });

        // Log successful login
        authLogger.login(result.user.id, result.user.username, true, req.ip);

        // Return standard OAuth response (not wrapped in ApiResponse)
        res.status(StatusCodes.OK).json({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: result.tokenType,
          expires_in: result.expiresIn,
          refresh_expires_in: result.refreshTokenExpiresIn,
          user: {
            id: result.user.id,
            username: result.user.username,
            role: result.user.role,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
          },
        });
        return;
      }

      case 'refresh_token': {
        // Refresh token grant type
        if (!refresh_token) {
          res.status(StatusCodes.BAD_REQUEST).json({
            error: 'invalid_request',
            error_description: 'Missing refresh_token parameter',
          });
          return;
        }

        const result = await authService.refreshToken(refresh_token);

        // Return standard OAuth response (not wrapped in ApiResponse)
        res.status(StatusCodes.OK).json({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: result.tokenType,
          expires_in: result.expiresIn,
          refresh_expires_in: result.refreshTokenExpiresIn,
        });
        return;
      }

      default:
        res.status(StatusCodes.BAD_REQUEST).json({
          error: 'unsupported_grant_type',
          error_description: `Grant type '${grant_type}' is not supported`,
        });
        return;
    }
  } catch (error) {
    // Handle login errors according to OAuth 2.0 spec
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'invalid_grant',
        error_description: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'server_error',
        error_description: 'An unexpected error occurred',
      });
    }
  }
};

export const revoke: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'invalid_request',
        error_description: 'Missing token parameter',
      });
      return;
    }

    // Revoke the token based on type hint
    await authService.logout(token);

    // OAuth spec requires 200 OK with empty body on successful revocation
    res.status(StatusCodes.OK).send();
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: 'invalid_request',
      error_description: error instanceof Error ? error.message : 'Token revocation failed',
    });
  }
};

// Export as a group for convenience
export const authController = {
  login,
  register,
  refreshToken,
  logout,
  token,
  revoke,
};
