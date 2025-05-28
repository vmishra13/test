import { createServer, Server } from 'http';
import app from '../app';
import { ENV } from '../config/env';
import logger from '../config/logger';
import { isPortAvailable, findAvailablePort } from '../shared/utils/port-utils';
import { generateStartupBanner, shouldShowBanner } from '../shared/utils/banner-utils';

/**
 * Server instance to use for graceful shutdown
 */
let server: Server;

/**
 * Start the server on the specified port
 */
export const startServerOnPort = (port: number): Server => {
  const httpServer = createServer(app);

  httpServer.listen(port, () => {
    // Use the banner utility with conditional display
    if (shouldShowBanner()) {
      logger.info(generateStartupBanner(port));
    } else {
      // Simplified output for environments where banner isn't appropriate
      logger.info(`ReliaCare API Server started on port ${port} (${ENV.nodeEnv})`);
    }
  });

  // Store server reference for shutdown
  server = httpServer;
  return httpServer;
};

/**
 * Handle server startup with port conflict resolution
 */
export const initializeServer = async (): Promise<Server> => {
  const PORT = Number(ENV.port);

  try {
    // Use requested port if available
    if (await isPortAvailable(PORT)) {
      return startServerOnPort(PORT);
    }

    // Handle port conflict based on environment
    if (ENV.isDevelopment) {
      // In development, find an alternative port
      const newPort = await findAvailablePort(PORT + 1);
      logger.warn(`Port ${PORT} is in use, using alternative port: ${newPort}`);
      return startServerOnPort(newPort);
    } else {
      // In production, fail fast
      throw new Error(`Port ${PORT} is already in use`);
    }
  } catch (error) {
    logger.error('Server initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

/**
 * Gracefully shut down the server
 */
export const shutdownServer = (exitCode = 0): void => {
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
 * Get the current server instance
 */
export const getServer = (): Server | undefined => server;
