import { z } from 'zod';
import { userExtraInfoSchema } from '@/shared/schemas/json-schemas';

// ===================================================================
// 🎯 USER MANAGEMENT DTOs (User CRUD and registration types)
// ===================================================================

// User Registration DTOs
export interface UserRegistrationRequest {
  // Required fields
  clientId: number;
  userTypeId: number;
  loginName: string;
  password: string;
  confirmPassword: string;

  // Optional user details
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  dob?: string; // ISO date string
  mrn?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  timeZone?: string;

  // Terms and role assignments
  acceptTerms: boolean;
  roleIds?: number[];
}

export interface UserRegistrationResponse {
  success: boolean;
  data: {
    userId: number;
    user: CreatedUserSummary;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: 'Bearer';
    };
  };
  message: string;
  timestamp: string;
}

export interface CreatedUserSummary {
  id: number;
  loginName: string;
  firstName: string | null; // Changed from undefined to null
  lastName: string | null; // Changed from undefined to null
  email: string | null; // Changed from undefined to null
  clientId: number;
  userTypeId: number;
  status: number | null; // Changed from undefined to null
  createdAt: Date;
}

// UPDATED: UserProfile to match Prisma schema
export interface UserProfile {
  id: number;
  loginName: string;
  firstName: string | null; // Changed from undefined to null
  middleName: string | null; // Changed from undefined to null
  lastName: string | null; // Changed from undefined to null
  email: string | null; // Changed from undefined to null
  dob: Date | null; // Changed from undefined to null
  mrn: string | null; // Changed from undefined to null
  gender: string | null; // Changed from undefined to null
  timeZone: string | null; // Changed from undefined to null
  profilePicture: string | null; // Changed from undefined to null
  passExpireInDays: number | null; // Changed from undefined to null
  status: number | null; // Changed from undefined to null
  client: {
    id: number;
    name: string;
    timeZone: string | null; // Changed from undefined to null
    logo: string | null; // Changed from undefined to null
  };
  userType: {
    id: number;
    name: string;
    description: string | null; // Changed from undefined to null
  };
  roles: UserRoleInfo[];
  contacts: UserContactInfo[];
  createdAt: Date;
  updatedAt: Date | null; // Changed from undefined to null
}

export interface UserRoleInfo {
  id: number;
  name: string;
  description: string | null; // Changed from undefined to null
  assignedAt: Date;
  assignedBy: string;
}

export interface UserContactInfo {
  id: number;
  type: string;
  value: any; // Json field
  isPrimary?: boolean;
  isVerified?: boolean;
}

// UPDATED: UserUpdateRequest to match Prisma schema
export interface UserUpdateRequest {
  firstName?: string | null; // Allow explicit null
  middleName?: string | null; // Allow explicit null
  lastName?: string | null; // Allow explicit null
  email?: string | null; // Allow explicit null
  dob?: string | null; // ISO date string, allow null
  mrn?: string | null; // Allow explicit null
  gender?: string | null; // Allow explicit null
  timeZone?: string | null; // Allow explicit null
  profilePicture?: string | null; // Allow explicit null
  passExpireInDays?: number | null; // Allow explicit null
  status?: number | null; // Allow explicit null
}

export interface UserUpdateResponse {
  success: boolean;
  data: {
    user: UserProfile;
    updatedFields: string[];
  };
  message: string;
  timestamp: string;
}

// UPDATED: UserSearchResult to match Prisma schema
export interface UserSearchResult {
  id: number;
  loginName: string;
  firstName: string | null; // Changed from undefined to null
  lastName: string | null; // Changed from undefined to null
  email: string | null; // Changed from undefined to null
  status: number | null; // Changed from undefined to null
  userType: string;
  roles: string[];
  createdAt: Date;
  lastLogin?: Date; // Make it optional if not always needed
}

export interface UserSearchQuery {
  query?: string;
  clientId?: number;
  userTypeId?: number;
  roleId?: number;
  status?: number;
  page?: number;
  limit?: number;
  sortBy?: 'loginName' | 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResponse {
  success: boolean;
  data: {
    users: UserSearchResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
  timestamp: string;
}

// User Role Management DTOs
export interface AssignRoleRequest {
  userId: number;
  roleId: number;
  clientId: number;
}

export interface RemoveRoleRequest {
  userId: number;
  roleId: number;
  clientId: number;
}

export interface RoleAssignmentResponse {
  success: boolean;
  data: {
    userId: number;
    roleId: number;
    action: 'assigned' | 'removed';
    currentRoles: UserRoleInfo[];
  };
  message: string;
  timestamp: string;
}

// UPDATED: UserStatusUpdateRequest to match Prisma schema
export interface UserStatusUpdateRequest {
  userId: number;
  status: number | null; // Allow explicit null
  reason?: string;
}

export interface UserStatusUpdateResponse {
  success: boolean;
  data: {
    userId: number;
    previousStatus: number | null; // Changed from undefined to null
    newStatus: number | null; // Changed from undefined to null
    reason: string | null; // Changed from undefined to null
    effectiveDate: Date;
  };
  message: string;
  timestamp: string;
}

// Password Management DTOs
export interface SetPasswordRequest {
  userId: number;
  password: string;
  confirmPassword: string;
  mustChange?: boolean;
  temporaryPassword?: boolean;
}

export interface PasswordResetRequest {
  email: string;
  clientId?: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
    expiresAt: Date;
  } | null; // Changed from undefined to null
  timestamp: string;
}

// User Import/Export DTOs
export interface UserImportRequest {
  users: UserRegistrationRequest[];
  clientId: number;
  defaultUserTypeId: number;
  defaultRoleIds?: number[];
  validateOnly?: boolean;
}

export interface UserImportResult {
  userId: number | null; // Changed from undefined to null
  loginName: string;
  status: 'success' | 'error' | 'warning';
  errors: string[] | null; // Changed from undefined to null
  warnings: string[] | null; // Changed from undefined to null
}

export interface UserImportResponse {
  success: boolean;
  data: {
    total: number;
    successful: number;
    failed: number;
    warnings: number;
    results: UserImportResult[];
  };
  message: string;
  timestamp: string;
}

// User Analytics DTOs
export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByType: Record<string, number>;
  usersByRole: Record<string, number>;
  recentRegistrations: number;
  loginActivity: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}

// Contact Management DTOs
export interface ContactCreateRequest {
  type: string;
  value: any;
  userId: number | null; // Changed from undefined to null
  clientId: number | null; // Changed from undefined to null
  locationId: number | null; // Changed from undefined to null
}

export interface ContactUpdateRequest {
  id: number;
  type?: string;
  value?: any;
}

export interface ContactResponse {
  success: boolean;
  data: {
    contact: UserContactInfo;
  };
  message: string;
  timestamp: string;
}

// In your user.dto.ts or user.model.ts file
export interface UserCreationData {
  clientId: number;
  userTypeId: number;
  loginName: string;
  password: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  dob?: Date;
  mrn?: string;
  gender?: string;
  timeZone?: string;
  roleIds?: number[];
}

// src/features/users/dto/user.dto.ts
export interface GetUsersRequest {
  page?: number;
  limit?: number;
  clientId?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface UserSummary {
  id: number;
  loginName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: number;
  roles: string[];
  client: {
    id: number;
    name: string;
  };
  userType: {
    id: number;
    name: string;
  };
  crDate: string;
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: UserSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      clientId?: number;
      role?: string;
      status?: string;
    };
  };
  message: string;
  timestamp: string;
}

// Validation schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  timeZone: z.string().optional(),
  profilePicture: z.string().url().optional(),
  extraInfo: userExtraInfoSchema // ✅ Reuse the JSON schema
});

export const createUserSchema = z.object({
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().min(3).max(50),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  extraInfo: userExtraInfoSchema.optional()
});

// ✅ Infer types from schemas
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
