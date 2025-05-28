import { bootstrap } from './server/bootstrap';

// Start the application
bootstrap().catch(error => {
  console.error('Fatal bootstrap error:', error);
  process.exit(1);
});
