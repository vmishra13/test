/**
 * EXERCISE FEATURE ENTRY POINT
 * 
 * This file serves as the main entry point for the exercise feature.
 * It exports all public APIs and components from the exercise feature.
 */

// Export routes
export { default as exerciseRoutes } from './routes';

// Export DTOs
export * from './dto/exercise.dto';

// Export types
export * from './types/extended-request';

// Export validators
export * from './validators/exercise.validators';

// Export controllers (for potential direct use)
export * as exerciseController from './controllers/exercise.controller';

// Export services (for potential direct use)
export * as exerciseService from './services/exercise.service';

// Export repository functions (for potential direct use)
export * as exerciseRepository from './repositories/exercise.repository';
