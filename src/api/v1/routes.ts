import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@shared/utils/api-response';
import { todoRouter } from '@features/todo';
// Import other feature routes as needed

const healthRoute = Router();

// Health check
healthRoute.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    const response = ApiResponse.success(healthData, 'API v1 is running successfully');

    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    const errorResponse = ApiResponse.error(
      'Health check failed',
      'HEALTH_CHECK_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
    );

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export { healthRoute };
