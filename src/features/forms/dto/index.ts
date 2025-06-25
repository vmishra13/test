/**
 * DATA TRANSFER OBJECTS FOR FORMS
 * 
 * Healthcare-compliant DTOs for form_master operations with HIPAA considerations.
 * All DTOs include proper validation and multi-tenant isolation.
 */

/**
 * DTO for creating a new form
 */
export interface CreateFormDto {
  /** Name of the form (required, max 255 characters) */
  name: string;
  
  /** Optional description of the form */
  description?: string | null;
  
  /** Client ID for multi-tenant isolation (automatically set from auth context) */
  clientId: number;
}

/**
 * DTO for updating an existing form
 */
export interface UpdateFormDto {
  /** Name of the form (optional for updates) */
  name?: string;
  
  /** Description of the form (optional for updates) */
  description?: string | null;
}

/**
 * DTO for form response data
 */
export interface FormResponseDto {
  /** Unique identifier */
  id: number;
  
  /** Form name */
  name: string;
  
  /** Form description */
  description: string | null;
  
  /** Client ID for multi-tenant isolation */
  clientId: number;
  
  /** User who created the record */
  crUser: string;
  
  /** Creation date */
  crDate: Date | null;
  
  /** User who last modified the record */
  modUser: string;
  
  /** Last modification date */
  modDate: Date | null;
}

/**
 * DTO for paginated form queries
 */
export interface FormQueryDto {
  /** Page number (default: 1) */
  page?: number;
  
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  
  /** Search term to filter forms by name or description */
  search?: string;
  
  /** Sort field (default: 'name') */
  sortBy?: 'name' | 'crDate' | 'modDate';
  
  /** Sort order (default: 'asc') */
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO for bulk operations
 */
export interface BulkFormOperationDto {
  /** Array of form IDs to operate on */
  formIds: number[];
  
  /** Operation type */
  operation: 'delete' | 'activate' | 'deactivate';
}

/**
 * DTO for form statistics
 */
export interface FormStatsDto {
  /** Total number of forms for the client */
  totalForms: number;
  
  /** Number of active forms */
  activeForms: number;
  
  /** Number of forms created this month */
  formsThisMonth: number;
  
  /** Most recently created form */
  latestForm?: FormResponseDto;
}
