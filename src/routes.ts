import { Router, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authRoutes } from './features/auth';
import logger from './config/logger';
import { authenticate, IAuthenticatedRequest } from './features/auth/middlewares/auth.middleware';
import { checkRole, Permissions } from './features/auth/middlewares/role.middleware';
import { pathAuthorize } from './features/auth/middlewares/path-authorize.middleware';
import { ApiResponse } from './shared/utils/api-response';

const router = Router();

router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      'API is healthy',
    ),
  );
});

// Logging test endpoints
router.get('/test-logging', (req, res) => {
  logger.error('Test error log');
  logger.warn('Test warning log');
  logger.info('Test info log');
  logger.debug('Test debug log');
  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success(
        { logLevels: ['error', 'warn', 'info', 'debug'] },
        'Logging test complete',
      ),
    );
});

router.get('/test-error', (req, res, next) => {
  try {
    throw new Error('Test error for logging');
  } catch (error) {
    next(error);
  }
});

// RBAC TEST ENDPOINTS
// 1. Any authenticated user can access this endpoint
router.get(
  '/rbac/any-authenticated',
  authenticate,
  checkRole(Permissions.ANY_AUTHENTICATED),
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          permissionGroup: 'ANY_AUTHENTICATED',
        },
        'You have access to this resource',
      ),
    );
  },
);

// 2. Only admins can access this endpoint
router.get(
  '/rbac/admins-only',
  authenticate,
  checkRole(Permissions.ADMINS_ONLY),
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          permissionGroup: 'ADMINS_ONLY',
        },
        'Admin access granted',
      ),
    );
  },
);

// 3. Only medical staff can access this endpoint
router.get(
  '/rbac/medical-staff',
  authenticate,
  checkRole(Permissions.MEDICAL_STAFF),
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          permissionGroup: 'MEDICAL_STAFF',
        },
        'Medical staff access granted',
      ),
    );
  },
);

// 4. Only doctors can access this endpoint
router.get(
  '/rbac/doctors-only',
  authenticate,
  checkRole(Permissions.DOCTORS_ONLY),
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          permissionGroup: 'DOCTORS_ONLY',
        },
        'Doctor access granted',
      ),
    );
  },
);

// 5. Super admin only endpoint
router.get(
  '/rbac/super-admin',
  authenticate,
  checkRole(Permissions.SUPER_ADMIN_ONLY),
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          permissionGroup: 'SUPER_ADMIN_ONLY',
        },
        'Super admin access granted',
      ),
    );
  },
);

// Path-based RBAC TEST ENDPOINTS (alternative implementation)
router.get(
  '/rbac-path/resource',
  authenticate,
  pathAuthorize, // No parameters needed!
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          method: 'GET',
          path: req.path,
        },
        'Resource access granted via path-based authorization',
      ),
    );
  },
);

router.post(
  '/rbac-path/resource',
  authenticate,
  pathAuthorize,
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          method: 'POST',
          path: req.path,
        },
        'Resource creation granted via path-based authorization',
      ),
    );
  },
);

router.get(
  '/rbac-path/admins',
  authenticate,
  pathAuthorize,
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          method: 'GET',
          path: req.path,
        },
        'Admin access granted via path-based authorization',
      ),
    );
  },
);

router.get(
  '/rbac-path/medical',
  authenticate,
  pathAuthorize,
  (req: IAuthenticatedRequest, res: Response) => {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          yourRole: req.user?.role,
          method: 'GET',
          path: req.path,
        },
        'Medical access granted via path-based authorization',
      ),
    );
  },
);

export default router;
