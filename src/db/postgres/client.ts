import { PrismaClient } from './generated/postgres-client';
import logger from '../../config/logger';

// Create a singleton instance of PrismaClient for PostgreSQL
const prismaPostgres = new PrismaClient({
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
prismaPostgres.$on('query', e => {
  logger.debug('Postgres query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
  });
});

prismaPostgres.$on('error', e => {
  logger.error('Postgres error', { message: e.message });
});

export default prismaPostgres;
