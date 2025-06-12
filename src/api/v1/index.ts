import { Router } from 'express';
import { authRoutes } from '@features/auth';
import { useroutes } from '@/features/users';
// import diagnosticsRouter from '@features/diagnostics/routes';
// import rbacRouter from '@features/rbac-examples/routes';
// import pathRbacRouter from '@features/rbac-examples/path-routes';
// import { todoRouter } from '@features/todo';

const v1Router = Router();

// Mount v1 feature modules
v1Router.use('/auth', authRoutes);
v1Router.use('/users', useroutes);
// v1Router.use('/', diagnosticsRouter);
// v1Router.use('/rbac', rbacRouter);
// v1Router.use('/rbac-path', pathRbacRouter);
// v1Router.use('/todos', todoRouter);

export default v1Router;
