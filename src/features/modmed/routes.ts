import { Router } from 'express';
import { ModMedPatientController } from './controllers/patient.controller';
import { ModMedAppointmentController } from './controllers/appointment.controller';
import { authenticate } from '../auth/middlewares/auth.middleware';

const router = Router();

// Initialize controllers
const patientController = new ModMedPatientController();
const appointmentController = new ModMedAppointmentController();

// Apply authentication middleware to all ModMed routes
router.use(authenticate);

// Patient routes
router.get('/patients/search', patientController.searchPatient);
router.get('/patients/:patientId', patientController.getPatientById);
router.get('/patients', patientController.getPatientsList);
router.get('/patients/:patientId/appointments', patientController.getPatientAppointments);
router.get('/patients/:patientId/conditions', appointmentController.getPatientConditions);
router.get('/patients/:patientId/documents', appointmentController.getPatientDocuments);

// Appointment routes
router.get('/appointments/:appointmentId', appointmentController.getAppointmentById);
router.get('/appointments', patientController.getAppointments); // Legacy endpoint

// Location and Practitioner routes
router.get('/locations/:locationId', appointmentController.getLocation);
router.get('/practitioners/:practitionerId', appointmentController.getPractitioner);

// Document routes
router.get('/documents/:documentId', appointmentController.getDocumentObject);

export default router;
