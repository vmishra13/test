import { Router, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate, IAuthenticatedRequest } from '../auth/middlewares/auth.middleware';
import { pathAuthorize } from '../auth/middlewares/path-authorize.middleware';
import { ApiResponse } from '@shared/utils/api-response';

const pathRbacRouter = Router();

pathRbacRouter.get(
  '/resource',
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
        'Resource access granted via path-based authorization',
      ),
    );
  },
);

pathRbacRouter.post(
  '/resource',
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

pathRbacRouter.get(
  '/admins',
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

pathRbacRouter.get(
  '/medical',
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

export default pathRbacRouter;
