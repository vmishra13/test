import logger from '../config/logger';
import { shutdownServer } from './server';
import { stopAllCronJobs } from '../services/cron/cron.service';
import { db } from '../db';

/**
 * Handle graceful shutdown
 */
export const gracefulShutdown = (signal: string, exitCode = 0): void => {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop all cron jobs
  stopAllCronJobs();
  logger.info('All scheduled tasks stopped');

  // Disconnect from databases
  db.disconnect()
    .catch(err => {
      logger.error('Error disconnecting from databases', { error: err });
    })
    .finally(() => {
      // Proceed with server shutdown
      shutdownServer(exitCode);
    });
};

/**
 * Register process handlers for signals and uncaught errors
 */
export function registerProcessHandlers(): void {
  process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
  });

  process.on('unhandledRejection', (reason, _promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    gracefulShutdown('UNHANDLED_REJECTION', 1);
  });

  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM', 0);
  });

  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT', 0);
  });
}
