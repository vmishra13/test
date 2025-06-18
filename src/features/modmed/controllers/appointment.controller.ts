import { Request, Response, NextFunction } from 'express';
import { ModMedAppointmentService } from '../services/appointment.service';
import { ModMedApiService } from '../services/api.service';
import { ApiResponse } from '../../../shared/utils/api-response';

export class ModMedAppointmentController {
  private appointmentService: ModMedAppointmentService;
  private apiService: ModMedApiService;

  constructor() {
    this.appointmentService = new ModMedAppointmentService();
    this.apiService = new ModMedApiService();
  }

  /**
   * Get appointment by ID
   * GET /api/v1/modmed/appointments/:appointmentId
   */
  public getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(400).json(
          ApiResponse.error('Appointment ID is required')
        );
        return;
      }

      const appointment = await this.appointmentService.getAppointmentById(appointmentId);

      if (!appointment) {
        res.status(404).json(
          ApiResponse.error('Appointment not found')
        );
        return;
      }

      res.json(ApiResponse.success({ appointment }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get location details
   * GET /api/v1/modmed/locations/:locationId
   */
  public getLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { locationId } = req.params;

      if (!locationId) {
        res.status(400).json(
          ApiResponse.error('Location ID is required')
        );
        return;
      }

      const location = await this.appointmentService.getLocation(locationId);

      if (!location) {
        res.status(404).json(
          ApiResponse.error('Location not found')
        );
        return;
      }

      res.json(ApiResponse.success({ location }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get practitioner details
   * GET /api/v1/modmed/practitioners/:practitionerId
   */
  public getPractitioner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { practitionerId } = req.params;

      if (!practitionerId) {
        res.status(400).json(
          ApiResponse.error('Practitioner ID is required')
        );
        return;
      }

      const practitioner = await this.appointmentService.getPractitioner(practitionerId);

      if (!practitioner) {
        res.status(404).json(
          ApiResponse.error('Practitioner not found')
        );
        return;
      }

      res.json(ApiResponse.success({ practitioner }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get patient conditions
   * GET /api/v1/modmed/patients/:patientId/conditions
   */
  public getPatientConditions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

      const conditions = await this.apiService.getConditions(patientId);

      res.json(ApiResponse.success({ 
        conditions: conditions?.entry || [],
        total: conditions?.total || 0,
        patientId
      }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get patient documents
   * GET /api/v1/modmed/patients/:patientId/documents?category=lab
   */
  public getPatientDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { category } = req.query;

      if (!patientId) {
        res.status(400).json(
          ApiResponse.error('Patient ID is required')
        );
        return;
      }

      if (!category) {
        res.status(400).json(
          ApiResponse.error('Document category is required')
        );
        return;
      }

      const documents = await this.apiService.getDocuments(patientId, category as string);

      res.json(ApiResponse.success({ 
        documents: documents?.entry || [],
        total: documents?.total || 0,
        patientId,
        category
      }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document object URL
   * GET /api/v1/modmed/documents/:documentId
   */
  public getDocumentObject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        res.status(400).json(
          ApiResponse.error('Document ID is required')
        );
        return;
      }

      const documentUrl = await this.apiService.getDocumentObject(documentId);

      if (!documentUrl) {
        res.status(404).json(
          ApiResponse.error('Document not found or no URL available')
        );
        return;
      }

      res.json(ApiResponse.success({ 
        documentId,
        url: documentUrl
      }));
    } catch (error) {
      next(error);
    }
  };
}
