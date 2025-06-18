/**
 * ModMed Service
 * Provides high-level interface for ModMed API operations
 * DEPRECATED: Use the new services in /features/modmed/services/ instead
 * This file is maintained for backward compatibility only
 */

import { ModMedPatientService } from '../features/modmed/services/patient.service';
import { ModMedAppointmentService } from '../features/modmed/services/appointment.service';
import { ModMedAuthService } from '../features/modmed/services/auth.service';
import { ModMedApiService } from '../features/modmed/services/api.service';

export default class ModMedService {
  private static patientService = new ModMedPatientService();
  private static appointmentService = new ModMedAppointmentService();
  private static authService = ModMedAuthService.getInstance();
  private static apiService = new ModMedApiService();

  /**
   * Authenticate with ModMed API
   */
  static async authenticate() {
    try {
      return await this.authService.getAuthenticated();
    } catch (error) {
      console.error('ModMed authentication failed:', error);
      return null;
    }
  }

  /**
   * Search for a patient
   */
  static async searchPatient(firstName: string, lastName: string, dateOfBirth: string) {
    try {
      return await this.patientService.getPatient(firstName, lastName, dateOfBirth);
    } catch (error) {
      console.error('Error searching patient:', error);
      throw error;
    }
  }

  /**
   * Get list of patients
   */
  static async getPatients(quantity = 20, page = 1) {
    try {
      return await this.patientService.getPatientsList(quantity, page);
    } catch (error) {
      console.error('Error getting patients:', error);
      throw error;
    }
  }

  /**
   * Get patient appointments
   */
  static async getPatientAppointments(patientId: string) {
    try {
      return await this.appointmentService.getPatientAppointmentList(patientId);
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  }

  /**
   * Get patient documents
   */
  static async getPatientDocuments(patientId: string, category?: string) {
    try {
      return await this.apiService.getDocuments(patientId, category || '');
    } catch (error) {
      console.error('Error getting patient documents:', error);
      throw error;
    }
  }

  /**
   * Get patient conditions
   */
  static async getPatientConditions(patientId: string) {
    try {
      return await this.apiService.getConditions(patientId);
    } catch (error) {
      console.error('Error getting patient conditions:', error);
      throw error;
    }
  }

  /**
   * Get patient medications (placeholder - implement if needed)
   */
  static async getPatientMedications(patientId: string) {
    try {
      // This functionality needs to be implemented in the API service
      throw new Error('Patient medications functionality not yet implemented');
    } catch (error) {
      console.error('Error getting patient medications:', error);
      throw error;
    }
  }

  /**
   * Test ModMed connection
   */
  static async testConnection() {
    try {
      const auth = await this.authenticate();
      return {
        success: !!auth,
        message: auth ? 'ModMed connection successful' : 'ModMed connection failed',
        data: auth
      };
    } catch (error) {
      return {
        success: false,
        message: `ModMed connection failed: ${error}`,
        data: null
      };
    }
  }

  /**
   * Search documents (placeholder - implement if needed)
   */
  static async searchDocuments(searchParams: any) {
    try {
      // This functionality needs to be implemented in the API service
      throw new Error('Document search functionality not yet implemented');
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Get practitioner
   */
  static async getPractitioner(practitionerId: string) {
    try {
      return await this.appointmentService.getPractitioner(practitionerId);
    } catch (error) {
      console.error('Error getting practitioner:', error);
      throw error;
    }
  }

  /**
   * Get location
   */
  static async getLocation(locationId: string) {
    try {
      return await this.appointmentService.getLocation(locationId);
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }
}
