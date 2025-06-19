/**
 * CLIENT DTOs - Data Transfer Objects
 * 
 * Defines the structure for client-related API requests and responses
 * Following the same pattern as users feature for consistency
 */

// ===================================================================
// 📝 REQUEST DTOs
// ===================================================================

export interface CreateClientRequest {
  name: string;
  description?: string;
  timeZone?: string;
  language?: string;
  website?: string;
  logo?: string;
  favIcon?: string;
  extraInfo?: ClientExtraInfo;
}

export interface UpdateClientRequest {
  name?: string;
  description?: string;
  timeZone?: string;
  language?: string;
  website?: string;
  logo?: string;
  favIcon?: string;
  status?: number;
  extraInfo?: ClientExtraInfo;
}

export interface GetClientsQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  sort?: 'asc' | 'desc';
}

// ===================================================================
// 📤 RESPONSE DTOs
// ===================================================================

export interface ClientResponse {
  id: number;
  name: string;
  description: string | null;
  timeZone: string | null;
  language: string | null;
  website: string | null;
  logo: string | null;
  favIcon: string | null;
  status: number | null;
  extraInfo: ClientExtraInfo | null;
  userCount?: number;
  locationCount?: number;
  createdAt: string;
  modifiedAt: string | null;
}

export interface ClientListResponse {
  success: boolean;
  data: {
    clients: ClientSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
  timestamp: string;
}

export interface ClientDetailResponse {
  success: boolean;
  data: ClientResponse & {
    locations: ClientLocation[];
    contacts: ClientContact[];
  };
  message: string;
  timestamp: string;
}

export interface CreateClientResponse {
  success: boolean;
  data: ClientResponse;
  message: string;
  timestamp: string;
}

// ===================================================================
// 🔧 HELPER TYPES
// ===================================================================

export interface ClientSummary {
  id: number;
  name: string;
  description: string | null;
  timeZone: string | null;
  status: number | null;
  logo: string | null;
  website: string | null;
  userCount: number;
  locationCount: number;
  createdAt: string;
}

export interface ClientLocation {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  status: number;
}

export interface ClientContact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

// ===================================================================
// 📊 EXTRA INFO TYPES (from validators)
// ===================================================================

export interface ClientExtraInfo {
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings?: {
    allowRegistration?: boolean;
    requireEmailVerification?: boolean;
    sessionTimeout?: number;
    maxFileSize?: number;
  };
  integrations?: {
    stripe?: {
      publishableKey?: string;
      webhookSecret?: string;
    };
    sendgrid?: {
      apiKey?: string;
      fromEmail?: string;
    };
  };
  compliance?: {
    hipaaCompliant?: boolean;
    gdprCompliant?: boolean;
    dataRetentionDays?: number;
  };
  customFields?: Record<string, any>;
}

// ===================================================================
// 🔍 FILTER TYPES
// ===================================================================

export interface ClientFilters {
  page: number;
  limit: number;
  search?: string;
  status?: number;
  sort: 'asc' | 'desc';
  includeLocations?: boolean;
  includeContacts?: boolean;
  includeCounts?: boolean;
}
