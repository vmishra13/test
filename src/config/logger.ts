import winston from 'winston';
import { ENV } from './env';

// Enhanced log format for development with stack traces
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }), // ✅ Capture stack traces
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...meta } = info;
    const metaString = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message}${stack ? '\n' + stack : ''}${metaString}`;
  })
);

// Enhanced production format with structured logging and stack traces
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // ✅ Capture stack traces in production
  winston.format.json(),
  winston.format.printf(info => {
    // Structured production format that preserves all error information
    const logEntry: any = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: info.service || 'reliacare-api',
    };

    // Preserve stack traces for errors
    if (info.stack) {
      logEntry.stack = info.stack;
    }

    // Preserve error objects with all their properties
    if (info.error && typeof info.error === 'object') {
      logEntry.error = {
        name: (info.error as any).name,
        message: (info.error as any).message,
        stack: (info.error as any).stack,
        code: (info.error as any).code,
        statusCode: (info.error as any).statusCode
      };
    }

    // Add request context for tracing
    if (info.requestId) logEntry.requestId = info.requestId;
    if (info.correlationId) logEntry.correlationId = info.correlationId;
    if (info.userId) logEntry.userId = info.userId;
    if (info.clientId) logEntry.clientId = info.clientId;
    if (info.path) logEntry.path = info.path;
    if (info.method) logEntry.method = info.method;
    if (info.ip) logEntry.ip = info.ip;
    if (info.userAgent) logEntry.userAgent = info.userAgent;

    // Add any additional metadata
    Object.keys(info).forEach(key => {
      if (!['timestamp', 'level', 'message', 'service', 'stack', 'error', 'requestId', 'correlationId', 'userId', 'clientId', 'path', 'method', 'ip', 'userAgent'].includes(key)) {
        logEntry[key] = info[key];
      }
    });

    return JSON.stringify(logEntry);
  })
);

// Use appropriate format based on environment
const logFormat = ENV.isDevelopment ? developmentFormat : productionFormat;

// Create the logger with enhanced production capabilities
const logger = winston.createLogger({
  level: ENV.isProduction ? 'error' : 'info',
  format: logFormat,
  defaultMeta: { service: 'reliacare-api' },
  transports: [
    // Console transport (always enabled for container logs)
    new winston.transports.Console({
      stderrLevels: ['error'], // Send errors to stderr
    }),

    // Enhanced file transports for production
    ...(ENV.isProduction
      ? [
          // Error logs with full stack traces and rotation
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 50 * 1024 * 1024, // 50MB max file size
            maxFiles: 10, // Keep 10 files
            tailable: true, // Allow log rotation
          }),
          // Combined logs for all levels
          new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 100 * 1024 * 1024, // 100MB max file size
            maxFiles: 5, // Keep 5 files
            tailable: true,
          }),
          // Auth-specific logs for security monitoring
          new winston.transports.File({ 
            filename: 'logs/auth.log',
            level: 'info',
            maxsize: 20 * 1024 * 1024, // 20MB max file size
            maxFiles: 10,
            tailable: true,
          }),
        ]
      : [
          new winston.transports.File({ filename: 'logs/info.log', level: 'info' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      ),
  ],
  
  // ✅ Handle uncaught exceptions with stack traces
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    ...(ENV.isProduction ? [
      new winston.transports.File({ 
        filename: 'logs/exceptions.log',
        maxsize: 50 * 1024 * 1024,
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      })
    ] : [])
  ],
  
  // ✅ Handle unhandled promise rejections with stack traces
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    ...(ENV.isProduction ? [
      new winston.transports.File({ 
        filename: 'logs/rejections.log',
        maxsize: 50 * 1024 * 1024,
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      })
    ] : [])
  ],
  
  // Don't exit on handled exceptions
  exitOnError: false
});

// Enhanced logger with helper methods for better error tracking
export const enhancedLogger = {
  ...logger,
  
  // Error logging with full context and stack traces
  errorWithContext: (error: Error, context: any = {}) => {
    logger.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode: (error as any).statusCode
      },
      ...context,
      category: 'error',
      timestamp: new Date().toISOString()
    });
  },
  
  // Auth-specific logging with security context
  auth: (level: string, message: string, meta: any = {}) => {
    logger.log(level, `[AUTH] ${message}`, { 
      ...meta, 
      category: 'auth',
      timestamp: new Date().toISOString()
    });
  },
  
  // Security event logging
  security: (message: string, meta: any = {}) => {
    logger.warn(`[SECURITY] ${message}`, { 
      ...meta, 
      category: 'security',
      timestamp: new Date().toISOString()
    });
  },
  
  // Database operation logging
  database: (message: string, meta: any = {}) => {
    logger.info(`[DATABASE] ${message}`, { 
      ...meta, 
      category: 'database'
    });
  },
  
  // API request/response logging with enhanced context
  api: (level: string, message: string, meta: any = {}) => {
    logger.log(level, `[API] ${message}`, { 
      ...meta, 
      category: 'api'
    });
  },
  
  // Performance logging
  performance: (message: string, duration: number, meta: any = {}) => {
    logger.info(`[PERFORMANCE] ${message}`, {
      ...meta,
      duration,
      category: 'performance'
    });
  }
};

export default logger;
