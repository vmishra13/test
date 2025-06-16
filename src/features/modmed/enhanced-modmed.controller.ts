/**
 * Enhanced ModMed Controller
 * Uses the new FHIR abstraction layer instead of direct ModMed service calls
 */

import { Request, Response } from 'express';
import FHIRService from '../../services/fhir.service';
import { FHIRProvider } from '../../services/fhir/fhir-client.factory';

export class EnhancedModMedController {
  private fhirService: FHIRService;

  constructor() {
    this.fhirService = new FHIRService(FHIRProvider.MODMED);
  }

  /**
   * Test ModMed connection
   */
  async testConnection(req: Request, res: Response) {
    try {
      const result = await this.fhirService.testConnection();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          provider: this.fhirService.getCurrentProvider()
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Enhanced ModMed Controller: Test connection failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test ModMed connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search for a patient
   */
  async searchPatient(req: Request, res: Response) {
    try {
      const { firstName, lastName, dateOfBirth } = req.query;

      if (!firstName || !lastName || !dateOfBirth) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: firstName, lastName, dateOfBirth'
        });
      }

      const result = await this.fhirService.searchPatient(
        firstName as string,
        lastName as string,
        dateOfBirth as string
      );

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Patient search failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search for patient',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const result = await this.fhirService.getPatient(patientId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          provider: this.fhirService.getCurrentProvider()
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Patient not found',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patient failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patients list with pagination
   */
  async getPatients(req: Request, res: Response) {
    try {
      const quantity = parseInt(req.query.quantity as string) || 10;
      const page = parseInt(req.query.page as string) || 1;

      const result = await this.fhirService.getPatients(quantity, page);

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider(),
        pagination: {
          quantity,
          page,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patients failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patients',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const statusParam = req.query.status as string;
      const status = statusParam ? statusParam.split(',') : undefined;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const result = await this.fhirService.getPatientAppointments(patientId, status);

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patient appointments failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient appointments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient medications
   */
  async getPatientMedications(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const result = await this.fhirService.getPatientMedications(patientId);

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patient medications failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient medications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient conditions
   */
  async getPatientConditions(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const result = await this.fhirService.getPatientConditions(patientId);

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patient conditions failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient conditions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { category } = req.query;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const result = await this.fhirService.getPatientDocuments(
        patientId, 
        category as string
      );

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get patient documents failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { date, description, identifier, page, type } = req.query;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      const searchParams = {
        patientId,
        date: date as string,
        description: description as string,
        identifier: identifier as string,
        page: page as string,
        type: type as string
      };

      const result = await this.fhirService.searchDocuments(searchParams);

      res.status(200).json({
        success: true,
        data: result,
        provider: this.fhirService.getCurrentProvider()
      });
    } catch (error) {
      console.error('Enhanced ModMed Controller: Document search failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a specific document
   */
  async getDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const result = await this.fhirService.getDocument(documentId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          provider: this.fhirService.getCurrentProvider()
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Document not found',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get document failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get FHIR capability statement
   */
  async getCapabilityStatement(req: Request, res: Response) {
    try {
      const result = await this.fhirService.getCapabilityStatement();

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          provider: this.fhirService.getCurrentProvider()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve capability statement',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Enhanced ModMed Controller: Get capability statement failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve capability statement',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default EnhancedModMedController;
