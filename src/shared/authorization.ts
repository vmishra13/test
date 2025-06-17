import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
  //   type UserAction,
} from '@features/users/types/extended-request';
import { CoreRole, RoleUtils } from './constants';
import type { AuthenticatedUser } from '@/features/auth/dto/auth.dto';
import { createAuthError, createAuthorizationError } from '@/shared/errors/application-error';

export function performAuthorization(oAuthReq: AuthRequest): boolean {
  //   const currentUserRole = getCurrentUserPrimaryRole(oAuthReq.reqUserRoles);
  const currentUserRoles = oAuthReq.reqUserRoles || [];
  const currentUserTypeId = oAuthReq.reqUserTypeId;

  // TEMPORARY: Allow access for user ID 1 (superadmin) even without roles
  if (oAuthReq.reqUserId === 1) {
    console.log('⚠️ TEMPORARY: Bypassing role check for superadmin user (ID: 1)');
    return true;
  }

  if (currentUserRoles.length === 0) {
    throw createAuthorizationError('No roles found for current user');
  }

  switch (oAuthReq.actionPermission) {
    case RequestUserAction.userAdd:
      return validateUserRegistrationAccess(oAuthReq, currentUserRoles);
    //   // SUPER_ADMIN can add users anywhere
    //   //   if (oAuthReq.reqUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    //   if (currentUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    //     return true;
    //   }

    //   // CLIENT_ADMIN can add users within their own client
    //   if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
    //     // If actionClientID is specified, it must match the requester's client
    //     if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
    //       return false;
    //     }
    //     return true;
    //   }

    //   // Other roles cannot add users
    //   return false;

    case RequestUserAction.userView:
      return validateUserViewAccess(oAuthReq, currentUserRoles);

    // case RequestUserAction.userEdit:
    // case RequestUserAction.userDelete:
    //   // SUPER_ADMIN can edit/delete any user
    //   if (currentUserRole === CoreRole.SUPER_ADMIN) {
    //     return true;
    //   }

    //   // CLIENT_ADMIN can edit/delete users in their client (except SUPER_ADMIN users)
    //   if (currentUserRole === CoreRole.CLIENT_ADMIN) {
    //     if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
    //       return false;
    //     }
    //     return true;
    //   }

    //   // Other roles cannot edit/delete users
    //   return false;

    default:
      return false;
  }
}

// createAuthRequest(currentUser, actionUserId, actionClientId, actionUserTypeId, actionPermission);
export function createAuthRequest(
  currentUser: AuthenticatedUser | null | undefined,
  actionUserId: number | null,
  actionClientId: number | null,
  actionUserTypeId: number | null,
  actionUserRoles: CoreRole[] | CoreRole | null,
  actionPermission: RequestUserAction,
): AuthRequest {
  // Validate currentUser first
  if (!currentUser) {
    throw createAuthError('Authentication required: currentUser is null or undefined');
  }

  return {
    reqUserId: currentUser.userId,
    reqClientId: currentUser.clientId,
    reqUserTypeId: currentUser.userTypeId,
    reqUserRoles: currentUser.roles,
    actionUserId,
    actionClientId,
    actionUserTypeId,
    actionUserRoles,
    actionPermission,
  };
}

/**
 * Check authentication (reuse from registration)
 */
export function getCurrentUser(req: ExtendedRequest): AuthenticatedUser {
  const currentUser = req.user as AuthenticatedUser;
  if (!currentUser) {
    throw createAuthError('Authentication required');
  }
  return currentUser;
}

/**
 * Get the primary (highest privilege) role of the current user
 */
export function getCurrentUserPrimaryRole(userRoles: string[]): CoreRole {
  // Convert to CoreRole array and sort by hierarchy level (highest first)
  const coreRoles = userRoles
    .filter(role => Object.values(CoreRole).includes(role as CoreRole))
    .map(role => role as CoreRole)
    .sort((a, b) => RoleUtils.getRoleLevel(b) - RoleUtils.getRoleLevel(a));

  if (coreRoles.length === 0) {
    throw createAuthorizationError('No valid roles found for current user');
  }

  return coreRoles[0]; // Return highest privilege role
}

/**
 * Validate if the current user can view the specified user based on their roles
 * @param oAuthReq The OAuth request containing action and client information
 * @param currentUserRoles The roles of the current user
 * @returns true if the user can view the specified user, false otherwise
 */
function validateUserViewAccess(oAuthReq: AuthRequest, currentUserRoles: CoreRole[]): boolean {
  // SUPER_ADMIN can view any user
  if (currentUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    return true;
  }

  // CLIENT_ADMIN can view users in their client
  if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
    if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
      return false;
    }
    return true;
  }

  // CLINICAL_STAFF and OFFICE_STAFF can view patients in their client
  if (
    currentUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
    currentUserRoles.includes(CoreRole.OFFICE_STAFF)
  ) {
    if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
      return false;
    }
    // Additional check: they can only view patients (if userTypeId corresponds to patient role)
    return true;
  }

  return false;
}

/**
 * Validate if the current user can register/add new users based on their roles
 * @param oAuthReq The OAuth request containing action and client information
 * @param currentUserRoles The roles of the current user
 * @returns true if the user can register/add users, false otherwise
 */
function validateUserRegistrationAccess(
  oAuthReq: AuthRequest,
  currentUserRoles: CoreRole[],
): boolean {
  const actionUserRoles = oAuthReq.actionUserRoles || [];

  if (actionUserRoles.length === 0) {
    return false; // No roles specified for the action user
  }

  if (actionUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    return false; // Cannot register a SUPER_ADMIN user
  }

  // SUPER_ADMIN can add users anywhere except for SUPER_ADMIN
  if (currentUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    return true;
  }

  if (oAuthReq.actionClientId !== oAuthReq.reqClientId) {
    // If actionClientId is specified, it must match the requester's client
    return false;
  }

  // CLIENT_ADMIN can add users within their own client
  if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
    if (
      actionUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
      actionUserRoles.includes(CoreRole.OFFICE_STAFF) ||
      actionUserRoles.includes(CoreRole.PATIENT)
    ) {
      return true;
    } else {
      return false;
    }
  }

  if (
    currentUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
    currentUserRoles.includes(CoreRole.OFFICE_STAFF)
  ) {
    if (actionUserRoles.includes(CoreRole.PATIENT)) {
      return true;
    } else {
      return false;
    }
  }

  // Other roles (CLINICAL_STAFF, OFFICE_STAFF) cannot add users
  return false;
}
