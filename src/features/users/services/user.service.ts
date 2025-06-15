import { Request } from 'express';
import { CoreRole, RoleUtils } from '@shared/constants';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import type { GetUsersResponse } from '../dto/user.dto';
import {
  getUsersQuerySchema,
  validateUserViewPermissions,
  type GetUsersQueryRequest,
} from '../validators/user.validators';
import * as userRepository from '../repositories/user.repository';
import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
  type UserQuery,
} from '../types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';
import logger from '@/config/logger';
import {
  getCurrentUser,
  createAuthRequest,
  performAuthorization,
} from '@shared/authorization';

export async function getUsers(req: ExtendedRequest<UserQuery>): Promise<GetUsersResponse> {
  try {
    const currentUser = getCurrentUser(req);

    const actionUserId = null; // No specific user ID for view action
    const actionClientId = req.query.clientId ? parseInt(req.query.clientId) : currentUser.clientId;
    const actionUserTypeId = null; // No specific user type ID for view action
    const actionPermission = RequestUserAction.userView; // Specific permission for viewing users

    const oAuthReq: AuthRequest = createAuthRequest(
      currentUser,
      actionUserId,
      actionClientId,
      actionUserTypeId,
      actionPermission,
    );

    const hasPermission = performAuthorization(oAuthReq);

    // Check authorization for the specific action
    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} does not have permission to view users in client ${actionClientId}`,
      );
      throw createAuthorizationError('You do not have permission to perform this action');
    }

    // Validate query parameters using Zod
    const queryParams = validateQueryParameters(req.query);

    // Get users list based on validated params and current user context
    return await getUsersList(queryParams, currentUser.roles, currentUser.clientId);
  } catch (error: any) {
    logger.error('Error in getUsers service:', error);
    throw error;
  }
}

/**
 * Validate query parameters using Zod - replaces manual validation
 */
function validateQueryParameters(query: any): GetUsersQueryRequest {
  try {
    // Use Zod schema for validation
    const validatedQuery = getUsersQuerySchema.parse(query);
    return validatedQuery;
  } catch (error: any) {
    if (error.errors) {
      // Zod validation errors
      throw createValidationError(
        'Invalid query parameters',
        error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      );
    }

    // Other validation errors
    throw createValidationError('Query validation failed', [
      { field: 'query', message: error.message },
    ]);
  }
}

async function getUsersList(
  queryParams: GetUsersQueryRequest,
  currentUserRoles: CoreRole[],
  currentUserClientId: number,
): Promise<GetUsersResponse> {
  // Validate clientId if provided
  let requestedClientId: number | undefined;
  if (queryParams.clientId) {
    requestedClientId = queryParams.clientId;
    if (isNaN(requestedClientId) || requestedClientId <= 0) {
      throw createValidationError('Invalid client ID format', [
        { field: 'clientId', message: 'Client ID must be a positive integer' },
      ]);
    }
  }

  const currentUserRole = getCurrentUserPrimaryRole(currentUserRoles);

  const statusFilter = queryParams.status?.toString();
  const roleFilter = queryParams.role;

  let filters: userRepository.GetUsersFilters = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 20,
    search: queryParams.search,
    sort: queryParams.sort || 'asc',
  };

  switch (currentUserRole) {
    case CoreRole.SUPER_ADMIN:
      // Rule 1: SUPER_ADMIN can view all users irrespective of client
      if (requestedClientId) {
        filters.clientId = requestedClientId;
      }
      // Apply optional filters
      if (roleFilter) {
        filters.role = roleFilter;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      break;

    case CoreRole.CLIENT_ADMIN:
      // Rule 2: CLIENT_ADMIN can only view users in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
        throw createAuthorizationError(
          'CLIENT_ADMIN can only view users in their own organization',
        );
      }

      // Force filter to current user's client
      filters.clientId = currentUserClientId;

      // Exclude SUPER_ADMIN from results (business rule)
      filters.excludeRoles = [CoreRole.SUPER_ADMIN];

      // Apply optional filters
      if (roleFilter) {
        filters.role = roleFilter;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      break;

    case CoreRole.CLINICAL_STAFF:
    case CoreRole.OFFICE_STAFF:
      // Rule 3: CLINICAL_STAFF/OFFICE_STAFF can only view patients in their own client
      if (requestedClientId && requestedClientId !== currentUserClientId) {
        throw createAuthorizationError(
          `${currentUserRole} can only view patients in their own organization`,
        );
      }

      // Force filter to current user's client and patients only
      filters.clientId = currentUserClientId;
      filters.role = CoreRole.PATIENT;

      // Apply optional status filter
      if (statusFilter) {
        filters.status = statusFilter;
      }

      // Ignore role filter from query since they can only see patients
      break;

    case CoreRole.PATIENT:
      // PATIENT role cannot view user lists
      throw createAuthorizationError('PATIENT role is not authorized to view user lists');

    default:
      throw createAuthorizationError('Invalid or unsupported user role');
  }

  try {
    // Get users from repository
    const result = await userRepository.getUsersWithFilters(filters);

    return {
      success: true,
      data: {
        users: result.users.map(user => ({
          id: user.id,
          loginName: user.loginName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          roles: user.roles.map(role => role.name),
          client: {
            id: user.client.id,
            name: user.client.name,
          },
          userType: {
            id: user.userType.id,
            name: user.userType.name,
          },
          crDate: user.crDate.toISOString(),
        })),
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
        },
        filters: {
          clientId: filters.clientId,
          role: filters.role,
          status: filters.status,
        },
      },
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
}

function getCurrentUserPrimaryRole(roles: string[]): string {
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

