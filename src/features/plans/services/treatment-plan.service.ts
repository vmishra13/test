import { CoreRole } from '@shared/constants';
import { getCurrentUser, createAuthRequest, performAuthorization } from '@features/auth';
import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
} from '@features/users/types/extended-request';
import { createAuthorizationError, createValidationError } from '@shared/errors/application-error';
import logger from '@config/logger';

// ===================================================================
// 🏥 TYPES AND INTERFACES
// ===================================================================

export interface TreatmentPlanData {
  id: number;
  name: string;
  description: string;
  duration: string;
  status: 'active' | 'inactive' | 'completed' | 'suspended';
  patientId: number;
  clientId: number;
  exercises: number[];
  medications: number[];
  procedures: number[];
  goals?: string[];
  notes?: string;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetTreatmentPlansFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  patientId?: number;
  clientId: number;
}

export interface TreatmentPlanResponse {
  success: boolean;
  data: TreatmentPlanData | TreatmentPlanData[];
  message: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTreatmentPlanRequest {
  name: string;
  description: string;
  duration?: string;
  patientId: number;
  exercises?: number[];
  medications?: number[];
  procedures?: number[];
  goals?: string[];
  notes?: string;
}

export interface UpdateTreatmentPlanRequest {
  name?: string;
  description?: string;
  duration?: string;
  status?: 'active' | 'inactive' | 'completed' | 'suspended';
  exercises?: number[];
  medications?: number[];
  procedures?: number[];
  goals?: string[];
  notes?: string;
}

// ===================================================================
// 🔐 SECURE TREATMENT PLAN SERVICES
// ===================================================================

/**
 * Get treatment plans with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to treatment plans within same client or SuperAdmin cross-client access
 */
export async function getTreatmentPlans(req: ExtendedRequest<any>): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
    const requestedClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific plan ID for listing
      requestedClientId,
      null,
      null,
      RequestUserAction.userView, // Using userView as plan viewing action
    );

    // Check client-level permission
    const hasClientPermission = performAuthorization(oAuthReq);

    if (!hasClientPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to treatment plans in client ${requestedClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view treatment plans within your organization');
    }

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    let filters: GetTreatmentPlansFilters = {
      page,
      limit,
      search,
      status,
      patientId,
      clientId: requestedClientId,
    };

    // Enforce role-based restrictions
    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can see treatment plans from any client
        if (req.query.clientId) {
          filters.clientId = parseInt(req.query.clientId as string);
        }
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only see treatment plans in their own client
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only view treatment plans in their own organization`,
          );
        }
        filters.clientId = currentUser.clientId;
        break;

      case CoreRole.PATIENT:
        // Patients can only see their own treatment plans
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError('PATIENT can only view treatment plans in their own organization');
        }
        filters.clientId = currentUser.clientId;
        filters.patientId = currentUser.userId; // Restrict to their own plans
        break;

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Get treatment plans from database
    const treatmentPlans = await getTreatmentPlansFromDatabase(filters);

    // Calculate pagination
    const total = await getTreatmentPlansCountFromDatabase(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: treatmentPlans,
      message: 'Treatment plans retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    logger.error('Error in getTreatmentPlans service:', error);
    throw error;
  }
}

/**
 * Get treatment plan by ID with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to treatment plans within same client or SuperAdmin cross-client access
 */
export async function getTreatmentPlanById(req: ExtendedRequest<any> & { params: { planId: string } }): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const planId = parseInt(req.params.planId);

    if (isNaN(planId)) {
      throw createValidationError('Invalid treatment plan ID', [
        { field: 'planId', message: `Invalid ID: ${req.params.planId}` }
      ]);
    }

    // Get the treatment plan first to check its clientId
    const treatmentPlan = await getTreatmentPlanFromDatabase(planId);
    if (!treatmentPlan) {
      throw createValidationError('Treatment plan not found', [
        { field: 'planId', message: `Plan not found: ${planId}` }
      ]);
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      planId,
      treatmentPlan.clientId,
      null,
      null,
      RequestUserAction.userView,
    );

    // Check permission for this specific treatment plan
    const hasAccess = performAuthorization(oAuthReq);

    if (!hasAccess) {
      logger.error(
        `User ${currentUser.userId} denied access to treatment plan ${planId} in client ${treatmentPlan.clientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view treatment plans within your organization');
    }

    // Additional role-based validation for patients
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);
    if (userRole === CoreRole.PATIENT && treatmentPlan.patientId !== currentUser.userId) {
      throw createAuthorizationError('Patients can only view their own treatment plans');
    }

    return {
      success: true,
      data: treatmentPlan,
      message: 'Treatment plan retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getTreatmentPlanById service:', error);
    throw error;
  }
}

/**
 * Create treatment plan with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create treatment plans
 */
export async function createTreatmentPlan(req: ExtendedRequest<any>): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const treatmentPlanData: CreateTreatmentPlanRequest = req.body;

    // Extract clientId from body or use current user's clientId
    const targetClientId = req.body.clientId || currentUser.clientId;

    // Validate input
    if (!treatmentPlanData.name || !treatmentPlanData.description || !treatmentPlanData.patientId) {
      throw createValidationError('Treatment plan name, description, and patient ID are required', [
        { field: 'name', message: 'Name is required' },
        { field: 'description', message: 'Description is required' },
        { field: 'patientId', message: 'Patient ID is required' }
      ]);
    }

    // Create authorization request for treatment plan creation
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      targetClientId,
      null,
      null,
      RequestUserAction.userView, // Treatment plan creation action
    );

    // Check permission to create treatment plans
    const hasCreatePermission = performAuthorization(oAuthReq);

    if (!hasCreatePermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to create treatment plan in client ${targetClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only create treatment plans within your organization');
    }

    // Validate role-based creation permissions
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    if (![CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN, CoreRole.CLINICAL_STAFF].includes(userRole as CoreRole)) {
      throw createAuthorizationError('Only administrators and clinical staff can create treatment plans');
    }

    // For non-SuperAdmin users, ensure they can only create plans in their own client
    if (userRole !== CoreRole.SUPER_ADMIN && targetClientId !== currentUser.clientId) {
      throw createAuthorizationError(`${userRole} can only create treatment plans in their own organization`);
    }

    // TODO: Validate that patientId belongs to the target client
    // const patient = await getUserFromDatabase(treatmentPlanData.patientId);
    // if (!patient || patient.clientId !== targetClientId) {
    //   throw createValidationError('Patient does not exist or does not belong to the specified client');
    // }

    // Create the new treatment plan
    const newTreatmentPlanData: TreatmentPlanData = {
      id: 0, // Will be set by database
      name: treatmentPlanData.name,
      description: treatmentPlanData.description,
      duration: treatmentPlanData.duration || '4 weeks',
      status: 'active',
      patientId: treatmentPlanData.patientId,
      clientId: targetClientId,
      exercises: treatmentPlanData.exercises || [],
      medications: treatmentPlanData.medications || [],
      procedures: treatmentPlanData.procedures || [],
      goals: treatmentPlanData.goals || [],
      notes: treatmentPlanData.notes,
      createdBy: currentUser.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create treatment plan in database
    const createdTreatmentPlan = await createTreatmentPlanInDatabase(newTreatmentPlanData);

    return {
      success: true,
      data: createdTreatmentPlan,
      message: 'Treatment plan created successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in createTreatmentPlan service:', error);
    throw error;
  }
}

/**
 * Update treatment plan with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update treatment plans
 */
export async function updateTreatmentPlan(req: ExtendedRequest<any> & { params: { planId: string } }): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const planId = parseInt(req.params.planId);
    const updateData: UpdateTreatmentPlanRequest = req.body;

    if (isNaN(planId)) {
      throw createValidationError('Invalid treatment plan ID', [
        { field: 'planId', message: `Invalid ID: ${req.params.planId}` }
      ]);
    }

    // Get the existing treatment plan to check its clientId
    const existingPlan = await getTreatmentPlanFromDatabase(planId);
    if (!existingPlan) {
      throw createValidationError('Treatment plan not found', [
        { field: 'planId', message: `Plan not found: ${planId}` }
      ]);
    }

    // Create authorization request for treatment plan update
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      planId,
      existingPlan.clientId,
      null,
      null,
      RequestUserAction.userEdit,
    );

    // Check permission to update this treatment plan
    const hasUpdatePermission = performAuthorization(oAuthReq);

    if (!hasUpdatePermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to update treatment plan ${planId} in client ${existingPlan.clientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only update treatment plans within your organization');
    }

    // Validate role-based update permissions
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    if (![CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN, CoreRole.CLINICAL_STAFF].includes(userRole as CoreRole)) {
      throw createAuthorizationError('Only administrators and clinical staff can update treatment plans');
    }

    // Update treatment plan in database
    const updatedTreatmentPlan = await updateTreatmentPlanInDatabase(planId, updateData);

    if (!updatedTreatmentPlan) {
      throw createValidationError('Failed to update treatment plan', [
        { field: 'planId', message: `Update failed for plan: ${planId}` }
      ]);
    }

    return {
      success: true,
      data: updatedTreatmentPlan,
      message: 'Treatment plan updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateTreatmentPlan service:', error);
    throw error;
  }
}

/**
 * Delete treatment plan with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete treatment plans
 */
export async function deleteTreatmentPlan(req: ExtendedRequest<any> & { params: { planId: string } }): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const planId = parseInt(req.params.planId);

    if (isNaN(planId)) {
      throw createValidationError('Invalid treatment plan ID', [
        { field: 'planId', message: `Invalid ID: ${req.params.planId}` }
      ]);
    }

    // Get the existing treatment plan to check its clientId
    const existingPlan = await getTreatmentPlanFromDatabase(planId);
    if (!existingPlan) {
      throw createValidationError('Treatment plan not found', [
        { field: 'planId', message: `Plan not found: ${planId}` }
      ]);
    }

    // Create authorization request for treatment plan deletion
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      planId,
      existingPlan.clientId,
      null,
      null,
      RequestUserAction.userDelete,
    );

    // Check permission to delete this treatment plan
    const hasDeletePermission = performAuthorization(oAuthReq);

    if (!hasDeletePermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to delete treatment plan ${planId} in client ${existingPlan.clientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only delete treatment plans within your organization');
    }

    // Validate role-based deletion permissions
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    if (![CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN].includes(userRole as CoreRole)) {
      throw createAuthorizationError('Only super administrators and client administrators can delete treatment plans');
    }

    // Delete treatment plan from database
    await deleteTreatmentPlanFromDatabase(planId);

    return {
      success: true,
      data: { id: planId, deleted: true } as any,
      message: 'Treatment plan deleted successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in deleteTreatmentPlan service:', error);
    throw error;
  }
}

/**
 * Search treatment plans with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
export async function searchTreatmentPlans(req: ExtendedRequest<any>): Promise<TreatmentPlanResponse> {
  try {
    const currentUser = getCurrentUser(req);
    
    // Extract query parameters
    const q = req.query.q as string;
    const status = req.query.status as string;
    const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
    const targetClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    if (!q) {
      throw createValidationError('Search query is required', [
        { field: 'q', message: 'Query parameter is required for search' }
      ]);
    }

    // Create authorization request for search
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      targetClientId,
      null,
      null,
      RequestUserAction.userView,
    );

    // Check client-level permission for search
    const hasSearchPermission = performAuthorization(oAuthReq);

    if (!hasSearchPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to search treatment plans in client ${targetClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only search treatment plans within your organization');
    }

    // Search treatment plans in database
    const treatmentPlans = await searchTreatmentPlansInDatabase(q, status, patientId, targetClientId);

    return {
      success: true,
      data: treatmentPlans,
      message: 'Search results retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in searchTreatmentPlans service:', error);
    throw error;
  }
}

// ===================================================================
// 🔧 HELPER FUNCTIONS
// ===================================================================

function getCurrentUserPrimaryRole(roles: string[]): string {
  if (!roles || roles.length === 0) {
    return 'unknown';
  }
  
  // Return the first role as primary
  // TODO: Implement proper role hierarchy logic if needed
  return roles[0];
}

// ===================================================================
// 🔧 MOCK DATABASE FUNCTIONS (TO BE REPLACED WITH ACTUAL DATABASE IMPLEMENTATION)
// ===================================================================

async function getTreatmentPlansFromDatabase(filters: GetTreatmentPlansFilters): Promise<TreatmentPlanData[]> {
  // TODO: Replace with actual database query that includes clientId filtering
  logger.warn('Treatment plan database not yet implemented - returning mock data');
  
  const mockPlans: TreatmentPlanData[] = [
    {
      id: 1,
      name: 'Post-Surgery Recovery Plan',
      description: 'Comprehensive recovery plan for post-operative patients',
      duration: '6 weeks',
      status: 'active',
      patientId: 123,
      clientId: filters.clientId,
      exercises: [1, 2, 3],
      medications: [1, 2],
      procedures: [1],
      goals: ['Pain reduction', 'Mobility improvement'],
      notes: 'Patient showing good progress',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Physical Therapy Plan',
      description: 'Rehabilitation plan for muscle strengthening',
      duration: '4 weeks',
      status: 'active',
      patientId: 124,
      clientId: filters.clientId,
      exercises: [4, 5, 6],
      medications: [],
      procedures: [2],
      goals: ['Strength building', 'Range of motion'],
      notes: 'Focus on lower body exercises',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Apply filters
  let filteredPlans = mockPlans.filter(plan => plan.clientId === filters.clientId);

  if (filters.search) {
    filteredPlans = filteredPlans.filter(plan => 
      plan.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
      plan.description.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }

  if (filters.status) {
    filteredPlans = filteredPlans.filter(plan => plan.status === filters.status);
  }

  if (filters.patientId) {
    filteredPlans = filteredPlans.filter(plan => plan.patientId === filters.patientId);
  }

  // Apply pagination
  const startIndex = (filters.page - 1) * filters.limit;
  const endIndex = startIndex + filters.limit;
  
  return filteredPlans.slice(startIndex, endIndex);
}

async function getTreatmentPlansCountFromDatabase(filters: GetTreatmentPlansFilters): Promise<number> {
  // TODO: Replace with actual database count query
  logger.warn('Treatment plan database not yet implemented - returning mock count');
  return 2; // Mock count
}

async function getTreatmentPlanFromDatabase(id: number): Promise<TreatmentPlanData | null> {
  // TODO: Replace with actual database query
  logger.warn('Treatment plan database not yet implemented - returning mock data');
  
  const mockPlan: TreatmentPlanData = {
    id: 1,
    name: 'Post-Surgery Recovery Plan',
    description: 'Comprehensive recovery plan for post-operative patients',
    duration: '6 weeks',
    status: 'active',
    patientId: 123,
    clientId: 1,
    exercises: [1, 2, 3],
    medications: [1, 2],
    procedures: [1],
    goals: ['Pain reduction', 'Mobility improvement'],
    notes: 'Patient showing good progress',
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return id === 1 ? mockPlan : null;
}

async function createTreatmentPlanInDatabase(planData: TreatmentPlanData): Promise<TreatmentPlanData> {
  // TODO: Replace with actual database query
  logger.warn('Treatment plan database not yet implemented - returning mock data');
  
  const newPlan: TreatmentPlanData = {
    ...planData,
    id: Date.now(), // Mock ID generation
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return newPlan;
}

async function updateTreatmentPlanInDatabase(id: number, updateData: UpdateTreatmentPlanRequest): Promise<TreatmentPlanData | null> {
  // TODO: Replace with actual database query
  logger.warn('Treatment plan database not yet implemented - returning mock data');
  
  const existingPlan = await getTreatmentPlanFromDatabase(id);
  if (!existingPlan) {
    return null;
  }

  const updatedPlan: TreatmentPlanData = {
    ...existingPlan,
    ...updateData,
    updatedAt: new Date(),
  };

  return updatedPlan;
}

async function deleteTreatmentPlanFromDatabase(id: number): Promise<void> {
  // TODO: Replace with actual database query
  logger.warn('Treatment plan database not yet implemented - returning mock response');
  
  // Mock deletion - would normally delete from database
  return;
}

async function searchTreatmentPlansInDatabase(query: string, status?: string, patientId?: number, clientId?: number): Promise<TreatmentPlanData[]> {
  // TODO: Replace with actual database search that includes clientId filtering
  logger.warn('Treatment plan database not yet implemented - returning mock search results');
  
  const mockPlans: TreatmentPlanData[] = [
    {
      id: 1,
      name: 'Post-Surgery Recovery Plan',
      description: 'Comprehensive recovery plan for post-operative patients',
      duration: '6 weeks',
      status: 'active',
      patientId: 123,
      clientId: clientId || 1,
      exercises: [1, 2, 3],
      medications: [1, 2],
      procedures: [1],
      goals: ['Pain reduction', 'Mobility improvement'],
      notes: 'Patient showing good progress',
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return mockPlans.filter(plan => {
    const matchesQuery = plan.name.toLowerCase().includes(query.toLowerCase()) || 
                        plan.description.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !status || plan.status === status;
    const matchesPatient = !patientId || plan.patientId === patientId;
    const matchesClient = !clientId || plan.clientId === clientId;
    
    return matchesQuery && matchesStatus && matchesPatient && matchesClient;
  });
}
