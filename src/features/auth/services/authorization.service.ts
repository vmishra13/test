import {
  RequestUserAction,
  type AuthRequest,
  type ExtendedRequest,
  //   type UserAction,
} from '@features/users/types/extended-request';
import { CoreRole, RoleUtils } from '@shared/constants';
import type { AuthenticatedUser } from '@/features/auth/dto/auth.dto';
import { createAuthError, createAuthorizationError } from '@/shared/errors/application-error';
import logger from '@/config/logger';

export function performAuthorization(oAuthReq: AuthRequest): boolean {
  //   const currentUserRole = getCurrentUserPrimaryRole(oAuthReq.reqUserRoles);
  const currentUserRoles = oAuthReq.reqUserRoles || [];
  const currentUserTypeId = oAuthReq.reqUserTypeId || null;

  if (currentUserRoles.length === 0) {
    logger.error('❌ No roles found for current user');
    throw createAuthorizationError('No roles found for current user');
  }

  if (!currentUserTypeId || currentUserTypeId < 1 || currentUserTypeId > 5) {
    logger.error(
      `❌ Current user type ID is required and must be between 1 and 5, but got: ${currentUserTypeId}`,
    );
    throw createAuthorizationError('Current user type ID is required/incorrect for authorization');
  }

  switch (oAuthReq.actionPermission) {
    case RequestUserAction.userAdd:
      return validateUserRegistrationAccess(oAuthReq, currentUserRoles, currentUserTypeId);
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
      logger.error(`❌ Unknown action permission: ${oAuthReq.actionPermission}`);
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
    logger.error('❌ Authentication required: currentUser is null or undefined');
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
    logger.error('❌ Authentication required: currentUser is null or undefined');
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
      logger.error(
        `❌ CLIENT_ADMIN cannot view users in a different client: ${oAuthReq.actionClientId} !== ${oAuthReq.reqClientId}`,
      );
      return false;
    }
    return true;
  }

  // CLINICAL_STAFF and OFFICE_STAFF can view patients in their client
  if (
    currentUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
    currentUserRoles.includes(CoreRole.OFFICE_STAFF)
  ) {
    // First check client boundary
    if (oAuthReq.actionClientId && oAuthReq.actionClientId !== oAuthReq.reqClientId) {
      logger.error(
        `❌ CLINICAL_STAFF/OFFICE_STAFF cannot view users in a different client: ${oAuthReq.actionClientId} !== ${oAuthReq.reqClientId}`,
      );
      return false;
    }
    
    // CRITICAL: They can ONLY view PATIENT accounts (userTypeId = 5)
    if (oAuthReq.actionUserTypeId && oAuthReq.actionUserTypeId !== 5) {
      logger.error(
        `❌ CLINICAL_STAFF/OFFICE_STAFF can only view PATIENT accounts, attempted to view userTypeId: ${oAuthReq.actionUserTypeId}`,
      );
      return false;
    }
    
    // If no userTypeId provided, check actionUserRoles for PATIENT role
    if (oAuthReq.actionUserRoles) {
      const rolesArray = Array.isArray(oAuthReq.actionUserRoles) ? oAuthReq.actionUserRoles : [oAuthReq.actionUserRoles];
      if (!rolesArray.includes(CoreRole.PATIENT)) {
        logger.error(
          `❌ CLINICAL_STAFF/OFFICE_STAFF can only view users with PATIENT role, attempted roles: ${rolesArray.join(', ')}`,
        );
        return false;
      }
    }
    
    return true;
  }

  // PATIENT users can only view their own profile
  if (currentUserRoles.includes(CoreRole.PATIENT)) {
    // Patients can only view themselves
    if (oAuthReq.actionUserId !== oAuthReq.reqUserId) {
      logger.error(
        `❌ PATIENT can only view their own profile: ${oAuthReq.actionUserId} !== ${oAuthReq.reqUserId}`,
      );
      return false;
    }
    return true;
  }

  logger.error(`❌ Unauthorized user roles for viewing: ${currentUserRoles.join(', ')}`);
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
  currentUserTypeId: number,
): boolean {
  try {
    const actionUserRoles = oAuthReq.actionUserRoles || [];
    const actionUserTypeId = oAuthReq.actionUserTypeId || null;
    const actionUserClientId = oAuthReq.actionClientId || null;

    // actionUserTypeId = 1 stands for SUPER_ADMIN, 2 for CLIENT_ADMIN,
    // 3 for CLINICAL_STAFF, 4 for OFFICE_STAFF, and 5 for PATIENT
    if (
      actionUserRoles.length === 0 ||
      !actionUserTypeId ||
      actionUserTypeId < 1 ||
      actionUserTypeId > 5
    ) {
      logger.error(`Invalid actionUserRoles or actionUserTypeId`);
      return false;
    }

    // Step 1: Validate User Type to Role Compatibility
    if (!isValidUserTypeRoleCombination(actionUserTypeId, actionUserRoles as CoreRole[])) {
      logger.error('❌ Invalid user type and role combination');
      return false;
    }

    // Step 2: Check if current user can create the target user
    if (
      !canCurrentUserCreateTarget(
        currentUserTypeId,
        actionUserTypeId,
        actionUserRoles as CoreRole[],
        currentUserRoles as CoreRole[],
      )
    ) {
      logger.error('❌ Current user cannot create target user');
      return false;
    }

    // Step 3: Check client boundary restrictions
    if (!isClientAccessAllowed(currentUserTypeId, currentUserTypeId, actionUserClientId)) {
      logger.error('❌ Client boundary violation');
      return false;
    }

    return true;

    // if (actionUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    //   return false; // Cannot register a SUPER_ADMIN user
    // }

    // // SUPER_ADMIN can add users anywhere except for SUPER_ADMIN
    // if (currentUserRoles.includes(CoreRole.SUPER_ADMIN)) {
    //   return true;
    // }

    // if (oAuthReq.actionClientId !== oAuthReq.reqClientId) {
    //   // If actionClientId is specified, it must match the requester's client
    //   return false;
    // }

    // // CLIENT_ADMIN can add users within their own client
    // if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
    //   if (
    //     actionUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
    //     actionUserRoles.includes(CoreRole.OFFICE_STAFF) ||
    //     actionUserRoles.includes(CoreRole.PATIENT)
    //   ) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    // if (
    //   currentUserRoles.includes(CoreRole.CLINICAL_STAFF) ||
    //   currentUserRoles.includes(CoreRole.OFFICE_STAFF)
    // ) {
    //   if (actionUserRoles.includes(CoreRole.PATIENT)) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    // // Other roles (CLINICAL_STAFF, OFFICE_STAFF) cannot add users
    // return false;
  } catch (error) {
    logger.error(`Error validating user registration access`);
    return false;
  }
}

/**
 * Simple validation for user type and role combinations
 */
function isValidUserTypeRoleCombination(userTypeId: number, roles: CoreRole[]): boolean {
  // 1. actionUserTypeId 1 -> only SUPER_ADMIN role
  if (userTypeId === 1) {
    return roles.length === 1 && roles[0] === CoreRole.SUPER_ADMIN;
  }

  // 2. actionUserTypeId 2 -> only CLIENT_ADMIN role
  if (userTypeId === 2) {
    return roles.length === 1 && roles[0] === CoreRole.CLIENT_ADMIN;
  }

  // 3. actionUserTypeId 5 -> only PATIENT role
  if (userTypeId === 5) {
    return roles.length === 1 && roles[0] === CoreRole.PATIENT;
  }

  // 4. actionUserTypeId 3 -> CLINICAL_STAFF or [CLINICAL_STAFF, CLIENT_ADMIN]
  if (userTypeId === 3) {
    if (roles.length === 1) {
      return roles[0] === CoreRole.CLINICAL_STAFF;
    }
    if (roles.length === 2) {
      return roles.includes(CoreRole.CLINICAL_STAFF) && roles.includes(CoreRole.CLIENT_ADMIN);
    }
    logger.error(`❌ Invalid role combination for CLINICAL_STAFF: ${roles.join(', ')}`);
    return false;
  }

  // 5. actionUserTypeId 4 -> OFFICE_STAFF or [OFFICE_STAFF, CLIENT_ADMIN]
  if (userTypeId === 4) {
    if (roles.length === 1) {
      return roles[0] === CoreRole.OFFICE_STAFF;
    }
    if (roles.length === 2) {
      return roles.includes(CoreRole.OFFICE_STAFF) && roles.includes(CoreRole.CLIENT_ADMIN);
    }
    logger.error(`❌ Invalid role combination for OFFICE_STAFF: ${roles.join(', ')}`);
    return false;
  }

  logger.error(`❌ Unknown user type ID: ${userTypeId}`);
  return false;
}

/**
 * Simple check if current user can create target user
 */
function canCurrentUserCreateTarget(
  currentUserTypeId: number,
  actionUserTypeId: number,
  actionUserRoles: CoreRole[],
  currentUserRoles: CoreRole[],
): boolean {
  // 6. currentUserTypeId 1 (SYSTEM_ADMIN) -> can create any valid user
  if (currentUserTypeId === 1) {
    return true; // Already validated by isValidUserTypeRoleCombination
  }

  // 7. currentUserTypeId 2 (CLIENT_ADMIN) -> can create any valid user except SUPER_ADMIN
  if (currentUserTypeId === 2) {
    // Cannot create SUPER_ADMIN (userTypeId 1)
    if (actionUserTypeId === 1 || actionUserRoles.includes(CoreRole.SUPER_ADMIN)) {
      logger.error('❌ CLIENT_ADMIN cannot create SUPER_ADMIN user');
      return false;
    }
    return true; // Can create all other valid combinations
  }

  // 8. currentUserTypeId 3 (CLINICAL_USER) -> can create only PATIENT
  if (currentUserTypeId === 3) {
    if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
      // Same as rule 7: can create any valid user except SUPER_ADMIN
      if (actionUserTypeId === 1 || actionUserRoles.includes(CoreRole.SUPER_ADMIN)) {
        logger.error('❌ CLINICAL_USER cannot create SUPER_ADMIN user');
        return false;
      }
      return true; // Can create all other valid combinations
    }
    return (
      actionUserTypeId === 5 &&
      actionUserRoles.length === 1 &&
      actionUserRoles[0] === CoreRole.PATIENT
    );
  }

  // 9. currentUserTypeId 4 (OFFICE_STAFF) -> can create only PATIENT
  if (currentUserTypeId === 4) {
    if (currentUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
      // Same as rule 7: can create any valid user except SUPER_ADMIN
      if (actionUserTypeId === 1 || actionUserRoles.includes(CoreRole.SUPER_ADMIN)) {
        logger.error('❌ OFFICE_STAFF cannot create SUPER_ADMIN user');
        return false;
      }
      return true; // Can create all other valid combinations
    }
    return (
      actionUserTypeId === 5 &&
      actionUserRoles.length === 1 &&
      actionUserRoles[0] === CoreRole.PATIENT
    );
  }

  // currentUserTypeId 5 (PATIENT_USER) -> cannot create anyone
  if (currentUserTypeId === 5) {
    logger.error('❌ PATIENT_USER cannot create any users');
    return false;
  }

  logger.error(`❌ Unknown current user type: ${currentUserTypeId}`);
  return false;
}

/**
 * Simple client access validation
 */
function isClientAccessAllowed(
  currentUserTypeId: number,
  currentClientId: number,
  actionClientId: number | null,
): boolean {
  // 6. currentUserTypeId 1 (SYSTEM_ADMIN) -> can access any client
  if (currentUserTypeId === 1) {
    return true;
  }

  // All other user types are restricted to their own client
  return currentClientId === actionClientId;
}
