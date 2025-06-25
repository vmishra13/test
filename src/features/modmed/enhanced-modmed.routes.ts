/**
 * Enhanced ModMed Routes
 * Routes that use the new FHIR abstraction layer
 */

import { Router } from 'express';
import EnhancedModMedController from './enhanced-modmed.controller';

const router = Router();
const enhancedModMedController = new EnhancedModMedController();

// Test connection
router.get('/test-connection', async (req, res) => {
  await enhancedModMedController.testConnection(req, res);
});

// Patient routes
router.get('/patients/search', async (req, res) => {
  await enhancedModMedController.searchPatient(req, res);
});

router.get('/patients', async (req, res) => {
  await enhancedModMedController.getPatients(req, res);
});

router.get('/patients/:patientId', async (req, res) => {
  await enhancedModMedController.getPatient(req, res);
});

// Patient appointments
router.get('/patients/:patientId/appointments', async (req, res) => {
  await enhancedModMedController.getPatientAppointments(req, res);
});

// Patient medications
router.get('/patients/:patientId/medications', async (req, res) => {
  await enhancedModMedController.getPatientMedications(req, res);
});

// Patient conditions
router.get('/patients/:patientId/conditions', async (req, res) => {
  await enhancedModMedController.getPatientConditions(req, res);
});

// Patient documents
router.get('/patients/:patientId/documents', async (req, res) => {
  await enhancedModMedController.getPatientDocuments(req, res);
});

router.get('/patients/:patientId/documents/search', async (req, res) => {
  await enhancedModMedController.searchDocuments(req, res);
});

// Specific document
router.get('/documents/:documentId', async (req, res) => {
  await enhancedModMedController.getDocument(req, res);
});

// FHIR metadata
router.get('/capability-statement', async (req, res) => {
  await enhancedModMedController.getCapabilityStatement(req, res);
});

export default router;
