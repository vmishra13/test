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
// 🏥 MEDICATION MANAGEMENT INTERFACES
// ===================================================================

export interface MedicationData {
  id?: number;
  name: string;
  genericName?: string;
  brandName?: string;
  description: string;
  dosage: string;
  frequency?: string;
  type?: string;
  category?: string;
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
  instructions?: string[];
  clientId: number;
  crUser?: string;
  modUser?: string;
  createdAt?: string;
  updatedAt?: string;
  modDate?: Date;
}

export interface GetMedicationsFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  clientId: number;
}

export interface MedicationResponse {
  success: boolean;
  data: any;
  message: string;
  timestamp: string;
}

// ===================================================================
// 🔒 MULTI-TENANT MEDICATION SERVICES
// ===================================================================

/**
 * Get medications with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to medications within same client or SuperAdmin cross-client access
 */
export async function getMedications(req: ExtendedRequest<any>): Promise<MedicationResponse> {
  try {
    const currentUser = getCurrentUser(req);
    
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const requestedClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific medication ID for listing
      requestedClientId,
      null,
      null,
      RequestUserAction.userView, // Using userView as medication viewing action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to medications in client ${requestedClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view medications within your organization');
    }

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    let filters: GetMedicationsFilters = {
      page,
      limit,
      search,
      category,
      clientId: requestedClientId,
    };

    // Enforce role-based restrictions
    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can see medications from any client
        if (req.query.clientId) {
          filters.clientId = parseInt(req.query.clientId as string);
        }
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only see medications in their own client
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only view medications in their own organization`,
          );
        }
        filters.clientId = currentUser.clientId;
        break;

      case CoreRole.PATIENT:
        // Patients cannot view medication catalogs (only their own prescribed medications)
        throw createAuthorizationError('PATIENT role is not authorized to view medication catalogs');

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Get medications from database (mock implementation for now)
    const medications = await getMedicationsFromDatabase(filters);

    return {
      success: true,
      data: medications,
      message: 'Medications retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getMedications service:', error);
    throw error;
  }
}

/**
 * Get medication by ID with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to medications within same client or SuperAdmin cross-client access
 */
export async function getMedicationById(req: ExtendedRequest<any> & { params: { medicationId: string } }): Promise<MedicationResponse> {
  try {
    const { medicationId } = req.params;
    const currentUser = getCurrentUser(req);

    // Validate medication ID
    const id = parseInt(medicationId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid medication ID format', [
        { field: 'medicationId', message: 'Medication ID must be a positive integer' },
      ]);
    }

    // Get medication from database (mock implementation for now)
    const medication = await getMedicationFromDatabase(id);

    if (!medication) {
      throw createValidationError('Medication not found', [
        { field: 'medicationId', message: 'No medication found with the specified ID' },
      ]);
    }

    // Create authorization request using medication's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      medication.clientId, // Use medication's client
      null,
      null,
      RequestUserAction.userView,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to medication ${id} in client ${medication.clientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view medications within your organization');
    }

    return {
      success: true,
      data: medication,
      message: 'Medication retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getMedicationById service:', error);
    throw error;
  }
}

/**
 * Create medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create medications
 */
export async function createMedication(req: ExtendedRequest<any>): Promise<MedicationResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const medicationData: MedicationData = req.body;

    // Validate required fields
    if (!medicationData.name || !medicationData.description || !medicationData.dosage) {
      throw createValidationError('Missing required fields', [
        { field: 'name', message: 'Medication name is required' },
        { field: 'description', message: 'Description is required' },
        { field: 'dosage', message: 'Dosage is required' },
      ]);
    }

    // Determine target client ID
    const targetClientId = medicationData.clientId || currentUser.clientId;

    // Validate role-based access for medication creation
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can create medications for any client
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only create medications for their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only create medications for their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot create medications
        throw createAuthorizationError(
          `${userRole} role is not authorized to create medications`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific medication ID for creation
      targetClientId,
      null,
      null,
      RequestUserAction.userAdd, // Using userAdd as medication creation action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to create medication in client ${targetClientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to create medications');
    }

    // Prepare medication data with client assignment and audit fields
    const newMedicationData: MedicationData = {
      ...medicationData,
      clientId: targetClientId,
      crUser: currentUser.userId.toString(),
      genericName: medicationData.genericName || medicationData.name,
      brandName: medicationData.brandName || '',
      frequency: medicationData.frequency || 'As needed',
      type: medicationData.type || 'Tablet',
      category: medicationData.category || 'General',
      sideEffects: medicationData.sideEffects || [],
      contraindications: medicationData.contraindications || [],
      interactions: medicationData.interactions || [],
      instructions: medicationData.instructions || [],
    };

    // Create medication in database (mock implementation for now)
    const createdMedication = await createMedicationInDatabase(newMedicationData);

    logger.info(
      `User ${currentUser.userId} created medication ${createdMedication.id} for client ${targetClientId}`,
    );

    return {
      success: true,
      data: createdMedication,
      message: 'Medication created successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in createMedication service:', error);
    throw error;
  }
}

/**
 * Update medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update medications
 */
export async function updateMedication(req: ExtendedRequest<any> & { params: { medicationId: string } }): Promise<MedicationResponse> {
  try {
    const { medicationId } = req.params;
    const currentUser = getCurrentUser(req);
    const updateData: Partial<MedicationData> = req.body;

    // Validate medication ID
    const id = parseInt(medicationId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid medication ID format', [
        { field: 'medicationId', message: 'Medication ID must be a positive integer' },
      ]);
    }

    // Get existing medication from database
    const existingMedication = await getMedicationFromDatabase(id);

    if (!existingMedication) {
      throw createValidationError('Medication not found', [
        { field: 'medicationId', message: 'No medication found with the specified ID' },
      ]);
    }

    // Validate role-based access for medication updates
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can update any medication
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only update medications in their own client
        if (existingMedication.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only update medications in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot update medications
        throw createAuthorizationError(
          `${userRole} role is not authorized to update medications`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request using existing medication's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      existingMedication.clientId,
      null,
      null,
      RequestUserAction.userEdit, // Using userEdit as medication update action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to update medication ${id} in client ${existingMedication.clientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to update this medication');
    }

    // Prepare update data with audit fields
    const updateMedicationData = {
      ...updateData,
      modUser: currentUser.userId.toString(),
      modDate: new Date(),
    };

    // Update medication in database (mock implementation for now)
    const updatedMedication = await updateMedicationInDatabase(id, updateMedicationData);

    logger.info(
      `User ${currentUser.userId} updated medication ${id} in client ${existingMedication.clientId}`,
    );

    return {
      success: true,
      data: updatedMedication,
      message: 'Medication updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateMedication service:', error);
    throw error;
  }
}

/**
 * Delete medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete medications
 */
export async function deleteMedication(req: ExtendedRequest<any> & { params: { medicationId: string } }): Promise<MedicationResponse> {
  try {
    const { medicationId } = req.params;
    const currentUser = getCurrentUser(req);

    // Validate medication ID
    const id = parseInt(medicationId);
    if (isNaN(id) || id <= 0) {
      throw createValidationError('Invalid medication ID format', [
        { field: 'medicationId', message: 'Medication ID must be a positive integer' },
      ]);
    }

    // Get existing medication from database
    const existingMedication = await getMedicationFromDatabase(id);

    if (!existingMedication) {
      throw createValidationError('Medication not found', [
        { field: 'medicationId', message: 'No medication found with the specified ID' },
      ]);
    }

    // Validate role-based access for medication deletion
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can delete any medication
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only delete medications in their own client
        if (existingMedication.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only delete medications in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot delete medications
        throw createAuthorizationError(
          `${userRole} role is not authorized to delete medications`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request using existing medication's client
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      id,
      existingMedication.clientId,
      null,
      null,
      RequestUserAction.userDelete, // Using userDelete as medication deletion action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to delete medication ${id} in client ${existingMedication.clientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to delete this medication');
    }

    // Delete medication from database (mock implementation for now)
    await deleteMedicationFromDatabase(id);

    logger.info(
      `User ${currentUser.userId} deleted medication ${id} from client ${existingMedication.clientId}`,
    );

    return {
      success: true,
      data: { id },
      message: 'Medication deleted successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in deleteMedication service:', error);
    throw error;
  }
}

/**
 * Search medications with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
export async function searchMedications(req: ExtendedRequest<any>): Promise<MedicationResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { q, category } = req.query;

    if (!q && !category) {
      throw createValidationError('Search criteria required', [
        { field: 'query', message: 'Search query or category is required' },
      ]);
    }

    // Determine client scope
    const targetClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can search medications from any client
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only search medications in their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only search medications in their own organization`,
          );
        }
        break;

      case CoreRole.PATIENT:
        // Patients cannot search medication catalogs
        throw createAuthorizationError('PATIENT role is not authorized to search medication catalogs');

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
        `User ${currentUser.userId} denied access to search medications in client ${targetClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only search medications within your organization');
    }

    // Search medications in database (mock implementation for now)
    const medications = await searchMedicationsInDatabase(q as string, category as string, targetClientId);

    return {
      success: true,
      data: medications,
      message: 'Search results retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in searchMedications service:', error);
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

async function getMedicationsFromDatabase(filters: GetMedicationsFilters): Promise<any[]> {
  // TODO: Replace with actual database query that includes clientId filtering
  // For now, return mock data with clientId
  return [
    {
      id: 1,
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      description: 'Anti-inflammatory pain reliever',
      dosage: '200mg',
      frequency: 'Every 6 hours',
      type: 'Tablet',
      category: 'NSAID',
      clientId: filters.clientId,
      sideEffects: ['Stomach upset', 'Dizziness'],
      contraindications: ['Kidney disease', 'Stomach ulcers'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Acetaminophen',
      genericName: 'Acetaminophen',
      brandName: 'Tylenol',
      description: 'Pain reliever and fever reducer',
      dosage: '500mg',
      frequency: 'Every 4-6 hours',
      type: 'Tablet',
      category: 'Analgesic',
      clientId: filters.clientId,
      sideEffects: ['Rare allergic reactions'],
      contraindications: ['Liver disease'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ].filter(med => med.clientId === filters.clientId);
}

async function getMedicationFromDatabase(id: number): Promise<MedicationData | null> {
  // TODO: Replace with actual database query that includes clientId
  // For now, return mock data
  const mockMedications = [
    {
      id: 1,
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      description: 'Anti-inflammatory pain reliever',
      dosage: '200mg',
      frequency: 'Every 6 hours',
      type: 'Tablet',
      category: 'NSAID',
      clientId: 1, // Mock clientId
      sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
      contraindications: ['Kidney disease', 'Stomach ulcers', 'Heart disease'],
      interactions: ['Blood thinners', 'ACE inhibitors'],
      instructions: [
        'Take with food to reduce stomach upset',
        'Do not exceed 1200mg in 24 hours',
        'Discontinue if rash appears',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return mockMedications.find(med => med.id === id) || null;
}

async function createMedicationInDatabase(medicationData: MedicationData): Promise<MedicationData> {
  // TODO: Replace with actual database creation
  // For now, return mock data with generated ID
  return {
    ...medicationData,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function updateMedicationInDatabase(id: number, updateData: Partial<MedicationData>): Promise<MedicationData> {
  // TODO: Replace with actual database update
  // For now, return mock updated data
  const existing = await getMedicationFromDatabase(id);
  return {
    ...existing!,
    ...updateData,
    id,
    updatedAt: new Date().toISOString(),
  };
}

async function deleteMedicationFromDatabase(id: number): Promise<void> {
  // TODO: Replace with actual database deletion
  // For now, just log the deletion
  logger.info(`Mock deletion of medication ${id}`);
}

async function searchMedicationsInDatabase(query: string, category: string, clientId: number): Promise<any[]> {
  // TODO: Replace with actual database search that includes clientId filtering
  // For now, return filtered mock data
  const mockMedications = [
    {
      id: 1,
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      category: 'NSAID',
      dosage: '200mg',
      clientId: clientId,
    },
  ];

  return mockMedications.filter(med => med.clientId === clientId);
}
