import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { httpLogger } from './shared/middlewares/logger.middleware';
import { requestLogger } from './shared/middlewares/request-logger.middleware';
import { corsConfig } from './config/cors.config';
import { helmetConfig } from './config/helmet.config';
import { errorHandler, notFoundHandler } from '@shared/middlewares/error-handler.middleware';

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
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
