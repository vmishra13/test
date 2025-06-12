import { z } from 'zod';
import { CoreRole, RoleUtils } from '@shared/constants';

// ===================================================================
// 🎯 ZOD VALIDATION SCHEMAS (ADD THESE)
// ===================================================================

/**
 * Schema for registering a new user
 */
export const registerUserSchema = z
  .object({
    // Required fields
    loginName: z
      .string()
      .min(3, 'Login name must be at least 3 characters')
      .max(50, 'Login name must not exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'Login name can only contain letters, numbers, dots, underscores, and hyphens',
      ),

    clientId: z.number().int('Client ID must be an integer').positive('Client ID must be positive'),

    userTypeId: z
      .number()
      .int('User type ID must be an integer')
      .positive('User type ID must be positive'),

    roles: z
      .array(z.nativeEnum(CoreRole))
      .min(1, 'At least one role must be assigned')
      .max(3, 'Cannot assign more than 3 roles'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .refine(
        password => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter',
      )
      .refine(
        password => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter',
      )
      .refine(password => /\d/.test(password), 'Password must contain at least one number')
      .refine(
        password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
        'Password must contain at least one special character',
      )
      .refine(password => !/\s/.test(password), 'Password cannot contain spaces'),

    // Optional fields
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name must not exceed 50 characters')
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name must not exceed 50 characters')
      .optional(),

    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must not exceed 255 characters')
      .optional(),

    sendWelcomeEmail: z.boolean().optional().default(false),
  })
  .refine(
    data => {
      // Business rule: Email required when sendWelcomeEmail is true
      if (data.sendWelcomeEmail && !data.email) {
        return false;
      }
      return true;
    },
    {
      message: 'Email is required when sendWelcomeEmail is enabled',
      path: ['email'],
    },
  );

/**
 * Schema for validating registration data - matches RegisterUserRequest structure
 */
export const validateRegistrationSchema = z
  .object({
    // REQUIRED FIELDS (same as RegisterUserRequest)
    loginName: z
      .string()
      .min(3, 'Login name must be at least 3 characters')
      .max(50, 'Login name must not exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'Login name can only contain letters, numbers, dots, underscores, and hyphens',
      ),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .refine(
        password => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter',
      )
      .refine(
        password => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter',
      )
      .refine(password => /\d/.test(password), 'Password must contain at least one number')
      .refine(
        password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
        'Password must contain at least one special character',
      )
      .refine(password => !/\s/.test(password), 'Password cannot contain spaces'),

    clientId: z.number().int('Client ID must be an integer').positive('Client ID must be positive'),

    userTypeId: z
      .number()
      .int('User type ID must be an integer')
      .positive('User type ID must be positive'),

    roles: z
      .array(z.nativeEnum(CoreRole))
      .min(1, 'At least one role must be assigned')
      .max(3, 'Cannot assign more than 3 roles'),

    // OPTIONAL FIELDS (same as RegisterUserRequest)
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name must not exceed 50 characters')
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name must not exceed 50 characters')
      .optional(),

    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must not exceed 255 characters')
      .optional(),

    sendWelcomeEmail: z.boolean().optional(),

    temporaryPassword: z.boolean().optional(),

    timeZone: z.string().max(50).optional(),

    profilePicture: z.string().url('Profile picture must be a valid URL').optional(),
  })
  .refine(
    data => {
      // Business rule: Email required when sendWelcomeEmail is true
      if (data.sendWelcomeEmail && !data.email) {
        return false;
      }
      return true;
    },
    {
      message: 'Email is required when sendWelcomeEmail is enabled',
      path: ['email'],
    },
  );

/**
 * Schema for checking registration permissions
 */
export const checkPermissionsSchema = z.object({
  targetRoles: z
    .array(z.nativeEnum(CoreRole))
    .min(1, 'At least one role must be provided')
    .max(10, 'Cannot check more than 10 roles at once'),
});

/**
 * Schema for registration statistics query parameters
 */
export const registrationStatsQuerySchema = z.object({
  clientId: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'Client ID must be a positive number')
    .optional(),
});

// ===================================================================
// 🎯 EXISTING BUSINESS LOGIC FUNCTIONS (KEEP AS IS)
// ===================================================================

/**
 * Business rule validation: Check if current user can assign target roles
 */
export const validateRoleAssignmentPermissions = (
  currentUserRole: CoreRole,
  targetRoles: CoreRole[],
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const targetRole of targetRoles) {
    if (!RoleUtils.canCreateRole(currentUserRole, targetRole)) {
      errors.push(`You do not have permission to assign role: ${targetRole}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Business rule validation: Check client access permissions
 */
export const validateClientAccessPermissions = (
  currentUserRole: CoreRole,
  currentUserClientId: number,
  targetClientId: number,
): { isValid: boolean; error?: string } => {
  // Super admin can create users in any client
  if (RoleUtils.canManageAllClients(currentUserRole)) {
    return { isValid: true };
  }

  // Other roles can only create users in their own client
  if (currentUserClientId !== targetClientId) {
    return {
      isValid: false,
      error: 'You can only create users in your own organization',
    };
  }

  return { isValid: true };
};

/**
 * Role combination validation rules
 */
export const ROLE_COMBINATION_RULES = {
  // Roles that cannot be combined with others
  exclusive: [CoreRole.PATIENT],

  // Roles that require other roles
  dependencies: {
    // No dependencies currently, but can be added later
  },

  // Maximum roles per user type
  maxRolesPerUserType: {
    admin: 3,
    staff: 2,
    patient: 1,
  },
} as const;

/**
 * Validate role combinations
 */
export const validateRoleCombinations = (
  roles: CoreRole[],
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for exclusive roles
  const hasPatientRole = roles.includes(CoreRole.PATIENT);
  const hasAdminRoles = roles.some(role =>
    [CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN].includes(role),
  );

  if (hasPatientRole && hasAdminRoles) {
    errors.push('PATIENT role cannot be combined with administrative roles');
  }

  if (hasPatientRole && roles.length > 1) {
    errors.push('PATIENT role must be assigned alone');
  }

  // Check for reasonable role limits
  if (roles.length > 3) {
    errors.push('Cannot assign more than 3 roles to a single user');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Password strength validation
 */
export const PasswordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(password => /[a-z]/.test(password), 'Password must contain at least one lowercase letter')
  .refine(password => /[A-Z]/.test(password), 'Password must contain at least one uppercase letter')
  .refine(password => /\d/.test(password), 'Password must contain at least one number')
  .refine(
    password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Password must contain at least one special character',
  )
  .refine(password => !/\s/.test(password), 'Password cannot contain spaces')
  .refine(password => {
    // Check for common weak patterns
    const weakPatterns = [/123456/, /password/i, /qwerty/i, /admin/i, /letmein/i];
    return !weakPatterns.some(pattern => pattern.test(password));
  }, 'Password contains common weak patterns');

/**
 * Email domain validation (optional - for enterprise restrictions)
 */
export const validateEmailDomain = (
  email: string,
  allowedDomains?: string[],
): { isValid: boolean; error?: string } => {
  if (!allowedDomains || allowedDomains.length === 0) {
    return { isValid: true };
  }

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) {
    return { isValid: false, error: 'Invalid email format' };
  }

  const isAllowed = allowedDomains.some(
    domain =>
      emailDomain === domain.toLowerCase() || emailDomain.endsWith(`.${domain.toLowerCase()}`),
  );

  if (!isAllowed) {
    return {
      isValid: false,
      error: `Email domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`,
    };
  }

  return { isValid: true };
};

// Export validation helper types
export type RoleAssignmentValidation = ReturnType<typeof validateRoleAssignmentPermissions>;
export type ClientAccessValidation = ReturnType<typeof validateClientAccessPermissions>;
export type RoleCombinationValidation = ReturnType<typeof validateRoleCombinations>;
export type EmailDomainValidation = ReturnType<typeof validateEmailDomain>;

// Export Zod schema types
export type RegisterUserData = z.infer<typeof registerUserSchema>;
export type ValidateRegistrationData = z.infer<typeof validateRegistrationSchema>;
export type CheckPermissionsData = z.infer<typeof checkPermissionsSchema>;
export type RegistrationStatsQuery = z.infer<typeof registrationStatsQuerySchema>;
