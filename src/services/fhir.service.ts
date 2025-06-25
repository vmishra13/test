/**
 * FHIR Service
 * High-level service that uses the FHIR abstraction layer
 * Replaces the old ModMed-specific service with a provider-agnostic approach
 */

import { FHIRClientFactory, FHIRProvider } from './fhir/fhir-client.factory';
import { IFHIRClient, FHIRBundle, FHIROperationResult } from '../shared/interfaces/fhir-client.interface';
import { Patient, MedicationRequest, Condition, DocumentReference, Appointment } from '../shared/types/fhir-resources.types';

export class FHIRService {
  private client: IFHIRClient;
  private provider: FHIRProvider;

  constructor(provider: FHIRProvider = FHIRProvider.MODMED) {
    this.provider = provider;
    this.client = FHIRClientFactory.createClient({ provider });
  }

  /**
   * Authenticate with the FHIR provider
   */
  async authenticate() {
    try {
      return await this.client.authenticate();
    } catch (error) {
      console.error(`FHIR Service: Authentication failed for ${this.provider}:`, error);
      throw new Error(`Failed to authenticate with ${this.provider} FHIR server`);
    }
  }

  /**
   * Search for a patient by name and date of birth
   */
  async searchPatient(firstName: string, lastName: string, dateOfBirth: string): Promise<FHIRBundle<Patient>> {
    try {
      return await this.client.search<Patient>('Patient', {
        given: firstName,
        family: lastName,
        birthdate: dateOfBirth
      });
    } catch (error) {
      console.error('FHIR Service: Patient search failed:', error);
      throw new Error('Failed to search for patient');
    }
  }

  /**
   * Get a patient by ID
   */
  async getPatient(patientId: string): Promise<FHIROperationResult<Patient>> {
    try {
      return await this.client.read<Patient>('Patient', patientId);
    } catch (error) {
      console.error('FHIR Service: Failed to get patient:', error);
      throw new Error('Failed to retrieve patient');
    }
  }

  /**
   * Get list of patients with pagination
   */
  async getPatients(count: number = 10, page: number = 1): Promise<FHIRBundle<Patient>> {
    try {
      return await this.client.search<Patient>('Patient', {
        _count: count.toString(),
        _page: page.toString()
      });
    } catch (error) {
      console.error('FHIR Service: Failed to get patients list:', error);
      throw new Error('Failed to retrieve patients');
    }
  }

  /**
   * Get appointments for a specific patient
   */
  async getPatientAppointments(patientId: string, status?: string[]): Promise<FHIRBundle<Appointment>> {
    try {
      const params: any = {
        patient: patientId
      };

      if (status && status.length > 0) {
        params.status = status.join(',');
      } else if (this.provider === FHIRProvider.MODMED) {
        // Default ModMed appointment statuses
        params.status = 'pending,booked,checked-in';
      }

      return await this.client.search<Appointment>('Appointment', params);
    } catch (error) {
      console.error('FHIR Service: Failed to get patient appointments:', error);
      throw new Error('Failed to retrieve patient appointments');
    }
  }

  /**
   * Get medications for a specific patient
   */
  async getPatientMedications(patientId: string): Promise<FHIRBundle<MedicationRequest>> {
    try {
      return await this.client.search<MedicationRequest>('MedicationRequest', {
        patient: patientId
      });
    } catch (error) {
      console.error('FHIR Service: Failed to get patient medications:', error);
      throw new Error('Failed to retrieve patient medications');
    }
  }

  /**
   * Get conditions for a specific patient
   */
  async getPatientConditions(patientId: string): Promise<FHIRBundle<Condition>> {
    try {
      return await this.client.search<Condition>('Condition', {
        patient: patientId
      });
    } catch (error) {
      console.error('FHIR Service: Failed to get patient conditions:', error);
      throw new Error('Failed to retrieve patient conditions');
    }
  }

  /**
   * Get documents for a specific patient
   */
  async getPatientDocuments(patientId: string, category?: string): Promise<FHIRBundle<DocumentReference>> {
    try {
      const params: any = {
        patient: patientId
      };

      if (category) {
        params.category = category;
      }

      return await this.client.search<DocumentReference>('DocumentReference', params);
    } catch (error) {
      console.error('FHIR Service: Failed to get patient documents:', error);
      throw new Error('Failed to retrieve patient documents');
    }
  }

  /**
   * Search documents with advanced filters
   */
  async searchDocuments(searchParams: {
    patientId: string;
    date?: string;
    description?: string;
    identifier?: string;
    page?: string;
    type?: string;
  }): Promise<FHIRBundle<DocumentReference>> {
    try {
      const params: any = {
        patient: searchParams.patientId
      };

      if (searchParams.date) params.date = searchParams.date;
      if (searchParams.description) params.description = searchParams.description;
      if (searchParams.identifier) params.identifier = searchParams.identifier;
      if (searchParams.type) params.type = searchParams.type;
      if (searchParams.page) params._page = searchParams.page;

      return await this.client.search<DocumentReference>('DocumentReference', params);
    } catch (error) {
      console.error('FHIR Service: Document search failed:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<FHIROperationResult<DocumentReference>> {
    try {
      // Handle provider-specific ID encoding (e.g., ModMed pipe characters)
      let processedId = documentId;
      if (this.provider === FHIRProvider.MODMED) {
        processedId = documentId.replace(/\|/g, '%7C');
      }

      return await this.client.read<DocumentReference>('DocumentReference', processedId);
    } catch (error) {
      console.error('FHIR Service: Failed to get document:', error);
      throw new Error('Failed to retrieve document');
    }
  }

  /**
   * Test the connection to the FHIR server
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const authResult = await this.authenticate();
      return {
        success: true,
        message: `${this.provider} FHIR connection successful`
      };
    } catch (error) {
      return {
        success: false,
        message: `${this.provider} FHIR connection failed`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the capability statement for the FHIR server
   */
  async getCapabilityStatement(): Promise<FHIROperationResult<any>> {
    try {
      return await this.client.getCapabilityStatement();
    } catch (error) {
      console.error('FHIR Service: Failed to get capability statement:', error);
      throw new Error('Failed to retrieve capability statement');
    }
  }

  /**
   * Switch to a different FHIR provider
   */
  switchProvider(provider: FHIRProvider): void {
    this.provider = provider;
    this.client = FHIRClientFactory.createClient({ provider });
  }

  /**
   * Get the current provider
   */
  getCurrentProvider(): FHIRProvider {
    return this.provider;
  }

  /**
   * Get the raw FHIR client (for advanced usage)
   */
  getClient(): IFHIRClient {
    return this.client;
  }
}

export default FHIRService;
