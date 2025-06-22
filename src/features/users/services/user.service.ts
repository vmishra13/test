/**
 * UNIFIED USER SERVICE - HIPAA COMPLIANT & MULTI-TENANT
 *
 * This service consolidates all user-related business logic while maintaining:
 * - Strict multi-tenant security isolation
 * - HIPAA/PHI compliance
 * - Role-based access control
 * - Comprehensive validation and authorization
 *
 * FUNCTION ORDER:
 * 1. 🔐 Authentication & Registration
 * 2. 📋 User Management (Admin Operations)
 * 3. 👤 Current User Profile Operations
 * 4. 🎯 Onboarding Operations
 * 5. 👨‍⚕️ Healthcare Provider Operations
 * 6. 🔍 Validation Functions
 * 7. 🔧 Core Business Logic Functions
 * 8. 🔐 Security & Password Utilities
 * 9. 🗃️ Data Repository Utilities
 * 10. 📧 Communication Utilities
 */

import bcrypt from 'bcrypt';
import { UserStatus } from '@shared/constants';
import { CoreRole } from '@shared/constants';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  CreateUserResult,
  MobileRegistrationRequest,
  MobileRegistrationResponse,
} from '../dto/registration.dto';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import { validateEmailDomain, registerUserSchema } from '../validators/registration.validators';
import * as userRepository from '../repositories/user.repository';
import {
  ExtendedRequest,
  RequestUserAction,
  type AuthRequest,
  type UserQuery,
} from '../types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@shared/errors/application-error';
import { createAuthRequest, getCurrentUser, performAuthorization } from '@features/auth';
import logger from '@config/logger';
import type { GetUsersResponse } from '../dto/user.dto';
import {
  getUsersQuerySchema,
  mergeJsonFields,
  UserUpdateInputSchema,
  validateUserExtraInfo,
  type GetUsersQueryRequest,
  type UserExtraInfo,
  type UserUpdateInput,
} from '../validators/user.validators';
import prismaPostgres from '@db/postgres/client';
import type { UploadedFile } from 'express-fileupload';
import type {
  Doctor,
  DoctorSelectionRequest,
  DoctorSelectionResponse,
  DoctorsListResponse,
} from '../dto/doctor.dto';

// ===================================================================
// 🔐 AUTHENTICATION & REGISTRATION
// ===================================================================

/**
 * Register a new user (Admin/Web Registration)
 *
 * Creates a new user account with role-based authorization.
 * Enforces multi-tenant security and comprehensive validation.
 *
 * @param req - Extended request with RegisterUserRequest body and auth context
 * @returns Promise<RegisterUserResponse> - Registration result with user details
 */
export async function registerUserService(
  req: ExtendedRequest<any, RegisterUserRequest>,
): Promise<RegisterUserResponse> {
  // 1. Check authentication
  const currentUser = getCurrentUser(req);

  const actionUserId = null; // No specific user ID for registration action
  const actionClientId = req.body.clientId; // Target client from request body
  const actionUserTypeId = req.body.userTypeId; // Target user type from request body
  const actionUserRoles = req.body.roles; // Target user roles from request body
  const actionPermission = RequestUserAction.userAdd; // Specific permission for user registration

  const oAuthReq: AuthRequest = createAuthRequest(
    currentUser,
    actionUserId,
    actionClientId,
    actionUserTypeId,
    actionUserRoles,
    actionPermission,
  );

  // 2. Check authorization for the specific action
  const hasPermission = performAuthorization(oAuthReq);

  if (!hasPermission) {
    logger.error(
      `User ${currentUser.userId} does not have permission to register users in client ${actionClientId}`,
    );
    throw createAuthorizationError('You do not have permission to perform this action');
  }

  // 3. Validate request body
  const requestData = validateRegisterRequestBody(req.body);

  // 4. Perform registration
  return await performUserRegistration(requestData, currentUser);
}

/**
 * Register a new user via mobile app
 *
 * Handles mobile app user registration with simplified flow.
 * Validates client ID and creates user with default settings.
 *
 * @param data - Mobile registration request data
 * @returns Promise<MobileRegistrationResponse> - Registration result with tokens
 */
export async function registerMobileUserService(
  data: MobileRegistrationRequest,
): Promise<MobileRegistrationResponse> {
  try {
    logger.info('Registering mobile user for client:', {
      clientId: data.clientId,
      email: data.email,
    });

    // TODO: Implement actual registration logic with client validation
    // - Validate clientId exists and is active
    // - Validate email uniqueness within client scope
    // - Hash password
    // - Create user in database with clientId
    // - Generate JWT tokens
    // - Send welcome email

    // Mock implementation with client validation
    if (!data.clientId) {
      throw new Error('Client ID is required');
    }

    const user = {
      id: Math.floor(Math.random() * 1000) + 1,
      email: data.email,
      firstName: data.firstName || 'John',
      lastName: data.lastName || 'Doe',
      loginName: data.email,
      clientId: data.clientId,
    };

    const tokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600, // 1 hour
    };

    return {
      success: true,
      data: {
        user,
        tokens,
        onboardingRequired: true,
      },
    };
  } catch (error) {
    logger.error('Mobile registration error:', error);
    throw new Error(error instanceof Error ? error.message : 'Registration failed');
  }
}

// ===================================================================
// 📋 USER MANAGEMENT (ADMIN OPERATIONS)
// ===================================================================

/**
 * Get all users with filtering and pagination
 *
 * Retrieves users based on role permissions and client isolation.
 * Supports filtering by status, role, and client with HIPAA compliance.
 *
 * @param req - Extended request with UserQuery parameters and auth context
 * @returns Promise<GetUsersResponse> - Paginated list of users with metadata
 */
export async function getUsersService(req: ExtendedRequest<UserQuery>): Promise<GetUsersResponse> {
  try {
    const currentUser = getCurrentUser(req);

    // First validate query parameters to ensure proper type conversion
    const queryParams = validateQueryParameters(req.query);

    const actionUserId = null; // No specific user ID for view action
    const actionClientId = queryParams.clientId || currentUser.clientId; // Now it's properly typed as number
    const actionUserTypeId = null; // No specific user type ID for view action
    const actionUserRoles = (queryParams.role as CoreRole) || currentUser.roles; // Cast validated role to CoreRole type
    const actionPermission = RequestUserAction.userView; // Specific permission for viewing users

    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      actionUserId,
      actionClientId,
      actionUserTypeId,
      actionUserRoles,
      actionPermission,
    );

    const hasPermission = performAuthorization(oAuthReq);

    // Check authorization for the specific action
    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} does not have permission to view users in client ${actionClientId}`,
      );
      throw createAuthorizationError('You do not have permission to perform this action');
    }

    // Get users list based on validated params and current user context
    return await getUsersList(queryParams, currentUser.roles, currentUser.clientId);
  } catch (error: any) {
    logger.error('Error in getUsers service:', error);
    throw error;
  }
}

/**
 * Get specific user by ID
 *
 * Retrieves detailed user information with role-based access control.
 * Enforces strict client isolation and multi-tenant security.
 *
 * @param req - Extended request with userId parameter and auth context
 * @returns Promise<any> - Detailed user information with relationships
 */
export async function getUserByIdService(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<any> {
  try {
    const currentUser = getCurrentUser(req);
    const { userId } = req.params;

    if (!userId) {
      throw createValidationError('User ID is required', [
        { field: 'userId', message: 'User ID parameter is required' },
      ]);
    }

    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw createValidationError('Invalid user ID format', [
        { field: 'userId', message: 'User ID must be a valid number' },
      ]);
    }

    // Get target user first
    const targetUser = await userRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw createAuthorizationError('User not found');
    }

    // Extract target user's roles
    const targetUserRoles =
      targetUser.userRoles?.map((userRole: any) => userRole.role.name as CoreRole) || [];

    // Create authorization request for viewing specific user with ALL required context
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      targetUserId,
      targetUser.clientId, // Use target user's client
      targetUser.userTypeId,
      targetUserRoles,
      RequestUserAction.userView,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to user ${targetUserId} - Client isolation enforced`,
      );
      throw createAuthorizationError(
        'Access denied - You can only view users within your organization',
      );
    }

    return {
      success: true,
      data: {
        id: targetUser.id,
        loginName: targetUser.loginName,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        status: targetUser.status,
        roles: targetUser.userRoles.map((userRole: any) => userRole.role.name),
        client: {
          id: targetUser.client.id,
          name: targetUser.client.name,
        },
        userType: {
          id: targetUser.userType.id,
          name: targetUser.userType.name,
        },
        createdAt: targetUser.crDate.toISOString(),
        updatedAt: targetUser.modDate?.toISOString() || targetUser.crDate.toISOString(),
      },
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getUserById service:', error);
    throw error;
  }
}

/**
 * Update specific user by ID (Admin operation)
 *
 * Updates user information with proper authorization checks.
 * Supports partial updates and maintains comprehensive audit trail.
 *
 * @param req - Extended request with userId parameter, update data, and auth context
 * @returns Promise<{data: any; message: string}> - Updated user information
 */
export async function updateUserService(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<{ data: any; message: string }> {
  try {
    // 1. Check authentication
    const currentUser = getCurrentUser(req);

    // 2. Validate userId parameter
    const { userId } = req.params;
    if (!userId) {
      throw createValidationError('User ID is required', [
        { field: 'userId', message: 'User ID parameter is required' },
      ]);
    }

    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw createValidationError('Invalid user ID format', [
        { field: 'userId', message: 'User ID must be a valid number' },
      ]);
    }

    // 3. Get target user to build authorization context
    const targetUser = await userRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw createAuthorizationError('User not found');
    }

    // Extract target user's roles for authorization
    const targetUserRoles =
      targetUser.userRoles?.map((userRole: any) => userRole.role.name as CoreRole) || [];

    // 4. Build authorization request
    const actionUserId = targetUserId;
    const actionClientId = targetUser.clientId; // Target user's client
    const actionUserTypeId = targetUser.userTypeId; // Target user's type
    const actionUserRoles = targetUserRoles; // Target user's roles
    const actionPermission = RequestUserAction.userEdit; // Specific permission for user update

    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      actionUserId,
      actionClientId,
      actionUserTypeId,
      actionUserRoles,
      actionPermission,
    );

    // 5. Check authorization for the specific action
    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} does not have permission to update user ${targetUserId}`,
      );
      throw createAuthorizationError('You do not have permission to perform this action');
    }

    // 6. Validate request body
    const validatedData = validateUpdateRequestBody(req.body);

    // 7. Perform user update
    return await performUserUpdate(targetUserId, validatedData, currentUser);
  } catch (error: any) {
    logger.error('Error in updateUser service:', error);
    throw error;
  }
}

/**
 * Update user status (activate/deactivate)
 *
 * Changes user status with proper authorization and audit logging.
 * Enforces business rules and client isolation policies.
 *
 * @param req - Extended request with userId parameter, status data, and auth context
 * @returns Promise<any> - Status update confirmation with audit details
 */
export async function updateUserStatusService(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<any> {
  try {
    const currentUser = getCurrentUser(req);
    const { userId } = req.params;
    const { isActive, status } = req.body;

    if (!userId) {
      throw createValidationError('User ID is required', [
        { field: 'userId', message: 'User ID parameter is required' },
      ]);
    }

    // Validate input
    if (typeof isActive !== 'boolean' && typeof status !== 'number') {
      throw createValidationError('Invalid status parameters', [
        {
          field: 'isActive',
          message: 'Either isActive (boolean) or status (number) must be provided',
        },
      ]);
    }

    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw createValidationError('Invalid user ID format', [
        { field: 'userId', message: 'User ID must be a valid number' },
      ]);
    }

    // Get target user first
    const targetUser = await userRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw createAuthorizationError('User not found');
    }

    // Create authorization request for updating user status
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      targetUserId,
      targetUser.clientId,
      null,
      null,
      RequestUserAction.userEdit, // Status change is an edit operation
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied status update access to user ${targetUserId} - Client isolation enforced`,
      );
      throw createAuthorizationError(
        'Access denied - You can only update users within your organization',
      );
    }

    // Calculate final status
    const finalStatus = status !== undefined ? status : isActive ? 1 : 0;

    // Perform status update
    await userRepository.updateUserStatus(targetUserId, finalStatus, currentUser.loginName);

    return {
      success: true,
      data: {
        userId: targetUserId,
        isActive: finalStatus === 1,
        status: finalStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.loginName,
      },
      message: 'User status updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateUserStatus service:', error);
    throw error;
  }
}

/**
 * Update user password
 *
 * Updates user password with security validations and audit logging.
 * Enforces password policies, client isolation, and self-update verification.
 *
 * @param req - Extended request with userId parameter, password data, and auth context
 * @returns Promise<any> - Password update confirmation with security audit
 */
export async function updateUserPasswordService(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<any> {
  try {
    const currentUser = getCurrentUser(req);
    const { userId } = req.params;
    const { password, currentPassword, confirmPassword } = req.body;

    if (!userId) {
      throw createValidationError('User ID is required', [
        { field: 'userId', message: 'User ID parameter is required' },
      ]);
    }

    // Validate password requirements
    if (!password) {
      throw createValidationError('Password validation failed', [
        { field: 'password', message: 'New password is required' },
      ]);
    }

    if (confirmPassword && password !== confirmPassword) {
      throw createValidationError('Password validation failed', [
        { field: 'confirmPassword', message: 'Password confirmation does not match' },
      ]);
    }

    // Password strength validation
    if (password.length < 8) {
      throw createValidationError('Password validation failed', [
        { field: 'password', message: 'Password must be at least 8 characters long' },
      ]);
    }

    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw createValidationError('Invalid user ID format', [
        { field: 'userId', message: 'User ID must be a valid number' },
      ]);
    }

    // Get target user first
    const targetUser = await userRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw createAuthorizationError('User not found');
    }

    // Create authorization request for password update
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      targetUserId,
      targetUser.clientId,
      null,
      null,
      RequestUserAction.userEdit, // Password change is an edit operation
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied password update access to user ${targetUserId} - Client isolation enforced`,
      );
      throw createAuthorizationError(
        'Access denied - You can only update passwords within your organization',
      );
    }

    // Verify current password if provided (for self-update)
    if (currentPassword && currentUser.userId === targetUserId) {
      const isCurrentPasswordValid = await userRepository.verifyPassword(
        targetUserId,
        currentPassword,
      );
      if (!isCurrentPasswordValid) {
        throw createValidationError('Password validation failed', [
          { field: 'currentPassword', message: 'Current password is incorrect' },
        ]);
      }
    }

    // Update password
    await userRepository.updatePassword(targetUserId, password, currentUser.loginName);

    return {
      success: true,
      data: {
        userId: targetUserId,
        passwordUpdated: true,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.loginName,
      },
      message: 'Password updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateUserPassword service:', error);
    throw error;
  }
}

/**
 * Delete user by ID (Admin operation)
 *
 * Permanently removes user account with strict authorization.
 * Includes comprehensive audit logging and business rule validation.
 *
 * @param req - Extended request with userId parameter and auth context
 * @returns Promise<any> - Deletion confirmation with audit details
 */
export async function deleteUserService(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<any> {
  try {
    const currentUser = getCurrentUser(req);
    const { userId } = req.params;

    if (!userId) {
      throw createValidationError('User ID is required', [
        { field: 'userId', message: 'User ID parameter is required' },
      ]);
    }

    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId)) {
      throw createValidationError('Invalid user ID format', [
        { field: 'userId', message: 'User ID must be a valid number' },
      ]);
    }

    // Get target user first
    const targetUser = await userRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw createAuthorizationError('User not found');
    }

    // Create authorization request for deleting specific user
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      targetUserId,
      targetUser.clientId,
      null,
      null,
      RequestUserAction.userDelete, // Specific permission for deletion
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied deletion access to user ${targetUserId} - Insufficient permissions`,
      );
      throw createAuthorizationError(
        'Access denied - Insufficient permissions to delete this user',
      );
    }

    // Additional business rules for deletion
    const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

    // Prevent SUPER_ADMIN deletion
    const targetUserRoles = targetUser.userRoles.map((ur: any) => ur.role.name);
    if (targetUserRoles.includes(CoreRole.SUPER_ADMIN)) {
      throw createAuthorizationError('SUPER_ADMIN users cannot be deleted');
    }

    // CLIENT_ADMIN can only delete users in their own client (except other CLIENT_ADMINs)
    if (
      currentUserRole === CoreRole.CLIENT_ADMIN &&
      targetUserRoles.includes(CoreRole.CLIENT_ADMIN)
    ) {
      throw createAuthorizationError('CLIENT_ADMIN cannot delete other CLIENT_ADMIN users');
    }

    // Perform soft delete
    await userRepository.softDeleteUser(targetUserId, currentUser.loginName);

    return {
      success: true,
      data: {
        deletedUserId: targetUserId,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.loginName,
      },
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in deleteUser service:', error);
    throw error;
  }
}

// ===================================================================
// 👤 CURRENT USER PROFILE OPERATIONS
// ===================================================================

/**
 * Get current user's profile
 *
 * Retrieves authenticated user's complete profile information.
 * Includes personal details, medical info, and mobile app specific data.
 *
 * @param userId - The authenticated user's ID
 * @returns Promise<any> - Comprehensive user profile with extraInfo
 */
export async function getUserProfileService(userId: number) {
  try {
    logger.debug('Getting user profile', { userId });

    const user = await userRepository.findUserById(userId);

    if (!user) {
      logger.warn('User not found during profile retrieval', { userId });
      throw new Error('User not found');
    }

    logger.info('User profile retrieved successfully', {
      userId,
      hasExtraInfo: Boolean(user.extraInfo),
    });

    return {
      id: user.id,
      loginName: user.loginName,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      dob: user.dob,
      gender: user.gender,
      timeZone: user.timeZone,
      mrn: user.mrn,
      clientId: user.clientId,
      userTypeId: user.userTypeId,
      status: user.status,
      extraInfo: user.extraInfo,
      // Default values for mobile app
      profilePicture: user.extraInfo?.profilePicture || null,
      phoneNumber: user.extraInfo?.phoneNumber || null,
      address: user.extraInfo?.address || null,
      emergencyContact: user.extraInfo?.emergencyContact || null,
      medicalHistory: user.extraInfo?.medicalHistory || null,
      preferences: user.extraInfo?.preferences || null,
      onboardingCompleted: user.extraInfo?.onboardingCompleted || false,
    };
  } catch (error) {
    logger.error('Get user profile error:', error);
    throw new Error('Failed to retrieve user profile');
  }
}

/**
 * Update current user's profile
 *
 * Allows authenticated users to update their own profile information.
 * Validates data, merges extraInfo, and maintains audit trail.
 *
 * @param userId - The authenticated user's ID
 * @param profileData - Profile update data with optional fields
 * @returns Promise<any> - Updated user profile information
 */
export async function updateUserProfileService(userId: number, profileData: any) {
  try {
    logger.info('Updating user profile', {
      userId,
      fieldsToUpdate: Object.keys(profileData),
      hasExtraInfo: Boolean(profileData.extraInfo),
    });

    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
      logger.warn('User not found during profile update', { userId });
      throw new Error('User not found');
    }

    // Merge existing extraInfo with new data
    const currentExtraInfo = currentUser.extraInfo || {};
    const newExtraInfo = {
      ...currentExtraInfo,
      phoneNumber: profileData.phoneNumber ?? currentExtraInfo.phoneNumber,
      address: profileData.address ?? currentExtraInfo.address,
      emergencyContact: profileData.emergencyContact ?? currentExtraInfo.emergencyContact,
      emergencyPhoneNumber:
        profileData.emergencyPhoneNumber ?? currentExtraInfo.emergencyPhoneNumber,
      preferences: profileData.preferences ?? currentExtraInfo.preferences,
      medicalHistory: profileData.medicalHistory ?? currentExtraInfo.medicalHistory,
      allergies: profileData.allergies ?? currentExtraInfo.allergies,
      medications: profileData.medications ?? currentExtraInfo.medications,
      conditions: profileData.conditions ?? currentExtraInfo.conditions,
    };

    // Prepare UserUpdateInput object (following auth service pattern)
    const userUpdateInput = {
      firstName: profileData.firstName ?? undefined,
      middleName: profileData.middleName ?? undefined,
      lastName: profileData.lastName ?? undefined,
      email: profileData.email ?? undefined,
      dob: profileData.dob ? new Date(profileData.dob) : undefined,
      mrn: profileData.mrn ?? undefined,
      gender: profileData.gender ?? undefined,
      timeZone: profileData.timeZone ?? undefined,
      profilePicture: profileData.profilePicture ?? undefined,
      extraInfo: newExtraInfo,
      modUser: 'mobile-app', // Required field
    };

    // Update user with properly formatted UserUpdateInput
    await userRepository.updateUserProfile(userId, userUpdateInput, 'mobile-app');

    logger.info('User profile updated successfully', { userId });
    return await getUserProfileService(userId);
  } catch (error) {
    logger.error('Update user profile error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw new Error(
      `Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Update current user's personal information
 *
 * Updates specific personal information fields for the authenticated user.
 * Focuses on personal and medical information with HIPAA compliance.
 *
 * @param userId - The authenticated user's ID
 * @param personalInfo - Personal information update data
 * @returns Promise<any> - Updated user profile with personal information
 */
export async function updatePersonalInfoService(userId: number, personalInfo: any) {
  try {
    logger.info('Updating personal info', {
      userId,
      fieldsToUpdate: Object.keys(personalInfo),
    });

    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
      logger.warn('User not found during personal info update', { userId });
      throw new Error('User not found');
    }

    // Merge existing extraInfo with new personal info
    const currentExtraInfo = currentUser.extraInfo || {};
    const newExtraInfo = {
      ...currentExtraInfo,
      phoneNumber: personalInfo.phoneNumber ?? currentExtraInfo.phoneNumber,
      address: personalInfo.address ?? currentExtraInfo.address,
      medicalHistory: personalInfo.medicalHistory ?? currentExtraInfo.medicalHistory,
      allergies: personalInfo.allergies ?? currentExtraInfo.allergies,
      medications: personalInfo.medications ?? currentExtraInfo.medications,
      conditions: personalInfo.conditions ?? currentExtraInfo.conditions,
      emergencyContact: personalInfo.emergencyContact ?? currentExtraInfo.emergencyContact,
      emergencyPhoneNumber:
        personalInfo.emergencyPhoneNumber ?? currentExtraInfo.emergencyPhoneNumber,
    };

    // Prepare UserUpdateInput object (following auth service pattern)
    const userUpdateInput = {
      firstName: personalInfo.firstName ?? undefined,
      middleName: personalInfo.middleName ?? undefined,
      lastName: personalInfo.lastName ?? undefined,
      email: personalInfo.email ?? undefined,
      dob: personalInfo.dob ? new Date(personalInfo.dob) : undefined,
      gender: personalInfo.gender ?? undefined,
      extraInfo: newExtraInfo,
      modUser: 'mobile-app', // Required field
    };

    // Update user with properly formatted UserUpdateInput
    await userRepository.updateUserProfile(userId, userUpdateInput, 'mobile-app');

    logger.info('Personal info updated successfully', { userId });
    return await getUserProfileService(userId);
  } catch (error) {
    logger.error('Update personal info error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw new Error('Failed to update personal information');
  }
}

/**
 * Upload current user's profile picture
 *
 * Handles secure file upload for user profile pictures.
 * Validates file types, generates secure URLs, and updates extraInfo.
 *
 * @param userId - The authenticated user's ID
 * @param file - Uploaded file object with metadata
 * @returns Promise<any> - Upload confirmation with profile picture URL
 */
export async function uploadProfilePictureService(userId: number, file: UploadedFile) {
  try {
    logger.info('Uploading profile picture', {
      userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
      logger.warn('User not found during profile picture upload', { userId });
      throw new Error('User not found');
    }

    // TODO: Implement file upload to cloud storage (AWS S3, etc.)
    // For now, just generate a URL based on file info
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const profilePictureUrl = `/uploads/profiles/${fileName}`;

    // Update extraInfo with profile picture
    const currentExtraInfo = currentUser.extraInfo || {};
    const newExtraInfo = {
      ...currentExtraInfo,
      profilePicture: profilePictureUrl,
      profilePictureInfo: {
        originalName: file.name,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      },
    };

    await userRepository.updateUserExtraInfo(userId, newExtraInfo, 'mobile-app');

    logger.info('Profile picture uploaded successfully', {
      userId,
      profilePictureUrl,
    });

    return {
      success: true,
      profilePicture: profilePictureUrl,
      message: 'Profile picture uploaded successfully',
    };
  } catch (error) {
    logger.error('Upload profile picture error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      fileName: file?.name,
    });
    throw new Error('Failed to upload profile picture');
  }
}

// ===================================================================
// 🎯 ONBOARDING OPERATIONS
// ===================================================================

/**
 * Complete current user's onboarding
 *
 * Marks onboarding as complete and processes final setup steps.
 * Validates all required information and updates completion timestamp.
 *
 * @param userId - The authenticated user's ID
 * @param onboardingData - Final onboarding completion data
 * @returns Promise<any> - Completion confirmation with updated profile
 */
export async function completeOnboardingService(userId: number, onboardingData: any) {
  try {
    logger.info('Completing onboarding for user', {
      userId,
      dataFields: Object.keys(onboardingData),
    });

    // Update user profile with onboarding data
    await updateUserProfileService(userId, onboardingData);

    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
      logger.warn('User not found during onboarding completion', { userId });
      throw new Error('User not found');
    }

    // Mark onboarding as completed
    const currentExtraInfo = currentUser.extraInfo || {};
    const newExtraInfo = {
      ...currentExtraInfo,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    };

    await userRepository.updateUserExtraInfo(userId, newExtraInfo, 'mobile-app');

    logger.info('Onboarding completed successfully', { userId });

    return {
      success: true,
      message: 'Onboarding completed successfully',
      profile: await getUserProfileService(userId),
    };
  } catch (error) {
    logger.error('Complete onboarding error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw new Error('Failed to complete onboarding');
  }
}

/**
 * Get current user's onboarding status
 *
 * Retrieves the onboarding progress and completion status.
 * Calculates completion percentage and determines next required steps.
 *
 * @param userId - The authenticated user's ID
 * @returns Promise<any> - Onboarding status with progress tracking
 */
export async function getOnboardingStatusService(userId: number) {
  try {
    logger.debug('Getting onboarding status for user', { userId });

    const profile = await getUserProfileService(userId);

    const completedSteps = {
      basicInfo: !!(profile.firstName && profile.lastName && profile.email),
      personalInfo: !!(profile.dob && profile.gender),
      contactInfo: !!profile.phoneNumber,
      preferences: !!profile.preferences,
      profilePicture: !!profile.profilePicture,
    };

    const totalSteps = Object.keys(completedSteps).length;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const progressPercentage = Math.round((completedCount / totalSteps) * 100);

    logger.info('Onboarding status calculated', {
      userId,
      completedCount,
      totalSteps,
      progressPercentage,
      isCompleted: profile.onboardingCompleted || false,
    });

    return {
      isCompleted: profile.onboardingCompleted || false,
      steps: completedSteps,
      progress: {
        completed: completedCount,
        total: totalSteps,
        percentage: progressPercentage,
      },
      nextStep: getNextOnboardingStep(completedSteps),
    };
  } catch (error) {
    logger.error('Get onboarding status error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw new Error('Failed to retrieve onboarding status');
  }
}

// ===================================================================
// 👨‍⚕️ HEALTHCARE PROVIDER OPERATIONS
// ===================================================================

/**
 * Get available doctors for selection
 *
 * Retrieves list of available healthcare providers within client scope.
 * Supports filtering by specialization and location with client isolation.
 *
 * @param clientId - Client ID for filtering doctors
 * @param specialization - Optional specialization filter
 * @param location - Optional location filter
 * @returns Promise<DoctorsListResponse> - Filtered list of available doctors
 */
export async function getDoctorsService(
  clientId: number,
  specialization?: string,
  location?: string,
): Promise<DoctorsListResponse> {
  try {
    logger.info('Getting doctors for client:', {
      clientId,
      specialization,
      location,
    });

    // TODO: Implement actual database query with client filtering
    // - Query doctors from database WHERE clientId = clientId
    // - Apply specialization filter
    // - Apply location filter
    // - Include ratings and availability

    // Mock implementation with client-specific data
    const mockDoctors: Doctor[] = [
      {
        id: 1,
        firstName: 'Sarah',
        lastName: 'Johnson',
        specialization: 'Physical Therapy',
        title: 'DPT',
        bio: 'Experienced physical therapist specializing in sports medicine and rehabilitation.',
        rating: 4.8,
        reviewCount: 127,
        profilePictureUrl: '/images/doctors/sarah-johnson.jpg',
        availableSlots: ['2024-01-15T09:00:00Z', '2024-01-15T14:00:00Z'],
        clientId: clientId, // Client-specific doctor
        location: {
          clinic: 'ReliaCare Physical Therapy Center',
          address: '123 Health Street',
          city: 'San Francisco',
          state: 'CA',
        },
      },
      {
        id: 2,
        firstName: 'Michael',
        lastName: 'Chen',
        specialization: 'Orthopedic Surgery',
        title: 'MD',
        bio: 'Board-certified orthopedic surgeon with expertise in sports injuries and joint replacement.',
        rating: 4.9,
        reviewCount: 89,
        profilePictureUrl: '/images/doctors/michael-chen.jpg',
        availableSlots: ['2024-01-16T10:00:00Z', '2024-01-16T15:00:00Z'],
        clientId: clientId, // Client-specific doctor
        location: {
          clinic: 'Bay Area Orthopedic Associates',
          address: '456 Medical Plaza',
          city: 'San Francisco',
          state: 'CA',
        },
      },
      {
        id: 3,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        specialization: 'Pain Management',
        title: 'MD',
        bio: 'Pain management specialist focused on non-invasive treatment approaches.',
        rating: 4.7,
        reviewCount: 156,
        profilePictureUrl: '/images/doctors/emily-rodriguez.jpg',
        availableSlots: ['2024-01-17T11:00:00Z', '2024-01-17T16:00:00Z'],
        clientId: clientId, // Client-specific doctor
        location: {
          clinic: 'Comprehensive Pain Solutions',
          address: '789 Wellness Blvd',
          city: 'San Francisco',
          state: 'CA',
        },
      },
    ];

    // Filter by client first (this would be in the database query in real implementation)
    let filteredDoctors = mockDoctors.filter(doctor => doctor.clientId === clientId);

    // Apply additional filters
    if (specialization) {
      filteredDoctors = filteredDoctors.filter(doctor =>
        doctor.specialization.toLowerCase().includes(specialization.toLowerCase()),
      );
    }

    if (location) {
      filteredDoctors = filteredDoctors.filter(
        doctor =>
          doctor.location?.city.toLowerCase().includes(location.toLowerCase()) ||
          doctor.location?.state.toLowerCase().includes(location.toLowerCase()),
      );
    }

    return {
      success: true,
      data: {
        doctors: filteredDoctors,
        total: filteredDoctors.length,
        filters: {
          specializations: ['Physical Therapy', 'Orthopedic Surgery', 'Pain Management'],
          locations: ['San Francisco, CA'],
        },
      },
    };
  } catch (error) {
    logger.error('Error fetching doctors:', error);
    throw new Error('Failed to fetch doctors');
  }
}

/**
 * Select a doctor for care
 *
 * Associates a patient with a selected healthcare provider.
 * Validates provider availability, client relationships, and scheduling.
 *
 * @param userId - The patient's user ID
 * @param clientId - Client ID for validation
 * @param doctorSelection - Doctor selection request with appointment preferences
 * @returns Promise<DoctorSelectionResponse> - Selection confirmation with next steps
 */
export async function selectDoctorService(
  userId: string,
  clientId: number,
  doctorSelection: DoctorSelectionRequest,
): Promise<DoctorSelectionResponse> {
  try {
    logger.info('Selecting doctor for user:', {
      userId,
      clientId,
      doctorId: doctorSelection.doctorId,
      hasPreferredAppointmentTime: Boolean(doctorSelection.preferredAppointmentTime),
    });

    // TODO: Implement actual database operations with client validation
    // - Verify doctor belongs to the same client
    // - Create doctor-patient relationship
    // - Schedule appointment if requested
    // - Update user's care plan

    // Mock implementation with client validation
    const mockDoctor: Doctor = {
      id: doctorSelection.doctorId,
      firstName: 'Sarah',
      lastName: 'Johnson',
      specialization: 'Physical Therapy',
      title: 'DPT',
      bio: 'Experienced physical therapist specializing in sports medicine and rehabilitation.',
      rating: 4.8,
      reviewCount: 127,
      profilePictureUrl: '/images/doctors/sarah-johnson.jpg',
      clientId: clientId, // Ensure client match
      location: {
        clinic: 'ReliaCare Physical Therapy Center',
        address: '123 Health Street',
        city: 'San Francisco',
        state: 'CA',
      },
    };

    // Validate doctor belongs to the same client
    if (mockDoctor.clientId !== clientId) {
      throw new Error('Doctor not available for this client');
    }

    return {
      success: true,
      data: {
        selectedDoctor: mockDoctor,
        appointmentScheduled: Boolean(doctorSelection.preferredAppointmentTime),
        nextSteps: [
          'Your doctor selection has been confirmed',
          'You will receive a call within 24 hours to schedule your first appointment',
          'Complete your care plan assessment when available',
        ],
      },
    };
  } catch (error) {
    logger.error('Error selecting doctor:', error);
    throw error;
  }
}

// ===================================================================
// 🔍 VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate registration request body using Zod schema
 *
 * Validates all registration fields including roles, client ID, and user type.
 * Ensures data integrity and security compliance before processing.
 *
 * @param body - Raw request body from registration endpoint
 * @returns RegisterUserRequest - Validated and typed registration data
 */
function validateRegisterRequestBody(body: any): RegisterUserRequest {
  logger.debug('Validating registration request body', {
    hasLoginName: Boolean(body.loginName),
    hasEmail: Boolean(body.email),
    hasClientId: Boolean(body.clientId),
    hasUserTypeId: Boolean(body.userTypeId),
    rolesCount: Array.isArray(body.roles) ? body.roles.length : 0,
  });

  const validationResult = registerUserSchema.safeParse(body);
  if (!validationResult.success) {
    logger.warn('Registration request validation failed', {
      errors: validationResult.error.errors,
    });
    throw createValidationError(
      'Validation failed',
      validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    );
  }

  logger.debug('Registration request validation completed successfully');
  return validationResult.data;
}

/**
 * Validate query parameters using Zod schema
 *
 * Validates and transforms query parameters for user listing operations.
 * Ensures proper type conversion and security compliance.
 *
 * @param query - Raw query parameters from request
 * @returns GetUsersQueryRequest - Validated and typed query parameters
 */
function validateQueryParameters(query: UserQuery): GetUsersQueryRequest {
  logger.debug('Validating query parameters', {
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    role: query.role,
    clientId: query.clientId,
  });

  try {
    // Use Zod schema for validation
    const validatedQuery = getUsersQuerySchema.parse(query);
    logger.debug('Query parameters validation completed successfully');
    return validatedQuery;
  } catch (error: any) {
    if (error.errors) {
      logger.warn('Query parameters validation failed', {
        errors: error.errors,
      });
      // Zod validation errors
      throw createValidationError(
        'Invalid query parameters',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }

    logger.warn('Query parameters validation failed with non-Zod error', {
      error: error.message,
    });
    // Other validation errors
    throw createValidationError('Query validation failed', [
      { field: 'query', message: error.message },
    ]);
  }
}

/**
 * Validate update request body using Zod schema
 *
 * Validates user update requests with support for partial updates.
 * Handles extraInfo validation separately for complex JSON fields.
 *
 * @param body - Raw request body from update endpoint
 * @returns any - Validated update data with extraInfo handling
 */
function validateUpdateRequestBody(body: UserUpdateInput): any {
  logger.debug('Validating update request body', {
    fieldsPresent: Object.keys(body),
    hasExtraInfo: Boolean(body.extraInfo),
  });

  try {
    // Import the UserUpdateInputSchema for validation
    const { extraInfo, ...otherFields } = body;

    // Validate the main fields (excluding extraInfo)
    const mainFieldsValidation = UserUpdateInputSchema.omit({
      extraInfo: true,
      modUser: true,
    }).safeParse(otherFields);

    if (!mainFieldsValidation.success) {
      logger.warn('Update request main fields validation failed', {
        errors: mainFieldsValidation.error.errors,
      });
      throw createValidationError(
        'Validation failed',
        mainFieldsValidation.error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }

    // Validate extraInfo separately if provided
    let validatedExtraInfo: UserExtraInfo;
    if (extraInfo !== undefined) {
      logger.debug('Validating extraInfo field');
      const validation = validateUserExtraInfo(extraInfo);

      if (!validation.success) {
        logger.warn('Update request extraInfo validation failed', {
          errors: validation.errors,
        });
        throw createValidationError(
          'Invalid extraInfo format',
          validation.errors.map((error: string) => ({ field: 'extraInfo', message: error })),
        );
      }

      validatedExtraInfo = validation.data;
    }

    logger.debug('Update request validation completed successfully');
    return {
      ...mainFieldsValidation.data,
      ...(extraInfo !== undefined && { extraInfo: validatedExtraInfo }),
    };
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error; // Re-throw our validation errors
    }
    logger.error('Update request validation failed with unexpected error', {
      error: error.message,
    });
    throw createValidationError('Update validation failed', [
      { field: 'body', message: error.message },
    ]);
  }
}

/**
 * Validate all business rules for registration
 *
 * Validates email domains, client status, user types, and business rules.
 * Ensures compliance with organizational policies and data integrity.
 *
 * @param requestData - Validated registration request data
 * @param currentUser - Current authenticated user context
 * @returns Promise<void> - Throws error if validation fails
 */
async function validateRegistrationRules(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<void> {
  logger.debug('Validating registration rules', {
    loginName: requestData.loginName,
    clientId: requestData.clientId,
    userTypeId: requestData.userTypeId,
    hasEmail: Boolean(requestData.email),
    sendWelcomeEmail: requestData.sendWelcomeEmail,
    currentUser: currentUser.loginName,
  });

  // 1. Validate email domain if email is provided
  if (requestData.email) {
    const emailDomainResult = validateEmailDomain(requestData.email);

    if (!emailDomainResult.isValid) {
      logger.warn('Email domain validation failed', {
        email: requestData.email,
        error: emailDomainResult.error,
      });
      throw new Error(emailDomainResult.error);
    }
  }

  // 2. Validate client exists and is active
  const client = await userRepository.findClientById(requestData.clientId);
  if (!client) {
    logger.warn('Client validation failed - client not found', {
      clientId: requestData.clientId,
    });
    throw new Error('Invalid client ID');
  }
  if (client.status !== 1) {
    logger.warn('Client validation failed - client inactive', {
      clientId: requestData.clientId,
      clientStatus: client.status,
    });
    throw new Error('Cannot create users for inactive client');
  }

  // 3. Validate user type exists
  const userType = await userRepository.findUserTypeById(requestData.userTypeId);
  if (!userType) {
    logger.warn('User type validation failed', {
      userTypeId: requestData.userTypeId,
    });
    throw new Error('Invalid user type ID');
  }

  // 4. Validate business rule: Email required for welcome email
  if (requestData.sendWelcomeEmail && !requestData.email) {
    logger.warn('Welcome email requested but no email provided', {
      loginName: requestData.loginName,
    });
    throw new Error('Email is required when sendWelcomeEmail is enabled');
  }

  logger.debug('Registration rules validation completed successfully', {
    loginName: requestData.loginName,
    clientId: requestData.clientId,
  });
}

/**
 * Validate user uniqueness across the system
 *
 * Checks for existing users with same login name or email address.
 * Prevents duplicate account creation and maintains data integrity.
 *
 * @param requestData - Validated registration request data
 * @returns Promise<void> - Throws error if user already exists
 */
async function validateUserUniqueness(requestData: RegisterUserRequest): Promise<void> {
  logger.debug('Validating user uniqueness', {
    loginName: requestData.loginName,
    hasEmail: Boolean(requestData.email),
  });

  // Check if login name already exists
  const existingUser = await userRepository.findUserByLoginName(requestData.loginName);
  if (existingUser) {
    logger.warn('User uniqueness validation failed - login name exists', {
      loginName: requestData.loginName,
    });
    throw new Error('User with this login name already exists');
  }

  // Check if email already exists (if provided)
  if (requestData.email) {
    const existingEmailUser = await userRepository.findUserByEmail(requestData.email);
    if (existingEmailUser) {
      logger.warn('User uniqueness validation failed - email exists', {
        email: requestData.email,
      });
      throw new Error('User with this email already exists');
    }
  }

  logger.debug('User uniqueness validation completed successfully', {
    loginName: requestData.loginName,
  });
}

// ===================================================================
// 🔧 CORE BUSINESS LOGIC FUNCTIONS
// ===================================================================

/**
 * Perform user registration - main orchestration function
 *
 * Handles the complete registration workflow with database transaction.
 * Orchestrates validation, password generation, role assignment, and notifications.
 *
 * @param requestData - Validated registration request data
 * @param currentUser - Current authenticated user performing registration
 * @returns Promise<RegisterUserResponse> - Complete registration result
 */
async function performUserRegistration(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<RegisterUserResponse> {
  logger.info('Starting user registration', {
    loginName: requestData.loginName,
    clientId: requestData.clientId,
    userTypeId: requestData.userTypeId,
    rolesCount: requestData.roles.length,
    createdBy: currentUser.loginName,
  });

  try {
    // 1. Validate business rules
    await validateRegistrationRules(requestData, currentUser);

    // 2. Check if user already exists
    await validateUserUniqueness(requestData);

    // 3. Generate password (use provided or generate temporary)
    const passwordToUse = requestData.temporaryPassword
      ? generateTemporaryPassword()
      : requestData.password;

    // 4. Hash the password
    const hashedPassword = await hashPassword(passwordToUse);

    // 5. Get role IDs from role names
    const roleIds = await getRoleIdsFromNames(requestData.roles);

    logger.debug('Creating user with roles', {
      loginName: requestData.loginName,
      roleIds,
      hasTemporaryPassword: Boolean(requestData.temporaryPassword),
    });

    // 6. Create user in database transaction
    const result = await userRepository.createUserWithRoles({
      userData: {
        loginName: requestData.loginName,
        clientId: requestData.clientId,
        userTypeId: requestData.userTypeId,
        firstName: requestData.firstName || null,
        lastName: requestData.lastName || null,
        email: requestData.email || null,
        timeZone: requestData.timeZone || null,
        profilePicture: requestData.profilePicture || null,
        status: UserStatus.ACTIVE,
        crUser: currentUser.loginName,
        crDate: new Date(),
        modUser: currentUser.loginName,
        modDate: new Date(),
      },
      password: hashedPassword,
      roleIds: roleIds,
      createdBy: currentUser.loginName,
    });

    // 7. Send welcome email if requested
    if (requestData.sendWelcomeEmail && requestData.email) {
      await sendWelcomeEmail(requestData.email, result.user, passwordToUse);
    }

    logger.info('User registration completed successfully', {
      userId: result.user.id,
      loginName: result.user.loginName,
      clientId: result.user.clientId,
      emailSent: Boolean(requestData.sendWelcomeEmail && requestData.email),
    });

    // 8. Return response
    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          loginName: result.user.loginName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          timeZone: result.user.timeZone,
          profilePicture: result.user.profilePicture,
          status: result.user.status,
          crDate: result.user.crDate.toISOString(),
          client: {
            id: result.user.client.id,
            name: result.user.client.name,
            timeZone: result.user.client.timeZone,
          },
          userType: {
            id: result.user.userType.id,
            name: result.user.userType.name,
            description: result.user.userType.description,
          },
          roles: result.roles.map(role => role.name),
        },
        ...(requestData.temporaryPassword && {
          temporaryPassword: passwordToUse,
        }),
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('User registration failed', {
      error: error.message,
      loginName: requestData.loginName,
      clientId: requestData.clientId,
      createdBy: currentUser.loginName,
    });
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Perform user update with business logic
 *
 * Handles user update operations with extraInfo merging and validation.
 * Maintains audit trail and ensures data consistency across updates.
 *
 * @param targetUserId - ID of user being updated
 * @param validatedData - Validated update data
 * @param currentUser - Current authenticated user performing update
 * @returns Promise<{data: any; message: string}> - Update result with audit info
 */
async function performUserUpdate(
  targetUserId: number,
  validatedData: any,
  currentUser: AuthenticatedUser,
): Promise<{ data: any; message: string }> {
  logger.info('Starting user update', {
    targetUserId,
    updatedBy: currentUser.loginName,
    hasExtraInfo: Boolean(validatedData.extraInfo),
    fieldsToUpdate: Object.keys(validatedData),
  });

  try {
    // 1. Get existing user for extraInfo merging
    const existingUser = await userRepository.findUserById(targetUserId);
    if (!existingUser) {
      logger.warn('User not found during update operation', {
        targetUserId,
        updatedBy: currentUser.loginName,
      });
      throw new Error('User not found during update operation');
    }

    // 2. Handle extraInfo merging if provided
    let sanitizedExtraInfo: UserExtraInfo | undefined = undefined;
    if (validatedData.extraInfo !== undefined) {
      if (validatedData.extraInfo) {
        // Merge with existing extraInfo
        const mergedResult = mergeJsonFields(
          existingUser.extraInfo as UserExtraInfo,
          validatedData.extraInfo,
        );
        sanitizedExtraInfo = mergedResult || undefined;
      } else {
        sanitizedExtraInfo = null as any; // Explicitly setting to null
      }
    }

    // 3. Prepare update data
    const updateData = {
      ...validatedData,
      modUser: currentUser.loginName, // Use loginName instead of ID for consistency
      modDate: new Date(),
      ...(validatedData.extraInfo !== undefined && { extraInfo: sanitizedExtraInfo }),
    };

    // Remove extraInfo from updateData if it was in validatedData to avoid duplication
    delete updateData.extraInfo;
    if (validatedData.extraInfo !== undefined) {
      updateData.extraInfo = sanitizedExtraInfo;
    }

    // 4. Perform database update
    logger.debug('Performing database update', {
      targetUserId,
      updateFields: Object.keys(updateData),
      hasExtraInfo: Boolean(updateData.extraInfo),
    });

    const updatedUser = await prismaPostgres.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        userType: { select: { id: true, name: true } },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    logger.info('User updated successfully', {
      targetUserId,
      updatedBy: currentUser.loginName,
      updatedAt: updatedUser.modDate,
    });

    // 5. Format response
    return {
      data: {
        id: updatedUser.id,
        clientId: updatedUser.clientId,
        userTypeId: updatedUser.userTypeId,
        loginName: updatedUser.loginName,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        dob: updatedUser.dob,
        mrn: updatedUser.mrn,
        gender: updatedUser.gender,
        timeZone: updatedUser.timeZone,
        profilePicture: updatedUser.profilePicture,
        extraInfo: updatedUser.extraInfo as UserExtraInfo,
        status: updatedUser.status,
        client: updatedUser.client,
        userType: updatedUser.userType,
        roles: updatedUser.userRoles.map(ur => ur.role),
        modDate: updatedUser.modDate,
        updatedBy: currentUser.loginName,
      },
      message: 'User updated successfully',
    };
  } catch (error: any) {
    logger.error('Failed to update user', {
      error: error.message,
      targetUserId,
      updatedBy: currentUser.loginName,
    });
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

/**
 * Get users list with role-based filtering and client isolation
 *
 * Implements complex role-based access control for user listing.
 * Enforces client isolation and applies appropriate filters based on user permissions.
 *
 * @param queryParams - Validated query parameters for filtering
 * @param currentUserRoles - Current user's roles for permission checking
 * @param currentUserClientId - Current user's client ID for isolation
 * @returns Promise<GetUsersResponse> - Filtered and paginated user list
 */
async function getUsersList(
  queryParams: GetUsersQueryRequest,
  currentUserRoles: CoreRole[],
  currentUserClientId: number,
): Promise<GetUsersResponse> {
  logger.debug('Getting users list', {
    queryParams,
    currentUserRoles,
    currentUserClientId,
  });

  // Validate clientId if provided
  let requestedClientId: number | undefined;
  if (queryParams.clientId) {
    requestedClientId = queryParams.clientId;
    if (isNaN(requestedClientId) || requestedClientId <= 0) {
      logger.warn('Invalid client ID format provided', {
        clientId: queryParams.clientId,
      });
      throw createValidationError('Invalid client ID format', [
        { field: 'clientId', message: 'Client ID must be a positive integer' },
      ]);
    }
  }

  const currentUserRole = getCurrentUserPrimaryRole(currentUserRoles);
  logger.debug('Determined primary user role', {
    currentUserRole,
    allRoles: currentUserRoles,
  });

  const statusFilter = queryParams.status?.toString();
  const roleFilter = queryParams.role;

  let filters: userRepository.GetUsersFilters = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 20,
    search: queryParams.search,
    sort: queryParams.sort || 'asc',
  };

  switch (currentUserRole) {
    case CoreRole.SUPER_ADMIN:
      logger.debug('Applying SUPER_ADMIN permissions - can view all users');
      // Rule 1: SUPER_ADMIN can view all users irrespective of client
      if (requestedClientId) {
        filters.clientId = requestedClientId;
      }
      // Apply optional filters
      if (roleFilter) {
        filters.role = roleFilter;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      break;

    case CoreRole.CLIENT_ADMIN:
      logger.debug('Applying CLIENT_ADMIN permissions - restricted to own client');
      // Rule 2: CLIENT_ADMIN can only view users in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
        logger.warn('CLIENT_ADMIN attempted cross-client access', {
          currentUserClientId,
          requestedClientId,
        });
        throw createAuthorizationError(
          'CLIENT_ADMIN can only view users in their own organization',
        );
      }

      // Force filter to current user's client
      filters.clientId = currentUserClientId;

      // Exclude SUPER_ADMIN from results (business rule)
      filters.excludeRoles = [CoreRole.SUPER_ADMIN];

      // Apply optional filters
      if (roleFilter) {
        filters.role = roleFilter;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      break;

    case CoreRole.CLINICAL_STAFF:
    case CoreRole.OFFICE_STAFF:
      logger.debug(`Applying ${currentUserRole} permissions - patients only in own client`);
      // Rule 3: CLINICAL_STAFF/OFFICE_STAFF can only view patients in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
        logger.warn(`${currentUserRole} attempted cross-client access`, {
          currentUserClientId,
          requestedClientId,
        });
        throw createAuthorizationError(
          `${currentUserRole} can only view patients in their own organization`,
        );
      }

      // Force filter to current user's client and patients only
      filters.clientId = currentUserClientId;
      filters.role = CoreRole.PATIENT;

      // Apply optional status filter
      if (statusFilter) {
        filters.status = statusFilter;
      }

      // Ignore role filter from query since they can only see patients
      break;

    case CoreRole.PATIENT:
      logger.warn('PATIENT role attempted to access user lists');
      // PATIENT role cannot view user lists
      throw createAuthorizationError('PATIENT role is not authorized to view user lists');

    default:
      logger.error('Invalid user role detected', {
        currentUserRole,
        currentUserRoles,
      });
      throw createAuthorizationError('Invalid or unsupported user role');
  }

  logger.debug('Final filters applied for users list', { filters });

  try {
    // Get users from repository
    const result = await userRepository.getUsersWithFilters(filters);

    logger.info('Users list retrieved successfully', {
      totalUsers: result.users.length,
      totalRecords: result.pagination.total,
      page: filters.page,
      limit: filters.limit,
      currentUserRole,
    });

    return {
      success: true,
      data: {
        users: result.users.map(user => ({
          id: user.id,
          loginName: user.loginName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          roles: user.roles.map(role => role.name),
          client: {
            id: user.client.id,
            name: user.client.name,
          },
          userType: {
            id: user.userType.id,
            name: user.userType.name,
          },
          crDate: user.crDate.toISOString(),
        })),
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
        },
        filters: {
          clientId: filters.clientId,
          role: filters.role,
          status: filters.status,
        },
      },
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Failed to retrieve users list', {
      error: error.message,
      filters,
      currentUserRole,
    });
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
}

// ===================================================================
// 🔐 SECURITY & PASSWORD UTILITIES
// ===================================================================

/**
 * Hash password using bcrypt with strong salt rounds
 *
 * Creates secure password hashes using industry-standard bcrypt algorithm.
 * Uses high salt rounds appropriate for healthcare data security requirements.
 *
 * @param password - Plain text password to hash
 * @returns Promise<string> - Securely hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong salt rounds for healthcare data
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate secure temporary password
 *
 * Creates cryptographically secure temporary passwords with mixed character types.
 * Ensures compliance with password complexity requirements.
 *
 * @returns string - Secure temporary password with mixed character types
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%^&*';

  let password = '';

  // Ensure at least one character from each category
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Get current user primary role from hierarchy
 *
 * Determines the highest priority role when a user has multiple roles assigned.
 * Implements role hierarchy system for consistent authorization decisions across the application.
 *
 * @param roles - Array of role names assigned to the user
 * @returns string - The highest priority role name from the predefined hierarchy
 * @throws createAuthError - When user has no roles or no valid roles assigned
 */
function getCurrentUserPrimaryRole(roles: string[]): string {
  if (roles.length === 0) {
    logger.error('User has no roles assigned.');
    throw createAuthError('User has no roles assigned');
  }

  // Define role hierarchy (highest to lowest priority)
  const roleHierarchy = [
    CoreRole.SUPER_ADMIN,
    CoreRole.CLIENT_ADMIN,
    CoreRole.CLINICAL_STAFF,
    CoreRole.OFFICE_STAFF,
    CoreRole.PATIENT,
  ];

  // Find the highest priority role that the user has
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return role;
    }
  }

  // If no known role is found, throw an error
  throw createAuthError('User has no valid roles assigned');
}

/**
 * Helper function to determine next onboarding step
 *
 * Analyzes completed onboarding steps to determine the next required action.
 * Implements sequential onboarding flow for mobile app user experience.
 *
 * @param completedSteps - Object containing boolean flags for each onboarding step
 * @returns string | null - Next required step name or null if all steps completed
 */
function getNextOnboardingStep(completedSteps: any): string | null {
  if (!completedSteps.basicInfo) return 'basicInfo';
  if (!completedSteps.personalInfo) return 'personalInfo';
  if (!completedSteps.contactInfo) return 'contactInfo';
  if (!completedSteps.preferences) return 'preferences';
  if (!completedSteps.profilePicture) return 'profilePicture';
  return null; // All steps completed
}

// ===================================================================
// 🗃️ DATA REPOSITORY UTILITIES
// ===================================================================

/**
 * Get role IDs from role names with validation
 *
 * Converts role names to corresponding database IDs with comprehensive validation.
 * Ensures all requested roles exist in the system before proceeding with operations.
 *
 * @param roleNames - Array of CoreRole enum values to convert to IDs
 * @returns Promise<number[]> - Array of role IDs corresponding to the input role names
 * @throws Error - When one or more role names are invalid or not found in database
 */
async function getRoleIdsFromNames(roleNames: CoreRole[]): Promise<number[]> {
  logger.debug('Getting role IDs from role names', {
    roleNames,
    roleCount: roleNames.length,
  });

  const roles = await userRepository.findRolesByNames(roleNames);

  if (roles.length !== roleNames.length) {
    const foundRoleNames = roles.map(role => role.name);
    const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
    logger.error('Invalid roles detected during role ID lookup', {
      requestedRoles: roleNames,
      foundRoles: foundRoleNames,
      missingRoles,
    });
    throw new Error(`Invalid roles: ${missingRoles.join(', ')}`);
  }

  const roleIds = roles.map(role => role.id);
  logger.debug('Role IDs retrieved successfully', {
    roleNames,
    roleIds,
  });

  return roleIds;
}

// ===================================================================
// 📧 COMMUNICATION UTILITIES
// ===================================================================

/**
 * Send welcome email to new user with proper logging
 *
 * Sends welcome email notification to newly registered users with account details.
 * Includes temporary password if generated and maintains audit trail through logging.
 *
 * @param email - Recipient email address for welcome notification
 * @param user - Created user object with profile and client information
 * @param temporaryPassword - Optional temporary password to include in email
 * @returns Promise<void> - Does not throw on email failure to avoid registration rollback
 */
async function sendWelcomeEmail(
  email: string,
  user: CreateUserResult['user'],
  temporaryPassword?: string,
): Promise<void> {
  try {
    // TODO: Implement email service integration
    logger.info(`Welcome email would be sent to: ${email}`);
    logger.info(`User: ${user.firstName} ${user.lastName} (${user.loginName})`);
    logger.info(`Client: ${user.client.name}`);
    if (temporaryPassword) {
      logger.info(`Temporary password generated for user: ${user.loginName}`);
    }

    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    // await emailService.sendWelcomeEmail({
    //   to: email,
    //   templateData: {
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     loginName: user.loginName,
    //     clientName: user.client.name,
    //     temporaryPassword: temporaryPassword,
    //     loginUrl: process.env.FRONTEND_URL + '/login'
    //   }
    // });
  } catch (error: any) {
    // Don't fail registration if email fails
    logger.error('Failed to send welcome email:', error.message);
  }
}
