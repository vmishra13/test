// Test script to verify imports work
import { UserRegistrationService } from './features/users/services/user-registration.service';
import { DoctorSelectionService } from './features/users/services/doctor-selection.service';
import { CarePlanService } from './features/plans/services/care-plan.service';

console.log('All imports successful!');

const userService = new UserRegistrationService();
const doctorService = new DoctorSelectionService();
const carePlanService = new CarePlanService();

console.log('All services instantiated successfully!');
