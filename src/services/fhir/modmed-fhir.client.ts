/**
 * ModMed-specific FHIR Client
 * Extends the generic FHIR client with ModMed-specific authentication and configuration
 */

import { GenericFHIRClient } from './generic-fhir.client';
import { 
  FHIRClientConfig, 
  FHIRResource, 
  FHIRBundle,
  FHIRSearchParams,
  FHIRAuthResponse,
  FHIROperationResult 
} from '../../shared/interfaces/fhir-client.interface';
import { 
  modmedFullFhirURL, 
  modmedKey, 
  modmedFullAuthURL, 
  modmedId, 
  modmedPassword, 
  modmedAuthenticationData 
} from '../../shared/constants/modmed';
import axios, { AxiosRequestConfig } from 'axios';

interface ModMedAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * ModMed FHIR Client
 * Implements ModMed-specific authentication and API patterns
 */
export class ModMedFhirClient extends GenericFHIRClient {
  private accessToken?: string;
  private tokenType?: string;
  private tokenExpiry?: Date;

  constructor() {
    const config: FHIRClientConfig = {
      baseUrl: modmedFullFhirURL,
      clientId: modmedId,
      clientSecret: modmedPassword,
      apiKey: modmedKey,
      authUrl: modmedFullAuthURL,
      authData: modmedAuthenticationData
    };

    super(config);
  }

  /**
   * Authenticate with ModMed using their custom OAuth2 flow
   */
  public async authenticate(): Promise<FHIRAuthResponse> {
    try {
      console.log('ModMed FHIR Client: Starting authentication');
      
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': modmedKey,
        'Cache-Control': 'no-cache'
      };

      let data = modmedAuthenticationData;
      data = data.replace('{username}', modmedId);
      data = data.replace('{password}', modmedPassword);

      const response = await axios.post<ModMedAuthResponse>(
        modmedFullAuthURL, 
        data, 
        { headers }
      );

      const authData = response.data;
      
      // Store authentication data
      this.accessToken = authData.access_token;
      this.tokenType = authData.token_type;
      
      // Calculate token expiry (default to 1 hour if not provided)
      const expiresInSeconds = authData.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresInSeconds * 1000));

      console.log('ModMed FHIR Client: Authentication successful');
      
      return {
        access_token: this.accessToken,
        token_type: this.tokenType,
        expires_in: expiresInSeconds
      };
    } catch (error) {
      console.error('ModMed FHIR Client: Authentication failed', error);
      throw new Error(`ModMed authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the current token is valid and not expired
   */
  public isAuthenticated(): boolean {
    return !!(
      this.accessToken && 
      this.tokenType && 
      this.tokenExpiry && 
      this.tokenExpiry > new Date()
    );
  }

  /**
   * Get authorization headers for ModMed requests
   */
  protected async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }

    return {
      'Authorization': `${this.tokenType} ${this.accessToken}`,
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      'x-api-key': modmedKey,
      'Cache-Control': 'no-cache'
    };
  }

  /**
   * Prepare axios config with ModMed-specific headers
   */
  protected async prepareRequestConfig(config?: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    const authHeaders = await this.getAuthHeaders();
    
    return {
      ...config,
      headers: {
        ...authHeaders,
        ...config?.headers
      }
    };
  }

  /**
   * Override the base search method to handle ModMed-specific patterns
   */
  public async search<T extends FHIRResource>(
    resourceType: string, 
    params: FHIRSearchParams = {}
  ): Promise<FHIRBundle<T>> {
    try {
      console.log(`ModMed FHIR Client: Searching ${resourceType}`, params);
      
      // Ensure authentication
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }

      // Use the base class search but with ModMed-specific headers
      const searchParams = new URLSearchParams();
      
      // Convert search parameters to URL params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const url = `${resourceType}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const requestConfig = await this.prepareRequestConfig();
      
      const response = await axios.get<FHIRBundle<T>>(`${this.config.baseUrl}${url}`, requestConfig);
      
      console.log(`ModMed FHIR Client: Search successful for ${resourceType}`);
      return response.data;
    } catch (error) {
      console.error(`ModMed FHIR Client: Search failed for ${resourceType}`, error);
      throw this.handleError(error, `Failed to search ${resourceType}`);
    }
  }

  /**
   * Override the base read method to handle ModMed-specific patterns
   */
  public async read<T extends FHIRResource>(
    resourceType: string, 
    id: string
  ): Promise<FHIROperationResult<T>> {
    try {
      console.log(`ModMed FHIR Client: Reading ${resourceType}/${id}`);
      
      // Ensure authentication
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }
      
      const requestConfig = await this.prepareRequestConfig();
      const response = await axios.get<T>(`${this.config.baseUrl}${resourceType}/${id}`, requestConfig);
      
      console.log(`ModMed FHIR Client: Read successful for ${resourceType}/${id}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`ModMed FHIR Client: Read failed for ${resourceType}/${id}`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * ModMed-specific patient search with name and birthdate
   */
  public async searchPatient(
    firstName: string, 
    lastName: string, 
    dateOfBirth: string
  ): Promise<FHIRBundle<any>> {
    return this.search('Patient', {
      given: firstName,
      family: lastName,
      birthdate: dateOfBirth
    });
  }

  /**
   * ModMed-specific appointment search for a patient
   */
  public async searchPatientAppointments(
    patientId: string, 
    status?: string[]
  ): Promise<FHIRBundle<any>> {
    const params: FHIRSearchParams = {
      patient: patientId
    };

    if (status && status.length > 0) {
      params.status = status.join(',');
    } else {
      // Default ModMed appointment statuses
      params.status = 'pending,booked,checked-in';
    }

    return this.search('Appointment', params);
  }

  /**
   * ModMed-specific medication search for a patient
   */
  public async searchPatientMedications(patientId: string): Promise<FHIRBundle<any>> {
    return this.search('MedicationRequest', {
      patient: patientId
    });
  }

  /**
   * ModMed-specific condition search for a patient
   */
  public async searchPatientConditions(patientId: string): Promise<FHIRBundle<any>> {
    return this.search('Condition', {
      patient: patientId
    });
  }

  /**
   * ModMed-specific document search for a patient
   */
  public async searchPatientDocuments(
    patientId: string, 
    category?: string
  ): Promise<FHIRBundle<any>> {
    const params: FHIRSearchParams = {
      patient: patientId
    };

    if (category) {
      params.category = category;
    }

    return this.search('DocumentReference', params);
  }

  /**
   * ModMed-specific document search with advanced filters
   */
  public async searchDocuments(searchParams: {
    date?: string;
    description?: string;
    identifier?: string;
    page?: string;
    patientId: string;
    type?: string;
  }): Promise<FHIRBundle<any>> {
    const params: FHIRSearchParams = {
      patient: searchParams.patientId
    };

    if (searchParams.date) params.date = searchParams.date;
    if (searchParams.description) params.description = searchParams.description;
    if (searchParams.identifier) params.identifier = searchParams.identifier;
    if (searchParams.type) params.type = searchParams.type;
    if (searchParams.page) params._page = searchParams.page;

    return this.search('DocumentReference', params);
  }

  /**
   * Get a specific document by ID (handles ModMed's pipe character encoding)
   */
  public async getDocument(documentId: string): Promise<any> {
    try {
      // ModMed requires pipe characters to be URL encoded as %7C
      const encodedDocumentId = documentId.replace(/\|/g, '%7C');
      return await this.read('DocumentReference', encodedDocumentId);
    } catch (error) {
      console.error(`ModMed FHIR Client: Failed to get document ${documentId}`, error);
      throw this.handleError(error, `Failed to get document ${documentId}`);
    }
  }

  /**
   * Test the ModMed connection
   */
  public async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const authResult = await this.authenticate();
      return {
        success: true,
        message: 'ModMed FHIR connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'ModMed FHIR connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default ModMedFhirClient;
