import { Router } from 'express';
import v1Router from './v1';
// Future imports would be added here:
// import v2Router from './v2';

const apiRouter = Router();

// Mount version-specific routers
apiRouter.use('/v1', v1Router);
// Future versions would be added here:
// apiRouter.use('/v2', v2Router);

export default apiRouter;
