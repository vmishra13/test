import { prismaPostgres } from '@/db/postgres/client'; // ✅ Fixed import
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  TokenFamilyInfo,
  ActiveTokenSummary,
  SecurityEvent,
  RefreshTokenPayload,
  TokenRotationResult
} from '../dto/auth.dto';

// ===================================================================
// 🎯 STATELESS JWT TOKEN MANAGEMENT (NO DATABASE STORAGE)
// ===================================================================

/**
 * Generate refresh token family ID
 */
export function generateTokenFamily(): string {
  return uuidv4();
}

/**
 * Generate unique JTI for token
 */
export function generateJti(): string {
  return uuidv4();
}

/**
 * Create refresh token (stateless JWT - not stored in DB)
 */
export function createRefreshToken(payload: RefreshTokenPayload): string {
  try {
    const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_TOKEN_SECRET not configured');
    }

    const tokenPayload = {
      sub: payload.userId.toString(),
      clientId: payload.clientId,
      jti: payload.jti,
      family: payload.family,
      type: 'refresh',
    };

    // Calculate expiration as a positive number of seconds and convert to string
    const expiresInSeconds = Math.max(1, Math.floor((payload.expiresAt.getTime() - Date.now()) / 1000));
    
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: expiresInSeconds, // Use number directly instead of string
    };

    return jwt.sign(tokenPayload, secret, options);
  } catch (error: any) {
    throw new Error(`Failed to create refresh token: ${error.message}`);
  }
}

/**
 * Create access token (stateless JWT)
 */
export function createAccessToken(
  userId: number,
  clientId: number,
  roles: string[],
  expiresInSeconds: number = 15 * 60 // 15 minutes by default
): string {
  try {
    const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET not configured');
    }

    const tokenPayload = {
      sub: userId.toString(),
      clientId,
      roles,
      jti: generateJti(),
      type: 'access',
    };

    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: expiresInSeconds,
    };

    return jwt.sign(tokenPayload, secret, options);
  } catch (error: any) {
    throw new Error(`Failed to create access token: ${error.message}`);
  }
}

/**
 * Verify and decode refresh token (stateless)
 */
export function verifyRefreshToken(token: string): {
  isValid: boolean;
  payload?: RefreshTokenPayload;
  error?: string;
} {
  try {
    const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!secret) {
      return { isValid: false, error: 'JWT secret not configured' };
    }

    const decoded = jwt.verify(token, secret) as any;

    // Validate token structure
    if (decoded.type !== 'refresh') {
      return { isValid: false, error: 'Invalid token type' };
    }

    const payload: RefreshTokenPayload = {
      userId: parseInt(decoded.sub),
      clientId: decoded.clientId,
      jti: decoded.jti,
      family: decoded.family,
      expiresAt: new Date(decoded.exp * 1000),
      issuedAt: new Date(decoded.iat * 1000),
    };

    return { isValid: true, payload };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { isValid: false, error: 'Token expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { isValid: false, error: 'Invalid token signature' };
    }
    return { isValid: false, error: `Token verification failed: ${error.message}` };
  }
}

/**
 * Verify access token (stateless)
 */
export function verifyAccessToken(token: string): {
  isValid: boolean;
  payload?: {
    userId: number;
    clientId: number;
    roles: string[];
    jti: string;
    exp: number;
    iat: number;
  };
  error?: string;
} {
  try {
    const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
    if (!secret) {
      return { isValid: false, error: 'JWT secret not configured' };
    }

    const decoded = jwt.verify(token, secret) as any;

    if (decoded.type !== 'access') {
      return { isValid: false, error: 'Invalid token type' };
    }

    const payload = {
      userId: parseInt(decoded.sub),
      clientId: decoded.clientId,
      roles: decoded.roles || [],
      jti: decoded.jti,
      exp: decoded.exp,
      iat: decoded.iat,
    };

    return { isValid: true, payload };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { isValid: false, error: 'Token expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { isValid: false, error: 'Invalid token signature' };
    }
    return { isValid: false, error: `Token verification failed: ${error.message}` };
  }
}

// ===================================================================
// 🎯 BLACKLIST MANAGEMENT (Using existing tables for metadata only)
// ===================================================================

/**
 * Use user table to track suspicious activity or security events
 * Since we don't have refresh_token table, we'll use user audit fields
 */
export async function logSecurityEvent(
  userId: number,
  clientId: number,
  eventType: 'token_rotation' | 'suspicious_activity' | 'logout_all',
  details: Record<string, any>,
  modUser: string
): Promise<void> {
  try {
    // Update user's modDate to track last security event
    await prismaPostgres.user.update({
      where: { id: userId },
      data: {
        modUser,
        modDate: new Date(),
        // We could store security events in extraInfo JSON field
        extraInfo: {
          lastSecurityEvent: {
            type: eventType,
            timestamp: new Date().toISOString(),
            details,
          },
        },
      },
    });
  } catch (error: any) {
    // Don't throw on logging failures
    console.error('Failed to log security event:', error);
  }
}

/**
 * Check user for security flags
 */
export async function getUserSecurityInfo(userId: number): Promise<{
  hasSecurityFlags: boolean;
  lastSecurityEvent?: any;
  suspiciousActivity?: boolean;
}> {
  try {
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      select: {
        extraInfo: true,
        modDate: true,
      },
    });

    if (!user) {
      return { hasSecurityFlags: false };
    }

    const extraInfo = user.extraInfo as any;
    const lastSecurityEvent = extraInfo?.lastSecurityEvent;

    // Check if there was recent suspicious activity (last 24 hours)
    const suspiciousActivity = lastSecurityEvent &&
      lastSecurityEvent.type === 'suspicious_activity' &&
      new Date(lastSecurityEvent.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    return {
      hasSecurityFlags: !!lastSecurityEvent,
      lastSecurityEvent,
      suspiciousActivity: !!suspiciousActivity,
    };
  } catch (error: any) {
    throw new Error(`Failed to get user security info: ${error.message}`);
  }
}

// ===================================================================
// 🎯 TOKEN ROTATION (Stateless with User Audit Trail)
// ===================================================================

/**
 * Rotate refresh token (pure stateless - just validate old and create new)
 */
export async function rotateRefreshToken(
  oldToken: string,
  newTokenData: RefreshTokenPayload,
  rotatedBy: string,
): Promise<TokenRotationResult> {
  try {
    // 1. Verify old token
    const verification = verifyRefreshToken(oldToken);
    if (!verification.isValid || !verification.payload) {
      throw new Error(`Invalid token for rotation: ${verification.error}`);
    }

    const oldPayload = verification.payload;

    // 2. Check for suspicious activity
    const securityInfo = await getUserSecurityInfo(oldPayload.userId);
    if (securityInfo.suspiciousActivity) {
      throw new Error('Token rotation rejected: suspicious activity detected');
    }

    // 3. Log rotation event
    await logSecurityEvent(
      oldPayload.userId,
      oldPayload.clientId,
      'token_rotation',
      {
        oldJti: oldPayload.jti,
        newJti: newTokenData.jti,
        family: oldPayload.family,
      },
      rotatedBy
    );

    // 4. Create new token (stateless)
    const newToken = createRefreshToken(newTokenData);

    return {
      newToken,
      newJti: newTokenData.jti,
      family: newTokenData.family,
      expiresAt: newTokenData.expiresAt,
      rotatedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Failed to rotate refresh token: ${error.message}`);
  }
}

/**
 * Invalidate all user sessions (logout all devices)
 * Since we're stateless, we update user info to track forced logout
 */
export async function revokeAllUserTokens(
  userId: number,
  clientId: number,
  revokedBy: string,
): Promise<{ success: boolean; timestamp: Date }> {
  try {
    const timestamp = new Date();

    // Update user with logout timestamp - all tokens issued before this are invalid
    await prismaPostgres.user.update({
      where: { id: userId },
      data: {
        modUser: revokedBy,
        modDate: timestamp,
        extraInfo: {
          globalLogout: {
            timestamp: timestamp.toISOString(),
            revokedBy,
            reason: 'logout_all_devices',
          },
        },
      },
    });

    // Log security event
    await logSecurityEvent(
      userId,
      clientId,
      'logout_all',
      { timestamp: timestamp.toISOString() },
      revokedBy
    );

    return { success: true, timestamp };
  } catch (error: any) {
    throw new Error(`Failed to revoke all user tokens: ${error.message}`);
  }
}

/**
 * Check if user has been globally logged out
 */
export async function isUserGloballyLoggedOut(
  userId: number,
  tokenIssuedAt: Date
): Promise<boolean> {
  try {
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      select: { extraInfo: true },
    });

    if (!user) return true; // User not found, consider logged out

    const extraInfo = user.extraInfo as any;
    const globalLogout = extraInfo?.globalLogout;

    if (!globalLogout?.timestamp) return false;

    const logoutTimestamp = new Date(globalLogout.timestamp);
    return tokenIssuedAt < logoutTimestamp;
  } catch (error: any) {
    // On error, be safe and consider logged out
    return true;
  }
}

// ===================================================================
// 🎯 TOKEN VALIDATION (Comprehensive Security Checks)
// ===================================================================

/**
 * Comprehensive token validation (includes all security checks)
 */
export async function validateRefreshToken(token: string): Promise<{
  isValid: boolean;
  payload?: RefreshTokenPayload;
  error?: string;
  securityFlags?: string[];
}> {
  try {
    // 1. Verify JWT signature and structure
    const verification = verifyRefreshToken(token);
    if (!verification.isValid || !verification.payload) {
      return { isValid: false, error: verification.error };
    }

    const payload = verification.payload;
    const securityFlags: string[] = [];

    // 2. Check if user exists and is active
    const user = await prismaPostgres.user.findUnique({
      where: { id: payload.userId },
      select: { 
        status: true, 
        clientId: true,
        extraInfo: true 
      },
    });

    if (!user) {
      return { isValid: false, error: 'User not found' };
    }

    if (user.status === -99) {
      return { isValid: false, error: 'User account disabled' };
    }

    if (user.clientId !== payload.clientId) {
      securityFlags.push('client_mismatch');
      return { isValid: false, error: 'Client mismatch', securityFlags };
    }

    // 3. Check global logout
    const isGloballyLoggedOut = await isUserGloballyLoggedOut(
      payload.userId, 
      payload.issuedAt
    );
    
    if (isGloballyLoggedOut) {
      securityFlags.push('globally_logged_out');
      return { isValid: false, error: 'Session invalidated', securityFlags };
    }

    // 4. Check for suspicious activity
    const securityInfo = await getUserSecurityInfo(payload.userId);
    if (securityInfo.suspiciousActivity) {
      securityFlags.push('suspicious_activity');
      // Don't reject, but flag for monitoring
    }

    return {
      isValid: true,
      payload,
      securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
    };
  } catch (error: any) {
    return { isValid: false, error: `Token validation failed: ${error.message}` };
  }
}

/**
 * Validate access token with user status check
 */
export async function validateAccessToken(token: string): Promise<{
  isValid: boolean;
  payload?: {
    userId: number;
    clientId: number;
    roles: string[];
    jti: string;
  };
  error?: string;
}> {
  try {
    // 1. Verify JWT
    const verification = verifyAccessToken(token);
    if (!verification.isValid || !verification.payload) {
      return { isValid: false, error: verification.error };
    }

    const { userId, clientId, roles, jti } = verification.payload;

    // 2. Check if user is still active
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      select: { 
        status: true, 
        clientId: true 
      },
    });

    if (!user) {
      return { isValid: false, error: 'User not found' };
    }

    if (user.status === -99) {
      return { isValid: false, error: 'User account disabled' };
    }

    if (user.clientId !== clientId) {
      return { isValid: false, error: 'Client mismatch' };
    }

    // 3. Check global logout
    const tokenIssuedAt = new Date(verification.payload.iat * 1000);
    const isGloballyLoggedOut = await isUserGloballyLoggedOut(userId, tokenIssuedAt);
    
    if (isGloballyLoggedOut) {
      return { isValid: false, error: 'Session invalidated' };
    }

    return {
      isValid: true,
      payload: { userId, clientId, roles, jti },
    };
  } catch (error: any) {
    return { isValid: false, error: `Access token validation failed: ${error.message}` };
  }
}

// ===================================================================
// 🎯 MONITORING & ANALYTICS (Using User Data)
// ===================================================================

/**
 * Get token family information (simulated from user data)
 */
export async function getTokenFamilyInfo(family: string): Promise<TokenFamilyInfo | null> {
  // Since we're stateless, we can't track family info without database
  // This would need to be implemented differently or removed
  return null;
}

/**
 * Get active token summary (simulated)
 */
export async function getActiveTokenSummary(
  userId: number,
  clientId: number,
): Promise<ActiveTokenSummary> {
  try {
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      select: {
        crDate: true,
        modDate: true,
        extraInfo: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Simulate token info from user data
    return {
      userId,
      clientId,
      totalActiveTokens: 1, // Can't track without database
      tokenFamilies: [],
      oldestTokenDate: user.crDate,
      newestTokenDate: user.modDate || user.crDate,
    };
  } catch (error: any) {
    throw new Error(`Failed to get active token summary: ${error.message}`);
  }
}

/**
 * Detect suspicious token activity (based on user access patterns)
 */
export async function detectSuspiciousTokenActivity(
  userId: number,
  clientId: number,
): Promise<SecurityEvent[]> {
  try {
    const events: SecurityEvent[] = [];
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      select: { extraInfo: true },
    });

    if (!user) return events;

    const extraInfo = user.extraInfo as any;
    const lastSecurityEvent = extraInfo?.lastSecurityEvent;

    // Check for recent security events
    if (lastSecurityEvent && lastSecurityEvent.type === 'suspicious_activity') {
      const eventTime = new Date(lastSecurityEvent.timestamp);
      const isRecent = eventTime > new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (isRecent) {
        events.push({
          type: 'suspicious_activity',
          userId,
          clientId,
          details: lastSecurityEvent.details,
          timestamp: eventTime,
          severity: 'medium',
        });
      }
    }

    return events;
  } catch (error: any) {
    throw new Error(`Failed to detect suspicious activity: ${error.message}`);
  }
}

// ===================================================================
// 🔒 PASSWORD RESET TOKEN MANAGEMENT (IN-MEMORY STORAGE)
// ===================================================================

// In-memory storage for password reset tokens
// TODO: Replace with persistent storage (database table) in production
interface PasswordResetToken {
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

const passwordResetTokens = new Map<string, PasswordResetToken>();

/**
 * Store password reset token in memory
 */
export async function storePasswordResetToken(
  userId: number, 
  token: string, 
  expiresAt: Date
): Promise<void> {
  try {
    // Clean up expired tokens
    cleanupExpiredTokens();
    
    passwordResetTokens.set(token, {
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      used: false
    });
  } catch (error) {
    console.error('Failed to store password reset token:', error);
    throw new Error('Failed to store password reset token');
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  userId: number;
  expiresAt: Date;
} | null> {
  try {
    const resetToken = passwordResetTokens.get(token);

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt
    };
  } catch (error) {
    console.error('Failed to verify password reset token:', error);
    return null;
  }
}

/**
 * Invalidate password reset token
 */
export async function invalidatePasswordResetToken(token: string): Promise<void> {
  try {
    const resetToken = passwordResetTokens.get(token);
    if (resetToken) {
      resetToken.used = true;
      passwordResetTokens.set(token, resetToken);
    }
  } catch (error) {
    console.error('Failed to invalidate password reset token:', error);
    throw new Error('Failed to invalidate password reset token');
  }
}

/**
 * Invalidate all user tokens (for security after password reset)
 */
export async function invalidateAllUserTokens(userId: number): Promise<void> {
  try {
    // Mark all password reset tokens as used for this user
    for (const [token, tokenData] of passwordResetTokens.entries()) {
      if (tokenData.userId === userId && !tokenData.used) {
        tokenData.used = true;
        passwordResetTokens.set(token, tokenData);
      }
    }
    
    // Note: For stateless JWT tokens, we can't invalidate them in the DB
    // In a production system, you might want to maintain a blacklist
    // or use shorter token expiration times
    console.log(`Invalidated password reset tokens for user ${userId}`);
  } catch (error) {
    console.error('Failed to invalidate user tokens:', error);
    throw new Error('Failed to invalidate user tokens');
  }
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, tokenData] of passwordResetTokens.entries()) {
    if (tokenData.expiresAt < now) {
      passwordResetTokens.delete(token);
    }
  }
}

/**
 * Extract token payload without verification (for debugging)
 */
export function decodeTokenUnsafe(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}

/**
 * Get token TTL in seconds
 */
export function getTokenTTL(token: string): number {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.exp) return 0;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, ttl);
  } catch (error) {
    return 0;
  }
}

/**
 * Create token pair (access + refresh)
 */
export async function createTokenPair(
  userId: number,
  clientId: number,
  roles: string[],
  refreshExpiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  tokenFamily: string;
}> {
  try {
    const family = generateTokenFamily();
    const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn);
    
    const refreshToken = createRefreshToken({
      userId,
      clientId,
      jti: generateJti(),
      family,
      expiresAt: refreshExpiresAt,
      issuedAt: new Date(),
    });

    const accessToken = createAccessToken(userId, clientId, roles);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: refreshExpiresIn / 1000, // Convert to seconds
      tokenFamily: family,
    };
  } catch (error: any) {
    throw new Error(`Failed to create token pair: ${error.message}`);
  }
}
