/**
 * User Profile Controller for Mobile App
 * Handles user onboarding, profile setup, and personal information management
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UploadedFile } from 'express-fileupload';
import { ApiResponse } from '@shared/utils/api-response';
import { getCurrentUserId } from '@features/auth/middlewares';
import * as userService from '../services/user.service';

/**
 * Get user profile for mobile app
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to access profile'
        )
      );
      return;
    }

    const profile = await userService.getUserProfile(userId);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        profile,
        'User profile retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to retrieve user profile',
        'PROFILE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

/**
 * Update user profile - for mobile app onboarding
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to update profile'
        )
      );
      return;
    }

    const profileData = req.body;
    const updatedProfile = await userService.updateUserProfile(userId, profileData);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        updatedProfile,
        'User profile updated successfully'
      )
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to update user profile',
        'PROFILE_UPDATE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

/**
 * Update personal information
 */
export const updatePersonalInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to update personal information'
        )
      );
      return;
    }

    const personalInfo = req.body;
    const updatedInfo = await userService.updatePersonalInfo(userId, personalInfo);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        updatedInfo,
        'Personal information updated successfully'
      )
    );
  } catch (error) {
    console.error('Update personal info error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to update personal information',
        'PERSONAL_INFO_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

/**
 * Complete user onboarding
 */
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to complete onboarding'
        )
      );
      return;
    }

    const onboardingData = req.body;
    const result = await userService.completeOnboarding(userId, onboardingData);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        result,
        'User onboarding completed successfully'
      )
    );
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to complete onboarding',
        'ONBOARDING_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to check onboarding status'
        )
      );
      return;
    }

    const status = await userService.getOnboardingStatus(userId);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        status,
        'Onboarding status retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to retrieve onboarding status',
        'ONBOARDING_STATUS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json(
        ApiResponse.error(
          'Authentication required',
          'UNAUTHORIZED',
          'User must be authenticated to upload profile picture'
        )
      );
      return;
    }

    // Handle file upload
    if (!req.files || !req.files.profilePicture) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(
          'No file uploaded',
          'NO_FILE',
          'Please select a profile picture to upload'
        )
      );
      return;
    }

    const imageFile = req.files.profilePicture as UploadedFile;
    const result = await userService.uploadProfilePicture(userId, imageFile);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        result,
        'Profile picture uploaded successfully'
      )
    );
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error(
        'Failed to upload profile picture',
        'UPLOAD_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
};
