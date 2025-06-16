/**
 * ModMed Routes
 * Defines API endpoints for ModMed integration
 */

import { Router } from 'express';
import { ModMedController } from './modmed.controller';

const router = Router();

// Test connection
router.get('/test', async (req, res) => {
  await ModMedController.testConnection(req, res);
});

// Patient operations
router.get('/patients/search', async (req, res) => {
  await ModMedController.searchPatient(req, res);
});

router.get('/patients', async (req, res) => {
  await ModMedController.getPatients(req, res);
});

router.get('/patients/:patientId/appointments', async (req, res) => {
  await ModMedController.getPatientAppointments(req, res);
});

router.get('/patients/:patientId/documents', async (req, res) => {
  await ModMedController.getPatientDocuments(req, res);
});

router.get('/patients/:patientId/conditions', async (req, res) => {
  await ModMedController.getPatientConditions(req, res);
});

router.get('/patients/:patientId/medications', async (req, res) => {
  await ModMedController.getPatientMedications(req, res);
});

router.get('/documents/search', async (req, res) => {
  await ModMedController.searchDocuments(req, res);
});

export default router;
