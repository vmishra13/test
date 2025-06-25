import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@features/auth/middlewares';
import { ApiResponse } from '@shared/utils/api-response';
import { userController } from './controllers/user.controller';

const router = Router();

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
router.post('/register', authenticate, (req, res) =>
  userController.registerUser(req as any, res)
);

// Mobile app registration (public)
router.post('/register/mobile', (req, res) =>
  userController.registerMobileUser(req as any, res)
);

// ===================================================================
// 📋 USER LIST & SEARCH ENDPOINTS
// ===================================================================

// Get all users (with filtering, pagination, search)
router.get('/', authenticate, (req, res) =>
  userController.getUsers(req as any, res)
);

// ===================================================================
// 👨‍⚕️ DOCTOR & HEALTHCARE PROVIDER ENDPOINTS
// ===================================================================

// Get available doctors
router.get('/doctors', authenticate, (req, res) =>
  userController.getDoctors(req as any, res)
);

// Select a doctor
router.post('/select-doctor', authenticate, (req, res) =>
  userController.selectDoctor(req as any, res)
);

// ===================================================================
// 👤 CURRENT USER PROFILE ENDPOINTS (BEFORE /:userId ROUTES)
// ===================================================================

// Get current user's profile
router.get('/profile', authenticate, (req, res) =>
  userController.getCurrentUserProfile(req, res)
);

// Update current user's profile
router.put('/profile', authenticate, (req, res) =>
  userController.updateCurrentUserProfile(req, res)
);

// Update current user's personal information
router.put('/profile/personal-info', authenticate, (req, res) =>
  userController.updatePersonalInfo(req, res)
);

// Upload current user's profile picture
router.post('/profile/upload-picture', authenticate, (req, res) =>
  userController.uploadProfilePicture(req, res)
);

// ===================================================================
// 🎯 ONBOARDING ENDPOINTS (CURRENT USER)
// ===================================================================

// Update personal info during onboarding
router.put('/onboarding/personal-info', authenticate, (req, res) =>
  userController.updatePersonalInfo(req, res)
);

// Get current user's onboarding status
router.get('/onboarding/status', authenticate, (req, res) =>
  userController.getOnboardingStatus(req, res)
);

// Get current user's onboarding status (alternative endpoint)
router.get('/profile/onboarding-status', authenticate, (req, res) =>
  userController.getOnboardingStatus(req, res)
);

// Complete current user's onboarding
router.post('/onboarding/complete', authenticate, (req, res) =>
  userController.completeOnboarding(req, res)
);

// Complete current user's onboarding (alternative endpoint)
router.post('/profile/complete-onboarding', authenticate, (req, res) =>
  userController.completeOnboarding(req, res)
);

// ===================================================================
// 👥 SPECIFIC USER MANAGEMENT ENDPOINTS (ADMIN OPERATIONS)
// ===================================================================

// View a specific user by ID
router.get('/:userId', authenticate, (req, res) =>
  userController.getUserById(req as any, res)
);

// Update a specific user by ID
router.put('/:userId', authenticate, (req, res) =>
  userController.updateUser(req as any, res)
);

// Delete a specific user by ID
router.delete('/:userId', authenticate, (req, res) =>
  userController.deleteUser(req as any, res)
);

// Update user status (activate/deactivate)
router.patch('/:userId', authenticate, (req, res) =>
  userController.updateUserStatus(req as any, res)
);

// ===================================================================
// 🔒 USER SECURITY & ACCESS ENDPOINTS
// ===================================================================

// Update user password
router.put('/:userId/password', authenticate, (req, res) =>
  userController.updateUserPassword(req as any, res)
);

// Link user to a client (admin operation)
router.post('/:userId/link-client', authenticate, (req, res) =>
  userController.linkUserToClient(req as any, res)
);

export default router;
