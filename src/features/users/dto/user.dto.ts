/**
 * UNIFIED USER DTOs - HIPAA COMPLIANT & MULTI-TENANT
 *
 * This file contains all user-related Data Transfer Objects organized by functionality:
 * - Strict multi-tenant security isolation
 * - HIPAA/PHI compliance
 * - Role-based access control
 * - Consistent validation and typing
 *
 * CATEGORIES:
 * 1. 🔐 Authentication & Registration DTOs
 * 2. 👤 User Profile & Management DTOs
 * 3. 🔍 User Search & Query DTOs
 * 4. 🔒 Role & Permission Management DTOs
 * 5. 🔑 Password & Security DTOs
 * 6. 📱 Mobile Application DTOs
 * 7. 🎯 Onboarding & Profile Setup DTOs
 * 8. 👨‍⚕️ Healthcare Provider DTOs
 * 9. 📊 Analytics & Reporting DTOs
 * 10. 🔧 Internal Service DTOs
 * 11. ✅ Validation Schemas
 */

import { z } from 'zod';
import { CoreRole } from '@shared/constants';
import { userExtraInfoSchema } from '../validators/user.validators';

// ===================================================================
// 🔐 AUTHENTICATION & REGISTRATION DTOs
// ===================================================================

/**
 * Standard user registration request for admin/web applications
 */
export interface RegisterUserRequest {
  // Required user data
  loginName: string;
  password: string;
  clientId: number;
  userTypeId: number;
  roles: CoreRole[];

  // Optional user data
  firstName?: string;
  lastName?: string;
  email?: string;
  sendWelcomeEmail?: boolean;
  temporaryPassword?: boolean;
  timeZone?: string;
  profilePicture?: string;
}

/**
 * Registration response to client
 */
export interface RegisterUserResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      loginName: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      timeZone: string | null;
      profilePicture: string | null;
      status: number | null;
      crDate: string; // ISO string for API
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
      roles: string[];
    };
    temporaryPassword?: string;
  };
  message: string;
  timestamp: string;
}

/**
 * Summary of created user for registration responses
 */
export interface CreatedUserSummary {
  id: number;
  loginName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  clientId: number;
  userTypeId: number;
  status: number | null;
  createdAt: Date;
}

// ===================================================================
// 📱 MOBILE APPLICATION DTOs
// ===================================================================

/**
 * Mobile app registration request
 */
export interface MobileRegistrationRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  clientId: number; // Required for multi-tenancy
}

/**
 * Mobile app registration response
 */
export interface MobileRegistrationResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      loginName: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    onboardingRequired: boolean;
  };
}

// ===================================================================
// 👤 USER PROFILE & MANAGEMENT DTOs
// ===================================================================

/**
 * Complete user profile with all related data
 */
export interface UserProfile {
  id: number;
  loginName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string | null;
  dob: Date | null;
  mrn: string | null;
  gender: string | null;
  timeZone: string | null;
  profilePicture: string | null;
  passExpireInDays: number | null;
  status: number | null;
  client: {
    id: number;
    name: string;
    timeZone: string | null;
    logo: string | null;
  };
  userType: {
    id: number;
    name: string;
    description: string | null;
  };
  roles: UserRoleInfo[];
  contacts: UserContactInfo[];
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * User role information
 */
export interface UserRoleInfo {
  id: number;
  name: string;
  description: string | null;
  assignedAt: Date;
  assignedBy: string;
}

/**
 * User contact information
 */
export interface UserContactInfo {
  id: number;
  type: string;
  value: any; // Json field
  isPrimary?: boolean;
  isVerified?: boolean;
}

/**
 * User update request
 */
export interface UserUpdateRequest {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  dob?: string | null; // ISO date string, allow null
  mrn?: string | null;
  gender?: string | null;
  timeZone?: string | null;
  profilePicture?: string | null;
  passExpireInDays?: number | null;
  status?: number | null;
}

/**
 * User update response
 */
export interface UserUpdateResponse {
  success: boolean;
  data: {
    user: UserProfile;
    updatedFields: string[];
  };
  message: string;
  timestamp: string;
}

/**
 * User summary for listings
 */
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

/**
 * Status update request
 */
export interface UserStatusUpdateRequest {
  userId: number;
  status: number | null;
  reason?: string;
}

/**
 * Status update response
 */
export interface UserStatusUpdateResponse {
  success: boolean;
  data: {
    userId: number;
    previousStatus: number | null;
    newStatus: number | null;
    reason: string | null;
    effectiveDate: Date;
  };
  message: string;
  timestamp: string;
}

// ===================================================================
// � USER SEARCH & QUERY DTOs
// ===================================================================

/**
 * User search query parameters
 */
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

/**
 * User search result item
 */
export interface UserSearchResult {
  id: number;
  loginName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: number | null;
  userType: string;
  roles: string[];
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * User search response
 */
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

/**
 * Get users request
 */
export interface GetUsersRequest {
  page?: number;
  limit?: number;
  clientId?: number;
  role?: string;
  status?: string;
  search?: string;
}

/**
 * Get users response
 */
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

// ===================================================================
// 🔒 ROLE & PERMISSION MANAGEMENT DTOs
// ===================================================================

/**
 * Assign role request
 */
export interface AssignRoleRequest {
  userId: number;
  roleId: number;
  clientId: number;
}

/**
 * Remove role request
 */
export interface RemoveRoleRequest {
  userId: number;
  roleId: number;
  clientId: number;
}

/**
 * Role assignment response
 */
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

// ===================================================================
// 🔑 PASSWORD & SECURITY DTOs
// ===================================================================

/**
 * Set password request
 */
export interface SetPasswordRequest {
  userId: number;
  password: string;
  confirmPassword: string;
  mustChange?: boolean;
  temporaryPassword?: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  clientId?: number;
}

/**
 * Password reset response
 */
export interface PasswordResetResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
    expiresAt: Date;
  } | null;
  timestamp: string;
}

// ===================================================================
// 🎯 ONBOARDING & PROFILE SETUP DTOs
// ===================================================================

/**
 * Personal information request
 */
export interface PersonalInfoRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
}

/**
 * Personal information response
 */
export interface PersonalInfoResponse {
  success: boolean;
  data: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      phoneNumber?: string;
      gender?: string;
      emergencyContact?: any;
      address?: any;
    };
    onboardingProgress: {
      currentStep: string;
      completedSteps: string[];
      totalSteps: number;
      isComplete: boolean;
    };
  };
}

/**
 * Onboarding status response
 */
export interface OnboardingStatusResponse {
  success: boolean;
  data: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    isComplete: boolean;
    progress: number; // 0-100
    nextSteps: string[];
  };
}

/**
 * Onboarding complete response
 */
export interface OnboardingCompleteResponse {
  success: boolean;
  data: {
    completedAt: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      onboardingComplete: boolean;
    };
    nextSteps: string[];
  };
}

// ===================================================================
// 👨‍⚕️ HEALTHCARE PROVIDER DTOs
// ===================================================================

/**
 * Doctor selection request
 */
export interface DoctorSelectionRequest {
  doctorId: number;
  preferredAppointmentTime?: string;
  notes?: string;
}

/**
 * Doctor information
 */
export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  title: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  profilePictureUrl?: string;
  availableSlots?: string[];
  clientId: number; // Multi-tenant support
  location?: {
    clinic: string;
    address: string;
    city: string;
    state: string;
  };
}

/**
 * Doctor selection response
 */
export interface DoctorSelectionResponse {
  success: boolean;
  data: {
    selectedDoctor: Doctor;
    appointmentScheduled?: boolean;
    nextSteps: string[];
  };
}

/**
 * Doctors list response
 */
export interface DoctorsListResponse {
  success: boolean;
  data: {
    doctors: Doctor[];
    total: number;
    filters: {
      specializations: string[];
      locations: string[];
    };
  };
}

// ===================================================================
// 📊 ANALYTICS & REPORTING DTOs
// ===================================================================

/**
 * User analytics data
 */
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

/**
 * User import request
 */
export interface UserImportRequest {
  users: RegisterUserRequest[];
  clientId: number;
  defaultUserTypeId: number;
  defaultRoleIds?: number[];
  validateOnly?: boolean;
}

/**
 * User import result
 */
export interface UserImportResult {
  userId: number | null;
  loginName: string;
  status: 'success' | 'error' | 'warning';
  errors: string[] | null;
  warnings: string[] | null;
}

/**
 * User import response
 */
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

// ===================================================================
// 🔧 INTERNAL SERVICE DTOs
// ===================================================================

/**
 * Internal service data for user creation
 */
export interface CreateUserData {
  loginName: string;
  clientId: number;
  userTypeId: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  timeZone?: string | null;
  profilePicture?: string | null;
  status: number | null;
  crUser: string;
  crDate?: Date;
  modUser?: string | null;
  modDate?: Date | null;
}

/**
 * Internal service data for password creation
 */
export interface CreatePasswordData {
  userId: number;
  password: string;
  status: number | null;
  crUser: string;
  crDate?: Date;
  modUser?: string | null;
  modDate?: Date | null;
}

/**
 * Internal service data for role assignment
 */
export interface AssignRoleData {
  userId: number;
  clientId: number;
  roleId: number;
  crUser: string;
  crDate?: Date;
  modUser?: string | null;
  modDate?: Date | null;
}

/**
 * Repository layer transaction data
 */
export interface CreateUserWithRolesData {
  userData: CreateUserData;
  password: string;
  roleIds: number[];
  createdBy: string;
}

/**
 * User creation result from repository
 */
export interface CreateUserResult {
  user: {
    id: number;
    loginName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    timeZone: string | null;
    profilePicture: string | null;
    clientId: number;
    userTypeId: number;
    status: number | null;
    crUser: string;
    crDate: Date;
    modUser: string | null;
    modDate: Date | null;
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
  };
  roles: {
    id: number;
    name: string;
    description: string | null;
  }[];
}

/**
 * Registration business rules validation
 */
export interface RegistrationValidationRules {
  currentUser: {
    role: CoreRole;
    clientId: number;
    loginName: string;
  };
  targetClientId: number;
  targetRoles: CoreRole[];
  targetUserTypeId: number;
}

/**
 * Client validation result
 */
export interface ClientValidationResult {
  id: number;
  name: string;
  status: number;
  isActive: boolean;
}

/**
 * User type validation result
 */
export interface UserTypeValidationResult {
  id: number;
  name: string;
  description?: string;
  isValid: boolean;
}

/**
 * User creation data for internal use
 */
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

/**
 * Contact creation request
 */
export interface ContactCreateRequest {
  type: string;
  value: any;
  userId: number | null;
  clientId: number | null;
  locationId: number | null;
}

/**
 * Contact update request
 */
export interface ContactUpdateRequest {
  id: number;
  type?: string;
  value?: any;
}

/**
 * Contact response
 */
export interface ContactResponse {
  success: boolean;
  data: {
    contact: UserContactInfo;
  };
  message: string;
  timestamp: string;
}

// ===================================================================
// ✅ VALIDATION SCHEMAS
// ===================================================================

/**
 * User update validation schema
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  timeZone: z.string().optional(),
  profilePicture: z.string().url().optional(),
  extraInfo: userExtraInfoSchema.optional(),
});

/**
 * User creation validation schema
 */
export const createUserSchema = z.object({
  clientId: z.number().int().positive(),
  userTypeId: z.number().int().positive(),
  loginName: z.string().min(3).max(50),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  extraInfo: userExtraInfoSchema.optional(),
});

/**
 * Inferred types from validation schemas
 */
export type UpdateUserRequestSchema = z.infer<typeof updateUserSchema>;
export type CreateUserRequestSchema = z.infer<typeof createUserSchema>;

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
