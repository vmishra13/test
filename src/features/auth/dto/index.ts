// ===================================================================
// 🎯 CLEAN DTO EXPORTS
// ===================================================================

// Authentication DTOs
export type {
  // Token Types
  TokenPair,
  AccessTokenClaims,
  RefreshTokenClaims,

  // Login Types
  LoginRequest,
  LoginResponse,
  PublicUserData,

  // Token Refresh Types
  RefreshTokenRequest,
  RefreshTokenResponse,

  // Token Revocation Types
  RevokeTokenRequest,
  RevokeTokenResponse,

  // Authentication Context
  AuthenticatedUser,
  AuthenticationContext,

  // OAuth 2.0 Types
  OAuth2TokenRequest,
  OAuth2TokenResponse,
  OAuth2ErrorResponse,

  // Security Types
  SecurityEvent,
  TokenFamilyInfo,
  ActiveTokenSummary,
  PasswordVerificationResult,
  PasswordChangeRequest,
  RateLimitInfo,
  AuthAuditLog,
} from './auth.dto';

// // User Management DTOs
// export type {
//   // Registration Types
//   UserRegistrationRequest,
//   UserRegistrationResponse,
//   CreatedUserSummary,

//   // Profile Types
//   UserProfile,
//   UserRoleInfo,
//   UserContactInfo,

//   // Update Types
//   UserUpdateRequest,
//   UserUpdateResponse,

//   // Search Types
//   UserSearchQuery,
//   UserSearchResult,
//   UserSearchResponse,

//   // Role Management Types
//   AssignRoleRequest,
//   RemoveRoleRequest,
//   RoleAssignmentResponse,

//   // Status Management Types
//   UserStatusUpdateRequest,
//   UserStatusUpdateResponse,

//   // Password Management Types
//   SetPasswordRequest,
//   PasswordResetRequest,
//   PasswordResetResponse,

//   // Import/Export Types
//   UserImportRequest,
//   UserImportResult,
//   UserImportResponse,

//   // Analytics Types
//   UserAnalytics,

//   // Contact Types
//   ContactCreateRequest,
//   ContactUpdateRequest,
//   ContactResponse,
// } from './user.dto';

// // Specific exports for commonly used types
// export type {
//   RegisterUserRequest,
//   RegisterUserResponse,
//   CreateUserWithRolesData,
//   CreateUserResult,
// } from './registration.dto';
