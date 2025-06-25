import { z } from 'zod';
import { CoreRole } from '@shared/constants/roles';

/**
 * OPTIMIZED USER VALIDATORS - HIPAA COMPLIANT & MULTI-TENANT
 *
 * This file uses DRY principles with schema composition to eliminate repetition:
 * - Base field schemas for reusability
 * - Schema composition with merge/pick/omit
 * - Shared audit fields and common patterns
 * - Type-safe inference with minimal duplication
 */

// ===================================================================
// 🧱 BASE FIELD SCHEMAS (Building Blocks)
// ===================================================================

// Common audit fields used across all entities
const auditFieldsSchema = z.object({
  crUser: z.string().max(50),
  crDate: z.date(),
  modUser: z.string().max(50).nullable(),
  modDate: z.date().nullable(),
});

// Common create audit fields (only crUser required)
const createAuditFieldsSchema = z.object({
  crUser: z.string().max(50),
});

// Common update audit fields (only modUser required)
const updateAuditFieldsSchema = z.object({
  modUser: z.string().max(50),
});

// Standard ID field
const idFieldSchema = z.object({
  id: z.number().int().positive(),
});

// Common entity name pattern
const nameDescriptionSchema = z.object({
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
});

// User identification fields
const userIdentitySchema = z.object({
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
});

// User personal information fields
const userPersonalSchema = z.object({
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
});

// ===================================================================
// 🎯 CORE ENTITY SCHEMAS (Using Composition)
// ===================================================================

// Base schemas without ID and audit fields
const baseClientSchema = z.object({
  name: z.string().max(100).min(1),
  description: z.string().nullable(),
  timeZone: z.string().max(100).nullable(),
  status: z.number().int().nullable().default(-1),
  logo: z.string().max(2000).nullable(),
  favIcon: z.string().max(2000).nullable(),
  language: z.string().max(50).nullable(),
  website: z.string().max(2000).url().nullable(),
  extraInfo: z.any().nullable(),
});

const baseUserSchema = userIdentitySchema.merge(userPersonalSchema);

// Full entity schemas = base + ID + audit
export const ClientSchema = baseClientSchema.merge(idFieldSchema).merge(auditFieldsSchema);
export const UserTypeSchema = nameDescriptionSchema.merge(idFieldSchema).merge(auditFieldsSchema);
export const RoleSchema = nameDescriptionSchema.merge(idFieldSchema).merge(auditFieldsSchema);

export const UserSchema = baseUserSchema.merge(idFieldSchema).merge(auditFieldsSchema);

export const PasswordSchema = z
  .object({
    userId: z.number().int().positive(),
    password: z.string().max(500),
    salt: z.string().max(100).nullable(),
    lastChanged: z.date().nullable(),
    mustChange: z.boolean().default(false),
  })
  .merge(idFieldSchema)
  .merge(auditFieldsSchema);

export const UserRoleSchema = z
  .object({
    userId: z.number().int().positive(),
    roleId: z.number().int().positive(),
    clientId: z.number().int().positive(),
  })
  .merge(idFieldSchema)
  .merge(auditFieldsSchema);

export const ContactSchema = z
  .object({
    type: z.string().max(50),
    value: z.any(), // Json field
    userId: z.number().int().positive().nullable(),
    clientId: z.number().int().positive().nullable(),
    locationId: z.number().int().positive().nullable(),
  })
  .merge(idFieldSchema)
  .merge(auditFieldsSchema);

export const ClientLocationSchema = z
  .object({
    clientId: z.number().int().positive(),
    name: z.string().max(100),
    description: z.string().nullable(),
    status: z.number().int().nullable(),
    logo: z.string().max(2000).nullable(),
    extraInfo: z.any().nullable(),
  })
  .merge(idFieldSchema)
  .merge(auditFieldsSchema);

export const RefreshTokenSchema = z
  .object({
    userId: z.number().int().positive(),
    clientId: z.number().int().positive(),
    jti: z.string().max(36), // JWT ID
    family: z.string().max(36), // Token family for rotation tracking
    token: z.string().max(500), // Hashed refresh token
    expiresAt: z.date(),
    isRevoked: z.boolean().default(false),
  })
  .merge(idFieldSchema)
  .merge(auditFieldsSchema);

// ===================================================================
// 🔧 INPUT SCHEMAS (Using Schema Transformations)
// ===================================================================

// Create inputs = base schemas + create audit (no ID, no mod fields)
export const UserCreateInputSchema = baseUserSchema.merge(createAuditFieldsSchema);
export const PasswordCreateInputSchema = PasswordSchema.omit({
  id: true,
  crDate: true,
  modUser: true,
  modDate: true,
}).merge(createAuditFieldsSchema);
export const ContactCreateInputSchema = ContactSchema.omit({
  id: true,
  crDate: true,
  modUser: true,
  modDate: true,
});

// Update inputs = partial base schemas + update audit
export const UserUpdateInputSchema = userPersonalSchema.partial().merge(updateAuditFieldsSchema);

// Role assignment schema (no base needed)
export const UserRoleAssignmentSchema = z
  .object({
    userId: z.number().int().positive(),
    roleId: z.number().int().positive(),
    clientId: z.number().int().positive(),
  })
  .merge(createAuditFieldsSchema);

export const RefreshTokenCreateInputSchema = RefreshTokenSchema.omit({
  id: true,
  crDate: true,
  modUser: true,
  modDate: true,
});

// ===================================================================
// 🎯 OPTIMIZED USER SCHEMAS (Using Pick/Omit)
// ===================================================================

// User variants using transformations instead of redefinition
export const UserSummarySchema = UserSchema.pick({
  id: true,
  loginName: true,
  firstName: true,
  lastName: true,
  email: true,
  clientId: true,
  userTypeId: true,
  timeZone: true,
  profilePicture: true,
  status: true,
});

export const PublicUserSchema = UserSummarySchema.omit({ status: true });

// Minimal user for nested objects
const userBasicSchema = z.object({
  id: z.number().int().positive(),
  loginName: z.string().max(50).min(1),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
});

// Client basic info for nested objects
const clientBasicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  timeZone: z.string().max(100).nullable(),
  status: z.number().int().nullable(),
});

// Role basic info for nested objects
const roleBasicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).min(1),
  description: z.string().max(100).nullable(),
});

// ===================================================================
// 🔄 RELATION SCHEMAS (Using Existing Schemas)
// ===================================================================

// Enhanced UserRole with role details
const userRoleWithDetailsSchema = UserRoleSchema.merge(
  z.object({
    role: RoleSchema,
  }),
);

// User with authentication data (using composition)
export const UserWithAuthDataSchema = UserSchema.merge(
  z.object({
    client: ClientSchema,
    user_type: UserTypeSchema,
    user_role: z.array(userRoleWithDetailsSchema),
  }),
);

// User with password (selective fields + relations)
export const UserWithPasswordSchema = UserSchema.pick({
  id: true,
  clientId: true,
  userTypeId: true,
  loginName: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
}).merge(
  z.object({
    password: z.array(PasswordSchema),
    client: ClientSchema,
    user_type: UserTypeSchema,
  }),
);

// Client with relations
export const ClientWithRelationsSchema = ClientSchema.merge(
  z.object({
    clientLocation: z.array(ClientLocationSchema),
    contact: z.array(ContactSchema),
    user: z.array(UserSchema).optional(),
  }),
);

// Refresh token with context
export const RefreshTokenWithRelationsSchema = RefreshTokenSchema.merge(
  z.object({
    user: userBasicSchema.extend({
      email: z.string().email().max(100).nullable(),
      status: z.number().int().nullable(),
    }),
    client: clientBasicSchema,
  }),
);

// Role with user assignments
export const RoleWithRelationsSchema = RoleSchema.merge(
  z.object({
    userRole: z.array(
      UserRoleSchema.merge(
        z.object({
          user: userBasicSchema,
        }),
      ),
    ),
  }),
);

// User type with users
export const UserTypeWithRelationsSchema = UserTypeSchema.merge(
  z.object({
    user: z.array(
      userBasicSchema.extend({
        clientId: z.number().int().positive(),
        status: z.number().int().nullable(),
      }),
    ),
  }),
);

// Summary schemas for specific use cases
export const UserRolesSummarySchema = z.object({
  userId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  roles: z.array(roleBasicSchema),
});

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
// 🎯 TYPE INFERENCE (All Types)
// ===================================================================

// Core entity types
export type Client = z.infer<typeof ClientSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type ClientLocation = z.infer<typeof ClientLocationSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

// Input types
export type UserCreateInput = z.infer<typeof UserCreateInputSchema>;
export type PasswordCreateInput = z.infer<typeof PasswordCreateInputSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateInputSchema>;
export type ContactCreateInput = z.infer<typeof ContactCreateInputSchema>;
export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;
export type RefreshTokenCreateInput = z.infer<typeof RefreshTokenCreateInputSchema>;

// Relation types
export type UserWithAuthData = z.infer<typeof UserWithAuthDataSchema>;
export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>;
export type ClientWithRelations = z.infer<typeof ClientWithRelationsSchema>;
export type RefreshTokenWithRelations = z.infer<typeof RefreshTokenWithRelationsSchema>;
export type RoleWithRelations = z.infer<typeof RoleWithRelationsSchema>;
export type UserTypeWithRelations = z.infer<typeof UserTypeWithRelationsSchema>;

// Optimized types
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

// ===================================================================
// 🎯 USER EXTRA INFO SCHEMA
// ===================================================================

/**
 * User extraInfo Zod schema
 */
export const userExtraInfoSchema = z
  .object({
    preferences: z
      .object({
        theme: z.enum(['light', 'dark']).optional(),
        language: z.string().min(2).max(5).optional(),
        notifications: z
          .object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional(),
          })
          .optional(),
        timezone: z.string().optional(),
      })
      .optional(),

    medical: z
      .object({
        allergies: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional(),
        emergencyContact: z
          .object({
            name: z.string().optional(),
            phone: z.string().optional(),
            relationship: z.string().optional(),
          })
          .optional(),
      })
      .optional(),

    profile: z
      .object({
        bio: z.string().max(500).optional(),
        socialLinks: z
          .object({
            linkedin: z.string().url().optional(),
            twitter: z.string().url().optional(),
          })
          .optional(),
      })
      .optional(),

    custom: z.record(z.string(), z.any()).optional(),
  })
  .optional();

// ✅ Infer TypeScript types from Zod schemas
export type UserExtraInfo = z.infer<typeof userExtraInfoSchema>;

/**
 * Validate and sanitize JSON field using Zod
 */
export function validateJsonField<T>(
  data: any,
  schema: z.ZodSchema<T>,
  fieldName: string = 'extraInfo',
): { success: true; data: T } | { success: false; errors: string[] } {
  if (data === null || data === undefined) {
    const result = schema.safeParse(undefined);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.errors.map(e => `${fieldName}: ${e.message}`) };
  }

  // Handle string JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
      return {
        success: false,
        errors: [`${fieldName} must be valid JSON`],
      };
    }
  }

  // Validate with Zod
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${fieldName}.${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Simplified validation function specifically for user extraInfo
 * Since we know the schema (userExtraInfoSchema) and field name ('extraInfo'),
 * we only need the data parameter
 */
export function validateUserExtraInfo(
  extraInfo: any,
): { success: true; data: UserExtraInfo } | { success: false; errors: string[] } {
  if (extraInfo === null || extraInfo === undefined) {
    const result = userExtraInfoSchema.safeParse(undefined);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.errors.map(e => `extraInfo: ${e.message}`) };
  }

  // Handle string JSON
  let parsedData = extraInfo;
  if (typeof extraInfo === 'string') {
    try {
      parsedData = JSON.parse(extraInfo);
    } catch (error) {
      return {
        success: false,
        errors: ['extraInfo must be valid JSON'],
      };
    }
  }

  // Validate with Zod
  const result = userExtraInfoSchema.safeParse(parsedData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `extraInfo.${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Merge JSON fields safely
 */
export function mergeJsonFields<T>(existing: T | null, updates: Partial<T> | null): T | null {
  if (!existing && !updates) return null;
  if (!existing) return updates as T;
  if (!updates) return existing;

  // Deep merge for nested objects
  const merge = (target: any, source: any): any => {
    if (!target || !source) return source || target;

    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  };

  return merge(existing, updates);
}
