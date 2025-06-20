/**
 * DIAGNOSIS FEATURE INDEX
 * 
 * This file exports all diagnosis-related functionality.
 */

// Controllers
export * from './controllers/diagnosis.controller';

// Services  
export * from './services/diagnosis.service';

// DTOs
export * from './dto/diagnosis.dto';

// Validators (selective exports to avoid conflicts)
export {
  DiagnosisIdSchema,
  createDiagnosisSchema,
  updateDiagnosisSchema,
  getDiagnosesQuerySchema,
} from './validators/diagnosis.validators';

// Types
export * from './types/extended-request';

// Routes
export { default as diagnosisRoutes } from './routes';
