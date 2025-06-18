// Temporary test file to verify ModMed services can be imported
import { ModMedApiService } from './api.service';
import { ModMedAuthService } from './auth.service';
import { ModMedPatientService } from './patient.service';
import { ModMedAppointmentService } from './appointment.service';

// Test that all classes can be instantiated
const testServices = () => {
  const apiService = new ModMedApiService();
  const authService = ModMedAuthService.getInstance();
  const patientService = new ModMedPatientService();
  const appointmentService = new ModMedAppointmentService();
  
  console.log('All ModMed services loaded successfully');
};

export { testServices };
