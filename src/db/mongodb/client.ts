import { PrismaClient } from './generated/mongodb-client';
import logger from '@config/logger';

// Create a singleton instance of PrismaClient for MongoDB
const prismaMongo = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log PrismaClient events
prismaMongo.$on('query', e => {
  logger.debug('MongoDB query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
  });
});

prismaMongo.$on('error', e => {
  logger.error('MongoDB error', { message: e.message });
});

export default prismaMongo;
