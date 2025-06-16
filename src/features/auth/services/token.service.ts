import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import ms from 'ms';
import { ENV } from '@config/env';
import { StringValue } from '@shared/types';
import {
  TokenPair,
  AccessTokenClaims,
  RefreshTokenClaims,
  AuthenticatedUser,
  SecurityEvent,
  PasswordVerificationResult,
  type DecodedAccessToken,
  type DecodedRefreshToken,
  type DecodedTokenPayload,
} from '../dto/auth.dto';
import {
  UserWithAuthData,
} from '@features/users/validators/user.validators';
import * as tokenRepository from '../repositories/token.repository';
import * as userRepository from '@features/users/repositories/user.repository';
import type { CoreRole } from '@/shared/constants';

// ===================================================================
// 🎯 JWT CONFIGURATION AND CONSTANTS
// ===================================================================

interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

const getJWTConfig = (): JWTConfig => ({
  accessTokenSecret: ENV.jwt.accessTokenSecret,
  refreshTokenSecret: ENV.jwt.refreshTokenSecret,
  accessTokenExpiry: ENV.jwt.accessTokenExpiresIn,
  refreshTokenExpiry: ENV.jwt.refreshTokenExpiresIn,
  issuer: ENV.jwt.issuer,
  audience: ENV.jwt.audience,
});

// Helper function to convert expiry strings to seconds (like in your old service)
const calculateExpiresInSeconds = (expiresIn: string): number => {
  return ms(expiresIn as StringValue) / 1000; // Convert to seconds
};

// Token expiry constants (calculated from config)
const getAccessTokenExpirySeconds = () => calculateExpiresInSeconds(ENV.jwt.accessTokenExpiresIn);
const getRefreshTokenExpirySeconds = () => calculateExpiresInSeconds(ENV.jwt.refreshTokenExpiresIn);

// ===================================================================
// 🎯 TOKEN GENERATION
// ===================================================================

/**
 * Generate a complete token pair (access + refresh) for authenticated user
 */
export async function generateTokenPair(
  user: UserWithAuthData,
  deviceInfo?: { userAgent?: string; ipAddress?: string },
): Promise<TokenPair> {
  try {
    // Extract user roles
    const roles = user.userRole?.map(ur => ur.role.name as CoreRole) || [];

    // Calculate refresh token expiry in milliseconds (7 days default)
    const refreshExpiryMs = calculateExpiresInSeconds(ENV.jwt.refreshTokenExpiresIn) * 1000;

    // Use the stateless token repository to create token pair
    const tokenPair = await tokenRepository.createTokenPair(
      user.id,
      user.clientId,
      roles,
      refreshExpiryMs
    );

    // Log security event for login
    await tokenRepository.logSecurityEvent(
      user.id,
      user.clientId,
      'token_rotation', // Use available event type for login tracking
      {
        action: 'login',
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        tokenFamily: tokenPair.tokenFamily,
      },
      user.loginName
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.accessExpiresIn,
      refreshExpiresIn: tokenPair.refreshExpiresIn,
    };
  } catch (error: any) {
    throw new Error(`Failed to generate token pair: ${error.message}`);
  }
}

/**
 * Refresh access token using valid refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  deviceInfo?: { userAgent?: string; ipAddress?: string },
): Promise<TokenPair> {
  try {
    // Validate refresh token using stateless token repository
    const validation = await tokenRepository.validateRefreshToken(refreshToken);
    
    if (!validation.isValid || !validation.payload) {
      throw new Error(validation.error || 'Invalid refresh token');
    }

    const oldPayload = validation.payload;

    // Get fresh user data for new tokens
    const user = await userRepository.findUserById(oldPayload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is still active
    if (user.status === -99 || user.status === 0) {
      throw new Error('User account is inactive');
    }

    // Extract user roles
    const roles = user.userRole?.map(ur => ur.role.name as CoreRole) || [];

    // Create new token data for rotation
    const newTokenData = {
      userId: oldPayload.userId,
      clientId: oldPayload.clientId,
      jti: tokenRepository.generateJti(),
      family: oldPayload.family,
      expiresAt: new Date(Date.now() + calculateExpiresInSeconds(ENV.jwt.refreshTokenExpiresIn) * 1000),
      issuedAt: new Date(),
    };

    // Rotate refresh token (stateless)
    const rotationResult = await tokenRepository.rotateRefreshToken(
      refreshToken,
      newTokenData,
      user.loginName
    );

    // Create new access token
    const accessToken = tokenRepository.createAccessToken(
      oldPayload.userId,
      oldPayload.clientId,
      roles
    );

    return {
      accessToken,
      refreshToken: rotationResult.newToken,
      expiresIn: 15 * 60, // 15 minutes
      refreshExpiresIn: calculateExpiresInSeconds(ENV.jwt.refreshTokenExpiresIn),
    };
  } catch (error: any) {
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

// ===================================================================
// 🎯 TOKEN VALIDATION
// ===================================================================

/**
 * Validate and decode access token
 */
export async function validateAccessToken(token: string): Promise<AuthenticatedUser> {
  try {
    // Use stateless token repository validation
    const validation = await tokenRepository.validateAccessToken(token);
    
    if (!validation.isValid || !validation.payload) {
      throw new Error(validation.error || 'Invalid access token');
    }

    const { userId, clientId, roles, jti } = validation.payload;

    // Get user data for additional context
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return authenticated user context
    return {
      userId,
      clientId,
      userTypeId: user.userTypeId,
      loginName: user.loginName,
      roles: roles as CoreRole[],
      permissions: [], // Would be populated from user roles/permissions
      tokenType: 'access',
      tokenExp: Math.floor(Date.now() / 1000) + (15 * 60), // Access tokens are 15 minutes
      tokenIat: Math.floor(Date.now() / 1000),
    };
  } catch (error: any) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
}

/**
 * Validate refresh token structure (without database check)
 */
export function validateRefreshTokenStructure(token: string): DecodedRefreshToken {
  try {
    const config = getJWTConfig();

    const decoded = jwt.verify(
      token,
      config.refreshTokenSecret as jwt.Secret,
    ) as DecodedRefreshToken;

    // Validate token structure
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    if (!decoded.jti || !decoded.family) {
      throw new Error('Invalid refresh token structure');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Refresh token validation failed: ${errorMessage}`);
  }
}

// ===================================================================
// 🎯 TOKEN REVOCATION
// ===================================================================

/**
 * Revoke a specific refresh token
 */
export async function revokeToken(
  token: string,
  revokedBy: string,
  tokenTypeHint?: 'access_token' | 'refresh_token',
): Promise<{ success: boolean; revokedCount: number; families: string[] }> {
  try {
    // For stateless tokens, we use global logout mechanism
    if (tokenTypeHint === 'access_token') {
      // Access tokens are stateless, just validate structure
      await validateAccessToken(token);
      return { success: true, revokedCount: 0, families: [] };
    }

    // For refresh tokens, validate and get user info for global logout
    const validation = await tokenRepository.validateRefreshToken(token);
    
    if (!validation.isValid || !validation.payload) {
      throw new Error('Invalid token');
    }

    const { userId, clientId, family } = validation.payload;

    // Perform global logout for this user to invalidate all tokens
    const result = await tokenRepository.revokeAllUserTokens(userId, clientId, revokedBy);

    return {
      success: result.success,
      revokedCount: 1,
      families: [family],
    };
  } catch (error: any) {
    throw new Error(`Failed to revoke token: ${error.message}`);
  }
}

/**
 * Revoke all tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(
  userId: number,
  clientId: number,
  revokedBy: string,
): Promise<{ success: boolean; revokedCount: number; families: string[] }> {
  try {
    const result = await tokenRepository.revokeAllUserTokens(userId, clientId, revokedBy);

    return {
      success: result.success,
      revokedCount: 1, // Stateless - we just mark global logout
      families: [], // Not tracked in stateless approach
    };
  } catch (error: any) {
    throw new Error(`Failed to revoke all user tokens: ${error.message}`);
  }
}

/**
 * Revoke token family (security breach response)
 */
// export async function revokeTokenFamily(
//   family: string,
//   revokedBy: string,
//   reason: string = 'Security breach detected',
// ): Promise<{ success: boolean; revokedCount: number; tokens: string[] }> {
//   try {
//     const result = await tokenRepository.revokeTokenFamily(family, revokedBy);

//     // Get family info for logging
//     const familyInfo = await tokenRepository.getTokenFamilyInfo(family);

//     if (familyInfo) {
//       const securityEvent: SecurityEvent = {
//         type: 'suspicious_activity',
//         userId: familyInfo.userId,
//         clientId: familyInfo.clientId,
//         details: {
//           reason,
//           tokenFamily: family,
//         },
//         timestamp: new Date(),
//         severity: 'high',
//       };

//       await tokenRepository.logSecurityEvent(securityEvent);
//     }

//     return {
//       success: true,
//       revokedCount: result.count,
//       tokens: result.tokens,
//     };
//   } catch (error) {
//     throw new Error(`Failed to revoke token family: ${error}`);
//   }
// }

// ===================================================================
// 🎯 TOKEN UTILITIES
// ===================================================================

/**
 * Extract user ID from token without full validation
 */
export function extractUserIdFromToken(token: string): number | null {
  try {
    // ✅ Try as access token first (most common)
    const decoded = jwt.decode(token) as DecodedAccessToken | DecodedRefreshToken;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (without signature verification)
 */
export function isTokenExpired(token: string): boolean {
  try {
    // ✅ Use DecodedTokenPayload which includes exp from JWT library
    const decoded = jwt.decode(token) as DecodedTokenPayload;
    if (!decoded?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as DecodedTokenPayload;
    if (!decoded?.exp) return null;

    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Get time until token expiration (in seconds)
 */
export function getTimeUntilExpiration(token: string): number | null {
  try {
    // ✅ Use DecodedTokenPayload which includes exp from JWT library
    const decoded = jwt.decode(token) as DecodedTokenPayload;
    if (!decoded?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch {
    return null;
  }
}

// ===================================================================
// 🎯 SECURITY AND MONITORING
// ===================================================================

/**
 * Detect suspicious token activity for a user
 */
export async function detectSuspiciousTokenActivity(
  userId: number,
  clientId: number,
): Promise<SecurityEvent[]> {
  try {
    return await tokenRepository.detectSuspiciousTokenActivity(userId, clientId);
  } catch (error: any) {
    throw new Error(`Failed to detect suspicious activity: ${error.message}`);
  }
}

/**
 * Get active token summary for user
 */
export async function getUserTokenSummary(userId: number, clientId: number) {
  try {
    return await tokenRepository.getActiveTokenSummary(userId, clientId);
  } catch (error: any) {
    throw new Error(`Failed to get user token summary: ${error.message}`);
  }
}

/**
 * Cleanup expired tokens (maintenance function) - Limited in stateless approach
 */
export async function cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
  try {
    // In stateless approach, tokens auto-expire. No cleanup needed.
    return { deletedCount: 0 };
  } catch (error: any) {
    throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
  }
}

/**
 * Get token statistics for monitoring - Limited in stateless approach
 */
export async function getTokenStatistics(clientId?: number) {
  try {
    // In stateless approach, we can't track detailed statistics
    return {
      totalActiveTokens: 0,
      totalTokenFamilies: 0,
      expiredTokens: 0,
      revokedTokens: 0,
      message: 'Statistics not available in stateless token mode',
    };
  } catch (error: any) {
    throw new Error(`Failed to get token statistics: ${error.message}`);
  }
}

// ===================================================================
// 🎯 PASSWORD AND AUTHENTICATION HELPERS
// ===================================================================

/**
 * Verify user password and get verification result
 */
export async function verifyUserPassword(
  userId: number,
  password: string,
): Promise<PasswordVerificationResult> {
  try {
    const isValid = await userRepository.verifyPassword(userId, password);

    // In a real implementation, you might check password policies here
    // For now, return basic verification result
    return {
      isValid,
      mustChange: false, // This would be determined by password age/policy
      // lastChanged: undefined, // Would come from password record
      // expiresAt: undefined,    // Would be calculated based on policy
      // strength: 'medium',      // Would be calculated based on password
    };
  } catch (error) {
    throw new Error(`Failed to verify password: ${error}`);
  }
}

/**
 * Generate secure token for password reset
 */
export function generatePasswordResetToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

/**
 * Generate secure token for email verification
 */
export function generateEmailVerificationToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

// ===================================================================
// 🎯 TOKEN SERVICE HEALTH CHECK
// ===================================================================

/**
 * Health check for token service
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}> {
  try {
    const config = getJWTConfig();

    // Test token generation and validation
    const testPayload = {
      userId: 1,
      clientId: 1,
      userTypeId: 1,
      loginName: 'test',
      roles: ['test'],
      permissions: [],
      type: 'access' as const,
    };

    const testOptions: SignOptions = {
      expiresIn: 60,
      issuer: config.issuer,
      audience: config.audience,
      subject: '1',
    };

    const testToken = jwt.sign(testPayload, config.accessTokenSecret as jwt.Secret, testOptions);

    // Verify the test token
    jwt.verify(testToken, config.accessTokenSecret as jwt.Secret);

    return {
      status: 'healthy',
      details: {
        jwtConfigured: true,
        tokenGenerationWorking: true,
        tokenValidationWorking: true,
        accessTokenExpiry: getAccessTokenExpirySeconds(),
        refreshTokenExpiry: getRefreshTokenExpirySeconds(),
        issuer: config.issuer,
        audience: config.audience,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      status: 'unhealthy',
      details: {
        error: errorMessage,
        jwtConfig: {
          hasAccessSecret: !!getJWTConfig().accessTokenSecret,
          hasRefreshSecret: !!getJWTConfig().refreshTokenSecret,
          accessTokenExpiry: getAccessTokenExpirySeconds(),
          refreshTokenExpiry: getRefreshTokenExpirySeconds(),
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Export the helper function for use elsewhere
export { calculateExpiresInSeconds };
