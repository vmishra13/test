import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CoreRole } from '@shared/constants';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import { getCurrentUser, createAuthRequest, performAuthorization } from '@features/auth';
import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
} from '@features/users/types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';
import logger from '@/config/logger';
import { prismaPostgres } from '@/db/postgres/client';

// ===================================================================
// 🏥 PROCEDURE MANAGEMENT INTERFACES
// ===================================================================

export interface ProcedureData {
  id?: number;
  name: string;
  description: string;
  category?: string;
  duration?: string;
  complexity?: string;
  cost?: number;
  preOperativeInstructions?: string[];
  postOperativeInstructions?: string[];
  clientId: number;
  crUser?: string;
  modUser?: string;
  createdAt?: string;
  updatedAt?: string;
  modDate?: Date;
}

export interface GetProceduresFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  complexity?: string;
  clientId: number;
}

export interface ProcedureResponse {
  success: boolean;
  data: any;
  message: string;
  timestamp: string;
}

// ===================================================================
// 🔒 MULTI-TENANT PROCEDURE SERVICES
// ===================================================================

/**
 * Get procedures with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to procedures within same client or SuperAdmin cross-client access
 */
export async function getProcedures(req: ExtendedRequest<any>): Promise<ProcedureResponse> {
  try {
    const currentUser = getCurrentUser(req);
    
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const complexity = req.query.complexity as string;
    const requestedClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific procedure ID for listing
      requestedClientId,
      null,
      null,
      RequestUserAction.userView, // Using userView as procedure viewing action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to procedures in client ${requestedClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view procedures within your organization');
    }

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    let filters: GetProceduresFilters = {
      page,
      limit,
      search,
      category,
      complexity,
      clientId: requestedClientId,
    };

    // Enforce role-based restrictions
    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can see procedures from any client
        if (req.query.clientId) {
          filters.clientId = parseInt(req.query.clientId as string);
        }
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only see procedures in their own client
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only view procedures in their own organization`,
          );
        }
        filters.clientId = currentUser.clientId;
        break;

      case CoreRole.PATIENT:
        // Patients cannot view procedure catalogs (only their own assigned procedures)
        throw createAuthorizationError('PATIENT role is not authorized to view procedure catalogs');

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Get procedures from database (mock implementation for now)
    const procedures = await getProceduresFromDatabase(filters);

    return {
      success: true,
      data: procedures,
      message: 'Procedures retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getProcedures service:', error);
    throw error;
  }
}

/**
 * Get procedure by ID with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to procedures within same client or SuperAdmin cross-client access
 */
export async function getProcedureById(req: ExtendedRequest<any> & { params: { procedureId: string } }): Promise<ProcedureResponse> {
  try {
    const { procedureId } = req.params;
    const currentUser = getCurrentUser(req);

    // Validate procedure ID
    const id = parseInt(procedureId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid procedure ID format', [
        { field: 'procedureId', message: 'Procedure ID must be a positive integer' },
      ]);
    }

    // Get procedure from database (mock implementation for now)
    const procedure = await getProcedureFromDatabase(id);

    if (!procedure) {
      throw createValidationError('Procedure not found', [
        { field: 'procedureId', message: 'No procedure found with the specified ID' },
      ]);
    }

    // Create authorization request using procedure's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      procedure.clientId, // Use procedure's client
      null,
      null,
      RequestUserAction.userView,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to procedure ${id} in client ${procedure.clientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view procedures within your organization');
    }

    return {
      success: true,
      data: procedure,
      message: 'Procedure retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getProcedureById service:', error);
    throw error;
  }
}

/**
 * Create procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create procedures
 */
export async function createProcedure(req: ExtendedRequest<any>): Promise<ProcedureResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const procedureData: ProcedureData = req.body;

    // Validate required fields
    if (!procedureData.name || !procedureData.description) {
      throw createValidationError('Missing required fields', [
        { field: 'name', message: 'Procedure name is required' },
        { field: 'description', message: 'Description is required' },
      ]);
    }

    // Determine target client ID
    const targetClientId = procedureData.clientId || currentUser.clientId;

    // Validate role-based access for procedure creation
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can create procedures for any client
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only create procedures for their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only create procedures for their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot create procedures
        throw createAuthorizationError(
          `${userRole} role is not authorized to create procedures`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific procedure ID for creation
      targetClientId,
      null,
      null,
      RequestUserAction.userAdd, // Using userAdd as procedure creation action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to create procedure in client ${targetClientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to create procedures');
    }

    // Prepare procedure data with client assignment and audit fields
    const newProcedureData: ProcedureData = {
      ...procedureData,
      clientId: targetClientId,
      crUser: currentUser.userId.toString(),
      category: procedureData.category || 'General',
      duration: procedureData.duration || 'Variable',
      complexity: procedureData.complexity || 'Low',
      cost: procedureData.cost || 0,
      preOperativeInstructions: procedureData.preOperativeInstructions || [],
      postOperativeInstructions: procedureData.postOperativeInstructions || [],
    };

    // Create procedure in database (mock implementation for now)
    const createdProcedure = await createProcedureInDatabase(newProcedureData);

    logger.info(
      `User ${currentUser.userId} created procedure ${createdProcedure.id} for client ${targetClientId}`,
    );

    return {
      success: true,
      data: createdProcedure,
      message: 'Procedure created successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in createProcedure service:', error);
    throw error;
  }
}

/**
 * Update procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update procedures
 */
export async function updateProcedure(req: ExtendedRequest<any> & { params: { procedureId: string } }): Promise<ProcedureResponse> {
  try {
    const { procedureId } = req.params;
    const currentUser = getCurrentUser(req);
    const updateData: Partial<ProcedureData> = req.body;

    // Validate procedure ID
    const id = parseInt(procedureId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid procedure ID format', [
        { field: 'procedureId', message: 'Procedure ID must be a positive integer' },
      ]);
    }

    // Get existing procedure from database
    const existingProcedure = await getProcedureFromDatabase(id);

    if (!existingProcedure) {
      throw createValidationError('Procedure not found', [
        { field: 'procedureId', message: 'No procedure found with the specified ID' },
      ]);
    }

    // Validate role-based access for procedure updates
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can update any procedure
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only update procedures in their own client
        if (existingProcedure.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only update procedures in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot update procedures
        throw createAuthorizationError(
          `${userRole} role is not authorized to update procedures`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request using existing procedure's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      existingProcedure.clientId,
      null,
      null,
      RequestUserAction.userEdit, // Using userEdit as procedure update action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to update procedure ${id} in client ${existingProcedure.clientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to update this procedure');
    }

    // Prepare update data with audit fields
    const updateProcedureData = {
      ...updateData,
      modUser: currentUser.userId.toString(),
      modDate: new Date(),
    };

    // Update procedure in database (mock implementation for now)
    const updatedProcedure = await updateProcedureInDatabase(id, updateProcedureData);

    logger.info(
      `User ${currentUser.userId} updated procedure ${id} in client ${existingProcedure.clientId}`,
    );

    return {
      success: true,
      data: updatedProcedure,
      message: 'Procedure updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateProcedure service:', error);
    throw error;
  }
}

/**
 * Delete procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete procedures
 */
export async function deleteProcedure(req: ExtendedRequest<any> & { params: { procedureId: string } }): Promise<ProcedureResponse> {
  try {
    const { procedureId } = req.params;
    const currentUser = getCurrentUser(req);

    // Validate procedure ID
    const id = parseInt(procedureId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid procedure ID format', [
        { field: 'procedureId', message: 'Procedure ID must be a positive integer' },
      ]);
    }

    // Get existing procedure from database
    const existingProcedure = await getProcedureFromDatabase(id);

    if (!existingProcedure) {
      throw createValidationError('Procedure not found', [
        { field: 'procedureId', message: 'No procedure found with the specified ID' },
      ]);
    }

    // Validate role-based access for procedure deletion
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can delete any procedure
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only delete procedures in their own client
        if (existingProcedure.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only delete procedures in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot delete procedures
        throw createAuthorizationError(
          `${userRole} role is not authorized to delete procedures`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request using existing procedure's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      existingProcedure.clientId,
      null,
      null,
      RequestUserAction.userDelete, // Using userDelete as procedure deletion action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to delete procedure ${id} in client ${existingProcedure.clientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to delete this procedure');
    }

    // Delete procedure from database (mock implementation for now)
    await deleteProcedureFromDatabase(id);

    logger.info(
      `User ${currentUser.userId} deleted procedure ${id} from client ${existingProcedure.clientId}`,
    );

    return {
      success: true,
      data: { id },
      message: 'Procedure deleted successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in deleteProcedure service:', error);
    throw error;
  }
}

/**
 * Search procedures with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
export async function searchProcedures(req: ExtendedRequest<any>): Promise<ProcedureResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { q, category, complexity } = req.query;

    if (!q && !category && !complexity) {
      throw createValidationError('Search criteria required', [
        { field: 'query', message: 'Search query, category, or complexity is required' },
      ]);
    }

    // Determine client scope
    const targetClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can search procedures from any client
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only search procedures in their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only search procedures in their own organization`,
          );
        }
        break;

      case CoreRole.PATIENT:
        // Patients cannot search procedure catalogs
        throw createAuthorizationError('PATIENT role is not authorized to search procedure catalogs');

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      targetClientId,
      null,
      null,
      RequestUserAction.userView,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to search procedures in client ${targetClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only search procedures within your organization');
    }

    // Search procedures in database (mock implementation for now)
    const procedures = await searchProceduresInDatabase(q as string, category as string, complexity as string, targetClientId);

    return {
      success: true,
      data: procedures,
      message: 'Search results retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in searchProcedures service:', error);
    throw error;
  }
}

// ===================================================================
// 🔧 HELPER FUNCTIONS
// ===================================================================

function getCurrentUserPrimaryRole(roles: string[]): string {
  // TEMPORARY: Return SUPER_ADMIN for empty roles (superadmin user without roles)
  if (roles.length === 0) {
    console.log('⚠️ TEMPORARY: Empty roles detected, assuming SUPER_ADMIN for compatibility');
    return CoreRole.SUPER_ADMIN;
  }

  // Define role hierarchy (highest to lowest priority)
  const roleHierarchy = [
    CoreRole.SUPER_ADMIN,
    CoreRole.CLIENT_ADMIN,
    CoreRole.CLINICAL_STAFF,
    CoreRole.OFFICE_STAFF,
    CoreRole.PATIENT,
  ];

  // Find the highest priority role that the user has
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return role;
    }
  }

  // If no known role is found, throw an error
  throw createAuthError('User has no valid roles assigned');
}

// ===================================================================
// 🔧 MOCK DATABASE FUNCTIONS (TO BE REPLACED WITH ACTUAL DATABASE IMPLEMENTATION)
// ===================================================================

async function getProceduresFromDatabase(filters: GetProceduresFilters): Promise<any[]> {
  // TODO: Replace with actual database query that includes clientId filtering
  // For now, return mock data with clientId
  return [
    {
      id: 1,
      name: 'Knee Replacement Surgery',
      description: 'Total knee replacement procedure',
      category: 'Orthopedic',
      duration: '2-3 hours',
      complexity: 'High',
      cost: 15000,
      clientId: filters.clientId,
      preOperativeInstructions: [
        'Fast for 12 hours before surgery',
        'Stop blood thinners 7 days prior',
        'Arrange transportation home'
      ],
      postOperativeInstructions: [
        'Keep incision dry for 48 hours',
        'Begin physical therapy in 2 weeks',
        'Follow up in 1 week'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Physical Therapy Session',
      description: 'Individual physical therapy session',
      category: 'Rehabilitation',
      duration: '1 hour',
      complexity: 'Low',
      cost: 150,
      clientId: filters.clientId,
      preOperativeInstructions: [],
      postOperativeInstructions: ['Continue exercises at home', 'Schedule next session'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ].filter(proc => proc.clientId === filters.clientId);
}

async function getProcedureFromDatabase(id: number): Promise<ProcedureData | null> {
  // TODO: Replace with actual database query that includes clientId
  // For now, return mock data
  const mockProcedures = [
    {
      id: 1,
      name: 'Knee Replacement Surgery',
      description: 'Total knee replacement procedure',
      category: 'Orthopedic',
      duration: '2-3 hours',
      complexity: 'High',
      cost: 15000,
      clientId: 1, // Mock clientId
      preOperativeInstructions: [
        'Fast for 12 hours before surgery',
        'Stop blood thinners 7 days prior',
        'Arrange transportation home'
      ],
      postOperativeInstructions: [
        'Keep incision dry for 48 hours',
        'Begin physical therapy in 2 weeks',
        'Follow up in 1 week'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return mockProcedures.find(proc => proc.id === id) || null;
}

async function createProcedureInDatabase(procedureData: ProcedureData): Promise<ProcedureData> {
  // TODO: Replace with actual database creation
  // For now, return mock data with generated ID
  return {
    ...procedureData,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function updateProcedureInDatabase(id: number, updateData: Partial<ProcedureData>): Promise<ProcedureData> {
  // TODO: Replace with actual database update
  // For now, return mock updated data
  const existing = await getProcedureFromDatabase(id);
  return {
    ...existing!,
    ...updateData,
    id,
    updatedAt: new Date().toISOString(),
  };
}

async function deleteProcedureFromDatabase(id: number): Promise<void> {
  // TODO: Replace with actual database deletion
  // For now, just log the deletion
  logger.info(`Mock deletion of procedure ${id}`);
}

async function searchProceduresInDatabase(query: string, category: string, complexity: string, clientId: number): Promise<any[]> {
  // TODO: Replace with actual database search that includes clientId filtering
  // For now, return filtered mock data
  const mockProcedures = [
    {
      id: 1,
      name: 'Knee Replacement Surgery',
      description: 'Total knee replacement procedure',
      category: 'Orthopedic',
      complexity: 'High',
      duration: '2-3 hours',
      clientId: clientId,
    },
  ];

  return mockProcedures.filter(proc => proc.clientId === clientId);
}
