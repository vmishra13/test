import { CoreRole } from '@shared/constants';

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
