/**
 * Generic FHIR Client Implementation
 * Base implementation that works with any FHIR R4 compliant server
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  IFHIRClient,
  FHIRResource,
  FHIRBundle,
  FHIRSearchParams,
  FHIROperationResult,
  FHIRAuthResponse,
  FHIRClientConfig
} from '../../shared/interfaces/fhir-client.interface';

export class GenericFHIRClient implements IFHIRClient {
  protected config: FHIRClientConfig;
  protected axiosInstance: AxiosInstance;
  protected authToken?: string;
  protected customHeaders: Record<string, string> = {};

  constructor(config: FHIRClientConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  protected setupInterceptors(): void {
    // Request interceptor to add auth and custom headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        if (this.authToken) {
          if (!config.headers) {
            config.headers = {} as any;
          }
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Add custom headers
        Object.assign(config.headers, this.customHeaders);

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle 401 Unauthorized - attempt to re-authenticate
        if (error.response?.status === 401 && this.authToken) {
          try {
            await this.authenticate();
            // Retry the original request
            return this.axiosInstance.request(error.config);
          } catch (authError) {
            return Promise.reject(authError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Basic authentication - override in provider-specific implementations
   */
  async authenticate(): Promise<FHIRAuthResponse> {
    // Generic implementation - no authentication required
    return {
      access_token: 'no-auth-required',
      token_type: 'Bearer'
    };
  }

  /**
   * Search for resources of a specific type
   */
  async search<T extends FHIRResource>(
    resourceType: string, 
    params: FHIRSearchParams = {}
  ): Promise<FHIRBundle<T>> {
    try {
      const searchParams = new URLSearchParams();
      
      // Convert search parameters to URL params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const url = `${resourceType}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response: AxiosResponse<FHIRBundle<T>> = await this.axiosInstance.get(url);

      return response.data;
    } catch (error) {
      console.error(`Error searching ${resourceType}:`, error);
      throw this.handleError(error, `Failed to search ${resourceType}`);
    }
  }

  /**
   * Read a specific resource by ID
   */
  async read<T extends FHIRResource>(
    resourceType: string, 
    id: string
  ): Promise<FHIROperationResult<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(`${resourceType}/${id}`);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Error reading ${resourceType}/${id}:`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Create a new resource
   */
  async create<T extends FHIRResource>(resource: T): Promise<FHIROperationResult<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(
        resource.resourceType, 
        resource
      );
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Error creating ${resource.resourceType}:`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Update an existing resource
   */
  async update<T extends FHIRResource>(resource: T): Promise<FHIROperationResult<T>> {
    try {
      if (!resource.id) {
        throw new Error('Resource ID is required for update operation');
      }

      const response: AxiosResponse<T> = await this.axiosInstance.put(
        `${resource.resourceType}/${resource.id}`, 
        resource
      );
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Error updating ${resource.resourceType}/${resource.id}:`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Delete a resource
   */
  async delete(resourceType: string, id: string): Promise<FHIROperationResult<void>> {
    try {
      const response = await this.axiosInstance.delete(`${resourceType}/${id}`);
      
      return {
        success: true,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Error deleting ${resourceType}/${id}:`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Get the capability statement for the FHIR server
   */
  async getCapabilityStatement(): Promise<FHIROperationResult<any>> {
    try {
      const response = await this.axiosInstance.get('metadata');
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error('Error fetching capability statement:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Set additional headers for requests
   */
  setHeaders(headers: Record<string, string>): void {
    this.customHeaders = { ...this.customHeaders, ...headers };
  }

  /**
   * Set the base URL for the FHIR server
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url;
    this.axiosInstance.defaults.baseURL = url;
  }

  /**
   * Get the current configuration
   */
  getConfig(): FHIRClientConfig {
    return { ...this.config };
  }

  /**
   * Test the connection to the FHIR server
   */
  async testConnection(): Promise<FHIROperationResult<{ message: string }>> {
    try {
      // Try to fetch the capability statement as a connection test
      const capabilityResult = await this.getCapabilityStatement();
      
      if (capabilityResult.success) {
        return {
          success: true,
          data: { message: 'FHIR server connection successful' },
          statusCode: 200
        };
      } else {
        return {
          success: false,
          error: 'Failed to connect to FHIR server',
          statusCode: capabilityResult.statusCode
        };
      }
    } catch (error) {
      console.error('FHIR connection test failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        statusCode: this.getErrorStatusCode(error)
      };
    }
  }

  /**
   * Build search URL with parameters
   */
  protected buildSearchUrl(resourceType: string, params: FHIRSearchParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return `${resourceType}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  }

  /**
   * Handle and transform errors
   */
  protected handleError(error: any, context: string): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.issue?.[0]?.diagnostics || 
                    error.response?.data?.message || 
                    error.message;
      return new Error(`${context}: ${message}`);
    }
    
    return error instanceof Error ? error : new Error(`${context}: ${String(error)}`);
  }

  /**
   * Extract error message from error object
   */
  protected getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.issue?.[0]?.diagnostics || 
             error.response?.data?.message || 
             error.message;
    }
    
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Extract status code from error object
   */
  protected getErrorStatusCode(error: any): number {
    if (axios.isAxiosError(error)) {
      return error.response?.status || 500;
    }
    
    return 500;
  }

  /**
   * Set authentication token
   */
  protected setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get current authentication token
   */
  protected getAuthToken(): string | undefined {
    return this.authToken;
  }
}
