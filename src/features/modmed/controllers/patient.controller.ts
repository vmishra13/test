import { Request, Response, NextFunction } from 'express';
import { ModMedPatientService } from '../services/patient.service';
import { ModMedAppointmentService } from '../services/appointment.service';
import { ApiResponse } from '../../../shared/utils/api-response';

export class ModMedPatientController {
  private patientService: ModMedPatientService;
  private appointmentService: ModMedAppointmentService;

  constructor() {
    this.patientService = new ModMedPatientService();
    this.appointmentService = new ModMedAppointmentService();
  }

  /**
   * Search for a patient by name and date of birth
   * GET /api/v1/modmed/patients/search?name=John&lastname=Doe&dob=1990-01-01
   */
  public searchPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, lastname, dob } = req.query;

      if (!name || !lastname || !dob) {
        res.status(400).json(
          ApiResponse.error('Missing required parameters: name, lastname, and dob are required')
        );
        return;
      }

      const patientResponse = await this.patientService.getPatient(
        name as string,
        lastname as string,
        dob as string
      );

      res.json(ApiResponse.success({ patient: patientResponse }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get patient by ModMed ID
   * GET /api/v1/modmed/patients/:patientId
   */
  public getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

      const patientResponse = await this.patientService.getPatientById(patientId);

      if (!patientResponse.found) {
        res.status(404).json(
          ApiResponse.error('Patient not found')
        );
        return;
      }

      res.json(ApiResponse.success({ patient: patientResponse }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get list of patients with pagination
   * GET /api/v1/modmed/patients?quantity=20&page=1
   */
  public getPatientsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quantity = parseInt(req.query.quantity as string) || 20;
      const page = parseInt(req.query.page as string) || 1;

      const patients = await this.patientService.getPatientsList(quantity, page);

      res.json(ApiResponse.success({ 
        patients,
        pagination: {
          page,
          quantity,
          total: patients.length
        }
      }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get patient appointments
   * GET /api/v1/modmed/patients/:patientId/appointments
   */
  public getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

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
        patientId
      }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Legacy endpoint for backward compatibility
   * GET /api/v1/modmed/appointments?patientId=123
   */
  public getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.query;

      if (!patientId) {
        res.json(ApiResponse.success({ appointments: [] }));
        return;
      }

      console.log('ModMed getAppointments PatientId:', patientId);

      const appointments = await this.appointmentService.getPatientAppointmentList(patientId as string);

      console.log('ModMed getAppointments response:', appointments);

      res.json(ApiResponse.success({ 
        appointments,
        count: appointments.length
      }));
    } catch (error) {
      console.error('ModMed getAppointments error:', error);
      next(error);
    }
  };
}
