import { Router } from 'express';

// Add debug logging for each import
console.log('🔍 Debugging route imports...');

try {
  const { authRoutes } = require('@features/auth');
  console.log('✅ authRoutes:', typeof authRoutes, authRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ authRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { userRoutes } = require('@/features/users');
  console.log('✅ userRoutes:', typeof userRoutes, userRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ userRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { clientRoutes } = require('@/features/clients');
  console.log('✅ clientRoutes:', typeof clientRoutes, clientRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ clientRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { planRoutes } = require('@/features/plans');
  console.log('✅ planRoutes:', typeof planRoutes, planRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ planRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { exerciseRoutes } = require('@/features/exercises');
  console.log('✅ exerciseRoutes:', typeof exerciseRoutes, exerciseRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ exerciseRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { procedureRoutes } = require('@/features/procedures');
  console.log('✅ procedureRoutes:', typeof procedureRoutes, procedureRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ procedureRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { medicationRoutes } = require('@/features/medications');
  console.log('✅ medicationRoutes:', typeof medicationRoutes, medicationRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ medicationRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const mediaRoutes = require('@/features/media/routes/media.routes').default;
  console.log('✅ mediaRoutes:', typeof mediaRoutes, mediaRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ mediaRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const { emailRoutes } = require('@/features/email');
  console.log('✅ emailRoutes:', typeof emailRoutes, emailRoutes ? 'exists' : 'undefined');
} catch (error) {
  console.log('❌ emailRoutes import failed:', error instanceof Error ? error.message : String(error));
}

// Now import normally with consistent singular naming
console.log('🚀 Starting normal imports...');

import { authRoutes } from '@features/auth';
import { userRoutes } from '@/features/users';
// import diagnosticsRouter from '@features/diagnostics/routes';
// import rbacRouter from '@features/rbac-examples/routes';
// import pathRbacRouter from '@features/rbac-examples/path-routes';
// import { todoRouter } from '@features/todo';

const v1Router = Router();

// Mount v1 feature modules
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
// v1Router.use('/', diagnosticsRouter);
// v1Router.use('/rbac', rbacRouter);
// v1Router.use('/rbac-path', pathRbacRouter);
// v1Router.use('/todos', todoRouter);

// Import messaging routes with error handling
try {
  const msgGroupRoutes = require('@/features/messaging/routes/msg-group.routes').default;
  console.log('✅ msgGroupRoutes loaded successfully');
  v1Router.use('/msg-groups', msgGroupRoutes);
} catch (error) {
  console.log('❌ msgGroupRoutes import failed:', error instanceof Error ? error.message : String(error));
}

try {
  const messageRoutes = require('@/features/messaging/routes/message.routes').default;
  console.log('✅ messageRoutes loaded successfully');
  v1Router.use('/messages', messageRoutes);
} catch (error) {
  console.log('❌ messageRoutes import failed:', error instanceof Error ? error.message : String(error));
}

export default v1Router;
