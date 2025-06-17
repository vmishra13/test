import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@features/auth/middlewares';
import { requireResourceOwner } from '@features/auth/middlewares/role.middleware';
import { ApiResponse } from '@shared/utils/api-response';
import { registerUserController } from './controllers/registration.controller';
import { getUsersController } from './controllers/user.controller';
import * as profileController from './controllers/profile.controller';

const router = Router();

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
 * View a specific user
 */
router.get('/:userId', authenticate, requireResourceOwner(), async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Implement actual database query
    const user = {
      id: userId,
      loginName: 'john.doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dob: '1990-01-15',
      gender: 'male',
      clientId: 1,
      userTypeId: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(user, 'User retrieved successfully')
    );
  } catch (error) {
    console.error('Get user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve user')
    );
  }
});

/**
 * PUT /users/:userId
 * Edit a user
 */
router.put('/:userId', authenticate, requireResourceOwner(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, dob, gender, timeZone } = req.body;

    // Basic validation
    if (!firstName && !lastName && !email) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('At least one field must be provided for update')
      );
      return;
    }

    // TODO: Implement actual database update
    const updatedUser = {
      id: userId,
      firstName,
      lastName,
      email,
      dob,
      gender,
      timeZone,
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(updatedUser, 'User updated successfully')
    );
  } catch (error) {
    console.error('Update user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update user')
    );
  }
});

/**
 * DELETE /users/:userId
 * Delete a user
 */
router.delete('/:userId', authenticate, requireResourceOwner(), async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Implement soft delete or hard delete based on business rules
    res.status(StatusCodes.NO_CONTENT).json(
      ApiResponse.success(null, 'User deleted successfully')
    );
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete user')
    );
  }
});

/**
 * PATCH /users/:userId
 * Inactivate/Activate a user
 */
router.patch('/:userId', authenticate, requireResourceOwner(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, status } = req.body;

    // Validate input
    if (typeof isActive !== 'boolean' && typeof status !== 'number') {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Either isActive (boolean) or status (number) must be provided')
      );
      return;
    }

    // TODO: Implement actual database status update
    const updatedUser = {
      id: userId,
      isActive: isActive !== undefined ? isActive : status === 1,
      status: status !== undefined ? status : (isActive ? 1 : 0),
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(updatedUser, 'User status updated successfully')
    );
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update user status')
    );
  }
});

/**
 * PUT /users/:userId/password
 * Update user password
 */
router.put('/:userId/password', authenticate, requireResourceOwner(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, currentPassword, confirmPassword } = req.body;

    // Validation
    if (!password) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('New password is required')
      );
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Password confirmation does not match')
      );
      return;
    }

    // Password strength validation (basic)
    if (password.length < 8) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Password must be at least 8 characters long')
      );
      return;
    }

    // TODO: Implement actual password update with proper validation
    // - Verify current password if provided
    // - Hash new password
    // - Update in database
    // - Invalidate existing tokens

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        { 
          userId,
          passwordUpdated: true,
          updatedAt: new Date().toISOString()
        }, 
        'Password updated successfully'
      )
    );
  } catch (error) {
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
