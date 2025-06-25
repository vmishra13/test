/**
 * ModMed Controller
 * Handles HTTP requests for ModMed integration
 */

import { Request, Response } from 'express';
import ModMedService from '../../services/modmed.service';

export class ModMedController {
  /**
   * Test ModMed connection
   * GET /api/modmed/test
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const result = await ModMedService.testConnection();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            connected: true,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          data: null
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to test ModMed connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search for a patient
   * GET /api/modmed/patients/search?firstName=John&lastName=Doe&dateOfBirth=1990-01-01
   */
  static async searchPatient(req: Request, res: Response) {
    try {
      const { firstName, lastName, dateOfBirth } = req.query;

      if (!firstName || !lastName || !dateOfBirth) {
        return res.status(400).json({
          success: false,
          message: 'firstName, lastName, and dateOfBirth are required'
        });
      }

      const patient = await ModMedService.searchPatient(
        firstName as string, 
        lastName as string, 
        dateOfBirth as string
      );

      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to search for patient',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient appointments
   * GET /api/modmed/patients/:patientId/appointments
   */
  static async getPatientAppointments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'patientId is required'
        });
      }

      const appointments = await ModMedService.getPatientAppointments(patientId);

      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get patient appointments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient documents
   * GET /api/modmed/patients/:patientId/documents
   */
  static async getPatientDocuments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { category } = req.query;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'patientId is required'
        });
      }

      const documents = await ModMedService.getPatientDocuments(
        patientId, 
        category as string
      );

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get patient documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patients list
   * GET /api/modmed/patients?quantity=10&page=1
   */
  static async getPatients(req: Request, res: Response) {
    try {
      const quantity = parseInt(req.query.quantity as string) || 10;
      const page = parseInt(req.query.page as string) || 1;

      const patients = await ModMedService.getPatients(quantity, page);

      res.status(200).json({
        success: true,
        data: patients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get patients',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient conditions
   * GET /api/modmed/patients/:patientId/conditions
   */
  static async getPatientConditions(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'patientId is required'
        });
      }

      const conditions = await ModMedService.getPatientConditions(patientId);

      res.status(200).json({
        success: true,
        data: conditions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get patient conditions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient medications
   * GET /api/modmed/patients/:patientId/medications
   */
  static async getPatientMedications(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'patientId is required'
        });
      }

      const medications = await ModMedService.getPatientMedications(patientId);

      res.status(200).json({
        success: true,
        data: medications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get patient medications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search documents with filters
   * GET /api/modmed/documents/search?patientId=123&date=2024-01-01&type=lab&page=1
   */
  static async searchDocuments(req: Request, res: Response) {
    try {
      const { patientId, date, description, identifier, page, type } = req.query;

      if (!patientId || !date || !page) {
        return res.status(400).json({
          success: false,
          message: 'patientId, date, and page are required'
        });
      }

      const searchParams = {
        patientId: patientId as string,
        date: date as string,
        page: page as string,
        description: description as string,
        identifier: identifier as string,
        type: type as string
      };

      const documents = await ModMedService.searchDocuments(searchParams);

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to search documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
