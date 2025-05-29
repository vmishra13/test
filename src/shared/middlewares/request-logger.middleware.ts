import { Request, Response, NextFunction } from 'express';
import logger from '@config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl } = req;
  const startTime = Date.now();

  // Create a copy of the body to log
  // Sanitize sensitive information if needed (e.g., passwords)
  const sanitizeBody = (body: any): any => {
    if (!body) return {};

    const sanitized = { ...body };

    // Sanitize sensitive fields
    if (sanitized.password) sanitized.password = '******';
    if (sanitized.accessToken) sanitized.accessToken = '******';
    if (sanitized.refreshToken) sanitized.refreshToken = '******';

    return sanitized;
  };

  // Log at the start of the request
  logger.info({
    message: `API Request: ${method} ${originalUrl}`,
    method,
    path: originalUrl,
    body: sanitizeBody(req.body),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture the response
  const oldSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;

    // Log at the end of the request
    logger.info({
      message: `API Response: ${method} ${originalUrl}`,
      method,
      path: originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return oldSend.apply(res, arguments as any);
  };

  next();
};
