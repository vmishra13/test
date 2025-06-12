import jwt, { SignOptions } from 'jsonwebtoken';
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
  RefreshTokenCreateInput,
} from '@features/users/validators/user.validators';
import * as tokenRepository from '../repositories/token.repository';
import * as userRepository from '@features/users/repositories/user.repository';

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
    const config = getJWTConfig();

    // Calculate expiry times
    const accessTokenExpirySeconds = getAccessTokenExpirySeconds();
    const refreshTokenExpirySeconds = getRefreshTokenExpirySeconds();

    // Generate token family and JTI for token rotation
    const tokenFamily = tokenRepository.generateTokenFamily();
    const jti = tokenRepository.generateJti();

    // Extract user roles
    const roles = user.userRole?.map(ur => ur.role.name) || [];

    // Generate Access Token
    const accessTokenPayload: AccessTokenClaims = {
      userId: user.id,
      clientId: user.clientId,
      userTypeId: user.userTypeId,
      loginName: user.loginName,
      roles,
      permissions: [],
      type: 'access',
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: accessTokenExpirySeconds,
      issuer: config.issuer,
      audience: config.audience,
      subject: user.id.toString(),
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      config.accessTokenSecret as jwt.Secret,
      accessTokenOptions,
    );

    // Generate Refresh Token
    const refreshTokenPayload: RefreshTokenClaims = {
      userId: user.id,
      clientId: user.clientId,
      type: 'refresh',
      family: tokenFamily,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: refreshTokenExpirySeconds,
      issuer: config.issuer,
      audience: config.audience,
      subject: user.id.toString(),
      jwtid: jti,
    };

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      config.refreshTokenSecret as jwt.Secret,
      refreshTokenOptions,
    );

    // Calculate expiration timestamp for database storage
    const now = Math.floor(Date.now() / 1000);

    // Store refresh token in database
    const refreshTokenData: RefreshTokenCreateInput = {
      userId: user.id,
      clientId: user.clientId,
      jti,
      family: tokenFamily,
      token: refreshToken,
      expiresAt: new Date((now + refreshTokenExpirySeconds) * 1000),
      isRevoked: false,
      crUser: user.loginName,
    };

    await tokenRepository.createRefreshToken(refreshTokenData);

    // Log security event
    const securityEvent: SecurityEvent = {
      type: 'login',
      userId: user.id,
      clientId: user.clientId,
      details: {
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        tokenFamily,
      },
      timestamp: new Date(),
      severity: 'low',
    };

    await tokenRepository.logSecurityEvent(securityEvent);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpirySeconds,
      refreshExpiresIn: refreshTokenExpirySeconds,
    };
  } catch (error) {
    throw new Error(`Failed to generate token pair: ${error}`);
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
    const config = getJWTConfig();

    const decoded = jwt.decode(refreshToken) as DecodedRefreshToken;
    if (!decoded?.jti) {
      throw new Error('Invalid refresh token format');
    }

    // Verify refresh token against database
    const { isValid, tokenData } = await tokenRepository.verifyRefreshToken(
      refreshToken,
      decoded.jti,
    );

    if (!isValid || !tokenData) {
      throw new Error('Invalid or expired refresh token');
    }

    // Verify JWT signature
    try {
      jwt.verify(refreshToken, config.refreshTokenSecret);
    } catch (jwtError) {
      // Revoke the token family for security
      await tokenRepository.revokeTokenFamily(decoded.family, 'system');
      throw new Error('Invalid refresh token signature');
    }

    // Get fresh user data for new tokens
    const user = await userRepository.findUserById(tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is still active
    if (user.status === -99 || user.status === 0) {
      await tokenRepository.revokeTokenFamily(decoded.family, 'system');
      throw new Error('User account is inactive');
    }

    // Revoke the used refresh token
    await tokenRepository.revokeRefreshToken(decoded.jti, user.loginName);

    // Check if token family should be rotated
    const shouldRotate = await tokenRepository.shouldRotateTokenFamily(decoded.family);
    const tokenFamily = shouldRotate ? tokenRepository.generateTokenFamily() : decoded.family;

    if (shouldRotate) {
      await tokenRepository.revokeTokenFamily(decoded.family, user.loginName);
    }

    // Generate new token pair
    const newJti = tokenRepository.generateJti();

    // Calculate expiry times
    const accessTokenExpirySeconds = getAccessTokenExpirySeconds();
    const refreshTokenExpirySeconds = getRefreshTokenExpirySeconds();

    // Extract user roles
    const roles = user.userRole?.map(ur => ur.role.name) || [];

    // Generate new Access Token
    const accessTokenPayload: AccessTokenClaims = {
      userId: user.id,
      clientId: user.clientId,
      userTypeId: user.userTypeId,
      loginName: user.loginName,
      roles,
      permissions: [],
      type: 'access',
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: accessTokenExpirySeconds,
      issuer: config.issuer,
      audience: config.audience,
      subject: user.id.toString(),
    };

    const newAccessToken = jwt.sign(
      accessTokenPayload,
      config.accessTokenSecret as jwt.Secret,
      accessTokenOptions,
    );

    // Generate new Refresh Token
    const refreshTokenPayload: RefreshTokenClaims = {
      userId: user.id,
      clientId: user.clientId,
      type: 'refresh',
      family: tokenFamily,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: refreshTokenExpirySeconds,
      issuer: config.issuer,
      audience: config.audience,
      subject: user.id.toString(),
      jwtid: newJti,
    };

    const newRefreshToken = jwt.sign(
      refreshTokenPayload,
      config.refreshTokenSecret as jwt.Secret,
      refreshTokenOptions,
    );

    // Calculate expiration for database
    const now = Math.floor(Date.now() / 1000);

    // Store new refresh token
    const newRefreshTokenData: RefreshTokenCreateInput = {
      userId: user.id,
      clientId: user.clientId,
      jti: newJti,
      family: tokenFamily,
      token: newRefreshToken,
      expiresAt: new Date((now + refreshTokenExpirySeconds) * 1000),
      isRevoked: false,
      crUser: user.loginName,
    };

    await tokenRepository.createRefreshToken(newRefreshTokenData);

    // Log security event
    const securityEvent: SecurityEvent = {
      type: 'token_refresh',
      userId: user.id,
      clientId: user.clientId,
      details: {
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        tokenFamily,
      },
      timestamp: new Date(),
      severity: 'low',
    };

    await tokenRepository.logSecurityEvent(securityEvent);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: accessTokenExpirySeconds,
      refreshExpiresIn: refreshTokenExpirySeconds,
    };
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error}`);
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
    const config = getJWTConfig();

    const decoded = jwt.verify(token, config.accessTokenSecret as jwt.Secret) as DecodedAccessToken;

    // Validate token structure
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    // Ensure user still exists and is active
    const user = await userRepository.findUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === -99 || user.status === 0) {
      throw new Error('User account is inactive');
    }

    // Return authenticated user context
    return {
      userId: decoded.userId,
      clientId: decoded.clientId,
      userTypeId: decoded.userTypeId,
      loginName: decoded.loginName,
      roles: decoded.roles,
      permissions: decoded.permissions || [],
      tokenType: 'access',
      tokenExp: decoded.exp,
      tokenIat: decoded.iat,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error(`Token validation failed: ${error}`);
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
    // Try to decode as refresh token first
    let isRefreshToken = false;
    let decoded: DecodedRefreshToken | null = null;

    try {
      decoded = validateRefreshTokenStructure(token);
      isRefreshToken = true;
    } catch {
      // Not a valid refresh token, might be access token
      if (tokenTypeHint === 'access_token') {
        // Access tokens are stateless, just validate structure
        await validateAccessToken(token);
        return { success: true, revokedCount: 0, families: [] };
      }
    }

    if (!isRefreshToken || !decoded) {
      throw new Error('Invalid token or unsupported token type');
    }

    // Revoke the specific refresh token
    const revoked = await tokenRepository.revokeRefreshToken(decoded.jti, revokedBy);

    if (!revoked) {
      throw new Error('Token not found or already revoked');
    }

    // Log security event
    const securityEvent: SecurityEvent = {
      type: 'token_revoke',
      userId: decoded.userId,
      clientId: decoded.clientId,
      details: {
        tokenFamily: decoded.family,
        reason: 'Manual revocation',
      },
      timestamp: new Date(),
      severity: 'medium',
    };

    await tokenRepository.logSecurityEvent(securityEvent);

    return {
      success: true,
      revokedCount: 1,
      families: [decoded.family],
    };
  } catch (error) {
    throw new Error(`Failed to revoke token: ${error}`);
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

    // Log security event
    const securityEvent: SecurityEvent = {
      type: 'logout',
      userId,
      clientId,
      details: {
        reason: 'Logout from all devices',
      },
      timestamp: new Date(),
      severity: 'low',
    };

    await tokenRepository.logSecurityEvent(securityEvent);

    return {
      success: true,
      revokedCount: result.count,
      families: result.families,
    };
  } catch (error) {
    throw new Error(`Failed to revoke all user tokens: ${error}`);
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
    return await tokenRepository.detectSuspiciousActivity(userId, clientId);
  } catch (error) {
    throw new Error(`Failed to detect suspicious activity: ${error}`);
  }
}

/**
 * Get active token summary for user
 */
export async function getUserTokenSummary(userId: number, clientId: number) {
  try {
    return await tokenRepository.getActiveTokenSummary(userId, clientId);
  } catch (error) {
    throw new Error(`Failed to get user token summary: ${error}`);
  }
}

/**
 * Cleanup expired tokens (maintenance function)
 */
export async function cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
  try {
    return await tokenRepository.cleanupExpiredTokens();
  } catch (error) {
    throw new Error(`Failed to cleanup expired tokens: ${error}`);
  }
}

/**
 * Get token statistics for monitoring
 */
export async function getTokenStatistics(clientId?: number) {
  try {
    return await tokenRepository.getTokenStatistics(clientId);
  } catch (error) {
    throw new Error(`Failed to get token statistics: ${error}`);
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
