// ===================================================================
// 🎯 USER MODEL TYPES (Prisma type exports and custom types only)
// ===================================================================

import type {
  user,
  client,
  user_type,
  user_role,
  role,
  password,
  contact,
  client_location,
} from '@db/postgres/generated/postgres-client';

// Re-export Prisma generated types (using your custom client path)
export type {
  user,
  client,
  user_type,
  role,
  user_role,
  password,
  contact,
  client_location,
} from '@db/postgres/generated/postgres-client';

// ===================================================================
// 🏗️ CUSTOM TYPE COMBINATIONS (For Repository Layer)
// ===================================================================

// User with authentication data (for login process)
export type UserWithAuthData = user & {
  client: client;
  user_type: user_type;
  userType?: user_type; // ✅ ADD THIS LINE - Alias for compatibility
  userRole: (user_role & {
    role: role;
  })[];
  password: password[];
};

// User with client info only
export type UserWithClient = user & {
  client: client;
};

// User with roles for authorization
export type UserWithRoles = user & {
  client: client;
  user_type: user_type;
  userRole: (user_role & {
    role: role;
  })[];
};

// User with full profile data
export type UserWithFullProfile = user & {
  client: client;
  user_type: user_type;
  userRole: (user_role & {
    role: role;
  })[];
  contact: contact[];
};

// Client with all relations
export type ClientWithRelations = client & {
  clientLocation: client_location[];
  contact: contact[];
  user?: user[];
};

// Role with user assignments
export type RoleWithRelations = role & {
  userRole: (user_role & {
    user: {
      id: number;
      loginName: string;
      firstName: string | null;
      lastName: string | null;
    };
  })[];
};

// User type with assigned users
export type UserTypeWithRelations = user_type & {
  user: {
    id: number;
    loginName: string;
    firstName: string | null;
    lastName: string | null;
    clientId: number;
    status: number | null;
  }[];
};

// ===================================================================
// 🔧 DATABASE OPERATION TYPES (For Repository Layer)
// ===================================================================

// User creation data (matches Prisma schema exactly)
export type UserCreationData = {
  clientId: number;
  userTypeId: number;
  loginName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  dob?: Date | null;
  mrn?: string | null;
  gender?: string | null;
  timeZone?: string | null;
  profilePicture?: string | null;
  passExpireInDays?: number | null;
  extraInfo?: any; // JSON field
  status?: number | null;
  crUser: string;
  crDate: Date;
};

// User update data
export type UserUpdateData = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  dob?: Date | null;
  mrn?: string | null;
  gender?: string | null;
  timeZone?: string | null;
  profilePicture?: string | null;
  passExpireInDays?: number | null;
  extraInfo?: any;
  status?: number | null;
  modUser: string;
  modDate: Date;
};

// Password creation data (matches schema)
export type PasswordCreationData = {
  userId: number;
  password: string; // bcrypt hashed
  expiryDate?: Date | null;
  status?: number | null;
  crUser: string;
  crDate: Date;
};

// User role assignment data
export type UserRoleAssignmentData = {
  userId: number;
  clientId: number;
  roleId: number;
  crUser: string;
  crDate: Date;
};

// Contact creation data
export type ContactCreationData = {
  type: string; // max 50 chars
  value: any; // JSON
  userId?: number | null;
  clientId?: number | null;
  locationId?: number | null;
  default?: boolean | null;
  status?: string | null; // max 5 chars
  crUser: string;
  crDate: Date;
};

// Client location creation data
export type ClientLocationCreationData = {
  clientId: number;
  name: string; // max 100 chars
  description?: string | null;
  status?: number | null;
  logo?: string | null; // max 2000 chars
  extraInfo?: any; // JSON
  crUser: string;
  crDate: Date;
};

// ===================================================================
// 🔍 QUERY FILTER TYPES (For Repository Layer)
// ===================================================================

// User search filters
export type UserSearchFilters = {
  clientId?: number;
  userTypeId?: number;
  status?: number;
  searchTerm?: string; // searches loginName, firstName, lastName, email
  roleId?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  hasEmail?: boolean;
  isActive?: boolean;
};

// User list options (pagination and sorting)
export type UserListOptions = {
  page?: number;
  limit?: number;
  sortBy?: keyof user | 'crDate' | 'modDate';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
  includeContacts?: boolean;
  includePasswords?: boolean;
};

// Token search filters - using generic object since no refresh_token table exists
export type TokenSearchFilters = {
  userId?: number;
  clientId?: number;
  family?: string;
  jti?: string;
  isRevoked?: boolean | null;
  expiresAfter?: Date;
  expiresBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
};

// Role search filters
export type RoleSearchFilters = {
  name?: string;
  clientId?: number;
  userId?: number;
  isActive?: boolean;
};

// Contact search filters
export type ContactSearchFilters = {
  userId?: number;
  clientId?: number;
  locationId?: number;
  type?: string;
  isDefault?: boolean;
  status?: string;
};

// ===================================================================
// 📊 SUMMARY TYPES (For API Responses)
// ===================================================================

// Minimal user summary (for JWT payload - keep small)
export type UserSummary = {
  id: number;
  loginName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  clientId: number;
  userTypeId: number;
  timeZone: string | null;
  profilePicture: string | null;
  status: number | null;
};

// Public user data (safe for API responses - no sensitive data)
export type PublicUser = {
  id: number;
  loginName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  timeZone: string | null;
  profilePicture: string | null;
  client: {
    id: number;
    name: string;
    timeZone: string | null;
  };
  userType: {
    id: number;
    name: string;
    description: string | null;
  };
  roles: string[]; // Simple array of role names
};

// User roles summary for authorization
export type UserRolesSummary = {
  userId: number;
  clientId: number;
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
};

// Active tokens summary (for security monitoring) - using generic object
export type ActiveTokensSummary = {
  userId: number;
  clientId: number;
  activeTokenCount: number;
  tokens: Array<{
    id: number;
    jti: string;
    family: string;
    expiresAt: Date;
    crDate: Date | null;
  }>;
};

// User with password summary (for authentication only)
export type UserPasswordSummary = {
  userId: number;
  hasActivePassword: boolean;
  passwordExpiryDate: Date | null;
  mustChangePassword: boolean;
  lastPasswordChange: Date | null;
};

// ===================================================================
// 🔢 CONSTANTS (Business Rules from Database)
// ===================================================================

export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  SUSPENDED: -1,
  DELETED: -99,
} as const;

export const USER_TYPES = {
  SUPER_ADMIN: 1,
  CLIENT_ADMIN: 2,
  CLINICAL_STAFF: 3,
  OFFICE_STAFF: 4,
  PATIENT: 5,
} as const;

export const PASSWORD_STATUS = {
  ACTIVE: 1,
  EXPIRED: 0,
  DISABLED: -1,
} as const;

export const CONTACT_STATUS = {
  ACTIVE: '1',
  INACTIVE: '0',
  DELETED: '-1',
} as const;

export const CLIENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  SUSPENDED: -1,
  DELETED: -99,
} as const;

// ===================================================================
// 🛡️ TYPE GUARDS (Runtime Type Checking)
// ===================================================================

export function isValidUserStatus(status: number): boolean {
  return Object.values(USER_STATUS).includes(status as any);
}

export function isActiveUser(user: user): boolean {
  return user.status === USER_STATUS.ACTIVE;
}

export function hasRequiredUserData(user: Partial<user>): user is user {
  return !!(user.id && user.loginName && user.clientId && user.userTypeId);
}

export function isUserInClient(user: user, clientId: number): boolean {
  return user.clientId === clientId;
}

export function hasValidEmail(user: user): boolean {
  return !!(user.email && user.email.includes('@'));
}

export function canUserAuthenticate(user: user): boolean {
  return user.status === USER_STATUS.ACTIVE;
}

export function isActivePassword(password: password): boolean {
  if (password.status !== PASSWORD_STATUS.ACTIVE) return false;
  if (password.expiryDate && password.expiryDate <= new Date()) return false;
  return true;
}

// ===================================================================
// 🔧 UTILITY FUNCTIONS (Business Logic Helpers)
// ===================================================================

export function generateTokenFamily(): string {
  return `fam_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function calculateTokenExpiration(durationInSeconds: number): Date {
  return new Date(Date.now() + durationInSeconds * 1000);
}

export function getUserFullName(user: user): string {
  const parts = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .filter(part => part?.trim());

  return parts.length > 0 ? parts.join(' ') : user.loginName;
}

export function getUserDisplayName(user: user): string {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  return user.loginName;
}

export function formatUserForDisplay(user: user): string {
  const displayName = getUserDisplayName(user);
  return displayName !== user.loginName ? `${displayName} (${user.loginName})` : user.loginName;
}

export function calculatePasswordExpiry(user: user): Date | null {
  if (!user.passExpireInDays) return null;
  return new Date(Date.now() + user.passExpireInDays * 24 * 60 * 60 * 1000);
}

export function isPasswordExpiringSoon(password: password, daysThreshold: number = 7): boolean {
  if (!password.expiryDate) return false;
  const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
  return password.expiryDate <= threshold;
}

// ===================================================================
// 🎯 MODEL UTILITIES (Helper Objects)
// ===================================================================

export const UserUtils = {
  isActive: (user: user) => user.status === USER_STATUS.ACTIVE,
  canAuthenticate: canUserAuthenticate,
  isInClient: isUserInClient,
  getFullName: getUserFullName,
  getDisplayName: getUserDisplayName,
  formatForDisplay: formatUserForDisplay,
  hasValidData: hasRequiredUserData,
  hasValidEmail: hasValidEmail,
  calculatePasswordExpiry: calculatePasswordExpiry,
} as const;

export const PasswordUtils = {
  isActive: isActivePassword,
  isExpiringSoon: isPasswordExpiringSoon,
  calculateExpiry: calculatePasswordExpiry,
} as const;

export const StatusUtils = {
  user: {
    isValid: isValidUserStatus,
    isActive: (status: number | null) => status === USER_STATUS.ACTIVE,
    isInactive: (status: number | null) => status === USER_STATUS.INACTIVE,
    isSuspended: (status: number | null) => status === USER_STATUS.SUSPENDED,
    isDeleted: (status: number | null) => status === USER_STATUS.DELETED,
  },
  password: {
    isActive: (status: number | null) => status === PASSWORD_STATUS.ACTIVE,
    isExpired: (status: number | null) => status === PASSWORD_STATUS.EXPIRED,
    isDisabled: (status: number | null) => status === PASSWORD_STATUS.DISABLED,
  },
  client: {
    isActive: (status: number | null) => status === CLIENT_STATUS.ACTIVE,
    isInactive: (status: number | null) => status === CLIENT_STATUS.INACTIVE,
    isSuspended: (status: number | null) => status === CLIENT_STATUS.SUSPENDED,
    isDeleted: (status: number | null) => status === CLIENT_STATUS.DELETED,
  },
} as const;

// ===================================================================
// 🧪 TYPE PREDICATES (For Runtime Validation)
// ===================================================================

// export const TypeGuards = {
//   isUser: (obj: any): obj is user => hasRequiredUserData(obj),

//   isUserWithAuthData: (obj: any): obj is UserWithAuthData =>
//     obj && hasRequiredUserData(obj) && obj.clientId && obj.userTypeId && obj.userRole,

//   isRefreshToken: (obj: any): obj is refresh_token =>
//     obj &&
//     typeof obj.token === 'string' &&
//     obj.expiresAt instanceof Date &&
//     typeof obj.jti === 'string',

//   isClient: (obj: any): obj is client =>
//     obj && typeof obj.id === 'number' && typeof obj.name === 'string',

//   isRole: (obj: any): obj is role =>
//     obj && typeof obj.id === 'number' && typeof obj.name === 'string',

//   isPassword: (obj: any): obj is password =>
//     obj &&
//     typeof obj.id === 'number' &&
//     typeof obj.userId === 'number' &&
//     typeof obj.password === 'string',

//   isContact: (obj: any): obj is contact =>
//     obj && typeof obj.id === 'number' && typeof obj.type === 'string' && obj.value,
// } as const;

// ===================================================================
// 🎯 CONVERSION HELPERS (Model ↔ DTO)
// ===================================================================

export const ModelConverters = {
  // Convert full user to public user (safe for API)
  userToPublic: (user: UserWithRoles): PublicUser => ({
    id: user.id,
    loginName: user.loginName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    timeZone: user.timeZone,
    profilePicture: user.profilePicture,
    client: {
      id: user.client.id,
      name: user.client.name,
      timeZone: user.client.timeZone,
    },
    userType: {
      id: user.user_type.id,
      name: user.user_type.name,
      description: user.user_type.description,
    },
    roles: user.userRole.map(ur => ur.role.name),
  }),

  // Convert user to summary (for JWT)
  userToSummary: (user: user): UserSummary => ({
    id: user.id,
    loginName: user.loginName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    clientId: user.clientId,
    userTypeId: user.userTypeId,
    timeZone: user.timeZone,
    profilePicture: user.profilePicture,
    status: user.status,
  }),
} as const;
