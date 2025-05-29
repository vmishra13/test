import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '@config/env';
import { User } from '../models/user.model';
import ms from 'ms';
import { StringValue } from '@shared/types';

interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

interface RefreshTokenPayload extends TokenPayload {
  jti: string; // JWT ID - unique identifier for the token
  family: string; // Family ID to track token lineage
}

// In-memory storage for refresh tokens
// In production, this would be a database table
const refreshTokens = new Map<
  string,
  {
    token: string;
    userId: string;
    family: string;
    expiresAt: Date;
  }
>();

/**
 * Generate an access token for a user
 */
export const generateAccessToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const secret: jwt.Secret = ENV.jwt.accessTokenSecret;
  const expiresInSeconds = ms(ENV.jwt.accessTokenExpiresIn) / 1000;

  const options: SignOptions = {
    expiresIn: expiresInSeconds,
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Calculate expiration time from JWT expiration string
 */
export const calculateExpiresIn = (expiresIn: string): number => {
  return ms(expiresIn as StringValue) / 1000; // Convert to seconds
};

/**
 * Generate a refresh token for a user
 * @param user User object
 * @param family Optional family ID for token rotation
 */
export const generateRefreshToken = (user: User, family?: string): string => {
  // Generate a new JWT ID for this token
  const jti = uuidv4();

  // Generate a new family ID or use the provided one
  const tokenFamily = family || uuidv4();

  const payload: RefreshTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    jti,
    family: tokenFamily,
  };

  const secret: jwt.Secret = ENV.jwt.refreshTokenSecret;
  const expiresInMs = ms(ENV.jwt.refreshTokenExpiresIn as StringValue);
  const expiresAt = new Date(Date.now() + expiresInMs);

  const options: SignOptions = {
    expiresIn: expiresInMs / 1000,
  };

  const token = jwt.sign(payload, secret, options);

  // Store refresh token
  refreshTokens.set(jti, {
    token,
    userId: user.id,
    family: tokenFamily,
    expiresAt,
  });

  return token;
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, ENV.jwt.accessTokenSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, ENV.jwt.refreshTokenSecret) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Find a refresh token by JWT ID
 */
export const findRefreshToken = (jti: string) => {
  return refreshTokens.get(jti);
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = (jti: string): boolean => {
  return refreshTokens.delete(jti);
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = (userId: string): void => {
  // Find and delete all tokens belonging to this user
  for (const [jti, tokenData] of refreshTokens.entries()) {
    if (tokenData.userId === userId) {
      refreshTokens.delete(jti);
    }
  }
};

/**
 * Revoke all refresh tokens in a family
 */
export const revokeTokenFamily = (family: string): void => {
  // Find and delete all tokens in this family
  for (const [jti, tokenData] of refreshTokens.entries()) {
    if (tokenData.family === family) {
      refreshTokens.delete(jti);
    }
  }
};

// Export as a group for convenience
export const tokenService = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeTokenFamily,
  calculateExpiresIn,
};
