/**
 * TYPE DEFINITIONS FOR FORMS
 * 
 * Healthcare-compliant type definitions for form_master operations.
 * Includes all necessary types for multi-tenant form management.
 */

/**
 * Form entity type matching Prisma model
 */
export interface Form {
  /** Unique identifier */
  id: number;
  
  /** Form name */
  name: string;
  
  /** Form description */
  description: string | null;
  
  /** Client ID for multi-tenant isolation */
  clientid: number | null;
  
  /** User who created the record */
  cruser: string;
  
  /** Creation date */
  crdate: Date | null;
  
  /** User who last modified the record */
  moduser: string;
  
  /** Last modification date */
  moddate: Date | null;
}

/**
 * Form creation payload
 */
export interface CreateFormPayload {
  name: string;
  description?: string | null;
  clientid: number;
  cruser: string;
  moduser: string;
}

/**
 * Form update payload
 */
export interface UpdateFormPayload {
  name?: string;
  description?: string | null;
  moduser: string;
  moddate: Date;
}

/**
 * Form filter options for queries
 */
export interface FormFilters {
  clientId: number;
  search?: string;
  sortBy?: 'name' | 'crdate' | 'moddate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Form repository interface
 */
export interface IFormRepository {
  create(data: CreateFormPayload): Promise<Form>;
  findById(id: number, clientId: number): Promise<Form | null>;
  findByClientId(clientId: number, filters?: FormFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<Form>>;
  update(id: number, data: UpdateFormPayload, clientId: number): Promise<Form | null>;
  delete(id: number, clientId: number): Promise<boolean>;
  findByName(name: string, clientId: number, excludeId?: number): Promise<Form | null>;
  bulkDelete(ids: number[], clientId: number): Promise<number>;
  getStats(clientId: number): Promise<FormStats>;
}

/**
 * Form service interface
 */
export interface IFormService {
  createForm(data: CreateFormPayload): Promise<Form>;
  getFormById(id: number, clientId: number): Promise<Form | null>;
  getFormsByClientId(clientId: number, filters?: FormFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<Form>>;
  updateForm(id: number, data: UpdateFormPayload, clientId: number): Promise<Form | null>;
  deleteForm(id: number, clientId: number): Promise<boolean>;
  bulkDeleteForms(ids: number[], clientId: number): Promise<number>;
  getFormStats(clientId: number): Promise<FormStats>;
  validateFormName(name: string, clientId: number, excludeId?: number): Promise<boolean>;
}

/**
 * Form statistics
 */
export interface FormStats {
  totalForms: number;
  activeForms: number;
  formsThisMonth: number;
  latestForm?: Form;
}

/**
 * API response types
 */
export interface FormResponse {
  success: boolean;
  data?: Form | Form[] | PaginatedResponse<Form> | FormStats;
  message: string;
  error?: string;
}

/**
 * Error types specific to forms
 */
export enum FormErrorTypes {
  FORM_NOT_FOUND = 'FORM_NOT_FOUND',
  FORM_NAME_EXISTS = 'FORM_NAME_EXISTS',
  INVALID_CLIENT_ACCESS = 'INVALID_CLIENT_ACCESS',
  FORM_CREATION_FAILED = 'FORM_CREATION_FAILED',
  FORM_UPDATE_FAILED = 'FORM_UPDATE_FAILED',
  FORM_DELETE_FAILED = 'FORM_DELETE_FAILED',
  BULK_OPERATION_FAILED = 'BULK_OPERATION_FAILED'
}

/**
 * Audit log entry for forms
 */
export interface FormAuditLog {
  formId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  userId: string;
  clientId: number;
  timestamp: Date;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Healthcare compliance types
 */
export interface HealthcareFormMetadata {
  isHIPAACompliant: boolean;
  containsPHI: boolean;
  auditRequired: boolean;
  retentionPeriod?: number; // in years
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}

/**
 * Form permissions
 */
export interface FormPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canBulkOperation: boolean;
  canViewStats: boolean;
}

/**
 * Multi-tenant context
 */
export interface TenantContext {
  clientId: number;
  userId: string;
  userRole: string;
  permissions: FormPermissions;
}
