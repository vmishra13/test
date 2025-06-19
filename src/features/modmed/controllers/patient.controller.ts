import { Request, Response, NextFunction } from 'express';
import { ModMedPatientService } from '../services/patient.service';
import { ModMedAppointmentService } from '../services/appointment.service';
import { ApiResponse } from '../../../shared/utils/api-response';
import { getCurrentUser } from '@features/auth';
import { CoreRole } from '@shared/constants/roles';
import logger from '@config/logger';
import { StatusCodes } from 'http-status-codes';

export class ModMedPatientController {
  private patientService: ModMedPatientService;
  private appointmentService: ModMedAppointmentService;

  constructor() {
    this.patientService = new ModMedPatientService();
    this.appointmentService = new ModMedAppointmentService();
  }

  /**
   * Validate client context and role permissions for ModMed access
   */
  private validateClientAccess(req: Request): { isValid: boolean; error?: string; user?: any } {
    try {
      const user = getCurrentUser(req as any);
      
      if (!user) {
        return { isValid: false, error: 'Authentication required' };
      }

      if (!user.clientId) {
        return { isValid: false, error: 'Client context required for ModMed access' };
      }

      // Only certain roles can access ModMed integration
      const allowedRoles = [
        CoreRole.SUPER_ADMIN,
        CoreRole.CLIENT_ADMIN,
        CoreRole.CLINICAL_STAFF,
        CoreRole.OFFICE_STAFF
      ];

      const userRole = user.roles?.[0];
      if (!allowedRoles.includes(userRole as CoreRole)) {
        return { isValid: false, error: 'Insufficient permissions for ModMed access' };
      }

      return { isValid: true, user };
    } catch (error) {
      logger.error('Error validating client access:', error);
      return { isValid: false, error: 'Authentication validation failed' };
    }
  }

  /**
   * Search for a patient by name and date of birth
   * GET /api/v1/modmed/patients/search?name=John&lastname=Doe&dob=1990-01-01
   */
  public searchPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate client access first
      const validation = this.validateClientAccess(req);
      if (!validation.isValid) {
        res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error(validation.error!)
        );
        return;
      }

      const { name, lastname, dob } = req.query;

      if (!name || !lastname || !dob) {
        res.status(400).json(
          ApiResponse.error('Missing required parameters: name, lastname, and dob are required')
        );
        return;
      }

      logger.info('ModMed patient search', {
        userId: validation.user!.userId,
        clientId: validation.user!.clientId,
        searchParams: { name, lastname, dob }
      });

      const patientResponse = await this.patientService.getPatient(
        name as string,
        lastname as string,
        dob as string
      );

      res.json(ApiResponse.success({ 
        patient: patientResponse,
        clientId: validation.user!.clientId 
      }));
    } catch (error) {
      logger.error('ModMed search patient error:', error);
      next(error);
    }
  };

  /**
   * Get patient by ModMed ID
   * GET /api/v1/modmed/patients/:patientId
   */
  public getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate client access first
      const validation = this.validateClientAccess(req);
      if (!validation.isValid) {
        res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error(validation.error!)
        );
        return;
      }

      const { patientId } = req.params;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

      logger.info('ModMed get patient by ID', {
        userId: validation.user!.userId,
        clientId: validation.user!.clientId,
        patientId
      });

      const patientResponse = await this.patientService.getPatientById(patientId);

      if (!patientResponse.found) {
        res.status(404).json(
          ApiResponse.error('Patient not found')
        );
        return;
      }

      res.json(ApiResponse.success({ 
        patient: patientResponse,
        clientId: validation.user!.clientId 
      }));
    } catch (error) {
      logger.error('ModMed get patient by ID error:', error);
      next(error);
    }
  };

  /**
   * Get list of patients with pagination
   * GET /api/v1/modmed/patients?quantity=20&page=1
   */
  public getPatientsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate client access first
      const validation = this.validateClientAccess(req);
      if (!validation.isValid) {
        res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error(validation.error!)
        );
        return;
      }

      const quantity = parseInt(req.query.quantity as string) || 20;
      const page = parseInt(req.query.page as string) || 1;

      // SuperAdmin can specify clientId, others use their own
      let targetClientId = validation.user!.clientId;
      if (validation.user!.roles?.includes(CoreRole.SUPER_ADMIN) && req.query.clientId) {
        targetClientId = parseInt(req.query.clientId as string);
      }

      logger.info('ModMed get patients list', {
        userId: validation.user!.userId,
        clientId: validation.user!.clientId,
        targetClientId,
        pagination: { quantity, page }
      });

      const patients = await this.patientService.getPatientsList(quantity, page);

      res.json(ApiResponse.success({ 
        patients,
        pagination: {
          page,
          quantity,
          total: patients.length
        },
        clientId: targetClientId
      }));
    } catch (error) {
      logger.error('ModMed get patients list error:', error);
      next(error);
    }
  };

  /**
   * Get patient appointments
   * GET /api/v1/modmed/patients/:patientId/appointments
   */
  public getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate client access first
      const validation = this.validateClientAccess(req);
      if (!validation.isValid) {
        res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error(validation.error!)
        );
        return;
      }

      const { patientId } = req.params;
      const { startDate, endDate } = req.query;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

      logger.info('ModMed get patient appointments', {
        userId: validation.user!.userId,
        clientId: validation.user!.clientId,
        patientId,
        dateRange: { startDate, endDate }
      });

      let appointments;

      if (startDate && endDate) {
        appointments = await this.appointmentService.getAppointmentsByDateRange(
          patientId,
          startDate as string,
          endDate as string
        );
      } else {
        appointments = await this.appointmentService.getPatientAppointmentList(patientId);
      }

      res.json(ApiResponse.success({ 
        appointments,
        count: appointments.length,
        patientId,
        clientId: validation.user!.clientId
      }));
    } catch (error) {
      logger.error('ModMed get patient appointments error:', error);
      next(error);
    }
  };

  /**
   * Legacy endpoint for backward compatibility
   * GET /api/v1/modmed/appointments?patientId=123
   */
  public getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate client access first
      const validation = this.validateClientAccess(req);
      if (!validation.isValid) {
        res.status(StatusCodes.FORBIDDEN).json(
          ApiResponse.error(validation.error!)
        );
        return;
      }

      const { patientId } = req.query;

      if (!patientId) {
        res.json(ApiResponse.success({ 
          appointments: [],
          clientId: validation.user!.clientId 
        }));
        return;
      }

      logger.info('ModMed getAppointments PatientId:', patientId, {
        userId: validation.user!.userId,
        clientId: validation.user!.clientId
      });

      const appointments = await this.appointmentService.getPatientAppointmentList(patientId as string);

      logger.info('ModMed getAppointments response:', appointments);

      res.json(ApiResponse.success({ 
        appointments,
        count: appointments.length,
        clientId: validation.user!.clientId
      }));
    } catch (error) {
      logger.error('ModMed getAppointments error:', error);
      next(error);
    }
  };
}
