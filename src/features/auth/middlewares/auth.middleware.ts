import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { tokenService } from '../services/token.service';
import { userRepository } from '../repositories/user.repository';
import { ApiResponse } from '@shared/utils/api-response';

export interface IAuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticate = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          ApiResponse.error('Authentication required', 'NO_AUTH_TOKEN', StatusCodes.UNAUTHORIZED),
        );
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('Invalid token', 'INVALID_TOKEN', StatusCodes.UNAUTHORIZED));
      return;
    }

    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ApiResponse.error('User not found', 'USER_NOT_FOUND', StatusCodes.UNAUTHORIZED));
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json(ApiResponse.error('Authentication failed', 'AUTH_FAILED', StatusCodes.UNAUTHORIZED));
    return;
  }
};
