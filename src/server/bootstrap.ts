import logger from '../config/logger';
import { initializeServer } from './server';
import { registerProcessHandlers } from './process-handlers';
import { registerCronJobs } from '../services/cron/task-registry'; // Use consistent import
import { ENV } from '../config/env';

/**
 * Bootstrap application
 */
export const bootstrap = async (): Promise<void> => {
  try {
    // Register all global handlers
    registerProcessHandlers();

    // Initialize and start the server
    await initializeServer();

    // Start all scheduled cron jobs if not in test mode
    if (ENV.nodeEnv !== 'test') {
      registerCronJobs(); // Use consistent function name
      logger.info('Scheduled tasks initialized');
    }
  } catch (error) {
    logger.error('Bootstrap failure', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};
