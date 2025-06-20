// Test script to verify imports work
import { UserRegistrationService, DoctorSelectionService } from './features/users/services/user.service';

console.log('All imports successful!');

const userService = new UserRegistrationService();
const doctorService = new DoctorSelectionService();

console.log('All services instantiated successfully!');
