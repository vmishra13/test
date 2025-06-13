// ===================================================================
// 🎯 AUTHENTICATION DTOs (Pure authentication types only)
// ===================================================================

import type { CoreRole } from '@/shared/constants';

// Token-related DTOs
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface AccessTokenClaims {
  userId: number;
  clientId: number;
  userTypeId: number;
  loginName: string;
  roles: CoreRole[];
  permissions?: string[];
  type: 'access';
}

export interface RefreshTokenClaims {
  userId: number;
  clientId: number;
  type: 'refresh';
  family: string;
}

export interface TokenPayload {
  iss?: string; // Issuer
  aud?: string; // Audience
  sub?: string; // Subject
  jti?: string; // JWT ID
}

// Login-related DTOs
export interface LoginRequest {
  username: string;
  password: string;
  clientId?: number;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: PublicUserData;
    tokens: TokenPair;
    permissions?: string[];
  };
  message: string;
  timestamp: string;
}

export interface PublicUserData {
  id: number;
  loginName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  timeZone?: string;
  profilePicture?: string;
  client: {
    id: number;
    name: string;
    timeZone?: string;
  };
  userType: {
    id: number;
    name: string;
    description?: string;
  };
  roles: CoreRole[];
}

// Token Refresh DTOs
export interface RefreshTokenRequest {
  refresh_token: string; // Use OAuth 2.0 standard naming
  client_id?: string;
  scope?: string;
  grant_type?: 'refresh_token';
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    tokens: TokenPair;
    user?: PublicUserData;
  };
  message: string;
  timestamp: string;
}

// Token Revocation DTOs
export interface RevokeTokenRequest {
  token: string;
  tokenTypeHint?: 'access_token' | 'refresh_token';
  clientId?: string;
}

export interface RevokeTokenResponse {
  success: boolean;
  data: {
    revokedTokens: {
      refreshToken: boolean;
      tokenFamily: boolean;
      count: number;
    };
  };
  message: string;
  timestamp: string;
}

// Authentication Context DTOs (for middleware)
export interface AuthenticatedUser {
  userId: number;
  clientId: number;
  userTypeId: number;
  loginName: string;
  roles: CoreRole[];
  permissions?: string[];
  tokenType: 'access' | 'refresh';
  tokenExp: number;
  tokenIat: number;
}

export interface AuthenticationContext {
  user: AuthenticatedUser;
  token: string;
  isValid: boolean;
  expiresAt: Date;
}

// OAuth 2.0 DTOs
export interface OAuth2TokenRequest {
  grant_type: 'password' | 'refresh_token';
  username?: string;
  password?: string;
  refresh_token?: string;
  client_id?: string;
  scope?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  scope?: string;
  user: PublicUserData;
}

export interface OAuth2ErrorResponse {
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'unauthorized_client'
    | 'unsupported_grant_type'
    | 'invalid_scope';
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Security Event DTOs
export interface SecurityEvent {
  type:
    | 'login'
    | 'logout'
    | 'token_refresh'
    | 'token_revoke'
    | 'failed_login'
    | 'suspicious_activity';
  userId: number;
  clientId: number;
  details: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    reason?: string;
    tokenFamily?: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Token Management DTOs
export interface TokenFamilyInfo {
  family: string;
  userId: number;
  clientId: number;
  activeTokenCount: number;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface ActiveTokenSummary {
  userId: number;
  clientId: number;
  totalActiveTokens: number;
  tokenFamilies: TokenFamilyInfo[];
  oldestTokenDate: Date;
  newestTokenDate: Date;
}

// Password Authentication DTOs
export interface PasswordVerificationResult {
  isValid: boolean;
  mustChange: boolean;
  lastChanged?: Date;
  expiresAt?: Date;
  strength?: 'weak' | 'medium' | 'strong';
}

export interface PasswordChangeRequest {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Rate Limiting DTOs
export interface RateLimitInfo {
  endpoint: string;
  identifier: string; // IP or user ID
  attempts: number;
  windowStart: Date;
  windowEnd: Date;
  isBlocked: boolean;
}

// Audit DTOs
export interface AuthAuditLog {
  id: string;
  event: SecurityEvent;
  userId: number;
  clientId: number;
  success: boolean;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Add these NEW interfaces for decoded tokens (when JWT library adds iat/exp)

export interface DecodedAccessToken extends AccessTokenClaims {
  iat: number; // ✅ JWT library populates this
  exp: number; // ✅ JWT library populates this
  sub: string; // ✅ JWT library populates this
  iss: string; // ✅ JWT library populates this
  aud: string; // ✅ JWT library populates this
}

export interface DecodedRefreshToken extends RefreshTokenClaims {
  jti: string;
  iat: number;
  exp: number;
  sub: string;
  iss: string;
  aud: string;
}

// ✅ Generic decoded token interface
export interface DecodedTokenPayload extends TokenPayload {
  iat: number; // ✅ JWT library populates this
  exp: number; // ✅ JWT library populates this
  sub: string; // ✅ JWT library populates this
}
