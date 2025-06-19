import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@features/auth/middlewares';
import { ApiResponse } from '@shared/utils/api-response';
import { registerUserController } from './controllers/registration.controller';
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  updateUserStatusController,
  updateUserPasswordController,
} from './controllers/user.controller';
import * as profileController from './controllers/profile.controller';
import MobileRegistrationController from './controllers/mobile-registration.controller';
import DoctorSelectionController from './controllers/doctor-selection.controller';

const router = Router();

// Initialize controllers
const mobileRegistrationController = new MobileRegistrationController();
const doctorSelectionController = new DoctorSelectionController();

// ===================================================================
// 📚 ROUTE ORGANIZATION & ORDER
// ===================================================================
// 1. 🔐 Authentication & Registration (public + authenticated)
// 2. 📋 User Lists & Search (authenticated)
// 3. 👨‍⚕️ Healthcare Providers (authenticated)
// 4. 👤 Current User Profile (authenticated, specific paths)
// 5. 🎯 Onboarding (authenticated, specific paths)
// 6. 👥 Admin User Management (authenticated, parameterized paths)
// 7. 🔒 Security & Access Control (authenticated, parameterized paths)
//
// ⚠️  CRITICAL: Specific paths (e.g., /profile, /doctors) MUST come
//     before parameterized paths (e.g., /:userId) to avoid conflicts!
// ===================================================================

// ===================================================================
// 🔐 AUTHENTICATION & REGISTRATION ENDPOINTS
// ===================================================================

// Core user registration (web/admin)
router.post('/register', authenticate, registerUserController as any);

// Mobile app registration (public)
router.post('/register/mobile', (req, res) =>
  mobileRegistrationController.register(req as any, res),
);

// ===================================================================
// 📋 USER LIST & SEARCH ENDPOINTS
// ===================================================================

// Get all users (with filtering, pagination, search)
router.get('/', authenticate, getUsersController as any);

// ===================================================================
// 👨‍⚕️ DOCTOR & HEALTHCARE PROVIDER ENDPOINTS
// ===================================================================

// Get available doctors
router.get('/doctors', authenticate, (req, res) =>
  doctorSelectionController.getDoctors(req as any, res),
);

// Select a doctor
router.post('/select-doctor', authenticate, (req, res) =>
  doctorSelectionController.selectDoctor(req as any, res),
);

// ===================================================================
// 👤 CURRENT USER PROFILE ENDPOINTS (BEFORE /:userId ROUTES)
// ===================================================================

// Get current user's profile
router.get('/profile', authenticate, profileController.getUserProfile);

// Update current user's profile
router.put('/profile', authenticate, profileController.updateUserProfile);

// Update current user's personal information
router.put('/profile/personal-info', authenticate, profileController.updatePersonalInfo);

// Upload current user's profile picture
router.post('/profile/upload-picture', authenticate, profileController.uploadProfilePicture);

// ===================================================================
// 🎯 ONBOARDING ENDPOINTS (CURRENT USER)
// ===================================================================

// Update personal info during onboarding
router.put('/onboarding/personal-info', authenticate, (req, res) =>
  mobileRegistrationController.updatePersonalInfo(req as any, res),
);

// Get current user's onboarding status
router.get('/onboarding/status', authenticate, (req, res) =>
  mobileRegistrationController.getOnboardingStatus(req as any, res),
);

// Get current user's onboarding status (alternative endpoint)
router.get('/profile/onboarding-status', authenticate, profileController.getOnboardingStatus);

// Complete current user's onboarding
router.post('/onboarding/complete', authenticate, (req, res) =>
  mobileRegistrationController.completeOnboarding(req as any, res),
);

// Complete current user's onboarding (alternative endpoint)
router.post('/profile/complete-onboarding', authenticate, profileController.completeOnboarding);

// ===================================================================
// 👥 SPECIFIC USER MANAGEMENT ENDPOINTS (ADMIN OPERATIONS)
// ===================================================================

// View a specific user by ID
router.get('/:userId', authenticate, getUserByIdController as any);

// Update a specific user by ID
router.put('/:userId', authenticate, updateUserController as any);

// Delete a specific user by ID
router.delete('/:userId', authenticate, deleteUserController as any);

// Update user status (activate/deactivate)
router.patch('/:userId', authenticate, updateUserStatusController as any);

// ===================================================================
// 🔒 USER SECURITY & ACCESS ENDPOINTS
// ===================================================================

// Update user password
router.put('/:userId/password', authenticate, updateUserPasswordController as any);

// Link user to a client (admin operation)
router.post('/:userId/link-client', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { clientId } = req.body;

    // Validation
    if (!clientId) {
      res.status(StatusCodes.BAD_REQUEST).json(ApiResponse.error('Client ID is required'));
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
      linkedBy: req.user?.loginName || 'system',
    };

    res
      .status(StatusCodes.OK)
      .json(ApiResponse.success(linkedUser, 'User linked to client successfully'));
  } catch (error) {
    console.error('Link user to client error:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Failed to link user to client'));
  }
});

export default router;
