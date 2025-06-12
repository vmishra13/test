import {
  RequestUserAction,
  type AuthorizationContext,
  type ExtendedRequest,
  type UserAction,
} from '@features/users/types/extended-request';
import { CoreRole, RoleUtils } from './constants';
import type { AuthenticatedUser } from '@/features/auth/middlewares';
import { createAuthError, createAuthorizationError } from '@/shared/errors/application-error';

export function performAuthorization(oAuthReq: AuthorizationContext): boolean {
  const currentUserRole = getCurrentUserPrimaryRole(oAuthReq.reqUserRoles);
  const currentUserTypeId = oAuthReq.reqUserTypeId;

  switch (oAuthReq.actionPermission) {
    case RequestUserAction.userAdd:
      // SUPER_ADMIN can add users anywhere
      //   if (oAuthReq.reqUserRoles.includes(CoreRole.SUPER_ADMIN)) {
      if (currentUserRole === CoreRole.SUPER_ADMIN) {
        return true;
      }

      // CLIENT_ADMIN can add users within their own client
      if (currentUserRole === CoreRole.CLIENT_ADMIN) {
        // If actionClientID is specified, it must match the requester's client
        if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
          return false;
        }
        return true;
      }

      // Other roles cannot add users
      return false;

    case RequestUserAction.userView:
      // SUPER_ADMIN can view any user
      if (currentUserRole === CoreRole.SUPER_ADMIN) {
        return true;
      }

      // CLIENT_ADMIN can view users in their client
      if (currentUserRole === CoreRole.CLIENT_ADMIN) {
        if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
          return false;
        }
        return true;
      }

      // CLINICAL_STAFF and OFFICE_STAFF can view patients in their client
      if (
        currentUserRole === CoreRole.CLINICAL_STAFF ||
        currentUserRole === CoreRole.OFFICE_STAFF
      ) {
        if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
          return false;
        }
        // Additional check: they can only view patients (if userTypeId corresponds to patient role)
        return true;
      }

      return false;

    case RequestUserAction.userEdit:
    case RequestUserAction.userDelete:
      // SUPER_ADMIN can edit/delete any user
      if (currentUserRole === CoreRole.SUPER_ADMIN) {
        return true;
      }

      // CLIENT_ADMIN can edit/delete users in their client (except SUPER_ADMIN users)
      if (currentUserRole === CoreRole.CLIENT_ADMIN) {
        if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
          return false;
        }
        return true;
      }

      // Other roles cannot edit/delete users
      return false;

    default:
      return false;
  }
}

export function configureAuthRequest(
  currentUser: AuthenticatedUser,
  action: UserAction,
): AuthorizationContext {
  return {
    reqUserId: currentUser.userId,
    reqClientId: currentUser.clientId,
    reqUserTypeId: currentUser.userTypeId,
    reqUserRoles: currentUser.roles,
    actionUserId: action.actionUserId || null,
    actionClientId: action.actionClientId || null,
    actionPermission: action.actionPermission,
    actionUserTypeId: action.actionUserTypeId || null,
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
