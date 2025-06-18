import bcrypt from 'bcrypt';
import {
  LoginResponse,
  PublicUserData,
  RefreshTokenRequest,
  RefreshTokenResponse,
  OAuth2TokenRequest,
  OAuth2TokenResponse,
  OAuth2ErrorResponse,
  PasswordVerificationResult,
  AuthenticatedUser,
  SecurityEvent,
} from '../dto/auth.dto';
import {
  UserRegistrationRequest,
  UserProfile,
  UserUpdateRequest,
  UserUpdateResponse,
} from '@features/users/dto/user.dto';
import * as userRepository from '@features/users/repositories/user.repository';
import * as tokenService from './token.service';
import * as tokenRepository from '../repositories/token.repository';
import {
  validatePasswordChangeRequest,
  validateOAuth2TokenRequest,
  validateUserRegistrationRequest,
  type PasswordChangeRequest,
  type LoginCredentials,
} from '../validators/auth.validators';
import type { UserUpdateInput } from '@features/users/validators/user.validators';
import type { CoreRole } from '@/shared/constants';

// ===================================================================
// 🔒 TEMPORARY PASSWORD RESET STORAGE (IN-MEMORY)
// ===================================================================

interface ResetTokenData {
  userId: number;
  email: string;
  expiresAt: Date;
  used: boolean;
}

// Temporary in-memory storage for reset tokens
// TODO: Replace with database storage when passwordResetToken table is available
const temporaryResetTokens = new Map<string, ResetTokenData>();

// Clean up expired tokens every hour
setInterval(
  () => {
    const now = new Date();
    for (const [token, data] of temporaryResetTokens.entries()) {
      if (data.expiresAt < now || data.used) {
        temporaryResetTokens.delete(token);
      }
    }
  },
  60 * 60 * 1000,
);

// ===================================================================
// 🎯 AUTHENTICATION FLOWS
// ===================================================================

/**
 * Authenticate user with username/password
 */
export async function authenticateUser(
  loginData: LoginCredentials,
  deviceInfo?: { userAgent?: string; ipAddress?: string },
): Promise<LoginResponse> {
  try {
    // Find user with authentication data
    const user = await userRepository.findUserWithAuthData(loginData.username, loginData.clientId);

    if (!user) {
      // Log failed login attempt
      await logSecurityEvent({
        type: 'failed_login',
        userId: 0, // Unknown user
        clientId: loginData.clientId || 0,
        details: {
          reason: 'User not found',
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
        },
        timestamp: new Date(),
        severity: 'medium',
      });

      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValidPassword = await userRepository.verifyPassword(user.id, loginData.password);

    if (!isValidPassword) {
      // Log failed login attempt
      await logSecurityEvent({
        type: 'failed_login',
        userId: user.id,
        clientId: user.clientId,
        details: {
          reason: 'Invalid password',
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
        },
        timestamp: new Date(),
        severity: 'medium',
      });

      throw new Error('Invalid username or password');
    }

    // Check user status
    if (user.status === -99 || user.status === 0) {
      throw new Error('Account is inactive or suspended');
    }

    // Generate token pair
    const tokens = await tokenService.generateTokenPair(user, deviceInfo);

    // Extract public user data
    const publicUserData: PublicUserData = {
      id: user.id,
      loginName: user.loginName,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      email: user.email || undefined,
      timeZone: user.timeZone || undefined,
      client: {
        id: user.client.id,
        name: user.client.name,
        timeZone: user.client.timeZone || undefined,
      },
      userType: {
        id: user.userType.id,
        name: user.userType.name,
        description: user.userType.description || undefined,
      },
      roles: user.userRoles?.map(ur => ur.role.name as CoreRole) || [],
    };

    // Extract permissions (if available)
    const permissions: string[] = []; // TODO: Extract from roles/permissions table

    return {
      success: true,
      data: {
        user: publicUserData,
        tokens,
        permissions,
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  refreshData: RefreshTokenRequest,
  deviceInfo?: { userAgent?: string; ipAddress?: string },
): Promise<RefreshTokenResponse> {
  try {
    // Refresh the token
    const tokens = await tokenService.refreshAccessToken(refreshData.refresh_token, deviceInfo);

    // Optionally get updated user data
    const userId = tokenService.extractUserIdFromToken(refreshData.refresh_token);
    let userData: PublicUserData | undefined;

    if (userId) {
      const user = await userRepository.findUserById(userId);
      if (user) {
        userData = {
          id: user.id,
          loginName: user.loginName,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          timeZone: user.timeZone || undefined,
          client: {
            id: user.client.id,
            name: user.client.name,
            timeZone: user.client.timeZone || undefined,
          },
          userType: {
            id: user.userType.id,
            name: user.userType.name,
            description: user.userType.description || undefined,
          },
          roles: user.userRoles?.map(ur => ur.role.name as CoreRole) || [],
        };
      }
    }

    return {
      success: true,
      data: {
        tokens,
        user: userData,
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error}`);
  }
}

/**
 * Logout user (revoke tokens)
 */
export async function logoutUser(
  userId: number,
  clientId: number,
  refreshToken?: string,
  logoutAllDevices: boolean = false,
): Promise<{ success: boolean; message: string }> {
  try {
    if (logoutAllDevices) {
      // Revoke all tokens for user
      await tokenService.revokeAllUserTokens(userId, clientId, 'user');
    } else if (refreshToken) {
      // Revoke specific token
      await tokenService.revokeToken(refreshToken, 'user', 'refresh_token');
    }

    return {
      success: true,
      message: logoutAllDevices
        ? 'Logged out from all devices successfully'
        : 'Logged out successfully',
    };
  } catch (error) {
    throw new Error(`Logout failed: ${error}`);
  }
}

// ===================================================================
// 🎯 USER REGISTRATION AND MANAGEMENT
// ===================================================================

/**
 * Register new user
 */
export async function registerUser(
  registrationData: UserRegistrationRequest,
  createdBy: string,
): Promise<{ success: boolean; user: UserProfile; message: string }> {
  try {
    // Validate registration data
    const validatedData = validateUserRegistrationRequest.parse(registrationData);

    // Check if user already exists
    const existingUser = await userRepository.findUserWithAuthData(
      validatedData.loginName,
      validatedData.clientId,
    );

    if (existingUser) {
      throw new Error('User with this login name already exists');
    }

    // Check if email is already used (if provided)
    if (validatedData.email) {
      const existingEmailUser = await userRepository.findUserByEmail(
        validatedData.email,
        validatedData.clientId,
      );

      if (existingEmailUser) {
        throw new Error('User with this email already exists');
      }
    }

    // Convert validated data to repository format
    const userCreationData = {
      clientId: validatedData.clientId,
      userTypeId: validatedData.userTypeId,
      loginName: validatedData.loginName,
      password: validatedData.password,
      firstName: validatedData.firstName,
      middleName: validatedData.middleName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
      mrn: validatedData.mrn,
      gender: validatedData.gender,
      timeZone: validatedData.timeZone,
      roleIds: validatedData.roleIds,
    };

    // Create user
    const createdUser = await userRepository.createUser(userCreationData, createdBy);

    // Get full user profile
    const userProfile = await userRepository.getUserProfile(createdUser.id);

    if (!userProfile) {
      throw new Error('Failed to retrieve created user profile');
    }

    // Log registration event
    await logSecurityEvent({
      type: 'login', // You might want to add 'registration' type
      userId: createdUser.id,
      clientId: validatedData.clientId,
      details: {
        reason: 'User registration',
      },
      timestamp: new Date(),
      severity: 'low',
    });

    return {
      success: true,
      user: userProfile,
      message: 'User registered successfully',
    };
  } catch (error) {
    throw new Error(`User registration failed: ${error}`);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updateData: UserUpdateRequest,
  updatedBy: string,
): Promise<UserUpdateResponse> {
  try {
    const userUpdateInput: UserUpdateInput = {
      firstName: updateData.firstName ?? undefined, // Convert null to undefined
      middleName: updateData.middleName ?? undefined,
      lastName: updateData.lastName ?? undefined,
      email: updateData.email ?? undefined,
      dob: updateData.dob ? new Date(updateData.dob) : undefined,
      mrn: updateData.mrn ?? undefined,
      gender: updateData.gender ?? undefined,
      timeZone: updateData.timeZone ?? undefined,
      profilePicture: updateData.profilePicture ?? undefined,
      passExpireInDays: updateData.passExpireInDays ?? undefined,
      modUser: updatedBy,
    };

    // Call repository with transformed data
    const updatedUser = await userRepository.updateUserProfile(userId, userUpdateInput, updatedBy);

    const updatedFields = Object.keys(updateData).filter(
      key =>
        updateData[key as keyof UserUpdateRequest] !== undefined &&
        updateData[key as keyof UserUpdateRequest] !== null,
    );

    return {
      success: true,
      data: {
        user: updatedUser,
        updatedFields,
      },
      message: 'User profile updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`User profile update failed: ${error}`);
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    return await userRepository.getUserProfile(userId);
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error}`);
  }
}

// ===================================================================
// 🎯 PASSWORD MANAGEMENT
// ===================================================================

/**
 * Change user password
 */
export async function changeUserPassword(
  passwordData: PasswordChangeRequest,
  changedBy: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate password change request
    const validatedData = validatePasswordChangeRequest.parse(passwordData);

    // Verify current password
    const isCurrentPasswordValid = await userRepository.verifyPassword(
      validatedData.userId,
      validatedData.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(
      validatedData.newPassword,
      validatedData.currentPassword,
    );

    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Update password
    await userRepository.updatePassword(validatedData.userId, validatedData.newPassword, changedBy);

    // Revoke all existing tokens to force re-authentication
    const user = await userRepository.findUserById(validatedData.userId);
    if (user) {
      await tokenService.revokeAllUserTokens(user.id, user.clientId, changedBy);
    }

    // Log password change event
    await logSecurityEvent({
      type: 'token_revoke', // You might want to add 'password_change' type
      userId: validatedData.userId,
      clientId: user?.clientId || 0,
      details: {
        reason: 'Password changed - tokens revoked',
      },
      timestamp: new Date(),
      severity: 'medium',
    });

    return {
      success: true,
      message: 'Password changed successfully. Please login again.',
    };
  } catch (error) {
    throw new Error(`Password change failed: ${error}`);
  }
}

/**
 * Verify user password
 */
export async function verifyUserPassword(
  userId: number,
  password: string,
): Promise<PasswordVerificationResult> {
  try {
    return await tokenService.verifyUserPassword(userId, password);
  } catch (error) {
    throw new Error(`Password verification failed: ${error}`);
  }
}

// ===================================================================
// 🎯 OAUTH 2.0 ENDPOINTS
// ===================================================================

/**
 * OAuth 2.0 Token Endpoint
 */
export async function processOAuth2TokenRequest(
  tokenRequest: OAuth2TokenRequest,
  deviceInfo?: { userAgent?: string; ipAddress?: string },
): Promise<OAuth2TokenResponse | OAuth2ErrorResponse> {
  try {
    // Validate the token request
    const validatedRequest = validateOAuth2TokenRequest.parse(tokenRequest) as OAuth2TokenRequest;

    if (validatedRequest.grant_type === 'password') {
      // Resource Owner Password Credentials Grant
      if (!validatedRequest.username || !validatedRequest.password) {
        return {
          error: 'invalid_request',
          error_description: 'Username and password are required',
        };
      }

      const loginResult = await authenticateUser(
        {
          username: validatedRequest.username,
          password: validatedRequest.password,
          clientId: validatedRequest.client_id ? parseInt(validatedRequest.client_id) : undefined,
        },
        deviceInfo,
      );

      return {
        access_token: loginResult.data.tokens.accessToken,
        token_type: 'Bearer',
        expires_in: loginResult.data.tokens.expiresIn,
        refresh_token: loginResult.data.tokens.refreshToken,
        refresh_expires_in: loginResult.data.tokens.refreshExpiresIn,
        scope: validatedRequest.scope,
        user: loginResult.data.user,
      };
    } else if (validatedRequest.grant_type === 'refresh_token') {
      // Refresh Token Grant
      if (!validatedRequest.refresh_token) {
        return {
          error: 'invalid_request',
          error_description: 'Refresh token is required',
        };
      }

      const refreshResult = await refreshToken(
        {
          refresh_token: validatedRequest.refresh_token,
        },
        deviceInfo,
      );

      return {
        access_token: refreshResult.data.tokens.accessToken,
        token_type: 'Bearer',
        expires_in: refreshResult.data.tokens.expiresIn,
        refresh_token: refreshResult.data.tokens.refreshToken,
        refresh_expires_in: refreshResult.data.tokens.refreshExpiresIn,
        scope: validatedRequest.scope,
        user: refreshResult.data.user!,
      };
    } else {
      return {
        error: 'unsupported_grant_type',
        error_description: `Grant type ${validatedRequest.grant_type} is not supported`,
      };
    }
  } catch (error) {
    return {
      error: 'invalid_grant',
      error_description: `Authentication failed: ${error}`,
    };
  }
}

// ===================================================================
// 🎯 SECURITY AND MONITORING
// ===================================================================

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await tokenRepository.logSecurityEvent(
      event.userId,
      event.clientId,
      event.type as 'token_rotation' | 'suspicious_activity' | 'logout_all',
      event.details,
      'system', // modUser - could be passed as parameter or derived from context
    );
  } catch (error) {
    // Don't throw errors for logging failures
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get user's active token summary
 */
export async function getUserTokenSummary(userId: number, clientId: number) {
  try {
    return await tokenService.getUserTokenSummary(userId, clientId);
  } catch (error) {
    throw new Error(`Failed to get user token summary: ${error}`);
  }
}

/**
 * Detect suspicious activity for user
 */
export async function detectUserSuspiciousActivity(userId: number, clientId: number) {
  try {
    return await tokenService.detectSuspiciousTokenActivity(userId, clientId);
  } catch (error) {
    throw new Error(`Failed to detect suspicious activity: ${error}`);
  }
}

/**
 * Revoke user tokens due to security breach
 */
export async function revokeUserTokensForSecurity(
  userId: number,
  clientId: number,
  reason: string,
  revokedBy: string,
): Promise<{ success: boolean; revokedCount: number; families: string[] }> {
  try {
    const result = await tokenService.revokeAllUserTokens(userId, clientId, revokedBy);

    // Log security event
    await logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      clientId,
      details: {
        reason: `Security revocation: ${reason}`,
      },
      timestamp: new Date(),
      severity: 'high',
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to revoke tokens for security: ${error}`);
  }
}

// ===================================================================
// 🔒 PASSWORD RESET FUNCTIONALITY
// ===================================================================

/**
 * Initiate password reset process
 */
export async function initiatePasswordReset(email: string): Promise<{ requestId: string }> {
  try {
    // Check if user exists with this email
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      // For security, we don't reveal if the email exists
      // But we still return success to prevent email enumeration
      return { requestId: generateRequestId() };
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in memory (temporary solution)
    // TODO: Store in database when passwordResetToken table is available
    temporaryResetTokens.set(resetToken, {
      userId: user.id,
      email: user.email || '',
      expiresAt,
      used: false,
    });

    // TODO: Send reset email (integrate with email service)
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    // Log security event
    await logSecurityEvent({
      type: 'suspicious_activity', // Using existing type for now
      userId: user.id,
      clientId: user.clientId,
      details: { reason: 'Password reset requested' },
      timestamp: new Date(),
      severity: 'medium',
    });

    return { requestId: generateRequestId() };
  } catch (error) {
    console.error('Password reset initiation failed:', error);
    throw new Error('Failed to initiate password reset');
  }
}

/**
 * Reset password using reset token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  try {
    // Verify reset token from temporary storage
    const resetData = temporaryResetTokens.get(token);

    if (!resetData || resetData.expiresAt < new Date() || resetData.used) {
      throw new Error('invalid_token');
    }

    // Get user
    const user = await userRepository.findUserById(resetData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password using the correct method name
    await userRepository.updatePassword(user.id, hashedPassword, 'system-password-reset');

    // Mark reset token as used
    resetData.used = true;
    temporaryResetTokens.set(token, resetData);

    // Log security event
    await logSecurityEvent({
      type: 'suspicious_activity', // Using existing type
      userId: user.id,
      clientId: user.clientId,
      details: { reason: 'Password reset completed' },
      timestamp: new Date(),
      severity: 'high',
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset failed:', error);
    if (error instanceof Error && error.message === 'invalid_token') {
      throw error;
    }
    throw new Error('Failed to reset password');
  }
}

/**
 * Verify if reset token is valid
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  expiresAt?: Date;
}> {
  try {
    const resetData = temporaryResetTokens.get(token);

    if (!resetData || resetData.expiresAt < new Date() || resetData.used) {
      return { valid: false };
    }

    // Get user email
    const user = await userRepository.findUserById(resetData.userId);
    if (!user) {
      return { valid: false };
    }

    return {
      valid: true,
      email: user.email || undefined,
      expiresAt: resetData.expiresAt,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false };
  }
}

// ===================================================================
// 🔧 HELPER FUNCTIONS
// ===================================================================

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a request ID for tracking
 */
function generateRequestId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

// ===================================================================
// 🎯 UTILITY FUNCTIONS
// ===================================================================

/**
 * Validate authentication token
 */
export async function validateAuthToken(token: string): Promise<AuthenticatedUser> {
  try {
    return await tokenService.validateAccessToken(token);
  } catch (error) {
    throw new Error(`Token validation failed: ${error}`);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  return tokenService.isTokenExpired(token);
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  return tokenService.getTokenExpiration(token);
}

/**
 * Extract user ID from token
 */
export function extractUserIdFromToken(token: string): number | null {
  return tokenService.extractUserIdFromToken(token);
}

// ===================================================================
// 🎯 ADMIN FUNCTIONS
// ===================================================================

/**
 * Admin: Get token statistics
 */
export async function getTokenStatistics(clientId?: number) {
  try {
    return await tokenService.getTokenStatistics(clientId);
  } catch (error) {
    throw new Error(`Failed to get token statistics: ${error}`);
  }
}

/**
 * Admin: Cleanup expired tokens
 */
export async function cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
  try {
    return await tokenService.cleanupExpiredTokens();
  } catch (error) {
    throw new Error(`Failed to cleanup expired tokens: ${error}`);
  }
}

/**
 * Admin: Force logout user from all devices
 */
export async function forceLogoutUser(
  userId: number,
  clientId: number,
  reason: string,
  adminUser: string,
): Promise<{ success: boolean; revokedCount: number; families: string[] }> {
  try {
    const result = await tokenService.revokeAllUserTokens(userId, clientId, adminUser);

    // Log admin action
    await logSecurityEvent({
      type: 'logout',
      userId,
      clientId,
      details: {
        reason: `Admin forced logout: ${reason}`,
      },
      timestamp: new Date(),
      severity: 'medium',
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to force logout user: ${error}`);
  }
}

// ===================================================================
// 🎯 HEALTH CHECK
// ===================================================================

/**
 * Auth service health check
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}> {
  try {
    // Check token service health
    const tokenServiceHealth = await tokenService.healthCheck();

    // Check database connectivity (basic user query)
    const testUser = await userRepository.getUserProfile(1);

    // Check if we can create a test security event
    const testEvent: SecurityEvent = {
      type: 'login',
      userId: 0,
      clientId: 0,
      details: { reason: 'Health check test' },
      timestamp: new Date(),
      severity: 'low',
    };

    await logSecurityEvent(testEvent);

    return {
      status: 'healthy',
      details: {
        authService: true,
        tokenService: tokenServiceHealth.status === 'healthy',
        databaseConnectivity: true,
        securityLogging: true,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
