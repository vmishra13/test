import express from 'express';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';
import routes from './routes';
import logger from './config/logger';
import { httpLogger } from './shared/middlewares/logger.middleware';
import { requestLogger } from './shared/middlewares/request-logger.middleware';
import { ApiResponse } from './shared/utils/api-response';

const app = express();

// Important: Body parsing middleware must come BEFORE requestLogger
// so that req.body is available for logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add the request logger middleware
app.use(requestLogger);

// Use the HTTP logger middleware
app.use(httpLogger);

// Use cors middleware instead of manual CORS handling
app.use(
  cors({
    origin: '*', // You can specify allowed origins or use a function
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  }),
);

// More secure production configuration
// app.use(cors({
//   origin: ENV.isProduction
//     ? ['https://relicare.com', 'https://admin.relicare.com']
//     : '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,  // For cookies/authentication
//   maxAge: 86400,      // Cache preflight requests for 24 hours
// }));

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json(
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

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
    ApiResponse.error(
      'Internal server error',
      'SERVER_ERROR',
      StatusCodes.INTERNAL_SERVER_ERROR,
    ),
  );
});

export default app;
