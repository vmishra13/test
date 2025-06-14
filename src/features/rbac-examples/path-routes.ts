import { Router, Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '../auth/middlewares/auth.middleware';
import { ApiResponse } from '@shared/utils/api-response';

interface IAuthenticatedRequest extends Request {
  user?: any;
}

export const pathAuthorize = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Example path-based authorization logic
  // You can customize this based on your requirements

  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      ApiResponse.error('User not authenticated'),
    );
    return;
  }

  // Add your path-based authorization logic here
  // For example, check if user role has access to the requested path

  next();
};

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
  '/admin',
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

export default pathRbacRouter;
