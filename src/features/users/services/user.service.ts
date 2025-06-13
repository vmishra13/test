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
  // ExtendedGetUsersRequest,
  RequestUserAction,
  // UserRetrievalAction,
  type AuthRequest,
  type ExtendedRequest,
  // type UserAction,
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
  getCurrentUserPrimaryRole,
} from '@shared/authorization';
import { get } from 'http';

export async function getUsers(req: ExtendedRequest<UserQuery>): Promise<GetUsersResponse> {
  try {
    const currentUser = getCurrentUser(req);
    // const currentUser = req.user as AuthenticatedUser;

    // const action: UserAction = {
    //   actionUserId: null,
    // actionClientId: req?.query?.clientId
    //   ? parseInt(req?.query.clientId as string)
    //   : currentUser.clientId,
    //   actionUserTypeId: null,
    // actionPermission: RequestUserAction.userView, // Specific permission
    // };

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

    // const extendedReq = retrieveAction(req as unknown as ExtendedGetUsersRequest, currentUser);

    // 3. Check authorization for the specific action
    if (!hasPermission) {
      logger.error(
        `User ${currentUser.userId} does not have permission to view users in client ${actionClientId}`,
      );
      throw createAuthorizationError('You do not have permission to perform this action');
    }

    // 4. Validate query parameters using Zod
    const queryParams = validateQueryParameters(req.query);

    return await getUsersList(queryParams, currentUser.roles, currentUser.clientId);
  } catch (error: any) {
    logger.error('Error in getUsers service:', error);
    throw error;
  }
}

/**
 * Determine what type of user retrieval is being requested
 */
// function retrieveAction(
//   req: ExtendedGetUsersRequest,
//   currentUser: AuthenticatedUser,
// ): ExtendedGetUsersRequest {
//   // Get current user's primary role (highest privilege)
//   const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

//   // Determine action based on user role
//   switch (currentUserRole) {
//     case CoreRole.SUPER_ADMIN:
//       req.action = UserRetrievalAction.VIEW_ALL_USERS;
//       break;

//     case CoreRole.CLIENT_ADMIN:
//       req.action = UserRetrievalAction.VIEW_CLIENT_USERS;
//       break;

//     case CoreRole.CLINICAL_STAFF:
//     case CoreRole.OFFICE_STAFF:
//       req.action = UserRetrievalAction.VIEW_CLIENT_PATIENTS;
//       break;

//     default:
//       throw createAuthorizationError('No valid permission for viewing users');
//   }

//   return req;
// }

/**
 * Check authorization based on the retrieval action
 */
// function performAuthorization(req: ExtendedGetUsersRequest): void {
//   const currentUser = req.user;
//   const requestedClientId = currentUser.clientId;
//   const requestedRole = req.query.role;

//   // Get current user's primary role
//   const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

//   switch (req.action) {
//     case "userAdd":
//       if (){

//       } else {

//       }
//       return true;
//     case UserRetrievalAction.VIEW_ALL_USERS:
//       // Rule 1: SUPER_ADMIN can view all users
//       if (currentUserRole !== CoreRole.SUPER_ADMIN) {
//         throw createAuthorizationError('Only SUPER_ADMIN can view all users');
//       }
//       break;

//     case UserRetrievalAction.VIEW_CLIENT_USERS:
//       // Rule 2: CLIENT_ADMIN can view all users inside their client
//       if (currentUserRole !== CoreRole.CLIENT_ADMIN) {
//         throw createAuthorizationError('Only CLIENT_ADMIN can view client users');
//       }

//       // If clientId specified in query, it must match user's client
//       if (requestedClientId && currentUser.clientId !== requestedClientId) {
//         throw createAuthorizationError(
//           'CLIENT_ADMIN can only view users in their own organization',
//         );
//       }
//       break;

//     case UserRetrievalAction.VIEW_CLIENT_PATIENTS:
//       // Rule 3 & 4: CLINICAL_STAFF and OFFICE_STAFF can view all PATIENT inside their client
//       if (
//         currentUserRole !== CoreRole.CLINICAL_STAFF &&
//         currentUserRole !== CoreRole.OFFICE_STAFF
//       ) {
//         throw createAuthorizationError('Only CLINICAL_STAFF and OFFICE_STAFF can view patients');
//       }

//       // If clientId specified in query, it must match user's client
//       if (requestedClientId && currentUser.clientId !== requestedClientId) {
//         throw createAuthorizationError(
//           `${currentUserRole} can only view patients in their own organization`,
//         );
//       }

//       // ✅ CLINICAL_STAFF/OFFICE_STAFF can only view patients
//       if (requestedRole && requestedRole !== CoreRole.PATIENT) {
//         throw createAuthorizationError(`${currentUserRole} can only view PATIENT accounts`);
//       }
//       break;

//     default:
//       throw createAuthorizationError('Invalid user retrieval action specified');
//   }

//   // ✅ MOVED: Additional business rule validation (now part of authorization)
//   validateUserViewPermissions(
//     currentUserRole,
//     requestedRole,
//     requestedClientId,
//     currentUser.clientId,
//   );
// }

/**
 * Validate query parameters using Zod - replaces manual validation
 */
function validateQueryParameters(query: UserQuery) {
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
