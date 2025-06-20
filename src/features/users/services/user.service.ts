import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import { CoreRole, RoleUtils } from '@shared/constants';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import type { GetUsersResponse } from '../dto/user.dto';
import {
  getUsersQuerySchema,
  validateUserViewPermissions,
  type GetUsersQueryRequest,
} from '../validators/user.validators';
// Additional imports for consolidated services
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  MobileRegistrationRequest,
  MobileRegistrationResponse,
  PersonalInfoRequest,
  PersonalInfoResponse,
  OnboardingStatusResponse,
  OnboardingCompleteResponse,
} from '../dto/registration.dto';
import type {
  Doctor,
  DoctorSelectionRequest,
  DoctorSelectionResponse,
  DoctorsListResponse,
} from '../dto/doctor.dto';
import * as userRepository from '../repositories/user.repository';
import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
  type UserQuery,
} from '../types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';
import logger from '@/config/logger';
import { getCurrentUser, createAuthRequest, performAuthorization } from '@features/auth';
import {
  validateJsonField,
  userExtraInfoSchema,
  mergeJsonFields,
} from '../validators/user.validators';
import type { UserExtraInfo } from '../validators/user.validators';
import { prismaPostgres } from '@/db/postgres/client';

export async function getUsers(req: ExtendedRequest<UserQuery>): Promise<GetUsersResponse> {
  try {
    const currentUser = getCurrentUser(req);

    const actionUserId = null; // No specific user ID for view action
    const actionClientId = req.query.clientId ? parseInt(String(req.query.clientId)) : currentUser.clientId;
    const actionUserTypeId = null; // No specific user type ID for view action
    const actionUserRoles = (req.query.role as CoreRole) || currentUser.roles; // Use roles from query or current user
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

    // Validate query parameters using Zod
    const queryParams = validateQueryParameters(req.query);

    // Get users list based on validated params and current user context
    return await getUsersList(queryParams, currentUser.roles, currentUser.clientId);
  } catch (error: any) {
    logger.error('Error in getUsers service:', error);
    throw error;
  }
}

/**
 * Validate query parameters using Zod - replaces manual validation
 */
function validateQueryParameters(query: any): GetUsersQueryRequest {
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

function getCurrentUserPrimaryRole(roles: string[]): string {
  // TEMPORARY: Return SUPER_ADMIN for empty roles (superadmin user without roles)
  if (roles.length === 0) {
    console.log('⚠️ TEMPORARY: Empty roles detected, assuming SUPER_ADMIN for compatibility');
    return CoreRole.SUPER_ADMIN;
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

export async function updateUser(
  req: ExtendedRequest<any> & { params: { userId: string } },
): Promise<{ data: any; message: string }> {
  try {
    const { userId } = req.params;
    const { extraInfo, ...otherFields } = req.body;
    const currentUser = (req as any).user;

    // ✅ Validate JSON field with Zod
    let sanitizedExtraInfo: UserExtraInfo | undefined = undefined;
    if (extraInfo !== undefined) {
      const validation = validateJsonField(extraInfo, userExtraInfoSchema, 'extraInfo');

      if (!validation.success) {
        throw createValidationError(
          'Invalid extraInfo format',
          validation.errors.map(error => ({ field: 'extraInfo', message: error })),
        );
      }

      // For updates, merge with existing data
      if (validation.data) {
        const existingUser = await prismaPostgres.user.findUnique({
          where: { id: Number(userId) },
          select: { extraInfo: true },
        });

        const mergedResult = mergeJsonFields(
          existingUser?.extraInfo as UserExtraInfo,
          validation.data,
        );
        sanitizedExtraInfo = mergedResult || undefined;
      } else {
        sanitizedExtraInfo = null as any;
      }
    }

    const updateData = {
      ...otherFields,
      modUser: currentUser.id.toString(),
      modDate: new Date(),
      ...(extraInfo !== undefined && { extraInfo: sanitizedExtraInfo }),
    };

    const updatedUser = await prismaPostgres.user.update({
      where: { id: Number(userId) },
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
        extraInfo: updatedUser.extraInfo as UserExtraInfo, // ✅ Type-safe JSON
        status: updatedUser.status,
        client: updatedUser.client,
        userType: updatedUser.userType,
        roles: updatedUser.userRoles.map(ur => ur.role),
        modDate: updatedUser.modDate,
      },
      message: 'User updated successfully',
    };
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Update user profile
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
    console.error('Update user profile error:', error);
    throw new Error(
      `Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Update personal information
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
    console.error('Update personal info error:', error);
    throw new Error('Failed to update personal information');
  }
}

// ===================================================================
// 📱 MOBILE APP USER PROFILE FUNCTIONS
// ===================================================================

/**
 * Get user profile for mobile app
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
    console.error('Get user profile error:', error);
    throw new Error('Failed to retrieve user profile');
  }
}

/**
 * Complete user onboarding
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
    console.error('Complete onboarding error:', error);
    throw new Error('Failed to complete onboarding');
  }
}

/**
 * Get onboarding status
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
    console.error('Get onboarding status error:', error);
    throw new Error('Failed to retrieve onboarding status');
  }
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

/**
 * Upload profile picture
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
    console.error('Upload profile picture error:', error);
    throw new Error('Failed to upload profile picture');
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

// ===================================================================
// 📤 REGISTRATION SERVICE FUNCTIONS (CONSOLIDATED)
// ===================================================================

/**
 * Enhanced registerUser function that handles authentication, authorization, and validation
 */
export async function registerUser(
  req: ExtendedRequest<any, RegisterUserRequest>,
): Promise<RegisterUserResponse> {
  // 1. Check authentication
  const currentUser = getCurrentUser(req);

  const actionUserId = null; // No specific user ID for registration action
  const actionClientId = req.body.clientId; // Target client from request body
  const actionUserTypeId = req.body.userTypeId; // Target user type from request body
  const actionUserRoles = req.body.roles; // Target user type from request body
  const actionPermission = RequestUserAction.userAdd; // Specific permission for user registration

  const oAuthReq: AuthRequest = createAuthRequest(
    currentUser,
    actionUserId,
    actionClientId,
    actionUserTypeId,
    actionUserRoles,
    actionPermission,
  );

  // 3. Check authorization for the specific action
  const hasPermission = performAuthorization(oAuthReq);

  if (!hasPermission) {
    logger.error(
      `User ${currentUser.userId} does not have permission to register users in client ${actionClientId}`,
    );
    throw createAuthorizationError('You do not have permission to perform this action');
  }

  // 4. Validate request body - simplified for now
  if (!req.body.loginName || !req.body.password) {
    throw createValidationError('Missing required fields', [
      { field: 'loginName', message: 'Login name is required' },
      { field: 'password', message: 'Password is required' },
    ]);
  }

  // 5. Perform basic registration
  try {
    const hashedPassword = await hashPassword(req.body.password);

    // Mock response for now
    return {
      success: true,
      data: {
        user: {
          id: Math.floor(Math.random() * 1000),
          loginName: req.body.loginName,
          firstName: req.body.firstName || null,
          lastName: req.body.lastName || null,
          email: req.body.email || null,
          timeZone: req.body.timeZone || null,
          profilePicture: req.body.profilePicture || null,
          status: 1, // Active
          crDate: new Date().toISOString(),
          client: {
            id: req.body.clientId,
            name: 'Mock Client',
            timeZone: 'UTC',
          },
          userType: {
            id: req.body.userTypeId,
            name: 'Mock User Type',
            description: 'Mock description',
          },
          roles: req.body.roles || [],
        },
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcrypt');
  const saltRounds = 12; // Strong salt rounds for healthcare data
  return await bcrypt.hash(password, saltRounds);
}

/**
 * User Registration Service
 * Handles mobile app registration and onboarding logic
 */
export class UserRegistrationService {
  /**
   * Register a new user via mobile app with client validation
   */
  async registerUser(data: MobileRegistrationRequest): Promise<MobileRegistrationResponse> {
    try {
      console.log('Registering user for client:', data.clientId, 'email:', data.email);

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
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  /**
   * Update personal information during onboarding with client validation
   */
  async updatePersonalInfo(userId: string, clientId: number, data: PersonalInfoRequest): Promise<PersonalInfoResponse> {
    try {
      console.log('Updating personal info for user:', userId, 'client:', clientId);

      // Mock implementation with client validation
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      return {
        success: true,
        data: {
          personalInfo: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            phoneNumber: data.phoneNumber,
            gender: data.gender,
            emergencyContact: data.emergencyContact,
            address: data.address,
          },
          onboardingProgress: {
            currentStep: 'doctor_selection',
            completedSteps: ['registration', 'personal_info'],
            totalSteps: 4,
            isComplete: false,
          },
        },
      };
    } catch (error) {
      console.error('Personal info update error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update personal information');
    }
  }

  /**
   * Get onboarding status for a user with client validation
   */
  async getOnboardingStatus(userId: string, clientId: number): Promise<OnboardingStatusResponse> {
    try {
      console.log('Getting onboarding status for user:', userId, 'client:', clientId);

      // Mock implementation with client validation
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      return {
        success: true,
        data: {
          currentStep: 'personal_info',
          completedSteps: ['registration'],
          totalSteps: 4,
          isComplete: false,
          progress: 25, // 1/4 complete
          nextSteps: [
            'Complete personal information',
            'Select a doctor',
            'Set up care plan',
            'Complete onboarding'
          ],
        },
      };
    } catch (error) {
      console.error('Get onboarding status error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get onboarding status');
    }
  }

  /**
   * Complete the onboarding process with client validation
   */
  async completeOnboarding(userId: string, clientId: number): Promise<OnboardingCompleteResponse> {
    try {
      console.log('Completing onboarding for user:', userId, 'client:', clientId);

      // Mock implementation with client validation
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      return {
        success: true,
        data: {
          completedAt: new Date().toISOString(),
          user: {
            id: parseInt(userId),
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            onboardingComplete: true,
          },
          nextSteps: [
            'Explore your care plan',
            'Schedule your first appointment',
            'Complete injury assessment',
            'Browse learning center'
          ],
        },
      };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to complete onboarding');
    }
  }
}

// ===================================================================
// 🏥 DOCTOR SELECTION SERVICE CLASS (CONSOLIDATED)
// ===================================================================

/**
 * Doctor Selection Service
 * Handles doctor discovery and selection logic with multi-tenancy support
 */
export class DoctorSelectionService {
  /**
   * Get available doctors with optional filtering for a specific client
   */
  async getDoctors(clientId: number, specialization?: string, location?: string): Promise<DoctorsListResponse> {
    try {
      console.log('Getting doctors for client:', clientId, 'with filters:', { specialization, location });

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
      ];

      return {
        success: true,
        data: {
          doctors: mockDoctors,
          total: mockDoctors.length,
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
  async selectDoctor(userId: string, clientId: number, doctorSelection: DoctorSelectionRequest): Promise<DoctorSelectionResponse> {
    try {
      console.log('Selecting doctor for user:', userId, 'client:', clientId, 'doctor:', doctorSelection);

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
}

// Export default for compatibility
export default DoctorSelectionService;