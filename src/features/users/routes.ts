import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@features/auth/middlewares';
import { requireResourceOwner } from '@features/auth/middlewares/role.middleware';
import { ApiResponse } from '@shared/utils/api-response';
import { registerUserController } from './controllers/registration.controller';
import { getUsersController } from './controllers/user.controller';
import * as profileController from './controllers/profile.controller';
import * as userService from './services/user.service';
import MobileRegistrationController from './controllers/mobile-registration.controller';
import DoctorSelectionController from './controllers/doctor-selection.controller';
import { ExtendedRequest } from './types/extended-request';

const router = Router();

// Initialize controllers
const mobileRegistrationController = new MobileRegistrationController();
const doctorSelectionController = new DoctorSelectionController();

// ===================================================================
// 🎯 MOBILE REGISTRATION & ONBOARDING ENDPOINTS
// ===================================================================

// Mobile app registration
router.post('/register/mobile', (req, res) => 
  mobileRegistrationController.register(req as any, res)
);

// Onboarding endpoints
router.put('/onboarding/personal-info', authenticate, (req, res) => 
  mobileRegistrationController.updatePersonalInfo(req as any, res)
);
router.get('/onboarding/status', authenticate, (req, res) => 
  mobileRegistrationController.getOnboardingStatus(req as any, res)
);
router.post('/onboarding/complete', authenticate, (req, res) => 
  mobileRegistrationController.completeOnboarding(req as any, res)
);

// ===================================================================
// 🎯 DOCTOR SELECTION ENDPOINTS
// ===================================================================

// Get available doctors
router.get('/doctors', authenticate, (req, res) => 
  doctorSelectionController.getDoctors(req as any, res)
);

// Select a doctor
router.post('/select-doctor', authenticate, (req, res) => 
  doctorSelectionController.selectDoctor(req as any, res)
);

// ===================================================================
// 🎯 EXISTING ENDPOINTS
// ===================================================================

// Core registration endpoints
router.post('/register', authenticate, registerUserController as any);

// Core user management endpoints
router.get('/', authenticate, getUsersController as any);

// ===================================================================
// 🎯 MOBILE APP PROFILE ENDPOINTS (MUST BE BEFORE /:userId ROUTES)
// ===================================================================

// Get user profile
router.get('/profile', authenticate, profileController.getUserProfile);

// Update user profile
router.put('/profile', authenticate, profileController.updateUserProfile);

// Update personal information
router.put('/profile/personal-info', authenticate, profileController.updatePersonalInfo);

// Complete onboarding
router.post('/profile/complete-onboarding', authenticate, profileController.completeOnboarding);

// Get onboarding status
router.get('/profile/onboarding-status', authenticate, profileController.getOnboardingStatus);

// Upload profile picture
router.post('/profile/upload-picture', authenticate, profileController.uploadProfilePicture);

/**
 * GET /users/:userId
 * View a specific user - SECURED with multi-tenant validation
 */
router.get('/:userId', authenticate, async (req, res) => {
  try {
    // CRITICAL: Use secure user service that enforces client validation
    const result = await userService.getUserById(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Get user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve user')
    );
  }
});

/**
 * PUT /users/:userId
 * Edit a user - SECURED with multi-tenant validation
 */
router.put('/:userId', authenticate, async (req, res) => {
  try {
    // CRITICAL: Use secure user service that enforces client validation
    const result = await userService.updateUser(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Update user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update user')
    );
  }
});

/**
 * DELETE /users/:userId
 * Delete a user - SECURED with multi-tenant validation
 */
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    // CRITICAL: Use secure user service that enforces client validation and proper deletion authorization
    const result = await userService.deleteUser(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for user deletion',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Delete user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete user')
    );
  }
});

/**
 * PATCH /users/:userId
 * Inactivate/Activate a user - SECURED with multi-tenant validation
 */
router.patch('/:userId', authenticate, async (req, res) => {
  try {
    // CRITICAL: Use secure user service that enforces client validation and status change authorization
    const result = await userService.updateUserStatus(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for status change',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Update user status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update user status')
    );
  }
});

/**
 * PUT /users/:userId/password
 * Update user password - SECURED with multi-tenant validation
 */
router.put('/:userId/password', authenticate, async (req, res) => {
  try {
    // CRITICAL: Use secure user service that enforces client validation and password policies
    const result = await userService.updateUserPassword(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - You can only update passwords within your organization',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Update password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update password')
    );
  }
});

/**
 * POST /users/:userId/link-client
 * Link user to a client
 */
router.post('/:userId/link-client', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { clientId } = req.body;

    // Validation
    if (!clientId) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Client ID is required')
      );
      return;
    }

    // TODO: Implement actual client linking logic
    // - Validate client exists
    // - Check permissions (only admins can link users to clients)
    // - Update user's clientId
    // - Log the action

    const linkedUser = {
      userId: parseInt(userId),
      clientId: parseInt(clientId),
      linkedAt: new Date().toISOString(),
      linkedBy: req.user?.loginName || 'system'
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(linkedUser, 'User linked to client successfully')
    );
  } catch (error) {
    console.error('Link user to client error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to link user to client')
    );
  }
});

export default router;
