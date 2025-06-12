import logger from '@config/logger';
import { bootstrap } from './server/bootstrap';

// Start the application
bootstrap().catch(error => {
  logger.error('Fatal bootstrap error:', error);
  process.exit(1);
});
