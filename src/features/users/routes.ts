import { Router } from 'express';
import { authenticate } from '@features/auth/middlewares';
import {
  registerUserController,
  registerMobileUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  updateUserStatusController,
  updateUserPasswordController,
  getCurrentUserProfileController,
  updateCurrentUserProfileController,
  updatePersonalInfoController,
  uploadProfilePictureController,
  getOnboardingStatusController,
  completeOnboardingController,
  getDoctorsController,
  selectDoctorController,
  linkUserToClientController,
} from './controllers/user.controller';

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
router.post('/register', authenticate, registerUserController as any);

// Mobile app registration (public)
router.post('/register/mobile', registerMobileUserController as any);

// ===================================================================
// 📋 USER LIST & SEARCH ENDPOINTS
// ===================================================================

// Get all users (with filtering, pagination, search)
router.get('/', authenticate, getUsersController as any);

// ===================================================================
// 👨‍⚕️ DOCTOR & HEALTHCARE PROVIDER ENDPOINTS
// ===================================================================

// Get available doctors
router.get('/doctors', authenticate, getDoctorsController as any);

// Select a doctor
router.post('/select-doctor', authenticate, selectDoctorController as any);

// ===================================================================
// 👤 CURRENT USER PROFILE ENDPOINTS (BEFORE /:userId ROUTES)
// ===================================================================

// Get current user's profile
router.get('/profile', authenticate, getCurrentUserProfileController as any);

// Update current user's profile
router.put('/profile', authenticate, updateCurrentUserProfileController as any);

// Update current user's personal information
router.put('/profile/personal-info', authenticate, updatePersonalInfoController as any);

// Upload current user's profile picture
router.post('/profile/upload-picture', authenticate, uploadProfilePictureController as any);

// ===================================================================
// 🎯 ONBOARDING ENDPOINTS (CURRENT USER)
// ===================================================================

// Update personal info during onboarding
router.put('/onboarding/personal-info', authenticate, updatePersonalInfoController as any);

// Get current user's onboarding status
router.get('/onboarding/status', authenticate, getOnboardingStatusController as any);

// Get current user's onboarding status (alternative endpoint)
router.get('/profile/onboarding-status', authenticate, getOnboardingStatusController as any);

// Complete current user's onboarding
router.post('/onboarding/complete', authenticate, completeOnboardingController as any);

// Complete current user's onboarding (alternative endpoint)
router.post('/profile/complete-onboarding', authenticate, completeOnboardingController as any);

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
router.post('/:userId/link-client', authenticate, linkUserToClientController as any);

export default router;
