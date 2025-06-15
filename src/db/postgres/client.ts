import { PrismaClient } from './generated/postgres-client';

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

  console.debug('Postgres query', {
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

// FIXED: Single error handler
prismaPostgres.$on('error', e => {
  console.error('Postgres error', {
    message: e.message,
    target: e.target,
  });
});

prismaPostgres.$on('info', e => {
  console.info('Postgres info', {
    message: e.message,
    target: e.target,
  });
});

prismaPostgres.$on('warn', e => {
  console.warn('Postgres warning', {
    message: e.message,
    target: e.target,
  });
});

// Graceful shutdown
async function disconnectPrisma() {
  await prismaPostgres.$disconnect();
}

// Handle process termination
process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);

// Export the client instance
export { prismaPostgres };
export default prismaPostgres;

// Export commonly used types - only include types that exist in your generated client
export type {
  // Core models that should exist
  user,
  client,
  role,
  user_type,
  user_role,
  password,
  contact,
  client_location,
  refresh_token,
  msg_group,
  msg_group_user,
  message,
  user_msg_box,
} from './generated/postgres-client';
// Export useful Prisma types
export type {
  Prisma,
} from './generated/postgres-client';

