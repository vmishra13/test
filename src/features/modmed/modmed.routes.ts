/**
 * ModMed Routes
 * Defines API endpoints for ModMed integration with STRICT authentication and client validation
 */

import { Router } from 'express';
import { ModMedController } from './modmed.controller';
import { authenticate } from '@features/auth/middlewares';

const router = Router();

// CRITICAL: All ModMed routes now require authentication
// Test connection
router.get('/test', authenticate, async (req, res) => {
  await ModMedController.testConnection(req, res);
});

// Patient operations - ALL require authentication and client validation
router.get('/patients/search', authenticate, async (req, res) => {
  await ModMedController.searchPatient(req, res);
});

router.get('/patients', authenticate, async (req, res) => {
  await ModMedController.getPatients(req, res);
});

router.get('/patients/:patientId/appointments', authenticate, async (req, res) => {
  await ModMedController.getPatientAppointments(req, res);
});

router.get('/patients/:patientId/documents', authenticate, async (req, res) => {
  await ModMedController.getPatientDocuments(req, res);
});

router.get('/patients/:patientId/conditions', authenticate, async (req, res) => {
  await ModMedController.getPatientConditions(req, res);
});

router.get('/patients/:patientId/medications', authenticate, async (req, res) => {
  await ModMedController.getPatientMedications(req, res);
});

router.get('/documents/search', authenticate, async (req, res) => {
  await ModMedController.searchDocuments(req, res);
});

export default router;
