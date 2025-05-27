// src/features/auth/utils/auth-logger.ts
import logger from '../../../config/logger';

export const authLogger = {
  login: (userId: string, username: string, success: boolean, ip?: string) => {
    if (success) {
      logger.info({
        event: 'auth:login:success',
        user: { id: userId, username },
        ip,
        message: `User ${username} logged in successfully`,
      });
    } else {
      logger.warn({
        event: 'auth:login:failed',
        user: { username },
        ip,
        message: `Failed login attempt for ${username}`,
      });
    }
  },

  register: (userId: string, username: string, success: boolean) => {
    if (success) {
      logger.info({
        event: 'auth:register:success',
        user: { id: userId, username },
        message: `New user registered: ${username}`,
      });
    } else {
      logger.warn({
        event: 'auth:register:failed',
        user: { username },
        message: `Failed registration attempt for ${username}`,
      });
    }
  },

  tokenRefresh: (userId: string, success: boolean, tokenId?: string) => {
    if (success) {
      logger.info({
        event: 'auth:token:refresh',
        user: { id: userId },
        tokenId,
        message: `Token refreshed for user ${userId}`,
      });
    } else {
      logger.warn({
        event: 'auth:token:refresh:failed',
        user: { id: userId },
        tokenId,
        message: `Token refresh failed for user ${userId}`,
      });
    }
  },

  logout: (userId: string) => {
    logger.info({
      event: 'auth:logout',
      user: { id: userId },
      message: `User ${userId} logged out`,
    });
  },

  accessDenied: (userId: string | null, resource: string, ip?: string) => {
    logger.warn({
      event: 'auth:access:denied',
      user: userId ? { id: userId } : 'unauthenticated',
      resource,
      ip,
      message: `Access denied to ${resource}${userId ? ` for user ${userId}` : ''}`,
    });
  },
};
