import app from './app';
import { createServer, Server } from 'http';
import { ENV } from './config/env';
import logger from './config/logger';
import { isPortAvailable, findAvailablePort } from './shared/utils/port-utils';
import { generateStartupBanner, shouldShowBanner } from './shared/utils/banner-utils';

/**
 * Server instance to use for graceful shutdown
 */
let server: Server;

/**
 * Start the server on the specified port
 */
const startServerOnPort = (port: number): void => {
  server = createServer(app);

  server.listen(port, () => {
    // Use the banner utility with conditional display
    if (shouldShowBanner()) {
      logger.info(generateStartupBanner(port));
    } else {
      // Simplified output for environments where banner isn't appropriate
      logger.info(`ReliaCare API Server started on port ${port} (${ENV.nodeEnv})`);
    }
  });

  server.on('error', handleServerError);
};

/**
 * Handle server-specific errors
 */
const handleServerError = (error: NodeJS.ErrnoException): void => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port is already in use`);
  } else {
    logger.error('Server error:', { error: error.message });
  }
  gracefulShutdown(1);
};

/**
 * Initialize the server with port availability check
 */
const initializeServer = async (): Promise<void> => {
  const PORT = Number(ENV.port);

  try {
    // Use requested port if available
    if (await isPortAvailable(PORT)) {
      startServerOnPort(PORT);
      return;
    }

    // Handle port conflict based on environment
    if (ENV.isDevelopment) {
      // In development, find an alternative port
      const newPort = await findAvailablePort(PORT + 1);
      logger.warn(`Port ${PORT} is in use, using alternative port: ${newPort}`);
      startServerOnPort(newPort);
    } else {
      // In production, fail fast
      throw new Error(`Port ${PORT} is already in use`);
    }
  } catch (error) {
    logger.error('Server initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    gracefulShutdown(1);
  }
};

/**
 * Gracefully shut down the server
 */
const gracefulShutdown = (exitCode = 0): void => {
  logger.info(`Server shutting down with exit code: ${exitCode}`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(exitCode);
    });

    // Force exit if close takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(exitCode);
    }, 5000);
  } else {
    process.exit(exitCode);
  }
};

/**
 * Register global error and signal handlers
 */
const registerGlobalHandlers = (): void => {
  // Error handlers
  process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown(1);
  });

  process.on('unhandledRejection', (reason, _promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    gracefulShutdown(1);
  });

  // Signal handlers for container environments
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    gracefulShutdown(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received');
    gracefulShutdown(0);
  });
};

/**
 * Bootstrap application
 */
(async function bootstrap() {
  try {
    registerGlobalHandlers();
    await initializeServer();
  } catch (error) {
    logger.error('Bootstrap failure', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
})();
