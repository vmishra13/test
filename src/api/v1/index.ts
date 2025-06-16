import { Router } from 'express';

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
