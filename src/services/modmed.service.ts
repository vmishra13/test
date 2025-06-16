/**
 * ModMed Service
 * Provides high-level interface for ModMed API operations
 */

import { getPatientAppointmentList } from '../core/modmed/appointments';
import { getPatient, getPatientsList } from '../core/modmed/patient';
import { getAuthenticated } from '../core/modmed/authentication';
import { 
  findPatient, 
  findPatientAppointments, 
  getDocuments, 
  getConditions,
  getMedications,
  searchDocuments 
} from '../core/modmed/services';

export class ModMedService {
  /**
   * Authenticate with ModMed API
   */
  static async authenticate() {
    try {
      return await getAuthenticated();
    } catch (error) {
      console.error('ModMed authentication failed:', error);
      throw new Error('Failed to authenticate with ModMed API');
    }
  }

  /**
   * Search for a patient by name and date of birth
   */
  static async searchPatient(firstName: string, lastName: string, dateOfBirth: string) {
    try {
      return await getPatient(firstName, lastName, dateOfBirth);
    } catch (error) {
      console.error('Patient search failed:', error);
      throw new Error('Failed to search for patient in ModMed');
    }
  }

  /**
   * Get list of patients with pagination
   */
  static async getPatients(quantity: number = 10, page: number = 1) {
    try {
      return await getPatientsList(quantity, page);
    } catch (error) {
      console.error('Failed to get patients list:', error);
      throw new Error('Failed to retrieve patients from ModMed');
    }
  }

  /**
   * Get appointments for a specific patient
   */
  static async getPatientAppointments(patientId: string) {
    try {
      return await getPatientAppointmentList(patientId);
    } catch (error) {
      console.error('Failed to get patient appointments:', error);
      throw new Error('Failed to retrieve patient appointments from ModMed');
    }
  }

  /**
   * Get documents for a specific patient
   */
  static async getPatientDocuments(patientId: string, category?: string) {
    try {
      return await getDocuments(patientId, category || '');
    } catch (error) {
      console.error('Failed to get patient documents:', error);
      throw new Error('Failed to retrieve patient documents from ModMed');
    }
  }

  /**
   * Get conditions for a specific patient
   */
  static async getPatientConditions(patientId: string) {
    try {
      return await getConditions(patientId);
    } catch (error) {
      console.error('Failed to get patient conditions:', error);
      throw new Error('Failed to retrieve patient conditions from ModMed');
    }
  }

  /**
   * Get medications for a specific patient
   */
  static async getPatientMedications(patientId: string) {
    try {
      return await getMedications(patientId);
    } catch (error) {
      console.error('Failed to get patient medications:', error);
      throw new Error('Failed to retrieve patient medications from ModMed');
    }
  }

  /**
   * Search documents with filters
   */
  static async searchDocuments(searchParams: {
    date: string;
    description?: string;
    identifier?: string;
    page: string;
    patientId: string;
    type?: string;
  }) {
    try {
      return await searchDocuments(searchParams);
    } catch (error) {
      console.error('Document search failed:', error);
      throw new Error('Failed to search documents in ModMed');
    }
  }

  /**
   * Test ModMed connection
   */
  static async testConnection() {
    try {
      const authResult = await this.authenticate();
      return {
        success: true,
        message: 'ModMed connection successful',
        authData: authResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'ModMed connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default ModMedService;
