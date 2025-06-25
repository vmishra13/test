import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../../shared/utils/api-response';
import { UserRegistrationService } from '../services/user-registration.service.js';
import type { ExtendedRequest } from '../types/extended-request';
import type {
  MobileRegistrationRequest,
  PersonalInfoRequest,
} from '../dto/registration.dto';

/**
 * Mobile Registration Controller
 * Handles user registration and onboarding endpoints with multi-tenancy support
 */
export class MobileRegistrationController {
  private registrationService: UserRegistrationService;

  constructor() {
    this.registrationService = new UserRegistrationService();
  }

  /**
   * Register a new user via mobile app
   * POST /api/v1/users/register/mobile
   */
  async register(req: ExtendedRequest<any, MobileRegistrationRequest>, res: Response): Promise<void> {
    try {
      const registrationData: MobileRegistrationRequest = req.body;
      
      // Validate clientId is provided
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
    } catch (error) {
      console.error('Mobile registration error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(
          'Registration failed',
          'REGISTRATION_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }

  /**
   * Update personal information during onboarding
   * PUT /api/v1/users/onboarding/personal-info
   */
  async updatePersonalInfo(req: ExtendedRequest<any, PersonalInfoRequest>, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const clientId = req.user?.clientId;
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('User not authenticated', 'AUTH_ERROR')
        );
        return;
      }

      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const personalInfo: PersonalInfoRequest = req.body;
      const result = await this.registrationService.updatePersonalInfo(String(userId), clientId, personalInfo);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Personal information updated successfully')
      );
    } catch (error) {
      console.error('Personal info update error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(
          'Failed to update personal information',
          'UPDATE_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }

  /**
   * Get onboarding status
   * GET /api/v1/users/onboarding/status
   */
  async getOnboardingStatus(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const clientId = req.user?.clientId;
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('User not authenticated', 'AUTH_ERROR')
        );
        return;
      }

      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const result = await this.registrationService.getOnboardingStatus(String(userId), clientId);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Onboarding status retrieved successfully')
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
  }

  /**
   * Complete onboarding
   * POST /api/v1/users/onboarding/complete
   */
  async completeOnboarding(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const clientId = req.user?.clientId;
      
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('User not authenticated', 'AUTH_ERROR')
        );
        return;
      }

      if (!clientId) {
        res.status(StatusCodes.UNAUTHORIZED).json(
          ApiResponse.error('Client not identified', 'CLIENT_ERROR')
        );
        return;
      }

      const result = await this.registrationService.completeOnboarding(String(userId), clientId);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Onboarding completed successfully')
      );
    } catch (error) {
      console.error('Complete onboarding error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(
          'Failed to complete onboarding',
          'ONBOARDING_COMPLETE_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }
}

export default MobileRegistrationController;
