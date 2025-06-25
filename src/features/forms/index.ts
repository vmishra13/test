/**
 * FORM FEATURE ENTRY POINT
 * 
 * This file serves as the main entry point for the form feature.
 * It exports all public APIs and components from the form feature.
 */

// Export routes
export { default as formRoutes } from './routes';

// Export DTOs
export * from './dto';

// Export types
export * from './types';

// Export validators
export * from './validators';

// Export controllers (for potential direct use)
export * as formController from './controllers/form.controller';

// Export services (for potential direct use)
export * as formService from './services/form.service';

// Export repository functions (for potential direct use)
export * as formRepository from './repositories/form.repository';
