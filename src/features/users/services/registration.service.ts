import bcrypt from 'bcrypt';
import { UserStatus } from '@shared/constants';
import { CoreRole, RoleUtils } from '@shared/constants';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  CreateUserResult,
} from '../dto/registration.dto';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import {
  validateRoleCombinations,
  validateEmailDomain,
  registerUserSchema,
} from '../validators/registration.validators';
import * as userRepository from '../repositories/user.repository';
import { Request } from 'express';
import {
  ExtendedRequest,
  RequestUserAction,
  // UserRegistrationAction,
  type AuthRequest,
} from '../types/extended-request';
import {
  createAuthError,
  createAuthorizationError,
  createValidationError,
} from '@/shared/errors/application-error';
import {
  createAuthRequest,
  getCurrentUser,
  getCurrentUserPrimaryRole,
  performAuthorization,
} from '@shared/authorization';
import logger from '@/config/logger';

/**
 * Enhanced registerUser function that handles authentication, authorization, and validation
 */
export async function registerUser(
  req: ExtendedRequest<any, RegisterUserRequest>,
): Promise<RegisterUserResponse> {
  // 1. Check authentication
  const currentUser = getCurrentUser(req);

  const actionUserId = null; // No specific user ID for registration action
  const actionClientId = req.body.clientId; // Target client from request body
  const actionUserTypeId = req.body.userTypeId; // Target user type from request body
  const actionPermission = RequestUserAction.userAdd; // Specific permission for user registration

  const oAuthReq: AuthRequest = createAuthRequest(
    currentUser,
    actionUserId,
    actionClientId,
    actionUserTypeId,
    actionPermission,
  );
  // 2. Determine registration action
  // const extendedReq = retrieveAction(req as unknown as ExtendedRequest, currentUser);

  // 3. Check authorization for the specific action
  const hasPermission = performAuthorization(oAuthReq);

  if (!hasPermission) {
    logger.error(
      `User ${currentUser.userId} does not have permission to register users in client ${actionClientId}`,
    );
    throw createAuthorizationError('You do not have permission to perform this action');
  }

  // 4. Validate request body
  const requestData = validateRequestBody(req.body);

  // 5. Perform registration
  return await performUserRegistration(requestData, currentUser);
}

/**
 * Check authentication - moved from controller
 */
// function checkAuthentication(req: Request): AuthenticatedUser {
//   const currentUser = req.user as AuthenticatedUser;
//   if (!currentUser) {
//     throw createAuthError('Authentication required');
//   }
//   return currentUser;
// }

/**
 * Determine what type of user is being registered and set action
 */
// function retrieveAction(req: ExtendedRequest, currentUser: AuthenticatedUser): ExtendedRequest {
//   // Parse request body to get roles (basic parsing for action determination)
//   let targetRoles: CoreRole[] = [];

//   try {
//     // Ensure req.body is treated as an object with proper type checking
//     const body = req.body as Record<string, any>;
//     if (body && body.roles && Array.isArray(body.roles)) {
//       targetRoles = body.roles;
//     }
//   } catch (error) {
//     // Will be handled in validation step
//     targetRoles = [];
//   }

//   // Determine primary action based on highest privilege role being assigned
//   if (targetRoles.includes(CoreRole.CLIENT_ADMIN)) {
//     req.action = UserRegistrationAction.ADD_CLIENT_ADMIN;
//   } else if (targetRoles.includes(CoreRole.CLINICAL_STAFF)) {
//     req.action = UserRegistrationAction.ADD_CLINICAL_STAFF;
//   } else if (targetRoles.includes(CoreRole.OFFICE_STAFF)) {
//     req.action = UserRegistrationAction.ADD_OFFICE_STAFF;
//   } else if (targetRoles.includes(CoreRole.PATIENT)) {
//     req.action = UserRegistrationAction.ADD_PATIENT;
//   } else {
//     throw createAuthorizationError('No valid role specified for user registration');
//   }

//   return req;
// }

/**
 * Check authorization based on the registration action
 */
// function performAuthorization2(req: ExtendedRequest): void {
//   const currentUser = req.user;
//   const targetClientId = (req.body as any)?.clientId;

//   // Get current user's primary role (highest privilege)
//   const currentUserRole = getCurrentUserPrimaryRole(currentUser.roles);

//   switch (req.action) {
//     case UserRegistrationAction.ADD_CLIENT_ADMIN:
//       if (currentUserRole !== CoreRole.SUPER_ADMIN) {
//         throw createAuthorizationError('Only SUPER_ADMIN can create CLIENT_ADMIN accounts');
//       }
//       break;

//     case UserRegistrationAction.ADD_CLINICAL_STAFF:
//       if (currentUserRole !== CoreRole.CLIENT_ADMIN) {
//         throw createAuthorizationError('Only CLIENT_ADMIN can create CLINICAL_STAFF accounts');
//       }

//       // Check same client restriction
//       if (currentUser.clientId !== targetClientId) {
//         throw createAuthorizationError(
//           'CLIENT_ADMIN can only create CLINICAL_STAFF in their own organization',
//         );
//       }
//       break;

//     case UserRegistrationAction.ADD_OFFICE_STAFF:
//       // Rule 4: OFFICE_STAFF can be created by only CLIENT_ADMIN of the same Client
//       if (currentUserRole !== CoreRole.CLIENT_ADMIN) {
//         throw createAuthorizationError('Only CLIENT_ADMIN can create OFFICE_STAFF accounts');
//       }

//       // Check same client restriction
//       if (currentUser.clientId !== targetClientId) {
//         throw createAuthorizationError(
//           'CLIENT_ADMIN can only create OFFICE_STAFF in their own organization',
//         );
//       }
//       break;

//     case UserRegistrationAction.ADD_PATIENT:
//       // Rule 5: PATIENT can be created by CLIENT_ADMIN and CLINICAL_STAFF of the same Client
//       if (
//         currentUserRole !== CoreRole.CLIENT_ADMIN &&
//         currentUserRole !== CoreRole.CLINICAL_STAFF
//       ) {
//         throw createAuthorizationError(
//           'Only CLIENT_ADMIN and CLINICAL_STAFF can create PATIENT accounts',
//         );
//       }

//       // Check same client restriction
//       if (currentUser.clientId !== targetClientId) {
//         throw createAuthorizationError(
//           `${currentUserRole} can only create PATIENT accounts in their own organization`,
//         );
//       }
//       break;

//     default:
//       throw createAuthorizationError('Invalid registration action specified');
//   }
// }

/**
 * Validate request body - moved from controller
 */
function validateRequestBody(body: any): RegisterUserRequest {
  const validationResult = registerUserSchema.safeParse(body);
  if (!validationResult.success) {
    throw createValidationError(
      'Validation failed',
      validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    );
  }
  return validationResult.data;
}

/**
 * Perform user registration
 */
async function performUserRegistration(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<RegisterUserResponse> {
  try {
    // 1. Validate business rules
    await validateRegistrationRules(requestData, currentUser);

    // 2. Check if user already exists
    await validateUserUniqueness(requestData);

    // 3. Generate password (use provided or generate temporary)
    const passwordToUse = requestData.temporaryPassword
      ? generateTemporaryPassword()
      : requestData.password;

    // 4. Hash the password
    const hashedPassword = await hashPassword(passwordToUse);

    // 5. Get role IDs from role names
    const roleIds = await getRoleIdsFromNames(requestData.roles);

    // 6. Create user in database transaction
    const result = await userRepository.createUserWithRoles({
      userData: {
        loginName: requestData.loginName,
        clientId: requestData.clientId,
        userTypeId: requestData.userTypeId,
        firstName: requestData.firstName || null,
        lastName: requestData.lastName || null,
        email: requestData.email || null,
        timeZone: requestData.timeZone || null,
        profilePicture: requestData.profilePicture || null,
        status: UserStatus.ACTIVE,
        crUser: currentUser.loginName,
      },
      password: hashedPassword,
      roleIds: roleIds,
      createdBy: currentUser.loginName,
    });

    // 7. Send welcome email if requested
    if (requestData.sendWelcomeEmail && requestData.email) {
      await sendWelcomeEmail(requestData.email, result.user, passwordToUse);
    }

    // 8. Return response
    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          loginName: result.user.loginName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          timeZone: result.user.timeZone,
          profilePicture: result.user.profilePicture,
          status: result.user.status,
          crDate: result.user.crDate.toISOString(),
          client: {
            id: result.user.client.id,
            name: result.user.client.name,
            timeZone: result.user.client.timeZone,
          },
          userType: {
            id: result.user.userType.id,
            name: result.user.userType.name,
            description: result.user.userType.description,
          },
          roles: result.roles.map(role => role.name),
        },
        ...(requestData.temporaryPassword && {
          temporaryPassword: passwordToUse,
        }),
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Check if any of the user's roles has the required permission
 */
function hasRolePermission(
  userRoles: string[],
  requiredPermission: (role: CoreRole) => boolean,
): boolean {
  const coreRoles = userRoles.filter(role =>
    Object.values(CoreRole).includes(role as CoreRole),
  ) as CoreRole[];

  return coreRoles.some(role => requiredPermission(role));
}

/**
 * Check if user can assign specific roles
 */
function canAssignRoles(
  userRoles: string[],
  targetRoles: CoreRole[],
): {
  canAssign: boolean;
  deniedRoles: CoreRole[];
} {
  const deniedRoles: CoreRole[] = [];

  for (const targetRole of targetRoles) {
    const canAssign = hasRolePermission(userRoles, role =>
      RoleUtils.canCreateRole(role, targetRole),
    );

    if (!canAssign) {
      deniedRoles.push(targetRole);
    }
  }

  return {
    canAssign: deniedRoles.length === 0,
    deniedRoles,
  };
}

/**
 * Validate all business rules for registration
 */
async function validateRegistrationRules(
  requestData: RegisterUserRequest,
  currentUser: AuthenticatedUser,
): Promise<void> {
  // 1. Validate role assignment permissions - Check if ANY role can assign
  const roleAssignmentResult = canAssignRoles(currentUser.roles, requestData.roles);

  if (!roleAssignmentResult.canAssign) {
    throw new Error(
      `Insufficient permissions to assign roles: ${roleAssignmentResult.deniedRoles.join(', ')}`,
    );
  }

  // 2. Validate client access permissions - Check if ANY role can manage clients
  const canManageClients = hasRolePermission(currentUser.roles, role =>
    RoleUtils.canManageAllClients(role),
  );

  if (!canManageClients && currentUser.clientId !== requestData.clientId) {
    throw new Error('You can only create users in your own organization');
  }

  // 3. Validate role combinations
  const roleCombinationResult = validateRoleCombinations(requestData.roles);

  if (!roleCombinationResult.isValid) {
    throw new Error(roleCombinationResult.errors.join('; '));
  }

  // 4. Validate email domain if provided
  if (requestData.email) {
    const emailDomainResult = validateEmailDomain(requestData.email);

    if (!emailDomainResult.isValid) {
      throw new Error(emailDomainResult.error);
    }
  }

  // 5. Validate client exists and is active
  const client = await userRepository.findClientById(requestData.clientId);
  if (!client) {
    throw new Error('Invalid client ID');
  }
  if (client.status !== 1) {
    throw new Error('Cannot create users for inactive client');
  }

  // 6. Validate user type exists
  const userType = await userRepository.findUserTypeById(requestData.userTypeId);
  if (!userType) {
    throw new Error('Invalid user type ID');
  }

  // 7. Validate business rule: Email required for welcome email
  if (requestData.sendWelcomeEmail && !requestData.email) {
    throw new Error('Email is required when sendWelcomeEmail is enabled');
  }
}

/**
 * Validate user uniqueness
 */
async function validateUserUniqueness(requestData: RegisterUserRequest): Promise<void> {
  // Check if login name already exists
  const existingUser = await userRepository.findUserByLoginName(requestData.loginName);
  if (existingUser) {
    throw new Error('User with this login name already exists');
  }

  // Check if email already exists (if provided)
  if (requestData.email) {
    const existingEmailUser = await userRepository.findUserByEmail(requestData.email);
    if (existingEmailUser) {
      throw new Error('User with this email already exists');
    }
  }
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong salt rounds for healthcare data
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate temporary password
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%^&*';

  let password = '';

  // Ensure at least one character from each category
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Get role IDs from role names
 */
async function getRoleIdsFromNames(roleNames: CoreRole[]): Promise<number[]> {
  const roles = await userRepository.findRolesByNames(roleNames);

  if (roles.length !== roleNames.length) {
    const foundRoleNames = roles.map(role => role.name);
    const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
    throw new Error(`Invalid roles: ${missingRoles.join(', ')}`);
  }

  return roles.map(role => role.id);
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(
  email: string,
  user: CreateUserResult['user'],
  temporaryPassword?: string,
): Promise<void> {
  try {
    // TODO: Implement email service integration
    console.log(`Welcome email would be sent to: ${email}`);
    console.log(`User: ${user.firstName} ${user.lastName} (${user.loginName})`);
    console.log(`Client: ${user.client.name}`);
    if (temporaryPassword) {
      console.log(`Temporary password: ${temporaryPassword}`);
    }

    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    // await emailService.sendWelcomeEmail({
    //   to: email,
    //   templateData: {
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     loginName: user.loginName,
    //     clientName: user.client.name,
    //     temporaryPassword: temporaryPassword,
    //     loginUrl: process.env.FRONTEND_URL + '/login'
    //   }
    // });
  } catch (error: any) {
    // Don't fail registration if email fails
    console.error('Failed to send welcome email:', error.message);
  }
}

// /**
//  * Get user registration statistics (for analytics)
//  */
// export async function getRegistrationStats(
//   currentUser: AuthenticatedUser,
//   clientId?: number,
// ): Promise<{
//   totalUsers: number;
//   activeUsers: number;
//   usersByRole: Record<string, number>;
//   recentRegistrations: number;
// }> {
//   try {
//     const targetClientId = clientId || currentUser.clientId;

//     // Check if ANY role can manage all clients
//     const canManageAllClients = hasRolePermission(currentUser.roles, role =>
//       RoleUtils.canManageAllClients(role),
//     );

//     if (!canManageAllClients && currentUser.clientId !== targetClientId) {
//       throw new Error('You can only view statistics for your own organization');
//     }

//     const stats = await userRepository.getUserRegistrationStats(targetClientId);
//     return stats;
//   } catch (error: any) {
//     throw new Error(`Failed to get registration statistics: ${error.message}`);
//   }
// }

// /**
//  * Validate if current user can register users with specific roles
//  */
// export function validateRegistrationPermissions(
//   currentUserRoles: string[], // Changed to accept roles array
//   targetRoles: CoreRole[],
// ): { canRegister: boolean; allowedRoles: CoreRole[]; deniedRoles: CoreRole[] } {
//   const allowedRoles: CoreRole[] = [];
//   const deniedRoles: CoreRole[] = [];

//   for (const targetRole of targetRoles) {
//     const canAssign = hasRolePermission(currentUserRoles, role =>
//       RoleUtils.canCreateRole(role, targetRole),
//     );

//     if (canAssign) {
//       allowedRoles.push(targetRole);
//     } else {
//       deniedRoles.push(targetRole);
//     }
//   }

//   return {
//     canRegister: deniedRoles.length === 0,
//     allowedRoles,
//     deniedRoles,
//   };
// }

// /**
//  * Get available roles that current user can assign
//  */
// export function getAvailableRolesForRegistration(currentUserRoles: string[]): CoreRole[] {
//   const allRoles = Object.values(CoreRole);
//   const availableRoles: CoreRole[] = [];

//   for (const role of allRoles) {
//     const canAssign = hasRolePermission(currentUserRoles, userRole =>
//       RoleUtils.canCreateRole(userRole, role),
//     );

//     if (canAssign) {
//       availableRoles.push(role);
//     }
//   }

//   return availableRoles;
// }

// /**
//  * Validate registration data before submission
//  */
// export async function validateRegistrationData(
//   requestData: RegisterUserRequest,
//   currentUser: AuthenticatedUser,
// ): Promise<{ isValid: boolean; errors: string[] }> {
//   const errors: string[] = [];

//   try {
//     // Basic validation
//     if (!requestData.loginName || requestData.loginName.trim().length < 3) {
//       errors.push('Login name must be at least 3 characters');
//     }

//     if (!requestData.password || requestData.password.length < 8) {
//       errors.push('Password must be at least 8 characters');
//     }

//     if (!requestData.roles || requestData.roles.length === 0) {
//       errors.push('At least one role must be assigned');
//     }

//     // Business rule validation using ANY role approach
//     const roleAssignmentResult = canAssignRoles(currentUser.roles, requestData.roles);

//     if (!roleAssignmentResult.canAssign) {
//       errors.push(`Cannot assign roles: ${roleAssignmentResult.deniedRoles.join(', ')}`);
//     }

//     const canManageClients = hasRolePermission(currentUser.roles, role =>
//       RoleUtils.canManageAllClients(role),
//     );

//     if (!canManageClients && currentUser.clientId !== requestData.clientId) {
//       errors.push('You can only create users in your own organization');
//     }

//     const roleCombinationResult = validateRoleCombinations(requestData.roles);

//     if (!roleCombinationResult.isValid) {
//       errors.push(...roleCombinationResult.errors);
//     }

//     // Check uniqueness
//     const existingUser = await userRepository.findUserByLoginName(requestData.loginName);
//     if (existingUser) {
//       errors.push('User with this login name already exists');
//     }

//     if (requestData.email) {
//       const existingEmailUser = await userRepository.findUserByEmail(requestData.email);
//       if (existingEmailUser) {
//         errors.push('User with this email already exists');
//       }
//     }
//   } catch (error: any) {
//     errors.push(error.message);
//   }

//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }
