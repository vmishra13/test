// Test script to verify imports work
import { registerUserService, getUsersService } from './features/users/services/user.service';

console.log('All imports successful!');

// Test that functions are available
console.log('registerUserService:', typeof registerUserService);
console.log('getUsersService:', typeof getUsersService);

console.log('All services imported successfully!');
