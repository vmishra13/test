import { Request, Response, NextFunction } from 'express';
import logger from '@config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl } = req;
  const startTime = Date.now();

  // Create a copy of the body to log
  // Sanitize sensitive information (passwords, tokens, secrets)
  const sanitizeBody = (body: any): any => {
    if (!body) return {};

    const sanitized = { ...body };

    // Sanitize password fields
    if (sanitized.password) sanitized.password = '******';
    if (sanitized.oldPassword) sanitized.oldPassword = '******';
    if (sanitized.newPassword) sanitized.newPassword = '******';
    if (sanitized.confirmPassword) sanitized.confirmPassword = '******';

    // Sanitize token fields (CRITICAL: Prevent token exposure)
    if (sanitized.accessToken) sanitized.accessToken = '[REDACTED_ACCESS_TOKEN]';
    if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED_REFRESH_TOKEN]';
    if (sanitized.refresh_token) sanitized.refresh_token = '[REDACTED_REFRESH_TOKEN]';
    if (sanitized.access_token) sanitized.access_token = '[REDACTED_ACCESS_TOKEN]';
    if (sanitized.token) sanitized.token = '[REDACTED_TOKEN]';
    if (sanitized.bearer) sanitized.bearer = '[REDACTED_BEARER_TOKEN]';
    if (sanitized.jwt) sanitized.jwt = '[REDACTED_JWT]';

    // Sanitize API keys and secrets
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED_API_KEY]';
    if (sanitized.clientSecret) sanitized.clientSecret = '[REDACTED_CLIENT_SECRET]';
    if (sanitized.privateKey) sanitized.privateKey = '[REDACTED_PRIVATE_KEY]';
    if (sanitized.secretKey) sanitized.secretKey = '[REDACTED_SECRET_KEY]';

    // Sanitize other sensitive data
    if (sanitized.ssn) sanitized.ssn = '[REDACTED_SSN]';
    if (sanitized.creditCard) sanitized.creditCard = '[REDACTED_CC]';

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
