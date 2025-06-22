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
// 🔥 MAIN PUBLIC FUNCTIONS - WEB/ADMIN REGISTRATION
// ===================================================================

/**
 * Enhanced registerUser function that handles authentication, authorization, and validation
 * Used for web/admin user registration with full authorization flow
 */
export async function registerUser(
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

// ===================================================================
// 🔥 MAIN PUBLIC FUNCTIONS - MOBILE APP REGISTRATION
// ===================================================================

/**
 * Register a new user via mobile app with client validation
 * Simplified registration flow for mobile applications
 */
export async function registerMobileUser(
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
// 🔥 MAIN PUBLIC FUNCTIONS - USER MANAGEMENT (ADMIN OPERATIONS)
// ===================================================================

/**
 * Get users with enhanced authentication and authorization
 * Supports role-based filtering and client isolation
 */
export async function getUsers(req: ExtendedRequest<UserQuery>): Promise<GetUsersResponse> {
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
 * Get user by ID with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to users within same client or SuperAdmin cross-client access
 */
export async function getUserById(
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
 * Update user with enhanced authorization
 * Supports partial updates with proper validation and authorization
 */
export async function updateUser(
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
 * Delete user with STRICT multi-tenant validation and authorization
 * HIPAA/PHI Protection: Only SuperAdmin and CLIENT_ADMIN can delete users within their organization
 */
export async function deleteUser(
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

/**
 * Update user status with STRICT multi-tenant validation and authorization
 * HIPAA/PHI Protection: Only authorized roles can change user status within their organization
 */
export async function updateUserStatus(
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
 * Update user password with STRICT multi-tenant validation and password policies
 * HIPAA/PHI Protection: Only authorized users can change passwords within their organization
 */
export async function updateUserPassword(
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

// ===================================================================
// 📱 MAIN PUBLIC FUNCTIONS - MOBILE APP USER PROFILE
// ===================================================================

/**
 * Get user profile for mobile app
 * Returns comprehensive profile information including extraInfo
 */
export async function getUserProfile(userId: number) {
  try {
    const user = await userRepository.findUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

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
 * Update user profile for mobile app
 * Handles profile data updates with extraInfo merging
 */
export async function updateUserProfile(userId: number, profileData: any) {
  try {
    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
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

    return await getUserProfile(userId);
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw new Error(
      `Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Update personal information for mobile app
 * Focuses on personal and medical information updates
 */
export async function updatePersonalInfo(userId: number, personalInfo: any) {
  try {
    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
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

    return await getUserProfile(userId);
  } catch (error) {
    logger.error('Update personal info error:', error);
    throw new Error('Failed to update personal information');
  }
}

/**
 * Complete user onboarding for mobile app
 * Marks onboarding as complete and processes final setup
 */
export async function completeOnboarding(userId: number, onboardingData: any) {
  try {
    // Update user profile with onboarding data
    await updateUserProfile(userId, onboardingData);

    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
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

    return {
      success: true,
      message: 'Onboarding completed successfully',
      profile: await getUserProfile(userId),
    };
  } catch (error) {
    logger.error('Complete onboarding error:', error);
    throw new Error('Failed to complete onboarding');
  }
}

/**
 * Get onboarding status for mobile app
 * Returns progress tracking and completion status
 */
export async function getOnboardingStatus(userId: number) {
  try {
    const profile = await getUserProfile(userId);

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
    logger.error('Get onboarding status error:', error);
    throw new Error('Failed to retrieve onboarding status');
  }
}

/**
 * Upload profile picture for mobile app
 * Handles secure file upload and storage
 */
export async function uploadProfilePicture(userId: number, file: UploadedFile) {
  try {
    // Get current user
    const currentUser = await userRepository.findUserById(userId);
    if (!currentUser) {
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

    return {
      success: true,
      profilePicture: profilePictureUrl,
      message: 'Profile picture uploaded successfully',
    };
  } catch (error) {
    logger.error('Upload profile picture error:', error);
    throw new Error('Failed to upload profile picture');
  }
}

// ===================================================================
// 👩‍⚕️ MAIN PUBLIC FUNCTIONS - DOCTOR SELECTION & MANAGEMENT
// ===================================================================

/**
 * Get available doctors with optional filtering for a specific client
 */
export async function getDoctors(
  clientId: number,
  specialization?: string,
  location?: string,
): Promise<DoctorsListResponse> {
  try {
    console.log('Getting doctors for client:', clientId, 'with filters:', {
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
    console.error('Error fetching doctors:', error);
    throw new Error('Failed to fetch doctors');
  }
}

/**
 * Select a doctor for a user with client validation
 */
export async function selectDoctor(
  userId: string,
  clientId: number,
  doctorSelection: DoctorSelectionRequest,
): Promise<DoctorSelectionResponse> {
  try {
    console.log(
      'Selecting doctor for user:',
      userId,
      'client:',
      clientId,
      'doctor:',
      doctorSelection,
    );

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
    console.error('Error selecting doctor:', error);
    throw error;
  }
}

// ===================================================================
// 🔍 VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate registration request body using Zod schema
 */
function validateRegisterRequestBody(body: any): RegisterUserRequest {
  const validationResult = registerUserSchema.safeParse(body);
  if (!validationResult.success) {
    throw createValidationError(
      'Validation failed',
      validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    );
  }
  return validationResult.data;
}

/**
 * Validate query parameters using Zod - replaces manual validation
 */
function validateQueryParameters(query: UserQuery): GetUsersQueryRequest {
  try {
    // Use Zod schema for validation
    const validatedQuery = getUsersQuerySchema.parse(query);
    return validatedQuery;
  } catch (error: any) {
    if (error.errors) {
      // Zod validation errors
      throw createValidationError(
        'Invalid query parameters',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }

    // Other validation errors
    throw createValidationError('Query validation failed', [
      { field: 'query', message: error.message },
    ]);
  }
}

/**
 * Validate update request body using Zod schema - similar to registerUser pattern
 */
function validateUpdateRequestBody(body: UserUpdateInput): any {
  try {
    // Import the UserUpdateInputSchema for validation
    const { extraInfo, ...otherFields } = body;

    // Validate the main fields (excluding extraInfo)
    const mainFieldsValidation = UserUpdateInputSchema.omit({
      extraInfo: true,
      modUser: true,
    }).safeParse(otherFields);

    if (!mainFieldsValidation.success) {
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
      const validation = validateUserExtraInfo(extraInfo);

      if (!validation.success) {
        throw createValidationError(
          'Invalid extraInfo format',
          validation.errors.map((error: string) => ({ field: 'extraInfo', message: error })),
        );
      }

      validatedExtraInfo = validation.data;
    }

    return {
      ...mainFieldsValidation.data,
      ...(extraInfo !== undefined && { extraInfo: validatedExtraInfo }),
    };
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error; // Re-throw our validation errors
    }
    throw createValidationError('Update validation failed', [
      { field: 'body', message: error.message },
    ]);
  }
}

/**
 * Validate all business rules for registration
 */
async function validateRegistrationRules(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<void> {
  // 1. Validate email domain if email is provided
  if (requestData.email) {
    const emailDomainResult = validateEmailDomain(requestData.email);

    if (!emailDomainResult.isValid) {
      throw new Error(emailDomainResult.error);
    }
  }

  // 2. Validate client exists and is active
  const client = await userRepository.findClientById(requestData.clientId);
  if (!client) {
    throw new Error('Invalid client ID');
  }
  if (client.status !== 1) {
    throw new Error('Cannot create users for inactive client');
  }

  // 3. Validate user type exists
  const userType = await userRepository.findUserTypeById(requestData.userTypeId);
  if (!userType) {
    throw new Error('Invalid user type ID');
  }

  // 4. Validate business rule: Email required for welcome email
  if (requestData.sendWelcomeEmail && !requestData.email) {
    throw new Error('Email is required when sendWelcomeEmail is enabled');
  }
}

/**
 * Validate user uniqueness across the system
 */
async function validateUserUniqueness(requestData: RegisterUserRequest): Promise<void> {
  // Check if login name already exists
  const existingUser = await userRepository.findUserByLoginName(requestData.loginName);
  if (existingUser) {
    throw new Error('User with this login name already exists');
  }

  // Check if email already exists (if provided)
  if (requestData.email) {
    const existingEmailUser = await userRepository.findUserByEmail(requestData.email);
    if (existingEmailUser) {
      throw new Error('User with this email already exists');
    }
  }
}

// ===================================================================
// 🔧 CORE BUSINESS LOGIC FUNCTIONS
// ===================================================================

/**
 * Perform user registration - main orchestration function
 * Handles the complete registration workflow with database transaction
 */
async function performUserRegistration(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<RegisterUserResponse> {
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
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Perform user update with business logic - similar to performUserRegistration pattern
 */
async function performUserUpdate(
  targetUserId: number,
  validatedData: any,
  currentUser: AuthenticatedUser,
): Promise<{ data: any; message: string }> {
  try {
    // 1. Get existing user for extraInfo merging
    const existingUser = await userRepository.findUserById(targetUserId);
    if (!existingUser) {
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
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

/**
 * Get users list with role-based filtering and client isolation
 */
async function getUsersList(
  queryParams: GetUsersQueryRequest,
  currentUserRoles: CoreRole[],
  currentUserClientId: number,
): Promise<GetUsersResponse> {
  // Validate clientId if provided
  let requestedClientId: number | undefined;
  if (queryParams.clientId) {
    requestedClientId = queryParams.clientId;
    if (isNaN(requestedClientId) || requestedClientId <= 0) {
      throw createValidationError('Invalid client ID format', [
        { field: 'clientId', message: 'Client ID must be a positive integer' },
      ]);
    }
  }

  const currentUserRole = getCurrentUserPrimaryRole(currentUserRoles);

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
      // Rule 2: CLIENT_ADMIN can only view users in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
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
      // Rule 3: CLINICAL_STAFF/OFFICE_STAFF can only view patients in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
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
      // PATIENT role cannot view user lists
      throw createAuthorizationError('PATIENT role is not authorized to view user lists');

    default:
      throw createAuthorizationError('Invalid or unsupported user role');
  }

  try {
    // Get users from repository
    const result = await userRepository.getUsersWithFilters(filters);

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
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
}

// ===================================================================
// 🔐 SECURITY & PASSWORD UTILITIES
// ===================================================================

/**
 * Hash password using bcrypt with strong salt rounds for healthcare data
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong salt rounds for healthcare data
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate secure temporary password with mixed character types
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
 */
async function getRoleIdsFromNames(roleNames: CoreRole[]): Promise<number[]> {
  const roles = await userRepository.findRolesByNames(roleNames);

  if (roles.length !== roleNames.length) {
    const foundRoleNames = roles.map(role => role.name);
    const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
    throw new Error(`Invalid roles: ${missingRoles.join(', ')}`);
  }

  return roles.map(role => role.id);
}

// ===================================================================
// 📧 COMMUNICATION UTILITIES
// ===================================================================

/**
 * Send welcome email to new user with proper logging
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
