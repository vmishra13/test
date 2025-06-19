/**
 * CLIENT SERVICE - Business Logic Layer
 * 
 * Handles all client-related business operations with:
 * - Authorization checks
 * - Input validation
 * - Business rule enforcement
 * - Multi-tenant security
 * 
 * Following the same pattern as users service for consistency
 */

import { Request } from 'express';
import { CoreRole } from '@shared/constants';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import type { 
  ClientListResponse,
  ClientDetailResponse,
  CreateClientResponse,
  CreateClientRequest,
  UpdateClientRequest,
  GetClientsQueryRequest,
  ClientFilters,
  ClientExtraInfo
} from '../dto/client.dto';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';
import logger from '@/config/logger';
import { getCurrentUser } from '@features/auth';
import {
  validateJsonField,
  clientExtraInfoSchema,
  createClientSchema,
  updateClientSchema,
  getClientsQuerySchema,
} from '../validators/client.validators';
import * as clientRepository from '../repositories/client.repository';
import type {
  ExtendedRequest,
  RequestClientAction,
  ClientListRequest,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientDetailRequest,
  ClientStatusRequest,
} from '../types/extended-request';

// ===================================================================
// 🔍 READ OPERATIONS
// ===================================================================

/**
 * Get clients with filtering and pagination (SUPER_ADMIN only)
 */
export async function getClients(req: ClientListRequest): Promise<ClientListResponse> {
  try {
    const currentUser = req.user;

    // Authorization: Only SUPER_ADMIN can view all clients
    if (!currentUser.roles.includes(CoreRole.SUPER_ADMIN)) {
      logger.error(`User ${currentUser.userId} attempted to access all clients without SUPER_ADMIN role`);
      throw createAuthorizationError('Access denied. Super Admin role required.');
    }

    // Validate query parameters
    const queryParams = validateGetClientsQuery(req.query);

    // Build filters
    const filters: ClientFilters = {
      page: queryParams.page || 1,
      limit: queryParams.limit || 20,
      search: queryParams.search,
      status: queryParams.status,
      sort: queryParams.sort || 'asc',
      includeLocations: true,
      includeCounts: true,
    };

    // Get clients from repository
    const result = await clientRepository.getClientsWithFilters(filters);

    return {
      success: true,
      data: {
        clients: result.clients.map(client => ({
          id: client.id,
          name: client.name,
          description: client.description,
          timeZone: client.timeZone,
          status: client.status,
          logo: client.logo,
          website: client.website,
          userCount: (client as any)._count?.users || 0,
          locationCount: (client as any)._count?.locations || 0,
          createdAt: client.crDate.toISOString(),
        })),
        pagination: result.pagination,
      },
      message: 'Clients retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getClients service:', error);
    throw error;
  }
}

/**
 * Get client by ID with authorization checks
 */
export async function getClientById(
  req: ClientDetailRequest
): Promise<ClientDetailResponse> {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      throw createValidationError('Invalid client ID format', [
        { field: 'id', message: 'Client ID must be a valid number' },
      ]);
    }

    // Authorization: Users can only view their own client OR SUPER_ADMIN can view any
    if (currentUser.clientId !== clientId && !currentUser.roles.includes(CoreRole.SUPER_ADMIN)) {
      logger.error(`User ${currentUser.userId} denied access to client ${clientId}`);
      throw createAuthorizationError('Access denied to this client');
    }

    // Get client from repository
    const client = await clientRepository.findClientById(clientId, {
      includeLocations: true,
      includeContacts: true,
      includeCounts: true,
    });

    if (!client) {
      throw createValidationError('Client not found', [
        { field: 'id', message: 'Client with this ID does not exist' },
      ]);
    }

    return {
      success: true,
      data: {
        id: client.id,
        name: client.name,
        description: client.description,
        timeZone: client.timeZone,
        language: client.language,
        website: client.website,
        logo: client.logo,
        favIcon: client.favIcon,
        status: client.status,
        extraInfo: client.extraInfo as ClientExtraInfo,
        userCount: (client as any)._count?.users || 0,
        locationCount: (client as any)._count?.locations || 0,
        locations: ((client as any).locations || []) as any[],
        contacts: ((client as any).contacts || []) as any[],
        createdAt: client.crDate.toISOString(),
        modifiedAt: client.modDate?.toISOString() || client.crDate.toISOString(),
      },
      message: 'Client retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getClientById service:', error);
    throw error;
  }
}

// ===================================================================
// ✏️ WRITE OPERATIONS
// ===================================================================

/**
 * Create new client (SUPER_ADMIN only)
 */
export async function createClient(
  req: ClientCreateRequest
): Promise<CreateClientResponse> {
  try {
    const currentUser = req.user;

    // Authorization: Only SUPER_ADMIN can create clients
    if (!currentUser.roles.includes(CoreRole.SUPER_ADMIN)) {
      logger.error(`User ${currentUser.userId} attempted to create client without SUPER_ADMIN role`);
      throw createAuthorizationError('Access denied. Super Admin role required.');
    }

    // Validate request body
    const clientData = validateCreateClientRequest(req.body);

    // Check for duplicate client name
    const existingClient = await clientRepository.findClientByName(clientData.name);
    if (existingClient) {
      throw createValidationError('Client name already exists', [
        { field: 'name', message: 'A client with this name already exists' },
      ]);
    }

    // Create client
    const client = await clientRepository.createClient(clientData, currentUser.loginName);

    return {
      success: true,
      data: {
        id: client.id,
        name: client.name,
        description: client.description,
        timeZone: client.timeZone,
        language: client.language,
        website: client.website,
        logo: client.logo,
        favIcon: client.favIcon,
        status: client.status,
        extraInfo: client.extraInfo as ClientExtraInfo,
        userCount: (client as any)._count?.users || 0,
        locationCount: (client as any)._count?.locations || 0,
        createdAt: client.crDate.toISOString(),
        modifiedAt: client.modDate?.toISOString() || client.crDate.toISOString(),
      },
      message: 'Client created successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in createClient service:', error);
    throw error;
  }
}

/**
 * Update client (SUPER_ADMIN or CLIENT_ADMIN of same client)
 */
export async function updateClient(
  req: ClientUpdateRequest
): Promise<ClientDetailResponse> {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      throw createValidationError('Invalid client ID format', [
        { field: 'id', message: 'Client ID must be a valid number' },
      ]);
    }

    // Authorization: SUPER_ADMIN can update any client, CLIENT_ADMIN can only update their own
    const canUpdate = 
      currentUser.roles.includes(CoreRole.SUPER_ADMIN) ||
      (currentUser.roles.includes(CoreRole.CLIENT_ADMIN) && currentUser.clientId === clientId);

    if (!canUpdate) {
      logger.error(`User ${currentUser.userId} denied update access to client ${clientId}`);
      throw createAuthorizationError('Access denied to update this client');
    }

    // Validate request body
    const updateData = validateUpdateClientRequest(req.body);

    // Check if client exists
    const existingClient = await clientRepository.findClientById(clientId);
    if (!existingClient) {
      throw createValidationError('Client not found', [
        { field: 'id', message: 'Client with this ID does not exist' },
      ]);
    }

    // Check for duplicate name if name is being updated
    if (updateData.name && updateData.name !== existingClient.name) {
      const duplicateClient = await clientRepository.findClientByName(updateData.name);
      if (duplicateClient) {
        throw createValidationError('Client name already exists', [
          { field: 'name', message: 'A client with this name already exists' },
        ]);
      }
    }

    // Update client
    const updatedClient = await clientRepository.updateClient(
      clientId, 
      updateData, 
      currentUser.loginName
    );

    return {
      success: true,
      data: {
        id: updatedClient.id,
        name: updatedClient.name,
        description: updatedClient.description,
        timeZone: updatedClient.timeZone,
        language: updatedClient.language,
        website: updatedClient.website,
        logo: updatedClient.logo,
        favIcon: updatedClient.favIcon,
        status: updatedClient.status,
        extraInfo: updatedClient.extraInfo as ClientExtraInfo,
        userCount: (updatedClient as any)._count?.users || 0,
        locationCount: (updatedClient as any)._count?.locations || 0,
        locations: [],
        contacts: [],
        createdAt: updatedClient.crDate.toISOString(),
        modifiedAt: updatedClient.modDate?.toISOString() || updatedClient.crDate.toISOString(),
      },
      message: 'Client updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateClient service:', error);
    throw error;
  }
}

/**
 * Update client status (SUPER_ADMIN only)
 */
export async function updateClientStatus(
  req: ClientStatusRequest
): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { status } = req.body;

    // Authorization: Only SUPER_ADMIN can change client status
    if (!currentUser.roles.includes(CoreRole.SUPER_ADMIN)) {
      logger.error(`User ${currentUser.userId} attempted to change client status without SUPER_ADMIN role`);
      throw createAuthorizationError('Access denied. Super Admin role required.');
    }

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      throw createValidationError('Invalid client ID format', [
        { field: 'id', message: 'Client ID must be a valid number' },
      ]);
    }

    if (status !== 0 && status !== 1) {
      throw createValidationError('Invalid status value', [
        { field: 'status', message: 'Status must be 0 (inactive) or 1 (active)' },
      ]);
    }

    // Check if client exists
    const existingClient = await clientRepository.findClientById(clientId);
    if (!existingClient) {
      throw createValidationError('Client not found', [
        { field: 'id', message: 'Client with this ID does not exist' },
      ]);
    }

    // Update status
    await clientRepository.updateClientStatus(clientId, status, currentUser.loginName);

    return {
      success: true,
      message: `Client ${status === 1 ? 'activated' : 'deactivated'} successfully`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateClientStatus service:', error);
    throw error;
  }
}

// ===================================================================
// 🔧 VALIDATION HELPERS
// ===================================================================

/**
 * Validate get clients query parameters
 */
function validateGetClientsQuery(query: any): GetClientsQueryRequest {
  try {
    return getClientsQuerySchema.parse(query);
  } catch (error: any) {
    if (error.errors) {
      throw createValidationError(
        'Invalid query parameters',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }
    throw createValidationError('Query validation failed', [
      { field: 'query', message: error.message },
    ]);
  }
}

/**
 * Validate create client request
 */
function validateCreateClientRequest(body: any): CreateClientRequest {
  try {
    const validatedData = createClientSchema.parse(body);
    
    // Validate extraInfo if provided
    if (validatedData.extraInfo) {
      const extraInfoValidation = validateJsonField(
        validatedData.extraInfo, 
        clientExtraInfoSchema, 
        'extraInfo'
      );
      
      if (!extraInfoValidation.success) {
        throw createValidationError(
          'Invalid extraInfo format',
          extraInfoValidation.errors.map(error => ({ field: 'extraInfo', message: error })),
        );
      }
      
      validatedData.extraInfo = extraInfoValidation.data;
    }
    
    return validatedData;
  } catch (error: any) {
    if (error.errors) {
      throw createValidationError(
        'Validation failed',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }
    throw error;
  }
}

/**
 * Validate update client request
 */
function validateUpdateClientRequest(body: any): UpdateClientRequest {
  try {
    const validatedData = updateClientSchema.parse(body);
    
    // Validate extraInfo if provided
    if (validatedData.extraInfo) {
      const extraInfoValidation = validateJsonField(
        validatedData.extraInfo, 
        clientExtraInfoSchema, 
        'extraInfo'
      );
      
      if (!extraInfoValidation.success) {
        throw createValidationError(
          'Invalid extraInfo format',
          extraInfoValidation.errors.map(error => ({ field: 'extraInfo', message: error })),
        );
      }
      
      validatedData.extraInfo = extraInfoValidation.data;
    }
    
    return validatedData;
  } catch (error: any) {
    if (error.errors) {
      throw createValidationError(
        'Validation failed',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }
    throw error;
  }
}
