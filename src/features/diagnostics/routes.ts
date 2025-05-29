import { Router, Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '@config/logger';
import { ApiResponse } from '@shared/utils/api-response';

const diagnosticsRouter = Router();

// Health check endpoint
diagnosticsRouter.get('/health', (req: Request, res: Response) => {
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

// Logging test endpoint
diagnosticsRouter.get('/test-logging', (req: Request, res: Response) => {
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

// Error test endpoint
diagnosticsRouter.get('/test-error', (req: Request, res: Response, next) => {
  try {
    throw new Error('Test error for logging');
  } catch (error) {
    next(error);
  }
});

export default diagnosticsRouter;
