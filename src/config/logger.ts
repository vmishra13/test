import winston from 'winston';
import { ENV } from './env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ENV.isDevelopment ? winston.format.colorize() : winston.format.uncolorize(),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
  ENV.isProduction ? winston.format.json() : winston.format.simple(),
);

// Create the logger
const logger = winston.createLogger({
  level: ENV.isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'relicare-api' },
  transports: [
    // Console transport
    new winston.transports.Console(),

    // File transports - add in production
    ...(ENV.isProduction
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

export default logger;
