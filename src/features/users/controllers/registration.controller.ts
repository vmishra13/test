import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { registerUser } from '../services/registration.service';
import type { ExtendedRequest } from '../types/extended-request';
import type { RegisterUserRequest } from '../dto/registration.dto';

/**
 * Register a new user
 * POST /api/users/register
 */
export async function registerUserController(
  req: ExtendedRequest<any, RegisterUserRequest>,
  res: Response,
): Promise<void> {
  try {
    // Service layer handles all authentication, authorization, validation, and business logic
    const result = await registerUser(req);

    // Controller only handles successful HTTP response
    res.status(StatusCodes.CREATED).json(result);
  } catch (error: any) {
    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle specific error types (existing logic)
    if (error.message.includes('already exists')) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'User already exists',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('permission') || error.message.includes('Insufficient')) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.message.includes('Invalid')) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid request data',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generic server error
    console.error('Registration error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Registration failed',
      details: 'An unexpected error occurred during user registration',
      timestamp: new Date().toISOString(),
    });
  }
}

// /**
//  * Validate registration data before submission
//  * POST /api/users/register/validate
//  */
// export async function validateRegistrationController(req: Request, res: Response): Promise<void> {
//   try {
//     const currentUser = checkAuthentication(req, res);
//     if (!currentUser) return; // Early return if auth failed

//     // 2. Validate request body
//     const validationResult = validateRegistrationSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         error: 'Validation failed',
//         details: validationResult.error.errors.map(err => ({
//           field: err.path.join('.'),
//           message: err.message,
//         })),
//         timestamp: new Date().toISOString(),
//       });
//       return;
//     }

//     const requestData: RegisterUserRequest = validationResult.data;

//     // 3. Validate registration data
//     const result = await validateRegistrationData(requestData, currentUser);

//     // 4. Return validation result
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: {
//         isValid: result.isValid,
//         errors: result.errors,
//       },
//       message: result.isValid ? 'Validation passed' : 'Validation failed',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error('Registration validation error:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       error: 'Validation failed',
//       details: 'An unexpected error occurred during validation',
//       timestamp: new Date().toISOString(),
//     });
//   }
// }

// /**
//  * Get registration statistics
//  * GET /api/users/register/stats?clientId=123
//  */
// export async function getRegistrationStatsController(req: Request, res: Response): Promise<void> {
//   try {
//     const currentUser = checkAuthentication(req, res);
//     if (!currentUser) return; // Early return if auth failed

//     // 2. Parse query parameters
//     const clientIdParam = req.query.clientId as string;
//     const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

//     if (clientIdParam && isNaN(clientId!)) {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         error: 'Invalid client ID',
//         details: 'Client ID must be a valid number',
//         timestamp: new Date().toISOString(),
//       });
//       return;
//     }

//     // 3. Get statistics
//     const stats = await getRegistrationStats(currentUser, clientId);

//     // 4. Return statistics
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: stats,
//       message: 'Registration statistics retrieved successfully',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     if (error.message.includes('permission') || error.message.includes('organization')) {
//       res.status(StatusCodes.FORBIDDEN).json({
//         success: false,
//         error: 'Insufficient permissions',
//         details: error.message,
//         timestamp: new Date().toISOString(),
//       });
//       return;
//     }

//     console.error('Registration stats error:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       error: 'Failed to retrieve statistics',
//       details: 'An unexpected error occurred while retrieving statistics',
//       timestamp: new Date().toISOString(),
//     });
//   }
// }

// /**
//  * Get available roles for registration
//  * GET /api/users/register/available-roles
//  */
// export async function getAvailableRolesController(req: Request, res: Response): Promise<void> {
//   try {
//     const currentUser = checkAuthentication(req, res);
//     if (!currentUser) return; // Early return if auth failed

//     // 2. Get available roles
//     const availableRoles = getAvailableRolesForRegistration(currentUser.roles);

//     // 3. Return available roles
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: {
//         availableRoles,
//         userRoles: currentUser.roles,
//       },
//       message: 'Available roles retrieved successfully',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error('Available roles error:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       error: 'Failed to retrieve available roles',
//       details: 'An unexpected error occurred while retrieving available roles',
//       timestamp: new Date().toISOString(),
//     });
//   }
// }

// /**
//  * Check registration permissions for specific roles
//  * POST /api/users/register/check-permissions
//  */
// export async function checkRegistrationPermissionsController(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const currentUser = checkAuthentication(req, res);
//     if (!currentUser) return; // Early return if auth failed

//     // 2. Validate request body
//     const { targetRoles } = req.body;
//     if (!targetRoles || !Array.isArray(targetRoles)) {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         error: 'Invalid request',
//         details: 'targetRoles must be an array of role names',
//         timestamp: new Date().toISOString(),
//       });
//       return;
//     }

//     // Validate that all targetRoles are valid CoreRole values
//     const invalidRoles = targetRoles.filter(
//       role => !Object.values(CoreRole).includes(role as CoreRole),
//     );

//     if (invalidRoles.length > 0) {
//       res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         error: 'Invalid roles',
//         details: `Invalid role names: ${invalidRoles.join(', ')}`,
//         timestamp: new Date().toISOString(),
//       });
//       return;
//     }

//     // 3. Check permissions
//     const permissionResult = validateRegistrationPermissions(
//       currentUser.roles,
//       targetRoles as CoreRole[],
//     );

//     // 4. Return permission result
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: permissionResult,
//       message: 'Permission check completed',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error('Permission check error:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       error: 'Permission check failed',
//       details: 'An unexpected error occurred during permission check',
//       timestamp: new Date().toISOString(),
//     });
//   }
// }

// /**
//  * Health check for registration service
//  * GET /api/users/register/health
//  */
// export async function registrationHealthController(req: Request, res: Response): Promise<void> {
//   try {
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: {
//         service: 'registration',
//         status: 'healthy',
//         timestamp: new Date().toISOString(),
//         endpoints: [
//           'POST /api/users/register',
//           'POST /api/users/register/validate',
//           'GET /api/users/register/stats',
//           'GET /api/users/register/available-roles',
//           'POST /api/users/register/check-permissions',
//         ],
//       },
//       message: 'Registration service is healthy',
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
//       success: false,
//       error: 'Service unhealthy',
//       details: error.message,
//       timestamp: new Date().toISOString(),
//     });
//   }
// }
