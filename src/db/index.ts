import logger from '../config/logger';
import prismaPostgres from './postgres/client';
import prismaMongo from './mongodb/client';

/**
 * Database service for managing multiple database connections
 */
export const db = {
  postgres: prismaPostgres,
  mongodb: prismaMongo,

  /**
   * Connect to all databases
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to databases...');

      // Connect to PostgreSQL
      await prismaPostgres.$connect();
      logger.info('Connected to PostgreSQL database');

      // Connect to MongoDB
      await prismaMongo.$connect();
      logger.info('Connected to MongoDB database');
    } catch (error) {
      logger.error('Failed to connect to databases', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Disconnect from all databases
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from databases...');

      // Disconnect from PostgreSQL
      await prismaPostgres.$disconnect();
      logger.info('Disconnected from PostgreSQL database');

      // Disconnect from MongoDB
      await prismaMongo.$disconnect();
      logger.info('Disconnected from MongoDB database');
    } catch (error) {
      logger.error('Error while disconnecting from databases', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
