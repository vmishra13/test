import { PrismaClient } from './generated/postgres-client';

/**
 * Check if a string contains sensitive data patterns
 */
function isSensitiveData(value: string): boolean {
  if (typeof value !== 'string') return false;

  // JWT token pattern (starts with ey and contains dots)
  const jwtPattern = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  // UUID pattern (for JTI values)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Base64 encoded data (potential tokens)
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/;

  // Check patterns
  if (jwtPattern.test(value)) return true;
  if (uuidPattern.test(value)) return true;
  if (value.length > 50 && base64Pattern.test(value)) return true;

  return false;
}

/**
 * Sanitize sensitive data in JSON objects
 */
function sanitizeSensitiveJsonData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeSensitiveJsonData);

  const sanitized = { ...obj };

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    // Check if key name suggests sensitive data
    const sensitiveKeys = ['token', 'jti', 'family', 'password', 'secret', 'key', 'auth'];
    const isSensitiveKey = sensitiveKeys.some(sk => key.toLowerCase().includes(sk));

    if (isSensitiveKey && typeof value === 'string') {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeSensitiveJsonData(value);
    } else if (typeof value === 'string' && isSensitiveData(value)) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Format parameter value for SQL logging with security sanitization
 */
function formatParam(param: any): string {
  if (param === null) return 'NULL';
  if (param === undefined) return 'NULL';
  if (typeof param === 'string') {
    // SECURITY: Sanitize sensitive data in parameters
    if (isSensitiveData(param)) {
      return "'[REDACTED_SENSITIVE_DATA]'";
    }
    return `'${param.replace(/'/g, "''")}'`;
  }
  if (typeof param === 'number' || typeof param === 'boolean') return String(param);
  if (param instanceof Date) return `'${param.toISOString()}'`;
  if (Array.isArray(param)) return `ARRAY[${param.map(formatParam).join(', ')}]`;

  // SECURITY: Sanitize JSON objects that might contain sensitive data
  const sanitizedParam = sanitizeSensitiveJsonData(param);
  return JSON.stringify(sanitizedParam);
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
  const timestamp = new Date()
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '');

  // SECURITY: Sanitize parameters before logging
  const sanitizedParams = Array.isArray(e.params)
    ? e.params.map(param => {
        if (typeof param === 'string' && isSensitiveData(param)) {
          return '[REDACTED]';
        }
        if (typeof param === 'object' && param !== null) {
          return sanitizeSensitiveJsonData(param);
        }
        return param;
      })
    : e.params;

  // Format query with SANITIZED parameters for safe logging
  const formattedQuery = formatSql(e.query, sanitizedParams);

  // Structured logging for all environments
  console.debug('Postgres query', {
    query: formattedQuery, // Now using formatted query with sanitized params
    params: JSON.stringify(sanitizedParams), // Sanitized parameters
    duration: `${e.duration}ms`,
    timestamp,
  });

  // Enhanced development logging (console-friendly format)
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔍 PostgreSQL Query [${timestamp}]`);
    console.log(`⏱️  Duration: ${e.duration}ms`);
    console.log(`📝 ${formattedQuery}\n`); // Show formatted query with sanitized params
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
  // Commented out tables that don't exist in schema:
  // refresh_token,
  // msg_group,
  // msg_group_user,
  // message,
  // user_msg_box,
} from './generated/postgres-client';
// Export useful Prisma types
export type { Prisma } from './generated/postgres-client';
