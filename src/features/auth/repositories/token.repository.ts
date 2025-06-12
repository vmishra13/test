import prismaPostgres from '@db/postgres/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  refresh_token as RefreshToken,
  RefreshTokenCreationData,
  RefreshTokenWithUser,
} from '@features/users/models/user.model';
import { TokenFamilyInfo, ActiveTokenSummary, SecurityEvent } from '../dto/auth.dto';

// ===================================================================
// 🎯 REFRESH TOKEN MANAGEMENT
// ===================================================================

/**
 * Create a new refresh token with family tracking
 */
export async function createRefreshToken(
  tokenData: RefreshTokenCreationData,
): Promise<RefreshToken> {
  try {
    // Hash the token before storing
    const saltRounds = 12;
    const hashedToken = await bcrypt.hash(tokenData.token, saltRounds);

    const refreshToken = await prismaPostgres.refresh_token.create({
      data: {
        userId: tokenData.userId,
        clientId: tokenData.clientId,
        jti: tokenData.jti,
        family: tokenData.family,
        token: hashedToken,
        expiresAt: tokenData.expiresAt,
        isRevoked: tokenData.isRevoked || false,
        crUser: tokenData.crUser,
      },
    });

    return refreshToken as RefreshToken;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('JTI already exists');
    }
    throw new Error(`Failed to create refresh token: ${error}`);
  }
}

/**
 * Find refresh token by JTI for validation
 */
export async function findRefreshTokenByJti(jti: string): Promise<RefreshTokenWithUser | null> {
  try {
    const refreshToken = await prismaPostgres.refresh_token.findUnique({
      where: { jti },
      include: {
        user: {
          select: {
            id: true,
            loginName: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            timeZone: true,
            status: true,
          },
        },
      },
    });

    return refreshToken as RefreshTokenWithUser | null;
  } catch (error) {
    throw new Error(`Failed to find refresh token by JTI: ${error}`);
  }
}

/**
 * Verify refresh token against stored hash
 */
export async function verifyRefreshToken(
  plainToken: string,
  jti: string,
): Promise<{ isValid: boolean; tokenData?: RefreshTokenWithUser }> {
  try {
    const storedToken = await findRefreshTokenByJti(jti);

    if (!storedToken) {
      return { isValid: false };
    }

    // Check if token is revoked or expired
    if (storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      return { isValid: false };
    }

    // Verify the token hash
    const isValidHash = await bcrypt.compare(plainToken, storedToken.token);

    if (!isValidHash) {
      return { isValid: false };
    }

    return { isValid: true, tokenData: storedToken };
  } catch (error) {
    throw new Error(`Failed to verify refresh token: ${error}`);
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(jti: string, modUser: string): Promise<boolean> {
  try {
    const result = await prismaPostgres.refresh_token.updateMany({
      where: {
        jti,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        modUser,
        modDate: new Date(),
      },
    });

    return result.count > 0;
  } catch (error) {
    throw new Error(`Failed to revoke refresh token: ${error}`);
  }
}

/**
 * Revoke all tokens in a family (for token rotation security)
 */
export async function revokeTokenFamily(
  family: string,
  modUser: string,
): Promise<{ count: number; tokens: string[] }> {
  try {
    // Get all tokens in the family first for logging
    const familyTokens = await prismaPostgres.refresh_token.findMany({
      where: {
        family,
        isRevoked: false,
      },
      select: { jti: true },
    });

    // Revoke all tokens in the family
    const result = await prismaPostgres.refresh_token.updateMany({
      where: {
        family,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        modUser,
        modDate: new Date(),
      },
    });

    return {
      count: result.count,
      tokens: familyTokens.map(t => t.jti),
    };
  } catch (error) {
    throw new Error(`Failed to revoke token family: ${error}`);
  }
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export async function revokeAllUserTokens(
  userId: number,
  clientId: number,
  modUser: string,
): Promise<{ count: number; families: string[] }> {
  try {
    // Get all unique families for this user
    const userTokens = await prismaPostgres.refresh_token.findMany({
      where: {
        userId,
        clientId,
        isRevoked: false,
      },
      select: { family: true },
      distinct: ['family'],
    });

    // Revoke all tokens for this user
    const result = await prismaPostgres.refresh_token.updateMany({
      where: {
        userId,
        clientId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        modUser,
        modDate: new Date(),
      },
    });

    return {
      count: result.count,
      families: userTokens.map(t => t.family),
    };
  } catch (error) {
    throw new Error(`Failed to revoke all user tokens: ${error}`);
  }
}

// ===================================================================
// 🎯 TOKEN FAMILY MANAGEMENT
// ===================================================================

/**
 * Generate new token family for rotation
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
 * Get token family information
 */
export async function getTokenFamilyInfo(family: string): Promise<TokenFamilyInfo | null> {
  try {
    const familyTokens = await prismaPostgres.refresh_token.findMany({
      where: { family },
      select: {
        id: true,
        userId: true,
        clientId: true,
        jti: true,
        expiresAt: true,
        isRevoked: true,
        crDate: true,
        modDate: true,
      },
      orderBy: { crDate: 'desc' },
    });

    if (familyTokens.length === 0) {
      return null;
    }

    const activeTokens = familyTokens.filter(t => !t.isRevoked && t.expiresAt > new Date());
    const firstToken = familyTokens[familyTokens.length - 1];
    const lastUsedToken = familyTokens.find(t => t.modDate) || firstToken;

    return {
      family,
      userId: firstToken.userId,
      clientId: firstToken.clientId,
      activeTokenCount: activeTokens.length,
      createdAt: firstToken.crDate || new Date(),
      lastUsedAt: lastUsedToken.modDate || lastUsedToken.crDate || new Date(),
    };
  } catch (error) {
    throw new Error(`Failed to get token family info: ${error}`);
  }
}

/**
 * Get active token summary for a user
 */
export async function getActiveTokenSummary(
  userId: number,
  clientId: number,
): Promise<ActiveTokenSummary> {
  try {
    const activeTokens = await prismaPostgres.refresh_token.findMany({
      where: {
        userId,
        clientId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        family: true,
        crDate: true,
        modDate: true,
      },
    });

    // Group by family
    const familyMap = new Map<string, Date[]>();
    activeTokens.forEach(token => {
      const dates = familyMap.get(token.family) || [];
      dates.push(token.crDate || new Date());
      if (token.modDate) {
        dates.push(token.modDate);
      }
      familyMap.set(token.family, dates);
    });

    // Get family info for each unique family
    const tokenFamilies: TokenFamilyInfo[] = [];
    for (const family of familyMap.keys()) {
      const familyInfo = await getTokenFamilyInfo(family);
      if (familyInfo) {
        tokenFamilies.push(familyInfo);
      }
    }

    const allDates = activeTokens.flatMap(t => [
      t.crDate || new Date(),
      ...(t.modDate ? [t.modDate] : []),
    ]);

    return {
      userId,
      clientId,
      totalActiveTokens: activeTokens.length,
      tokenFamilies,
      oldestTokenDate:
        allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date(),
      newestTokenDate:
        allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date(),
    };
  } catch (error) {
    throw new Error(`Failed to get active token summary: ${error}`);
  }
}

// ===================================================================
// 🎯 TOKEN CLEANUP AND MAINTENANCE
// ===================================================================

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
  try {
    const result = await prismaPostgres.refresh_token.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { deletedCount: result.count };
  } catch (error) {
    throw new Error(`Failed to cleanup expired tokens: ${error}`);
  }
}

/**
 * Clean up old revoked tokens (older than specified days)
 */
export async function cleanupOldRevokedTokens(
  olderThanDays: number = 30,
): Promise<{ deletedCount: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prismaPostgres.refresh_token.deleteMany({
      where: {
        isRevoked: true,
        modDate: { lt: cutoffDate },
      },
    });

    return { deletedCount: result.count };
  } catch (error) {
    throw new Error(`Failed to cleanup old revoked tokens: ${error}`);
  }
}

/**
 * Get token statistics for monitoring
 */
export async function getTokenStatistics(clientId?: number): Promise<any> {
  try {
    const where = clientId ? { clientId } : {};

    const [totalTokens, activeTokens, revokedTokens, expiredTokens, tokensByUser, tokensByFamily] =
      await Promise.all([
        prismaPostgres.refresh_token.count({ where }),
        prismaPostgres.refresh_token.count({
          where: {
            ...where,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
        }),
        prismaPostgres.refresh_token.count({
          where: { ...where, isRevoked: true },
        }),
        prismaPostgres.refresh_token.count({
          where: {
            ...where,
            expiresAt: { lt: new Date() },
          },
        }),
        prismaPostgres.refresh_token.groupBy({
          by: ['userId'],
          where: {
            ...where,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          _count: true,
        }),
        prismaPostgres.refresh_token.groupBy({
          by: ['family'],
          where: {
            ...where,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          _count: true,
        }),
      ]);

    return {
      totalTokens,
      activeTokens,
      revokedTokens,
      expiredTokens,
      userDistribution: tokensByUser.reduce(
        (acc, item) => {
          acc[item.userId] = item._count;
          return acc;
        },
        {} as Record<number, number>,
      ),
      familyDistribution: tokensByFamily.reduce(
        (acc, item) => {
          acc[item.family] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      utilizationRate: totalTokens > 0 ? (activeTokens / totalTokens) * 100 : 0,
    };
  } catch (error) {
    throw new Error(`Failed to get token statistics: ${error}`);
  }
}

// ===================================================================
// 🎯 SECURITY AND MONITORING
// ===================================================================

/**
 * Detect suspicious token activity
 */
export async function detectSuspiciousActivity(
  userId: number,
  clientId: number,
): Promise<SecurityEvent[]> {
  try {
    const events: SecurityEvent[] = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for multiple token families (possible device hijacking)
    const activeFamilies = await prismaPostgres.refresh_token.findMany({
      where: {
        userId,
        clientId,
        isRevoked: false,
        expiresAt: { gt: now },
        crDate: { gte: last24Hours },
      },
      select: { family: true },
      distinct: ['family'],
    });

    if (activeFamilies.length > 5) {
      events.push({
        type: 'suspicious_activity',
        userId,
        clientId,
        details: {
          reason: 'Multiple token families detected',
          tokenFamily: `${activeFamilies.length} families`,
        },
        timestamp: now,
        severity: 'medium',
      });
    }

    // Check for rapid token creation (possible brute force)
    const recentTokens = await prismaPostgres.refresh_token.count({
      where: {
        userId,
        clientId,
        crDate: { gte: new Date(now.getTime() - 5 * 60 * 1000) }, // Last 5 minutes
      },
    });

    if (recentTokens > 10) {
      events.push({
        type: 'suspicious_activity',
        userId,
        clientId,
        details: {
          reason: 'Rapid token creation detected',
          tokenFamily: `${recentTokens} tokens in 5 minutes`,
        },
        timestamp: now,
        severity: 'high',
      });
    }

    return events;
  } catch (error) {
    throw new Error(`Failed to detect suspicious activity: ${error}`);
  }
}

/**
 * Log security event (for audit trail)
 */
export async function logSecurityEvent(
  event: SecurityEvent,
  additionalDetails?: Record<string, any>,
): Promise<void> {
  try {
    // In a real implementation, you might log to a separate audit table
    // For now, we'll just console.log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', {
        ...event,
        additionalDetails,
      });
    }

    // Here you could:
    // 1. Log to MongoDB audit collection
    // 2. Send to external monitoring service
    // 3. Store in PostgreSQL audit table
    // 4. Send alerts for high severity events
  } catch (error) {
    // Don't throw errors for logging failures
    console.error('Failed to log security event:', error);
  }
}

/**
 * Check if token family should be rotated
 */
export async function shouldRotateTokenFamily(family: string): Promise<boolean> {
  try {
    const familyTokens = await prismaPostgres.refresh_token.findMany({
      where: { family },
      select: {
        crDate: true,
        modDate: true,
        isRevoked: true,
      },
    });

    if (familyTokens.length === 0) return false;

    // Rotate if family has more than 10 tokens
    if (familyTokens.length > 10) return true;

    // Rotate if family is older than 30 days
    const oldestToken = familyTokens[0];
    const familyAge = new Date().getTime() - (oldestToken.crDate?.getTime() || 0);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (familyAge > thirtyDaysMs) return true;

    // Rotate if there are any revoked tokens in the family
    const hasRevokedTokens = familyTokens.some(t => t.isRevoked);
    if (hasRevokedTokens) return true;

    return false;
  } catch (error) {
    throw new Error(`Failed to check token family rotation: ${error}`);
  }
}

/**
 * Find tokens by user and client (for admin operations)
 */
export async function findTokensByUser(
  userId: number,
  clientId: number,
  includeRevoked: boolean = false,
): Promise<RefreshToken[]> {
  try {
    const where: any = { userId, clientId };

    if (!includeRevoked) {
      where.isRevoked = false;
      where.expiresAt = { gt: new Date() };
    }

    const tokens = await prismaPostgres.refresh_token.findMany({
      where,
      orderBy: { crDate: 'desc' },
    });

    return tokens as RefreshToken[];
  } catch (error) {
    throw new Error(`Failed to find tokens by user: ${error}`);
  }
}

/**
 * Get token usage analytics
 */
export async function getTokenUsageAnalytics(
  userId: number,
  clientId: number,
  days: number = 30,
): Promise<any> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tokens = await prismaPostgres.refresh_token.findMany({
      where: {
        userId,
        clientId,
        crDate: { gte: startDate },
      },
      select: {
        crDate: true,
        modDate: true,
        isRevoked: true,
        expiresAt: true,
      },
      orderBy: { crDate: 'desc' },
    });

    const dailyUsage = new Map<string, number>();
    tokens.forEach(token => {
      const day = (token.crDate || new Date()).toISOString().split('T')[0];
      dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1);
    });

    return {
      totalTokens: tokens.length,
      activeTokens: tokens.filter(t => !t.isRevoked && t.expiresAt > new Date()).length,
      revokedTokens: tokens.filter(t => t.isRevoked).length,
      expiredTokens: tokens.filter(t => t.expiresAt <= new Date()).length,
      dailyUsage: Object.fromEntries(dailyUsage),
      averageTokensPerDay: tokens.length / days,
    };
  } catch (error) {
    throw new Error(`Failed to get token usage analytics: ${error}`);
  }
}
