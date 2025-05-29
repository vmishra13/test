import { PrismaClient } from './generated/postgres-client';
import logger from '@config/logger';

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
  // Add formatted SQL logging with parameters
  const formattedQuery = formatSql(e.query, e.params);

  logger.debug('Postgres query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    formattedSql: formattedQuery,
  });

  // In development, also log to console for easier debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔍 PostgreSQL Query:');
    console.log(`⏱️  Duration: ${e.duration}ms`);
    console.log(`📝 ${formattedQuery}\n`);
  }
});

prismaPostgres.$on('error', e => {
  logger.error('Postgres error', {
    message: e.message,
    target: e.target,
    stack: e.stack,
  });
});

// Define a proper LogEvent interface with optional stack property
interface LogEvent {
  message: string;
  level: string;
  timestamp?: string;
  error?: Error | unknown;
  stack?: string;
  // other properties you might have
}

// When creating a log event from an error
function createLogEvent(error: unknown): LogEvent {
  // Basic log event
  const logEvent: LogEvent = {
    message: error instanceof Error ? error.message : String(error),
    level: 'error',
    timestamp: new Date().toISOString(),
  };

  // Safely add stack trace if available
  if (error instanceof Error && error.stack) {
    logEvent.stack = error.stack;
  }

  return logEvent;
}

// Usage in a logger
function logError(error: unknown): void {
  const logEvent = createLogEvent(error);

  // Now you can safely access the stack property
  console.error(`${logEvent.message}${logEvent.stack ? `\nStack: ${logEvent.stack}` : ''}`);

  // Or pass to your logging system
  // logger.log(logEvent);
}

/**
 * Format SQL query with parameters for better readability
 */
function formatSql(sql: string, params: any): string {
  if (!params || params.length === 0) return sql;

  let formattedSql = sql;

  // Replace $1, $2, etc. with actual parameter values
  if (Array.isArray(params)) {
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value = formatParam(param);
      formattedSql = formattedSql.replace(new RegExp(placeholder + '\\b', 'g'), value);
    });
  }

  return formattedSql;
}

/**
 * Format parameter value for SQL logging
 */
function formatParam(param: any): string {
  if (param === null) return 'NULL';
  if (param === undefined) return 'NULL';
  if (typeof param === 'string') return `'${param.replace(/'/g, "''")}'`;
  if (typeof param === 'number' || typeof param === 'boolean') return String(param);
  if (param instanceof Date) return `'${param.toISOString()}'`;
  if (Array.isArray(param)) return `ARRAY[${param.map(formatParam).join(', ')}]`;
  return JSON.stringify(param);
}

export default prismaPostgres;
