import { z } from 'zod';
import { CoreRole } from '@shared/constants/roles';

// ===================================================================
// 🎯 CORE ENTITY SCHEMAS (Matching Prisma Schema)
// ===================================================================

// Client Schema
export const ClientSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().nullable(),
  timeZone: z.string().max(100).nullable(),
  status: z.number().int().nullable().default(-1),
  logo: z.string().max(2000).nullable(),
  favIcon: z.string().max(2000).nullable(),
  language: z.string().max(50).nullable(),
  website: z.string().max(2000).url().nullable(),
  extraInfo: z.any().nullable(), // Json field
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// User Type Schema
export const UserTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Role Schema
export const RoleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// User Schema (Core user data)
export const UserSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  middleName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  dob: z.date().nullable(),
  mrn: z.string().max(50).nullable(),
  gender: z.string().max(50).nullable(),
  timeZone: z.string().max(100).nullable(),
  profilePicture: z.string().max(2000).nullable(),
  passExpireInDays: z.number().int().positive().nullable(),
  extraInfo: z.any().nullable(), // Json field
  status: z.number().int().nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Password Schema
export const PasswordSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  password: z.string().max(500),
  salt: z.string().max(100).nullable(),
  lastChanged: z.date().nullable(),
  mustChange: z.boolean().default(false),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// User Role Schema (Junction table)
export const UserRoleSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Contact Schema
export const ContactSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().max(50),
  value: z.any(), // Json field
  userId: z.number().int().positive().nullable(),
  clientId: z.number().int().positive().nullable(),
  locationId: z.number().int().positive().nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Client Location Schema
export const ClientLocationSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  name: z.string().max(100),
  description: z.string().nullable(),
  status: z.number().int().nullable(),
  logo: z.string().max(2000).nullable(),
  extraInfo: z.any().nullable(), // Json field
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Refresh Token Schema (for JWT token rotation)
export const RefreshTokenSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  jti: z.string().max(36), // JWT ID
  family: z.string().max(36), // Token family for rotation tracking
  token: z.string().max(500), // Hashed refresh token
  expiresAt: z.date(),
  isRevoked: z.boolean().default(false),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// ===================================================================
// 🎯 INPUT SCHEMAS (For Create/Update Operations)
// ===================================================================

// User Create Input (for registration)
export const UserCreateInputSchema = z.object({
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).optional(),
  middleName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().max(100).optional(),
  dob: z.date().optional(),
  mrn: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  timeZone: z.string().max(100).optional(),
  profilePicture: z.string().max(2000).optional(),
  passExpireInDays: z.number().int().positive().optional(),
  extraInfo: z.any().optional(),
  status: z.number().int().optional(),
  crUser: z.string().max(50),
});

// Password Create Input
export const PasswordCreateInputSchema = z.object({
  userId: z.number().int().positive(),
  password: z.string().max(500),
  salt: z.string().max(100).optional(),
  lastChanged: z.date().optional(),
  mustChange: z.boolean().default(false),
  crUser: z.string().max(50),
});

// User Update Input
export const UserUpdateInputSchema = z.object({
  firstName: z.string().max(50).optional(),
  middleName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().max(100).optional(),
  dob: z.date().optional(),
  mrn: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  timeZone: z.string().max(100).optional(),
  profilePicture: z.string().max(2000).optional(),
  passExpireInDays: z.number().int().positive().optional(),
  extraInfo: z.any().optional(),
  status: z.number().int().optional(),
  modUser: z.string().max(50),
});

// Contact Create Input
export const ContactCreateInputSchema = z.object({
  type: z.string().max(50),
  value: z.any(),
  userId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  locationId: z.number().int().positive().optional(),
  crUser: z.string().max(50),
});

// User Role Assignment Input
export const UserRoleAssignmentSchema = z.object({
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  crUser: z.string().max(50),
});

// Refresh Token Create Input
export const RefreshTokenCreateInputSchema = z.object({
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  jti: z.string().max(36),
  family: z.string().max(36),
  token: z.string().max(500),
  expiresAt: z.date(),
  isRevoked: z.boolean().default(false),
  crUser: z.string().max(50),
});

// ===================================================================
// 🎯 TYPE INFERENCE (TypeScript Types Only)
// ===================================================================

export type Client = z.infer<typeof ClientSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type ClientLocation = z.infer<typeof ClientLocationSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

// Input Types
export type UserCreateInput = z.infer<typeof UserCreateInputSchema>;
export type PasswordCreateInput = z.infer<typeof PasswordCreateInputSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateInputSchema>;
export type ContactCreateInput = z.infer<typeof ContactCreateInputSchema>;
export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;
export type RefreshTokenCreateInput = z.infer<typeof RefreshTokenCreateInputSchema>;

// ===================================================================
// 🎯 RELATION SCHEMAS (Complex schemas with database relations)
// ===================================================================

// User with Authentication Data (Most important for JWT generation)
export const UserWithAuthDataSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  middleName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  dob: z.date().nullable(),
  mrn: z.string().max(50).nullable(),
  gender: z.string().max(50).nullable(),
  timeZone: z.string().max(100).nullable(),
  profilePicture: z.string().max(2000).nullable(),
  passExpireInDays: z.number().int().positive().nullable(),
  extraInfo: z.any().nullable(),
  status: z.number().int().nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),

  // Relations for authentication
  client: ClientSchema,
  userType: UserTypeSchema,
  userRole: z.array(
    z.object({
      id: z.number().int().positive(),
      userId: z.number().int().positive(),
      roleId: z.number().int().positive(),
      clientId: z.number().int().positive(),
      crUser: z.string().max(50),
      crDate: z.date(),
      modUser: z.string().max(50).nullable(),
      modDate: z.date().nullable(),
      role: RoleSchema, // Include role details
    }),
  ),
});

// User with Password (for authentication validation)
export const UserWithPasswordSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  status: z.number().int().nullable(),

  // Include password relation
  password: z.array(
    z.object({
      id: z.number().int().positive(),
      userId: z.number().int().positive(),
      password: z.string().max(500),
      salt: z.string().max(100).nullable(),
      lastChanged: z.date().nullable(),
      mustChange: z.boolean().default(false),
      crUser: z.string().max(50),
      crDate: z.date(),
      modUser: z.string().max(50).nullable(),
      modDate: z.date().nullable(),
    }),
  ),

  // Include client for organization context
  client: ClientSchema,
  userType: UserTypeSchema,
});

// Client with Relations (for organization management)
export const ClientWithRelationsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().nullable(),
  timeZone: z.string().max(100).nullable(),
  status: z.number().int().nullable().default(-1),
  logo: z.string().max(2000).nullable(),
  favIcon: z.string().max(2000).nullable(),
  language: z.string().max(50).nullable(),
  website: z.string().max(2000).url().nullable(),
  extraInfo: z.any().nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),

  // Relations
  clientLocation: z.array(ClientLocationSchema),
  contact: z.array(ContactSchema),
  user: z.array(UserSchema).optional(), // Users in this organization
});

// Refresh Token with Relations (for token management)
export const RefreshTokenWithRelationsSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  jti: z.string().max(36),
  family: z.string().max(36),
  token: z.string().max(500),
  expiresAt: z.date(),
  isRevoked: z.boolean().default(false),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),

  // Relations for token context
  user: z.object({
    id: z.number().int().positive(),
    loginName: z.string().max(50).min(1),
    firstName: z.string().max(50).nullable(),
    lastName: z.string().max(50).nullable(),
    email: z.string().email().max(100).nullable(),
    status: z.number().int().nullable(),
  }),
  client: z.object({
    id: z.number().int().positive(),
    name: z.string().max(100).min(1),
    timeZone: z.string().max(100).nullable(),
    status: z.number().int().nullable(),
  }),
});

// Role with Relations (for RBAC)
export const RoleWithRelationsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),

  // Relations
  userRole: z.array(
    z.object({
      id: z.number().int().positive(),
      userId: z.number().int().positive(),
      roleId: z.number().int().positive(),
      clientId: z.number().int().positive(),
      crUser: z.string().max(50),
      crDate: z.date(),
      modUser: z.string().max(50).nullable(),
      modDate: z.date().nullable(),
      user: z.object({
        id: z.number().int().positive(),
        loginName: z.string().max(50).min(1),
        firstName: z.string().max(50).nullable(),
        lastName: z.string().max(50).nullable(),
      }),
    }),
  ),
});

// User Type with Relations (for user classification)
export const UserTypeWithRelationsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),

  // Relations
  user: z.array(
    z.object({
      id: z.number().int().positive(),
      loginName: z.string().max(50).min(1),
      firstName: z.string().max(50).nullable(),
      lastName: z.string().max(50).nullable(),
      clientId: z.number().int().positive(),
      status: z.number().int().nullable(),
    }),
  ),
});

// ===================================================================
// 🎯 OPTIMIZED SCHEMAS FOR AUTHENTICATION FLOW
// ===================================================================

// Minimal User for JWT Payload (optimized for token size)
export const UserSummarySchema = z.object({
  id: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  timeZone: z.string().max(100).nullable(),
  profilePicture: z.string().max(2000).nullable(),
  status: z.number().int().nullable(),
});

// Public User (safe for API responses - no sensitive data)
export const PublicUserSchema = z.object({
  id: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  email: z.string().email().max(100).nullable(),
  timeZone: z.string().max(100).nullable(),
  profilePicture: z.string().max(2000).nullable(),
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
});

// User Roles Summary (for JWT payload)
export const UserRolesSummarySchema = z.object({
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  roles: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string().max(100).min(1),
      description: z.string().max(100).nullable(),
    }),
  ),
});

// Active Refresh Tokens Summary (for security monitoring)
export const ActiveRefreshTokensSummarySchema = z.object({
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  activeTokenCount: z.number().int().nonnegative(),
  tokens: z.array(
    z.object({
      id: z.number().int().positive(),
      jti: z.string().max(36),
      family: z.string().max(36),
      expiresAt: z.date(),
      crDate: z.date(),
    }),
  ),
});

// ===================================================================
// 🎯 RELATION TYPE INFERENCE
// ===================================================================

export type UserWithAuthData = z.infer<typeof UserWithAuthDataSchema>;
export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>;
export type ClientWithRelations = z.infer<typeof ClientWithRelationsSchema>;
export type RefreshTokenWithRelations = z.infer<typeof RefreshTokenWithRelationsSchema>;
export type RoleWithRelations = z.infer<typeof RoleWithRelationsSchema>;
export type UserTypeWithRelations = z.infer<typeof UserTypeWithRelationsSchema>;

// Optimized Types
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UserRolesSummary = z.infer<typeof UserRolesSummarySchema>;
export type ActiveRefreshTokensSummary = z.infer<typeof ActiveRefreshTokensSummarySchema>;

/**
 * Query parameters validation schema for getting users
 */
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 1))
    .refine(val => val >= 1, { message: 'Page must be a positive integer' })
    .refine(val => val <= 1000, { message: 'Page cannot exceed 1000' }),

  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 20))
    .refine(val => val >= 1, { message: 'Limit must be at least 1' })
    .refine(val => val <= 100, { message: 'Limit cannot exceed 100' }),

  clientId: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : undefined))
    .refine(val => val === undefined || val >= 1, {
      message: 'Client ID must be a positive integer',
    }),

  role: z
    .string()
    .optional()
    .refine(val => val === undefined || Object.values(CoreRole).includes(val as CoreRole), {
      message: `Role must be one of: ${Object.values(CoreRole).join(', ')}`,
    }),

  status: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : undefined))
    .refine(val => val === undefined || Number.isInteger(val), {
      message: 'Status must be a valid integer',
    }),

  search: z
    .string()
    .optional()
    .refine(val => val === undefined || val.length >= 2, {
      message: 'Search term must be at least 2 characters',
    })
    .refine(val => val === undefined || val.length <= 50, {
      message: 'Search term cannot exceed 50 characters',
    }),

  sort: z
    .string()
    .optional()
    .transform(val => val || 'asc') // Default to 'asc' if not provided
    .refine(val => ['asc', 'desc'].includes(val.toLowerCase()), {
      message: 'Sort must be either "asc" or "desc"',
    })
    .transform(val => val.toLowerCase() as 'asc' | 'desc'), // Ensure lowercase
});

export type GetUsersQueryRequest = z.infer<typeof getUsersQuerySchema>;

/**
 * Validate user retrieval permissions based on role combinations
 */
export function validateUserViewPermissions(
  currentUserRole: CoreRole,
  requestedRole?: string,
  requestedClientId?: number,
  currentUserClientId?: number,
): void {
  // Additional business rule validations
  if (
    currentUserRole === CoreRole.CLIENT_ADMIN &&
    requestedClientId &&
    currentUserClientId &&
    requestedClientId !== currentUserClientId
  ) {
    throw new Error('CLIENT_ADMIN can only view users in their own organization');
  }

  if (
    (currentUserRole === CoreRole.CLINICAL_STAFF || currentUserRole === CoreRole.OFFICE_STAFF) &&
    requestedRole &&
    requestedRole !== CoreRole.PATIENT
  ) {
    throw new Error(`${currentUserRole} can only view PATIENT accounts`);
  }
}
