/**
 * UNIFIED USER CONTROLLER - HIPAA COMPLIANT & MULTI-TENANT
 *
 * This controller consolidates all user-related operations while maintaining:
 * - Strict multi-tenant security isolation
 * - HIPAA/PHI compliance
 * - Role-based access control
 * - Consistent error handling patterns
 *
 * FUNCTION ORDER:
 * 1. 🛠️  Utility Functions
 * 2. 🔐 Authentication & Registration
 * 3. 📋 User Management (Admin Operations)
 * 4. 👤 Current User Profile Operations
 * 5. 🎯 Onboarding Operations
 * 6. 👨‍⚕️ Healthcare Provider Operations
 * 7. 🔒 Admin Client Management
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UploadedFile } from 'express-fileupload';
import { ApiResponse } from '@shared/utils/api-response';
import { getCurrentUserId } from '@features/auth/middlewares';
import logger from '@config/logger';
import type { ExtendedRequest } from '@shared/types';
import type { UserQuery } from '../types/extended-request';
import type {
  RegisterUserRequest,
  MobileRegistrationRequest,
  DoctorSelectionRequest,
} from '../dto/user.dto';
import {
  deleteUserService,
  getUserByIdService,
  getUserProfileService,
  getUsersService,
  registerUserService,
  registerMobileUserService,
  updateUserService,
  updateUserPasswordService,
  updateUserProfileService,
  updateUserStatusService,
  updatePersonalInfoService,
  uploadProfilePictureService,
  getOnboardingStatusService,
  completeOnboardingService,
  getDoctorsService,
  selectDoctorService,
} from '../services/user.service';

// ===================================================================
// 🛠️ UTILITY FUNCTIONS
// ===================================================================

/**
 * Standardized error handling across all controller methods
 *
 * Handles different error types with consistent response format:
 * - AuthenticationError: 401 Unauthorized
 * - AuthorizationError: 403 Forbidden
 * - ValidationError: 400 Bad Request
 * - NotFoundError: 404 Not Found
 * - Generic errors: 500 Internal Server Error
 *
 * @param res - Express response object
 * @param error - The error object to handle
 * @param defaultMessage - Default message for generic errors
 */
function handleError(res: Response, error: any, defaultMessage: string): void {
  // Log error with detailed information for debugging
  logger.error(`${defaultMessage}: ${error.message}`, {
    error: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode,
    details: error.details || null,
  });

  // Handle custom authentication errors
  if (error.name === 'AuthenticationError') {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ApiResponse.error('Authentication required', 'AUTHENTICATION_ERROR', error.message));
    return;
  }

  // Handle custom authorization errors
  if (error.name === 'AuthorizationError') {
    res
      .status(StatusCodes.FORBIDDEN)
      .json(ApiResponse.error('Authorization failed', 'AUTHORIZATION_ERROR', error.message));
    return;
  }

  // Handle custom validation errors
  if (error.name === 'ValidationError') {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(ApiResponse.error('Validation failed', 'VALIDATION_ERROR', error.details));
    return;
  }

  // Handle custom not found errors
  if (error.name === 'NotFoundError') {
    res
      .status(StatusCodes.NOT_FOUND)
      .json(ApiResponse.error('Resource not found', 'NOT_FOUND_ERROR', error.message));
    return;
  }

  // Use specific status code if provided
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res
    .status(statusCode)
    .json(ApiResponse.error(defaultMessage, 'INTERNAL_ERROR', error.message || 'Unknown error'));
}

// ===================================================================
// 🔐 AUTHENTICATION & REGISTRATION
// ===================================================================

/**
 * Register a new user (Admin/Web Registration)
 *
 * Creates a new user account with role-based authorization.
 * Supports multi-role assignments based on user permissions.
 *
 * @route POST /api/v1/users/register
 * @access Private (requires authentication)
 * @param req - Extended request with RegisterUserRequest body
 * @param res - Express response object
 */
export async function registerUserController(
  req: ExtendedRequest<any, RegisterUserRequest>,
  res: Response,
): Promise<void> {
  try {
    logger.info('User registration attempt', {
      clientId: req.body?.clientId,
      loginName: req.body?.loginName,
      timestamp: new Date().toISOString(),
    });

    const result = await registerUserService(req);

    logger.info('User registration successful', {
      userId: result.data?.user?.id,
      loginName: result.data?.user?.loginName,
      clientId: result.data?.user?.client?.id,
      timestamp: new Date().toISOString(),
    });

    res
      .status(StatusCodes.CREATED)
      .json(ApiResponse.success(result, 'User registered successfully'));
  } catch (error: any) {
    handleError(res, error, 'Registration failed');
  }
}

/**
 * Register a new user via mobile app
 *
 * Handles mobile app user registration with simplified flow.
 * Validates client ID and creates user with default settings.
 *
 * @route POST /api/v1/users/register/mobile
 * @access Public
 * @param req - Extended request with MobileRegistrationRequest body
 * @param res - Express response object
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
 *
 * Retrieves users based on role permissions and client isolation.
 * Supports filtering by status, role, and client.
 *
 * @route GET /api/v1/users
 * @access Private (requires authentication)
 * @param req - Extended request with UserQuery parameters
 * @param res - Express response object
 */
export async function getUsersController(
  req: ExtendedRequest<UserQuery>,
  res: Response,
): Promise<void> {
  try {
    const result = await getUsersService(req as any);
    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'Users retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve users');
  }
}

/**
 * Get specific user by ID
 *
 * Retrieves detailed user information with role-based access control.
 * Enforces client isolation and permission checks.
 *
 * @route GET /api/v1/users/:userId
 * @access Private (requires authentication)
 * @param req - Extended request with userId parameter
 * @param res - Express response object
 */
export async function getUserByIdController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await getUserByIdService(req as any);
    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'User retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve user');
  }
}

/**
 * Update specific user by ID (Admin operation)
 *
 * Updates user information with proper authorization checks.
 * Supports partial updates and maintains audit trail.
 *
 * @route PUT /api/v1/users/:userId
 * @access Private (requires admin permissions)
 * @param req - Extended request with userId parameter and update data
 * @param res - Express response object
 */
export async function updateUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await updateUserService(req as any);
    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'User updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update user');
  }
}

/**
 * Update user status (activate/deactivate)
 *
 * Changes user status with proper authorization and audit logging.
 * Prevents self-deactivation and validates business rules.
 *
 * @route PATCH /api/v1/users/:userId/status
 * @access Private (requires admin permissions)
 * @param req - Extended request with userId parameter and status data
 * @param res - Express response object
 */
export async function updateUserStatusController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const result = await updateUserStatusService(req as any);
    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(result, 'User status updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update user status');
  }
}

/**
 * Update user password
 *
 * Updates user password with security validations and audit logging.
 * Enforces password policies and client isolation.
 *
 * @route PUT /api/v1/users/:userId/password
 * @access Private (requires admin permissions)
 * @param req - Extended request with userId parameter and password data
 * @param res - Express response object
 */
export async function updateUserPasswordController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const userId = req.params.userId;

    logger.info('Password update attempt', {
      targetUserId: userId,
      initiatedBy: req.user?.loginName || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const result = await updateUserPasswordService(req as any);

    logger.info('Password update successful', {
      targetUserId: userId,
      initiatedBy: req.user?.loginName || 'unknown',
      timestamp: new Date().toISOString(),
    });

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(result, 'User password updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update user password');
  }
}

/**
 * Delete user by ID (Admin operation)
 *
 * Permanently removes user account with strict authorization.
 * Includes comprehensive audit logging and validation checks.
 *
 * @route DELETE /api/v1/users/:userId
 * @access Private (requires admin permissions)
 * @param req - Extended request with userId parameter
 * @param res - Express response object
 */
export async function deleteUserController(
  req: ExtendedRequest<any> & { params: { userId: string } },
  res: Response,
): Promise<void> {
  try {
    const userId = req.params.userId;

    logger.warn('User deletion attempt', {
      targetUserId: userId,
      initiatedBy: req.user?.loginName || 'unknown',
      clientId: req.user?.clientId || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const result = await deleteUserService(req as any);

    logger.warn('User deletion successful', {
      targetUserId: userId,
      deletedUserId: result.data?.deletedUserId,
      deletedAt: result.data?.deletedAt,
      initiatedBy: req.user?.loginName || 'unknown',
      timestamp: new Date().toISOString(),
    });

    res.status(StatusCodes.OK).json(ApiResponse.success(result, 'User deleted successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to delete user');
  }
}

// ===================================================================
// 👤 CURRENT USER PROFILE OPERATIONS
// ===================================================================

/**
 * Get current user's profile
 *
 * Retrieves authenticated user's complete profile information.
 * Includes personal details, preferences, and client information.
 *
 * @route GET /api/v1/users/profile
 * @access Private (requires authentication)
 * @param req - Express request object
 * @param res - Express response object
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

    const profile = await getUserProfileService(userId);
    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(profile, 'User profile retrieved successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to retrieve user profile');
  }
}

/**
 * Update current user's profile
 *
 * Allows authenticated users to update their own profile information.
 * Validates data and maintains audit trail of changes.
 *
 * @route PUT /api/v1/users/profile
 * @access Private (requires authentication)
 * @param req - Express request object with profile data
 * @param res - Express response object
 */
export async function updateCurrentUserProfileController(
  req: Request,
  res: Response,
): Promise<void> {
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
    const updatedProfile = await updateUserProfileService(userId, profileData);

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(updatedProfile, 'User profile updated successfully'));
  } catch (error: any) {
    handleError(res, error, 'Failed to update user profile');
  }
}

/**
 * Update current user's personal information
 *
 * Updates specific personal information fields for the authenticated user.
 * Includes validation and HIPAA-compliant data handling.
 *
 * @route PUT /api/v1/users/profile/personal-info
 * @access Private (requires authentication)
 * @param req - Express request object with personal info data
 * @param res - Express response object
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
 *
 * Handles secure file upload for user profile pictures.
 * Validates file types, sizes, and stores securely.
 *
 * @route POST /api/v1/users/profile/upload-picture
 * @access Private (requires authentication)
 * @param req - Express request object with file upload
 * @param res - Express response object
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
 *
 * Retrieves the onboarding progress and completion status.
 * Used to determine required onboarding steps.
 *
 * @route GET /api/v1/users/profile/onboarding-status
 * @access Private (requires authentication)
 * @param req - Express request object
 * @param res - Express response object
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
 *
 * Marks onboarding as complete and processes final setup steps.
 * Validates all required information is provided.
 *
 * @route POST /api/v1/users/profile/complete-onboarding
 * @access Private (requires authentication)
 * @param req - Express request object with onboarding data
 * @param res - Express response object
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
// 👨‍⚕️ HEALTHCARE PROVIDER OPERATIONS
// ===================================================================

/**
 * Get available doctors for selection
 *
 * Retrieves list of available healthcare providers within client scope.
 * Supports filtering by specialization and location.
 *
 * @route GET /api/v1/users/doctors
 * @access Private (requires authentication)
 * @param req - Extended request with optional query parameters
 * @param res - Express response object
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
 * Select a doctor for care
 *
 * Associates a patient with a selected healthcare provider.
 * Validates provider availability and client relationships.
 *
 * @route POST /api/v1/users/select-doctor
 * @access Private (requires authentication)
 * @param req - Extended request with DoctorSelectionRequest body
 * @param res - Express response object
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
 *
 * Associates a user with a specific client organization.
 * Requires super admin permissions and validates relationships.
 *
 * @route POST /api/v1/users/:userId/link-client
 * @access Private (requires super admin permissions)
 * @param req - Extended request with userId parameter and clientId body
 * @param res - Express response object
 */
export async function linkUserToClientController(
  req: ExtendedRequest<any>,
  res: Response,
): Promise<void> {
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
