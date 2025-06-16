import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@shared/utils/api-response';

// Import all feature routes
import { authRoutes } from '@features/auth';
import { userRoutes } from '@/features/users';
import { clientRoutes } from '@/features/clients';
import { planRoutes } from '@/features/plans';
import { exerciseRoutes } from '@/features/exercises';
import { procedureRoutes } from '@/features/procedures';
import { medicationRoutes } from '@/features/medications';
import { emailRoutes } from '@/features/email';
import { contactRoutes } from '@/features/contacts';
import { roleRoutes } from '@/features/roles';
import { todoRouter } from '@/features/todo';
import mediaRoutes from '@/features/media/routes/media.routes';
import msgGroupRoutes from '@/features/messaging/routes/msg-group.routes';
import messageRoutes from '@/features/messaging/routes/message.routes';

const v1Router = Router();

// Health check endpoint
v1Router.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
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

// Mount all feature routes
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/clients', clientRoutes);
v1Router.use('/plans', planRoutes);
v1Router.use('/exercises', exerciseRoutes);
v1Router.use('/procedures', procedureRoutes);
v1Router.use('/medications', medicationRoutes);
v1Router.use('/email', emailRoutes);
v1Router.use('/contacts', contactRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/todos', todoRouter);
v1Router.use('/media', mediaRoutes);
v1Router.use('/msg-groups', msgGroupRoutes);
v1Router.use('/messages', messageRoutes);

export default v1Router;
