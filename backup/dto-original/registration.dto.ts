import { CoreRole } from '../../../shared/constants';

/**
 * Registration request from client
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

// ===================================================================
// MOBILE REGISTRATION DTOX
// ===================================================================

/**
 * Mobile Registration request for mobile app
 */
export interface MobileRegistrationRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  clientId: number; // Required for multi-tenancy
}

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
// PERSONAL INFORMATION
// ===================================================================
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

// ===================================================================
// ONBOARDING
// ===================================================================
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
