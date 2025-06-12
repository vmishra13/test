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
import { ExtendedGetUsersRequest, UserRetrievalAction } from '../types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';

export async function getUsers(req: Request): Promise<GetUsersResponse> {
  // 1. Check authentication
  const currentUser = checkAuthentication(req);

  // 2. Determine retrieval action based on user role
  const extendedReq = retrieveAction(req as unknown as ExtendedGetUsersRequest, currentUser);

  // 3. Check authorization for the specific action
  performAuthorization(extendedReq);

  // 4. Validate query parameters using Zod
  const queryParams = validateQueryParameters(extendedReq.query);

  // 5. Perform user retrieval
  return await performUserRetrieval(queryParams, currentUser, extendedReq.action!);
}

/**
 * Check authentication (reuse from registration)
 */
function checkAuthentication(req: Request): AuthenticatedUser {
  const currentUser = req.user as AuthenticatedUser;
  if (!currentUser) {
    throw createAuthError('Authentication required');
  }
  return currentUser;
}

/**
 * Determine what type of user retrieval is being requested
 */
function retrieveAction(
  req: ExtendedGetUsersRequest,
  currentUser: AuthenticatedUser,
): ExtendedGetUsersRequest {
  // Get current user's primary role (highest privilege)
  const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

  // Determine action based on user role
  switch (currentUserRole) {
    case CoreRole.SUPER_ADMIN:
      req.action = UserRetrievalAction.VIEW_ALL_USERS;
      break;

    case CoreRole.CLIENT_ADMIN:
      req.action = UserRetrievalAction.VIEW_CLIENT_USERS;
      break;

    case CoreRole.CLINICAL_STAFF:
    case CoreRole.OFFICE_STAFF:
      req.action = UserRetrievalAction.VIEW_CLIENT_PATIENTS;
      break;

    default:
      throw createAuthorizationError('No valid permission for viewing users');
  }

  return req;
}

/**
 * Check authorization based on the retrieval action
 */
function performAuthorization(req: ExtendedGetUsersRequest): void {
  const currentUser = req.user;
  const requestedClientId = currentUser.clientId;
  const requestedRole = req.query.role;

  // Get current user's primary role
  const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

  switch (req.action) {
    case UserRetrievalAction.VIEW_ALL_USERS:
      // Rule 1: SUPER_ADMIN can view all users
      if (currentUserRole !== CoreRole.SUPER_ADMIN) {
        throw createAuthorizationError('Only SUPER_ADMIN can view all users');
      }
      break;

    case UserRetrievalAction.VIEW_CLIENT_USERS:
      // Rule 2: CLIENT_ADMIN can view all users inside their client
      if (currentUserRole !== CoreRole.CLIENT_ADMIN) {
        throw createAuthorizationError('Only CLIENT_ADMIN can view client users');
      }

      // If clientId specified in query, it must match user's client
      if (requestedClientId && currentUser.clientId !== requestedClientId) {
        throw createAuthorizationError(
          'CLIENT_ADMIN can only view users in their own organization',
        );
      }
      break;

    case UserRetrievalAction.VIEW_CLIENT_PATIENTS:
      // Rule 3 & 4: CLINICAL_STAFF and OFFICE_STAFF can view all PATIENT inside their client
      if (
        currentUserRole !== CoreRole.CLINICAL_STAFF &&
        currentUserRole !== CoreRole.OFFICE_STAFF
      ) {
        throw createAuthorizationError('Only CLINICAL_STAFF and OFFICE_STAFF can view patients');
      }

      // If clientId specified in query, it must match user's client
      if (requestedClientId && currentUser.clientId !== requestedClientId) {
        throw createAuthorizationError(
          `${currentUserRole} can only view patients in their own organization`,
        );
      }

      // ✅ CLINICAL_STAFF/OFFICE_STAFF can only view patients
      if (requestedRole && requestedRole !== CoreRole.PATIENT) {
        throw createAuthorizationError(`${currentUserRole} can only view PATIENT accounts`);
      }
      break;

    default:
      throw createAuthorizationError('Invalid user retrieval action specified');
  }

  // ✅ MOVED: Additional business rule validation (now part of authorization)
  validateUserViewPermissions(
    currentUserRole,
    requestedRole,
    requestedClientId,
    currentUser.clientId,
  );
}

/**
 * Get primary role (reuse from registration service)
 */
function getCurrentUserPrimaryRole(userRoles: string[]): CoreRole {
  const coreRoles = userRoles
    .filter(role => Object.values(CoreRole).includes(role as CoreRole))
    .map(role => role as CoreRole)
    .sort((a, b) => RoleUtils.getRoleLevel(b) - RoleUtils.getRoleLevel(a));

  if (coreRoles.length === 0) {
    throw createAuthorizationError('No valid roles found for current user');
  }

  return coreRoles[0];
}

/**
 * Validate query parameters using Zod - replaces manual validation
 */
function validateQueryParameters(query: ExtendedGetUsersRequest['query']): GetUsersQueryRequest {
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

/**
 * Perform user retrieval based on action
 */
async function performUserRetrieval(
  queryParams: GetUsersQueryRequest,
  currentUser: AuthenticatedUser,
  action: UserRetrievalAction,
): Promise<GetUsersResponse> {
  let filters: userRepository.GetUsersFilters = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 20,
    search: queryParams.search,
  };

  // Apply role-based filters
  switch (action) {
    case UserRetrievalAction.VIEW_ALL_USERS:
      // SUPER_ADMIN: Can view all users, optionally filter by client
      if (queryParams.clientId) {
        filters.clientId = queryParams.clientId;
      }
      if (queryParams.role) {
        filters.role = queryParams.role;
      }
      if (queryParams.status) {
        filters.status = queryParams.status.toString();
      }
      break;

    case UserRetrievalAction.VIEW_CLIENT_USERS:
      // CLIENT_ADMIN: View users in their client only
      filters.clientId = currentUser.clientId;
      // Exclude SUPER_ADMIN from results
      filters.excludeRoles = [CoreRole.SUPER_ADMIN];
      if (queryParams.role) {
        filters.role = queryParams.role;
      }
      if (queryParams.status) {
        filters.status = queryParams.status.toString();
      }
      break;

    case UserRetrievalAction.VIEW_CLIENT_PATIENTS:
      // CLINICAL_STAFF & OFFICE_STAFF: View patients in their client only
      filters.clientId = currentUser.clientId;
      filters.role = CoreRole.PATIENT; // Only patients
      if (queryParams.status) {
        filters.status = queryParams.status.toString();
      }
      break;
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
