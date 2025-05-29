// src/shared/middlewares/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '@config/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Create a structured log entry
    logger.info({
      http: {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent') || '',
        ip: req.ip,
      },
      message: `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`,
    });
  });

  next();
};
