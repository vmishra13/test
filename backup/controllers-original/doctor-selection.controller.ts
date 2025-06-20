import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../../shared/utils/api-response';
import DoctorSelectionService from '../services/doctor-selection.service.js';
import type { ExtendedRequest } from '../types/extended-request';
import type {
  DoctorSelectionRequest,
} from '../dto/doctor.dto.js';

/**
 * Doctor Selection Controller
 * Handles doctor discovery and selection endpoints
 */
export class DoctorSelectionController {
  private doctorService: DoctorSelectionService;

  constructor() {
    this.doctorService = new DoctorSelectionService();
  }

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
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(
          'Failed to retrieve doctors',
          'DOCTORS_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
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

      const doctorSelection: DoctorSelectionRequest = req.body;
      const result = await this.doctorService.selectDoctor(String(userId), clientId, doctorSelection);

      res.status(StatusCodes.OK).json(
        ApiResponse.success(result, 'Doctor selected successfully')
      );
    } catch (error) {
      console.error('Doctor selection error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(
          'Failed to select doctor',
          'DOCTOR_SELECTION_ERROR',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }
}

export default DoctorSelectionController;
