import { Router, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate, IAuthenticatedRequest } from '../auth/middlewares/auth.middleware';
import { checkRole, Permissions } from '../auth/middlewares/role.middleware';
import { pathAuthorize } from '../auth/middlewares/path-authorize.middleware';
import { ApiResponse } from '../../shared/utils/api-response';

const rbacRouter = Router();

// 1. Any authenticated user can access this endpoint
rbacRouter.get(
  '/any-authenticated',
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
rbacRouter.get(
  '/admins-only',
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
rbacRouter.get(
  '/medical-staff',
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
rbacRouter.get(
  '/doctors-only',
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
rbacRouter.get(
  '/super-admin',
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

export default rbacRouter;
