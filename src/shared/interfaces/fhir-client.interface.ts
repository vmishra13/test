/**
 * Core FHIR Client Interface
 * Provides a standard interface for interacting with any FHIR R4 compliant server
 */

// Base FHIR types
export interface FHIRResource {
  id?: string;
  resourceType: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRBundle<T = FHIRResource> {
  resourceType: 'Bundle';
  id?: string;
  total?: number;
  entry?: FHIRBundleEntry<T>[];
  link?: FHIRBundleLink[];
}

export interface FHIRBundleEntry<T = FHIRResource> {
  fullUrl?: string;
  resource?: T;
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
}

export interface FHIRBundleLink {
  relation: string;
  url: string;
}

// Search parameters
export interface FHIRSearchParams {
  [key: string]: string | number | boolean | undefined;
}

// Operation result
export interface FHIROperationResult<T = FHIRResource> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Authentication response
export interface FHIRAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
}

// Client configuration
export interface FHIRClientConfig {
  baseUrl: string;
  provider?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  firmPrefix?: string;
  authUrl?: string;
  authData?: string;
  username?: string;
  password?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Core FHIR Client Interface
 * All FHIR client implementations must implement this interface
 */
export interface IFHIRClient {
  /**
   * Initialize and authenticate the client
   */
  authenticate(): Promise<FHIRAuthResponse>;

  /**
   * Search for resources of a specific type
   * @param resourceType - FHIR resource type (e.g., 'Patient', 'MedicationRequest')
   * @param params - Search parameters
   */
  search<T extends FHIRResource>(
    resourceType: string, 
    params: FHIRSearchParams
  ): Promise<FHIRBundle<T>>;

  /**
   * Read a specific resource by ID
   * @param resourceType - FHIR resource type
   * @param id - Resource ID
   */
  read<T extends FHIRResource>(
    resourceType: string, 
    id: string
  ): Promise<FHIROperationResult<T>>;

  /**
   * Create a new resource
   * @param resource - FHIR resource to create
   */
  create<T extends FHIRResource>(resource: T): Promise<FHIROperationResult<T>>;

  /**
   * Update an existing resource
   * @param resource - FHIR resource to update
   */
  update<T extends FHIRResource>(resource: T): Promise<FHIROperationResult<T>>;

  /**
   * Delete a resource
   * @param resourceType - FHIR resource type
   * @param id - Resource ID
   */
  delete(resourceType: string, id: string): Promise<FHIROperationResult<void>>;

  /**
   * Get the capability statement for the FHIR server
   */
  getCapabilityStatement(): Promise<FHIROperationResult<any>>;

  /**
   * Set additional headers for requests
   * @param headers - HTTP headers
   */
  setHeaders(headers: Record<string, string>): void;

  /**
   * Set the base URL for the FHIR server
   * @param url - Base URL
   */
  setBaseUrl(url: string): void;

  /**
   * Get the current configuration
   */
  getConfig(): FHIRClientConfig;

  /**
   * Test the connection to the FHIR server
   */
  testConnection(): Promise<FHIROperationResult<{ message: string }>>;
}

/**
 * FHIR Provider Types
 */
export enum FHIRProvider {
  MODMED = 'modmed',
  EPIC = 'epic',
  CERNER = 'cerner',
  ALLSCRIPTS = 'allscripts',
  ATHENAHEALTH = 'athenahealth',
  GENERIC = 'generic'
}

/**
 * Provider-specific configuration interfaces
 */
export interface ModMedConfig extends FHIRClientConfig {
  provider: FHIRProvider.MODMED;
  firmPrefix: string;
  apiKey: string;
  username: string;
  password: string;
  authUrl: string;
  authData: string;
}

export interface EpicConfig extends FHIRClientConfig {
  provider: FHIRProvider.EPIC;
  clientId: string;
  clientSecret: string;
}

export interface CernerConfig extends FHIRClientConfig {
  provider: FHIRProvider.CERNER;
  apiKey: string;
}

export interface GenericConfig extends FHIRClientConfig {
  provider: FHIRProvider.GENERIC;
}

export type ProviderConfig = ModMedConfig | EpicConfig | CernerConfig | GenericConfig;
