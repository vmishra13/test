import { z } from 'zod';
import { CoreRole } from '../../../shared/constants';

// ===================================================================
// 🎯 OAUTH 2.0 TOKEN ENDPOINT VALIDATORS
// ===================================================================

// Grant Type Enum (OAuth 2.0 Standard)
export const GrantTypeSchema = z.enum(['password', 'refresh_token']);

// Base Token Request Schema
const BaseTokenRequestSchema = z.object({
  grant_type: GrantTypeSchema,
  client_id: z.string().optional(), // Optional for single-tenant, required for multi-tenant
});

// Password Grant Request (Login)
export const PasswordGrantRequestSchema = BaseTokenRequestSchema.extend({
  grant_type: z.literal('password'),
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(500),
  clientId: z.number().optional(),
  scope: z.string().optional(), // Optional scope parameter
});

// Refresh Token Grant Request
export const RefreshTokenGrantRequestSchema = BaseTokenRequestSchema.extend({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string().min(1),
  scope: z.string().optional(),
});

// Combined Token Request Schema (Union of both grant types)
export const TokenRequestSchema = z.discriminatedUnion('grant_type', [
  // Password grant
  z.object({
    grant_type: z.literal('password'), // Required
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    client_id: z.string().optional(),
    clientId: z.number().optional(),
    scope: z.string().optional(),
  }),
  // Refresh token grant
  z.object({
    grant_type: z.literal('refresh_token'), // Required, not optional
    refresh_token: z.string().min(1, 'Refresh token is required'),
    client_id: z.string().optional(),
    scope: z.string().optional(),
  }),
]);

// ===================================================================
// 🎯 TOKEN RESPONSE SCHEMAS (OAuth 2.0 Standard)
// ===================================================================

// User Data in Token Response (Public safe data)
export const TokenResponseUserSchema = z.object({
  id: z.number().int().positive(),
  loginName: z.string().max(50),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  timeZone: z.string().max(100).nullable(),
  profilePicture: z.string().max(2000).nullable(),
  client: z.object({
    id: z.number().int().positive(),
    name: z.string().max(100),
    timeZone: z.string().max(100).nullable(),
  }),
  userType: z.object({
    id: z.number().int().positive(),
    name: z.string().max(100),
    description: z.string().max(100).nullable(),
  }),
  roles: z.array(z.string().max(100)), // Array of role names
});

// Successful Token Response (OAuth 2.0 Standard)
export const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive(), // Seconds until expiration
  refresh_token: z.string().min(1),
  refresh_expires_in: z.number().int().positive(), // Seconds until refresh token expiration
  scope: z.string().optional(), // Space-separated scope values
  user: TokenResponseUserSchema,
});

// ===================================================================
// 🎯 TOKEN REVOCATION VALIDATORS (OAuth 2.0 RFC 7009)
// ===================================================================

// Token Type Hint Enum
export const TokenTypeHintSchema = z.enum(['access_token', 'refresh_token']);

// Revoke Token Request
export const RevokeTokenRequestSchema = z.object({
  token: z.string().min(1),
  token_type_hint: TokenTypeHintSchema.optional(),
  client_id: z.string().optional(),
});

// Revoke Token Response
export const RevokeTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  revoked_tokens: z.object({
    refresh_token: z.boolean(),
    token_family: z.boolean(),
    count: z.number().int().nonnegative(),
  }),
  timestamp: z.string().datetime(),
});

// ===================================================================
// 🎯 USER REGISTRATION VALIDATORS
// ===================================================================

// User Registration Request
export const UserRegistrationRequestSchema = z
  .object({
    // Required fields
    clientId: z.number().int().positive(),
    userTypeId: z.number().int().positive(),
    loginName: z.string().min(1).max(50),
    password: z.string().min(8).max(100), // Minimum 8 characters for security

    // Optional user details
    firstName: z.string().max(50).optional(),
    middleName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    email: z.string().email().max(100).optional(),
    dob: z.string().date().optional(), // ISO date string
    mrn: z.string().max(50).optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
    timeZone: z.string().max(100).optional(),

    // Password confirmation
    confirmPassword: z.string().min(8).max(100),

    // Terms and conditions
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),

    // Optional role assignments
    roleIds: z.array(z.number().int().positive()).optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User Registration Response
export const UserRegistrationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    userId: z.number().int().positive(),
    user: z.object({
      id: z.number().int().positive(),
      loginName: z.string().max(50),
      firstName: z.string().max(50).nullable(),
      lastName: z.string().max(50).nullable(),
      email: z.string().email().max(100).nullable(),
      clientId: z.number().int().positive(),
      userTypeId: z.number().int().positive(),
    }),
    tokens: TokenResponseSchema.omit({ user: true }), // Exclude user from nested tokens
  }),
  timestamp: z.string().datetime(),
});

// ===================================================================
// 🎯 ERROR RESPONSE SCHEMAS (OAuth 2.0 Standard)
// ===================================================================

// OAuth 2.0 Error Codes
export const OAuth2ErrorCodeSchema = z.enum([
  'invalid_request',
  'invalid_client',
  'invalid_grant',
  'unauthorized_client',
  'unsupported_grant_type',
  'invalid_scope',
  'server_error',
  'temporarily_unavailable',
]);

// OAuth 2.0 Error Response
export const OAuth2ErrorResponseSchema = z.object({
  error: OAuth2ErrorCodeSchema,
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
  state: z.string().optional(),
});

// General API Error Response
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
  timestamp: z.string().datetime(),
});

// ===================================================================
// 🎯 AUTHENTICATION CONTEXT SCHEMAS
// ===================================================================

// Login Credentials (internal use)
export const LoginCredentialsSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1),
  clientId: z.number().int().positive().optional(),
});

// ===================================================================
// 🎯 VALIDATION HELPER SCHEMAS
// ===================================================================

// Password Strength Validation
export const PasswordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email Domain Validation (for healthcare organizations)
export const HealthcareEmailSchema = z
  .string()
  .email('Invalid email format')
  .max(100, 'Email must be less than 100 characters')
  .refine(email => {
    // Add custom domain validation for healthcare organizations if needed
    return true; // For now, allow all domains
  }, 'Email domain not authorized for healthcare access');

// Client ID Validation
export const ClientIdValidationSchema = z
  .number()
  .int('Client ID must be an integer')
  .positive('Client ID must be positive')
  .refine(async () => {
    // Add database validation logic here if needed
    return true; // For now, assume all positive integers are valid
  }, 'Invalid client ID');

// ===================================================================
// 🎯 VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate login request
 */
export const validateLoginRequest = LoginCredentialsSchema;

/**
 * Validate password change request
 */
export const validatePasswordChangeRequest = z
  .object({
    userId: z.number().int().positive(),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: PasswordStrengthSchema,
    confirmNewPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Validate OAuth2 token request
 */
export const validateOAuth2TokenRequest = TokenRequestSchema;

/**
 * Validate user registration request
 */
export const validateUserRegistrationRequest = UserRegistrationRequestSchema;

/**
 * Validate token revocation request
 */
export const validateTokenRevocationRequest = RevokeTokenRequestSchema;

// ===================================================================
// 🎯 ADDITIONAL TYPE EXPORTS
// ===================================================================

export type PasswordChangeRequest = z.infer<typeof validatePasswordChangeRequest>;

// ===================================================================
// 🎯 TYPE INFERENCE FOR TYPESCRIPT
// ===================================================================

// Request Types
export type PasswordGrantRequest = z.infer<typeof PasswordGrantRequestSchema>;
export type RefreshTokenGrantRequest = z.infer<typeof RefreshTokenGrantRequestSchema>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type RevokeTokenRequest = z.infer<typeof RevokeTokenRequestSchema>;
export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Response Types
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type TokenResponseUser = z.infer<typeof TokenResponseUserSchema>;
export type RevokeTokenResponse = z.infer<typeof RevokeTokenResponseSchema>;
export type UserRegistrationResponse = z.infer<typeof UserRegistrationResponseSchema>;
export type OAuth2ErrorResponse = z.infer<typeof OAuth2ErrorResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// Enum Types
export type GrantType = z.infer<typeof GrantTypeSchema>;
export type TokenTypeHint = z.infer<typeof TokenTypeHintSchema>;
export type OAuth2ErrorCode = z.infer<typeof OAuth2ErrorCodeSchema>;

/**
 * Registration request validation schema
 */
export const RegisterUserSchema = z
  .object({
    // Required fields
    loginName: z
      .string()
      .min(3, 'Login name must be at least 3 characters')
      .max(50, 'Login name must not exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'Login name can only contain letters, numbers, dots, underscores, and hyphens',
      )
      .trim(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      ),

    clientId: z
      .number()
      .int('Client ID must be an integer')
      .positive('Client ID must be a positive integer'),

    userTypeId: z
      .number()
      .int('User type ID must be an integer')
      .positive('User type ID must be a positive integer'),

    roles: z
      .array(
        z.nativeEnum(CoreRole, {
          errorMap: () => ({
            message:
              'Invalid role. Must be one of: SUPER_ADMIN, CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT',
          }),
        }),
      )
      .min(1, 'At least one role must be assigned')
      .max(5, 'Cannot assign more than 5 roles')
      .refine(roles => new Set(roles).size === roles.length, 'Duplicate roles are not allowed'),

    // Optional user data fields
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name must not exceed 50 characters')
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name must not exceed 50 characters')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .toLowerCase()
      .trim()
      .optional(),

    phoneNumber: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .min(10, 'Phone number must be at least 10 characters')
      .max(20, 'Phone number must not exceed 20 characters')
      .trim()
      .optional(),

    timeZone: z
      .string()
      .min(1, 'Time zone cannot be empty')
      .max(50, 'Time zone must not exceed 50 characters')
      .trim()
      .optional(),

    profilePicture: z
      .string()
      .url('Profile picture must be a valid URL')
      .max(255, 'Profile picture URL must not exceed 255 characters')
      .optional(),

    // Metadata fields
    sendWelcomeEmail: z.boolean().optional().default(false),

    temporaryPassword: z.boolean().optional().default(false),
  })
  .strict() // Reject unknown fields
  .refine(
    data => {
      // Business rule: If email is provided and sendWelcomeEmail is true, email is required
      if (data.sendWelcomeEmail && !data.email) {
        return false;
      }
      return true;
    },
    {
      message: 'Email is required when sendWelcomeEmail is enabled',
      path: ['email'],
    },
  )
  .refine(
    data => {
      // Business rule: PATIENT role should not be combined with admin roles
      if (
        data.roles.includes(CoreRole.PATIENT) &&
        (data.roles.includes(CoreRole.SUPER_ADMIN) || data.roles.includes(CoreRole.CLIENT_ADMIN))
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'PATIENT role cannot be combined with administrative roles',
      path: ['roles'],
    },
  );

/**
 * Role validation schema (for individual role checks)
 */
export const RoleSchema = z.nativeEnum(CoreRole, {
  errorMap: () => ({
    message:
      'Invalid role. Must be one of: SUPER_ADMIN, CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT',
  }),
});

/**
 * User ID validation schema
 */
export const UserIdSchema = z
  .number()
  .int('User ID must be an integer')
  .positive('User ID must be a positive integer');

/**
 * Client ID validation schema
 */
export const ClientIdSchema = z
  .number()
  .int('Client ID must be an integer')
  .positive('Client ID must be a positive integer');

/**
 * Registration query parameters (for filtering/pagination if needed)
 */
export const RegistrationQuerySchema = z
  .object({
    clientId: z
      .string()
      .transform(val => parseInt(val, 10))
      .pipe(ClientIdSchema)
      .optional(),

    userType: z.string().min(1).max(50).optional(),

    role: RoleSchema.optional(),

    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .pipe(z.number().int().min(1))
      .optional()
      .default('1'),

    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('10'),
  })
  .strict();

// Export types for TypeScript inference
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type RoleInput = z.infer<typeof RoleSchema>;
export type UserIdInput = z.infer<typeof UserIdSchema>;
export type ClientIdInput = z.infer<typeof ClientIdSchema>;
export type RegistrationQueryInput = z.infer<typeof RegistrationQuerySchema>;
