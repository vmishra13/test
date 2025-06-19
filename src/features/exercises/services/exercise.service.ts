import logger from '@config/logger';
import { getCurrentUser, getCurrentUserPrimaryRole, createAuthRequest, performAuthorization } from '@features/auth';
import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
} from '@features/users/types/extended-request';
import { CoreRole } from '@shared/constants/roles';
import { createAuthorizationError, createValidationError } from '@shared/errors/application-error';

// Exercise types and interfaces
export interface ExerciseData {
  id?: number;
  node_type: string;
  name: string;
  description: string;
  procedure: string[];
  media_type: string;
  media_url?: string;
  frequency: string;
  unit: string;
  value: number;
  repetition: number;
  clientId: number;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExerciseResponse {
  success: boolean;
  data: ExerciseData | ExerciseData[] | null;
  message: string;
  timestamp: string;
}

export interface GetExercisesFilters {
  page?: number;
  limit?: number;
  search?: string;
  frequency?: string;
  clientId: number;
}

// Mock database functions - TO BE REPLACED WITH ACTUAL DATABASE
async function getExercisesFromDatabase(filters: GetExercisesFilters): Promise<ExerciseData[]> {
  // TODO: Replace with actual database query
  logger.warn('Exercise database not yet implemented - returning mock data');
  
  const mockExercises: ExerciseData[] = [
    {
      id: 1,
      node_type: 'Exercise',
      name: 'Ankle Pumps',
      description: 'Simple ankle flexion and extension exercise for post-operative recovery',
      procedure: [
        'Sit or lie down comfortably',
        'Point toes away from you',
        'Flex toes back toward you',
        'Repeat for prescribed repetitions'
      ],
      media_type: 'video',
      media_url: 'https://example.com/videos/ankle-pumps.mp4',
      frequency: 'daily',
      unit: 'Set',
      value: 3,
      repetition: 15,
      clientId: filters.clientId
    },
    {
      id: 2,
      node_type: 'Exercise',
      name: 'Quad Sets',
      description: 'Quadriceps strengthening exercise for muscle activation',
      procedure: [
        'Lie flat with leg extended',
        'Tighten thigh muscles',
        'Hold for 5 seconds',
        'Relax and repeat'
      ],
      media_type: 'video',
      media_url: 'https://example.com/videos/quad-sets.mp4',
      frequency: 'daily',
      unit: 'Set',
      value: 2,
      repetition: 10,
      clientId: filters.clientId
    }
  ].filter(exercise => 
    exercise.clientId === filters.clientId &&
    (!filters.search || exercise.name.toLowerCase().includes(filters.search.toLowerCase())) &&
    (!filters.frequency || exercise.frequency === filters.frequency)
  );

  return mockExercises;
}

async function getExerciseByIdFromDatabase(exerciseId: number, clientId: number): Promise<ExerciseData | null> {
  // TODO: Replace with actual database query
  logger.warn('Exercise database not yet implemented - returning mock data');
  
  const exercises = await getExercisesFromDatabase({ clientId });
  return exercises.find(exercise => exercise.id === exerciseId) || null;
}

async function createExerciseInDatabase(exerciseData: ExerciseData): Promise<ExerciseData> {
  // TODO: Replace with actual database query
  logger.warn('Exercise database not yet implemented - returning mock data');
  
  const newExercise: ExerciseData = {
    ...exerciseData,
    id: Date.now(), // Mock ID generation
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return newExercise;
}

async function updateExerciseInDatabase(exerciseId: number, clientId: number, updateData: Partial<ExerciseData>): Promise<ExerciseData | null> {
  // TODO: Replace with actual database query
  logger.warn('Exercise database not yet implemented - returning mock data');
  
  const existingExercise = await getExerciseByIdFromDatabase(exerciseId, clientId);
  if (!existingExercise) {
    return null;
  }

  const updatedExercise: ExerciseData = {
    ...existingExercise,
    ...updateData,
    updatedAt: new Date(),
  };

  return updatedExercise;
}

async function deleteExerciseFromDatabase(exerciseId: number, clientId: number): Promise<boolean> {
  // TODO: Replace with actual database query
  logger.warn('Exercise database not yet implemented - returning mock response');
  
  const existingExercise = await getExerciseByIdFromDatabase(exerciseId, clientId);
  return !!existingExercise;
}

/**
 * Get exercises with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to exercises within same client or SuperAdmin cross-client access
 */
export async function getExercises(req: ExtendedRequest<any>): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const frequency = req.query.frequency as string;
    const requestedClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific exercise ID for listing
      requestedClientId,
      null,
      null,
      RequestUserAction.userView, // Using userView as exercise viewing action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to exercises in client ${requestedClientId} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view exercises within your organization');
    }

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    let filters: GetExercisesFilters = {
      page,
      limit,
      search,
      frequency,
      clientId: requestedClientId,
    };

    // Enforce role-based restrictions
    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can see exercises from any client
        if (req.query.clientId) {
          filters.clientId = parseInt(req.query.clientId as string);
        }
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
        // These roles can only see exercises in their own client
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only view exercises in their own organization`,
          );
        }
        filters.clientId = currentUser.clientId;
        break;

      case CoreRole.PATIENT:
        // Patients can view exercises (for their care plans)
        if (requestedClientId !== currentUser.clientId) {
          throw createAuthorizationError('PATIENT can only view exercises in their own organization');
        }
        filters.clientId = currentUser.clientId;
        break;

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Get exercises from database
    const exercises = await getExercisesFromDatabase(filters);

    return {
      success: true,
      data: exercises,
      message: 'Exercises retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getExercises service:', error);
    throw error;
  }
}

/**
 * Get exercise by ID with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to exercises within same client or SuperAdmin cross-client access
 */
export async function getExerciseById(req: ExtendedRequest<any> & { params: { exerciseId: string } }): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { exerciseId } = req.params;

    if (!exerciseId) {
      throw createValidationError('Exercise ID is required', [
        { field: 'exerciseId', message: 'Exercise ID parameter is required' },
      ]);
    }

    const exerciseIdNum = parseInt(exerciseId);
    if (isNaN(exerciseIdNum)) {
      throw createValidationError('Invalid exercise ID format', [
        { field: 'exerciseId', message: 'Exercise ID must be a valid number' },
      ]);
    }

    // First get the exercise to determine its client
    const exercise = await getExerciseByIdFromDatabase(exerciseIdNum, currentUser.clientId);
    if (!exercise) {
      throw createAuthorizationError('Exercise not found');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      exercise.clientId,
      null,
      null,
      RequestUserAction.userView,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied access to exercise ${exerciseIdNum} - Client isolation enforced`,
      );
      throw createAuthorizationError('Access denied - You can only view exercises within your organization');
    }

    return {
      success: true,
      data: exercise,
      message: 'Exercise retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in getExerciseById service:', error);
    throw error;
  }
}

/**
 * Create exercise with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create exercises
 */
export async function createExercise(req: ExtendedRequest<any>): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const exerciseData: Partial<ExerciseData> = req.body;

    // Validate required fields
    if (!exerciseData.name || !exerciseData.description) {
      throw createValidationError('Missing required fields', [
        { field: 'name', message: 'Exercise name is required' },
        { field: 'description', message: 'Description is required' },
      ]);
    }

    // Determine target client ID
    const targetClientId = exerciseData.clientId || currentUser.clientId;

    // Validate role-based access for exercise creation
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can create exercises for any client
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only create exercises for their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only create exercises for their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot create exercises
        throw createAuthorizationError(
          `${userRole} role is not authorized to create exercises`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null, // No specific exercise ID for creation
      targetClientId,
      null,
      null,
      RequestUserAction.userAdd, // Using userAdd as exercise creation action
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to create exercise in client ${targetClientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to create exercises');
    }

    // Prepare exercise data with client assignment and audit fields
    const newExerciseData: ExerciseData = {
      node_type: 'Exercise',
      name: exerciseData.name!,
      description: exerciseData.description!,
      procedure: exerciseData.procedure || [],
      media_type: exerciseData.media_type || 'video',
      media_url: exerciseData.media_url,
      frequency: exerciseData.frequency || 'daily',
      unit: exerciseData.unit || 'Set',
      value: exerciseData.value || 1,
      repetition: exerciseData.repetition || 0,
      clientId: targetClientId,
      createdBy: currentUser.userId,
    };

    // Create exercise in database
    const createdExercise = await createExerciseInDatabase(newExerciseData);

    return {
      success: true,
      data: createdExercise,
      message: 'Exercise created successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in createExercise service:', error);
    throw error;
  }
}

/**
 * Update exercise with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update exercises
 */
export async function updateExercise(req: ExtendedRequest<any> & { params: { exerciseId: string } }): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { exerciseId } = req.params;
    const updateData: Partial<ExerciseData> = req.body;

    if (!exerciseId) {
      throw createValidationError('Exercise ID is required', [
        { field: 'exerciseId', message: 'Exercise ID parameter is required' },
      ]);
    }

    const exerciseIdNum = parseInt(exerciseId);
    if (isNaN(exerciseIdNum)) {
      throw createValidationError('Invalid exercise ID format', [
        { field: 'exerciseId', message: 'Exercise ID must be a valid number' },
      ]);
    }

    // Get existing exercise first
    const existingExercise = await getExerciseByIdFromDatabase(exerciseIdNum, currentUser.clientId);
    if (!existingExercise) {
      throw createValidationError('Exercise not found', [
        { field: 'exerciseId', message: 'No exercise found with the specified ID' },
      ]);
    }

    // Validate role-based access for exercise updates
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can update any exercise
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only update exercises in their own client
        if (existingExercise.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only update exercises in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot update exercises
        throw createAuthorizationError(
          `${userRole} role is not authorized to update exercises`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      existingExercise.clientId,
      null,
      null,
      RequestUserAction.userEdit,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to update exercise ${exerciseIdNum} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to update this exercise');
    }

    // Update exercise in database
    const updatedExercise = await updateExerciseInDatabase(exerciseIdNum, existingExercise.clientId, updateData);

    if (!updatedExercise) {
      throw createValidationError('Failed to update exercise', [
        { field: 'exerciseId', message: 'Exercise update operation failed' },
      ]);
    }

    return {
      success: true,
      data: updatedExercise,
      message: 'Exercise updated successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in updateExercise service:', error);
    throw error;
  }
}

/**
 * Delete exercise with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete exercises
 */
export async function deleteExercise(req: ExtendedRequest<any> & { params: { exerciseId: string } }): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { exerciseId } = req.params;

    if (!exerciseId) {
      throw createValidationError('Exercise ID is required', [
        { field: 'exerciseId', message: 'Exercise ID parameter is required' },
      ]);
    }

    const exerciseIdNum = parseInt(exerciseId);
    if (isNaN(exerciseIdNum)) {
      throw createValidationError('Invalid exercise ID format', [
        { field: 'exerciseId', message: 'Exercise ID must be a valid number' },
      ]);
    }

    // Get existing exercise first
    const existingExercise = await getExerciseByIdFromDatabase(exerciseIdNum, currentUser.clientId);
    if (!existingExercise) {
      throw createValidationError('Exercise not found', [
        { field: 'exerciseId', message: 'No exercise found with the specified ID' },
      ]);
    }

    // Validate role-based access for exercise deletion
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can delete any exercise
        break;

      case CoreRole.CLIENT_ADMIN:
        // CLIENT_ADMIN can only delete exercises in their own client
        if (existingExercise.clientId !== currentUser.clientId) {
          throw createAuthorizationError(
            'CLIENT_ADMIN can only delete exercises in their own organization',
          );
        }
        break;

      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles cannot delete exercises
        throw createAuthorizationError(
          `${userRole} role is not authorized to delete exercises`,
        );

      default:
        throw createAuthorizationError('Invalid or unsupported user role');
    }

    // Create authorization request
    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      null,
      existingExercise.clientId,
      null,
      null,
      RequestUserAction.userDelete,
    );

    const hasPermission = performAuthorization(oAuthReq);

    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} denied permission to delete exercise ${exerciseIdNum} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to delete this exercise');
    }

    // Delete exercise from database
    const deleted = await deleteExerciseFromDatabase(exerciseIdNum, existingExercise.clientId);

    if (!deleted) {
      throw createValidationError('Failed to delete exercise', [
        { field: 'exerciseId', message: 'Exercise deletion operation failed' },
      ]);
    }

    return {
      success: true,
      data: null,
      message: 'Exercise deleted successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in deleteExercise service:', error);
    throw error;
  }
}

/**
 * Search exercises with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
export async function searchExercises(req: ExtendedRequest<any>): Promise<ExerciseResponse> {
  try {
    const currentUser = getCurrentUser(req);
    const { q, frequency, category } = req.query;

    if (!q && !frequency && !category) {
      throw createValidationError('Search criteria required', [
        { field: 'query', message: 'Search query, frequency, or category is required' },
      ]);
    }

    // Determine client scope
    const targetClientId = req.query.clientId ? parseInt(req.query.clientId as string) : currentUser.clientId;

    // Validate role-based access
    const userRole = getCurrentUserPrimaryRole(currentUser.roles);

    switch (userRole) {
      case CoreRole.SUPER_ADMIN:
        // SuperAdmin can search exercises from any client
        break;

      case CoreRole.CLIENT_ADMIN:
      case CoreRole.CLINICAL_STAFF:
      case CoreRole.OFFICE_STAFF:
      case CoreRole.PATIENT:
        // These roles can only search exercises in their own client
        if (targetClientId !== currentUser.clientId) {
          throw createAuthorizationError(
            `${userRole} can only search exercises in their own organization`,
          );
        }
        break;

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
        `User ${currentUser.userId} denied permission to search exercises in client ${targetClientId} - Authorization failed`,
      );
      throw createAuthorizationError('Access denied - Insufficient permissions to search exercises');
    }

    // Build search filters
    const filters: GetExercisesFilters = {
      search: q as string,
      frequency: frequency as string,
      clientId: targetClientId,
    };

    // Get exercises from database
    const exercises = await getExercisesFromDatabase(filters);

    return {
      success: true,
      data: exercises,
      message: `Exercise search completed successfully`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error in searchExercises service:', error);
    throw error;
  }
}
