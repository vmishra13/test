/**
 * UNIFIED USER CONTROLLER - HIPAA COMPLIANT & MULTI-TENANT
 *
 * This controller consolidates all user-related operations while maintaining:
 * - Strict multi-tenant security isolation
 * - HIPAA/PHI compliance
 * - Role-based access control
 * - Consistent error handling patterns
 *
 * Consolidated from 5 separate controllers:
 * - user.controller.ts (admin operations)
 * - profile.controller.ts (current user profile)
 * - registration.controller.ts (user registration)
 * - doctor-selection.controller.ts (healthcare provider selection)
 * - mobile-registration.controller.ts (mobile app registration)
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UploadedFile } from 'express-fileupload';
import { ApiResponse } from '@shared/utils/api-response';
import { getCurrentUserId } from '@features/auth/middlewares';
import type { ExtendedRequest, UserQuery } from '../types/extended-request';
import type { RegisterUserRequest, MobileRegistrationRequest } from '../dto/registration.dto';
import type { DoctorSelectionRequest } from '../dto/doctor.dto';

// Service imports
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword,
  getUserProfile,
  updateUserProfile,
  updatePersonalInfo as updatePersonalInfoService,
  completeOnboarding as completeOnboardingService,
  getOnboardingStatus as getOnboardingStatusService,
  uploadProfilePicture as uploadProfilePictureService,
} from '../services/user.service';
import { registerUser } from '../services/registration.service';
import { registerUser as registerMobileUserService } from '../services/user-registration.service';
import {
  getDoctors as getDoctorsService,
  selectDoctor as selectDoctorService,
} from '../services/doctor-selection.service';

// ===================================================================
// 🛠️ UTILITY FUNCTIONS
// ===================================================================

/**
 * Standardized error handling across all controller methods
 * Maintains consistent error response format and security
 */
function handleError(res: Response, error: any, defaultMessage: string): void {
  console.error(`${defaultMessage}:`, error);

  // Handle custom authentication errors
  if (error.name === 'AuthenticationError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication required',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle custom authorization errors
  if (error.name === 'AuthorizationError') {
    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      error: 'Authorization failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle custom validation errors
  if (error.name === 'ValidationError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Validation failed',
      details: error.details,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle custom not found errors
  if (error.name === 'NotFoundError') {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: 'Resource not found',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Use specific status code if provided
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    error: defaultMessage,
    details: error.message || 'Unknown error',
    timestamp: new Date().toISOString(),
  });
}

/**
 * UNIFIED USER CONTROLLER - FUNCTION-BASED IMPLEMENTATION
 *
 * Converted from class-based to function-based implementation.
 * Consolidates all user-related operations while maintaining:
 * - Strict multi-tenant security isolation
 * - HIPAA/PHI compliance
 * - Role-based access control
 * - Consistent error handling patterns
 *
 * Consolidated from 5 separate controllers:
 * - user.controller.ts (admin operations)
 * - profile.controller.ts (current user profile)
 * - registration.controller.ts (user registration)
 * - doctor-selection.controller.ts (healthcare provider selection)
 * - mobile-registration.controller.ts (mobile app registration)
 */

// ===================================================================
// 🔐 AUTHENTICATION & REGISTRATION
// ===================================================================

/**
 * Register a new user (Admin/Web)
 * POST /api/v1/users/register
 */
export async function registerUserController(
  req: ExtendedRequest<any, RegisterUserRequest>,
  res: Response,
): Promise<void> {
  try {
    const result = await registerUser(req);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error: any) {
    handleError(res, error, 'Registration failed');
  }
}

/**
 * Register a new user via mobile app
 * POST /api/v1/users/register/mobile
 */
export async function registerMobileUserController(
  req: ExtendedRequest<any, MobileRegistrationRequest>,
  res: Response,
): Promise<void> {
  try {
    const registrationData: MobileRegistrationRequest = req.body;

    if (!registrationData.clientId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Client ID is required', 'CLIENT_ID_REQUIRED'));
      return;
    }

    const result = await registerMobileUserService(registrationData);
    res
      .status(StatusCodes.CREATED)
      .json(ApiResponse.success(result, 'User registered successfully'));
  } catch (error: any) {
    handleError(res, error, 'Mobile registration failed');
  }
}

// ===================================================================
// 📋 USER MANAGEMENT (ADMIN OPERATIONS)
// ===================================================================

/**
 * Get all users with filtering and pagination
 * GET /api/v1/users
 */
export async function getUsersController(
  req: ExtendedRequest<UserQuery>,
  res: Response,
): Promise<void> {
  try {
    const result = await getUsers(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve users');
  }
}

/**
 * Get specific user by ID
 * GET /api/v1/users/:userId
 */
export async function getUserByIdController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await getUserById(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve user');
  }
}

/**
 * Update specific user by ID (Admin operation)
 * PUT /api/v1/users/:userId
 */
export async function updateUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await updateUser(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to update user');
  }
}

/**
 * Delete user by ID (Admin operation)
 * DELETE /api/v1/users/:userId
 */
export async function deleteUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await deleteUser(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to delete user');
  }
}

/**
 * Update user status (activate/deactivate)
 * PATCH /api/v1/users/:userId/status
 */
export async function updateUserStatusController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await updateUserStatus(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to update user status');
  }
}

/**
 * Update user password
 * PUT /api/v1/users/:userId/password
 */
export async function updateUserPasswordController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await updateUserPassword(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    handleError(res, error, 'Failed to update user password');
  }
}

// ===================================================================
// 👤 CURRENT USER PROFILE OPERATIONS
// ===================================================================

/**
 * Get current user's profile
 * GET /api/v1/users/profile
 */
export async function getCurrentUserProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const profile = await getUserProfile(userId);
    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(profile, 'User profile retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve user profile');
  }
}

/**
 * Update current user's profile
 * PUT /api/v1/users/profile
 */
export async function updateCurrentUserProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication required',
            'UNAUTHORIZED',
            'User must be authenticated to update profile',
          ),
        );
      return;
    }

    const profileData = req.body;
    const updatedProfile = await updateUserProfile(userId, profileData);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(updatedProfile, 'User profile updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update user profile');
  }
}

/**
 * Update current user's personal information
 * PUT /api/v1/users/profile/personal-info
 */
export async function updatePersonalInfoController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication required',
            'UNAUTHORIZED',
            'User must be authenticated to update personal information',
          ),
        );
      return;
    }

    const personalInfo = req.body;
    const updatedInfo = await updatePersonalInfoService(userId, personalInfo);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(updatedInfo, 'Personal information updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update personal information');
  }
}

/**
 * Upload current user's profile picture
 * POST /api/v1/users/profile/upload-picture
 */
export async function uploadProfilePictureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication required',
            'UNAUTHORIZED',
            'User must be authenticated to upload profile picture',
          ),
        );
      return;
    }

    // Handle file upload
    if (!req.files || !req.files.profilePicture) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          ApiResponse.error(
            'No file uploaded',
            'NO_FILE',
            'Please select a profile picture to upload',
          ),
        );
      return;
    }

    const imageFile = req.files.profilePicture as UploadedFile;
    const result = await uploadProfilePictureService(userId, imageFile);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(result, 'Profile picture uploaded successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to upload profile picture');
  }
}

// ===================================================================
// 🎯 ONBOARDING OPERATIONS
// ===================================================================

/**
 * Get current user's onboarding status
 * GET /api/v1/users/profile/onboarding-status
 */
export async function getOnboardingStatusController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication required',
            'UNAUTHORIZED',
            'User must be authenticated to check onboarding status',
          ),
        );
      return;
    }

    const status = await getOnboardingStatusService(userId);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(status, 'Onboarding status retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve onboarding status');
  }
}

/**
 * Complete current user's onboarding
 * POST /api/v1/users/profile/complete-onboarding
 */
export async function completeOnboardingController(req: Request, res: Response): Promise<void> {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error(
            'Authentication required',
            'UNAUTHORIZED',
            'User must be authenticated to complete onboarding',
          ),
        );
      return;
    }

    const onboardingData = req.body;
    const result = await completeOnboardingService(userId, onboardingData);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(result, 'User onboarding completed successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to complete onboarding');
  }
}

// ===================================================================
// 👨‍⚕️ DOCTOR & HEALTHCARE PROVIDER OPERATIONS
// ===================================================================

/**
 * Get available doctors for selection
 * GET /api/v1/users/doctors
 */
export async function getDoctorsController(req: ExtendedRequest, res: Response): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Client not identified', 'CLIENT_ERROR'));
      return;
    }

    const specialization =
      typeof req.query.specialization === 'string' ? req.query.specialization : undefined;
    const location = typeof req.query.location === 'string' ? req.query.location : undefined;

    const result = await getDoctorsService(clientId, specialization, location);
    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'Doctors retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve doctors');
  }
}

/**
 * Select a doctor
 * POST /api/v1/users/select-doctor
 */
export async function selectDoctorController(
  req: ExtendedRequest<any, DoctorSelectionRequest>,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const clientId = req.user?.clientId;

    if (!userId || !clientId) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const selectionData: DoctorSelectionRequest = req.body;
    const result = await selectDoctorService(userId.toString(), clientId, selectionData);

    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'Doctor selected successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to select doctor');
  }
}

// ===================================================================
// 🔒 ADMIN CLIENT MANAGEMENT
// ===================================================================

/**
 * Link user to a client (Admin operation)
 * POST /api/v1/users/:userId/link-client
 */
export async function linkUserToClientController(req: ExtendedRequest<any>, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { clientId } = req.body;

    if (!clientId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Client ID is required', 'CLIENT_ID_REQUIRED'));
      return;
    }

    // TODO: Implement actual client linking logic with proper authorization
    // - Validate user has permission to link users to clients
    // - Validate client exists
    // - Update user's clientId
    // - Log the action for audit trail

    const linkedUser = {
      userId: parseInt(userId),
      clientId: parseInt(clientId),
      linkedAt: new Date().toISOString(),
      linkedBy: req.user?.loginName || 'system',
    };

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(linkedUser, 'User linked to client successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to link user to client');
  }
}
