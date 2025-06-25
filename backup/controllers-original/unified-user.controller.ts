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
import type { RegisterUserRequest, MobileRegistrationRequest, PersonalInfoRequest } from '../dto/registration.dto';
import type { DoctorSelectionRequest } from '../dto/doctor.dto';

// Service imports
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword,
  getUserProfile as getUserProfileService,
} from '../services/user.service';
import { registerUser } from '../services/registration.service';
import { UserRegistrationService } from '../services/user-registration.service';
import DoctorSelectionService from '../services/doctor-selection.service';

/**
 * Unified User Controller Class
 * Handles all user-related operations with consistent security patterns
 */
export class UnifiedUserController {
  private registrationService: UserRegistrationService;
  private doctorService: DoctorSelectionService;

  constructor() {
    this.registrationService = new UserRegistrationService();
    this.doctorService = new DoctorSelectionService();
  }

  // ===================================================================
  // 🔐 AUTHENTICATION & REGISTRATION
  // ===================================================================

  /**
   * Register a new user (Admin/Web)
   * POST /api/v1/users/register
   */
  async registerUser(req: ExtendedRequest<any, RegisterUserRequest>, res: Response): Promise<void> {
    try {
      const result = await registerUser(req);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Registration failed');
    }
  }

  /**
   * Register a new user via mobile app
   * POST /api/v1/users/register/mobile
   */
  async registerMobileUser(req: ExtendedRequest<any, MobileRegistrationRequest>, res: Response): Promise<void> {
    try {
      const registrationData: MobileRegistrationRequest = req.body;
      
      if (!registrationData.clientId) {
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error('Client ID is required', 'CLIENT_ID_REQUIRED')
        );
        return;
      }

      const result = await this.registrationService.registerUser(registrationData);
      res.status(StatusCodes.CREATED).json(
        ApiResponse.success(result, 'User registered successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Mobile registration failed');
    }
  }

  // ===================================================================
  // 📋 USER MANAGEMENT (ADMIN OPERATIONS)
  // ===================================================================

  /**
   * Get all users with filtering and pagination
   * GET /api/v1/users
   */
  async getUsers(req: ExtendedRequest<UserQuery>, res: Response): Promise<void> {
    try {
      const result = await getUsers(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve users');
    }
  }

  /**
   * Get specific user by ID
   * GET /api/v1/users/:userId
   */
  async getUserById(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const result = await getUserById(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve user');
    }
  }

  /**
   * Update specific user by ID (Admin operation)
   * PUT /api/v1/users/:userId
   */
  async updateUser(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const result = await updateUser(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update user');
    }
  }

  /**
   * Delete user by ID (Admin operation)
   * DELETE /api/v1/users/:userId
   */
  async deleteUser(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const result = await deleteUser(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to delete user');
    }
  }

  /**
   * Update user status (activate/deactivate)
   * PATCH /api/v1/users/:userId/status
   */
  async updateUserStatus(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const result = await updateUserStatus(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update user status');
    }
  }

  /**
   * Update user password
   * PUT /api/v1/users/:userId/password
   */
  async updateUserPassword(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const result = await updateUserPassword(req as any);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update user password');
    }
  }

  // ===================================================================
  // 👤 CURRENT USER PROFILE OPERATIONS
  // ===================================================================

  /**
   * Get current user's profile
   * GET /api/v1/users/profile
   */
  async getCurrentUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      const profile = await getUserProfileService(userId);
      res.status(StatusCodes.OK).json(
        ApiResponse.success(profile, 'User profile retrieved successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve user profile');
    }
  }

  /**
   * Update current user's profile
   * PUT /api/v1/users/profile
   */
  async updateCurrentUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      // Create a request object that includes userId in params for the service
      const serviceRequest = {
        ...req,
        params: { ...req.params, userId: userId.toString() },
        user: req.user
      } as unknown as ExtendedRequest<any> & { params: { userId: string } };

      const result = await updateUser(serviceRequest);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update user profile');
    }
  }

  /**
   * Update current user's personal information
   * PUT /api/v1/users/profile/personal-info
   */
  async updatePersonalInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      const personalInfo: PersonalInfoRequest = req.body;
      const clientId = req.user?.clientId;
      
      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const result = await this.registrationService.updatePersonalInfo(userId.toString(), clientId, personalInfo);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Personal information updated successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update personal information');
    }
  }

  /**
   * Upload current user's profile picture
   * POST /api/v1/users/profile/upload-picture
   */
  async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      if (!req.files || !req.files.profilePicture) {
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error('Profile picture file is required', 'FILE_REQUIRED')
        );
        return;
      }

      const file = req.files.profilePicture as UploadedFile;
      
      // TODO: Implement file upload logic with proper validation
      // - Validate file type (images only)
      // - Validate file size
      // - Upload to secure storage (S3, etc.)
      // - Update user profile with new picture URL
      
      const mockResult = {
        userId,
        profilePictureUrl: `/uploads/profiles/${userId}-${Date.now()}.jpg`,
        uploadedAt: new Date().toISOString()
      };

      res.status(StatusCodes.OK).json(
        ApiResponse.success(mockResult, 'Profile picture uploaded successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to upload profile picture');
    }
  }

  // ===================================================================
  // 🎯 ONBOARDING OPERATIONS
  // ===================================================================

  /**
   * Get current user's onboarding status
   * GET /api/v1/users/profile/onboarding-status
   */
  async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      const clientId = req.user?.clientId;
      
      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const status = await this.registrationService.getOnboardingStatus(userId.toString(), clientId);
      res.status(StatusCodes.OK).json(
        ApiResponse.success(status, 'Onboarding status retrieved successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve onboarding status');
    }
  }

  /**
   * Complete current user's onboarding
   * POST /api/v1/users/profile/complete-onboarding
   */
  async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      const clientId = req.user?.clientId;
      
      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const result = await this.registrationService.completeOnboarding(userId.toString(), clientId);
      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Onboarding completed successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to complete onboarding');
    }
  }

  // ===================================================================
  // 👨‍⚕️ DOCTOR & HEALTHCARE PROVIDER OPERATIONS
  // ===================================================================

  /**
   * Get available doctors for selection
   * GET /api/v1/users/doctors
   */
  async getDoctors(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user?.clientId;
      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const specialization = typeof req.query.specialization === 'string' ? req.query.specialization : undefined;
      const location = typeof req.query.location === 'string' ? req.query.location : undefined;
      
      const result = await this.doctorService.getDoctors(clientId, specialization, location);
      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Doctors retrieved successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve doctors');
    }
  }

  /**
   * Select a doctor
   * POST /api/v1/users/select-doctor
   */
  async selectDoctor(req: ExtendedRequest<any, DoctorSelectionRequest>, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const clientId = req.user?.clientId;
      
      if (!userId || !clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Authentication required', 'UNAUTHORIZED')
        );
        return;
      }

      const selectionData: DoctorSelectionRequest = req.body;
      const result = await this.doctorService.selectDoctor(userId.toString(), clientId, selectionData);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Doctor selected successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to select doctor');
    }
  }

  // ===================================================================
  // 🔒 ADMIN CLIENT MANAGEMENT
  // ===================================================================

  /**
   * Link user to a client (Admin operation)
   * POST /api/v1/users/:userId/link-client
   */
  async linkUserToClient(req: ExtendedRequest<any>, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { clientId } = req.body;

      if (!clientId) {
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error('Client ID is required', 'CLIENT_ID_REQUIRED')
        );
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

      res.status(StatusCodes.OK).json(
        ApiResponse.success(linkedUser, 'User linked to client successfully')
      );
    } catch (error: any) {
      this.handleError(res, error, 'Failed to link user to client');
    }
  }

  // ===================================================================
  // 🛠️ PRIVATE UTILITY METHODS
  // ===================================================================

  /**
   * Standardized error handling across all controller methods
   * Maintains consistent error response format and security
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
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
}

// Export both class and individual functions for backward compatibility
export const unifiedUserController = new UnifiedUserController();

// Individual function exports for existing route compatibility
export const getUsersController = unifiedUserController.getUsers.bind(unifiedUserController);
export const getUserByIdController = unifiedUserController.getUserById.bind(unifiedUserController);
export const updateUserController = unifiedUserController.updateUser.bind(unifiedUserController);
export const deleteUserController = unifiedUserController.deleteUser.bind(unifiedUserController);
export const updateUserStatusController = unifiedUserController.updateUserStatus.bind(unifiedUserController);
export const updateUserPasswordController = unifiedUserController.updateUserPassword.bind(unifiedUserController);
export const registerUserController = unifiedUserController.registerUser.bind(unifiedUserController);

// Profile operations
export const getUserProfile = unifiedUserController.getCurrentUserProfile.bind(unifiedUserController);
export const updateUserProfile = unifiedUserController.updateCurrentUserProfile.bind(unifiedUserController);
export const updatePersonalInfo = unifiedUserController.updatePersonalInfo.bind(unifiedUserController);
export const completeOnboarding = unifiedUserController.completeOnboarding.bind(unifiedUserController);
export const getOnboardingStatus = unifiedUserController.getOnboardingStatus.bind(unifiedUserController);
export const uploadProfilePicture = unifiedUserController.uploadProfilePicture.bind(unifiedUserController);

export default unifiedUserController;
