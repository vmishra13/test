/**
 * MEDICATION FEATURE ENTRY POINT
 * 
 * This file serves as the main entry point for the medication feature.
 * It exports all public APIs and components from the medication feature.
 */

// Export routes
export { default as medicationRoutes } from './routes';

// Export DTOs
export * from './dto/medication.dto';

// Export types
export * from './types/extended-request';

// Export validators
export * from './validators/medication.validators';

// Export controllers (for potential direct use)
export * as medicationController from './controllers/medication.controller';

// Export services (for potential direct use)
export * as medicationService from './services/medication.service';

// Export repository functions (for potential direct use)
export * as medicationRepository from './repositories/medication.repository';
