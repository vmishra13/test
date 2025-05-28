import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Import Helmet
import { StatusCodes } from 'http-status-codes';
import routes from './routes';
import logger from './config/logger';
import { httpLogger } from './shared/middlewares/logger.middleware';
import { requestLogger } from './shared/middlewares/request-logger.middleware';
import { ApiResponse } from './shared/utils/api-response';
import { corsConfig } from './config/cors.config';
import { ENV } from './config/env'; // Make sure to import ENV
import { helmetConfig } from './config/helmet.config';

const app = express();

// Apply Helmet middleware with configuration
app.use(helmet(helmetConfig));

// Important: Body parsing middleware must come BEFORE requestLogger
// so that req.body is available for logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add the request logger middleware
app.use(requestLogger);

// Use the HTTP logger middleware
app.use(httpLogger);

// Apply CORS configuration from separate config file
app.use(cors(corsConfig));

// Mount all routes under /api prefix
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res
    .status(StatusCodes.NOT_FOUND)
    .json(
      ApiResponse.error(
        `Route ${req.method} ${req.url} not found`,
        'NOT_FOUND',
        StatusCodes.NOT_FOUND,
      ),
    );
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json(
      ApiResponse.error('Internal server error', 'SERVER_ERROR', StatusCodes.INTERNAL_SERVER_ERROR),
    );
});

export default app;
