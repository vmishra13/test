/**
 * MEDICATION SERVICE - Business logic layer
 * 
 * This file contains the business logic for medication master operations.
 * It acts as a bridge between the controller and repository layers.
 */

import * as medicationRepository from '../repositories/medication.repository';
import { CreateMedicationInput, UpdateMedicationInput, MedicationQuery } from '../dto/medication.dto';
import { MedicationIdSchema, MedicationParamsSchema } from '../validators/medication.validators';

// ===================================================================
// 🎯 SERVICE FUNCTIONS
// ===================================================================

/**
 * Get all medications with filtering and pagination
 */
export async function getAllMedications(
  query: any,
  clientId: number
) {
  // Validate query parameters
  const validatedQuery = MedicationParamsSchema.parse(query);
  
  const result = await medicationRepository.getMedications({
    page: validatedQuery.page || 1,
    limit: validatedQuery.limit || 20,
    search: validatedQuery.search,
    dosageForm: validatedQuery.dosage_form,
    manufacturer: validatedQuery.manufacturer,
    sort: validatedQuery.sort || 'asc',
    clientId,
  });

  return result;
}

/**
 * Get a single medication by ID
 */
export async function getMedicationById(
  id: string,
  clientId: number
) {
  // Validate ID
  const validatedParams = MedicationIdSchema.parse({ id });
  const numericId = parseInt(validatedParams.id, 10);
  
  const medication = await medicationRepository.getMedicationById(numericId, clientId);
  
  if (!medication) {
    throw new Error('Medication not found');
  }
  
  return medication;
}

/**
 * Create a new medication
 */
export async function createMedication(
  data: CreateMedicationInput,
  clientId: number,
  userId: string
) {
  // Check if medication with same name already exists
  const exists = await medicationRepository.medicationExistsByName(
    data.medication_name,
    clientId
  );
  
  if (exists) {
    throw new Error('A medication with this name already exists for this client');
  }
  
  const medication = await medicationRepository.createMedication(data, clientId, userId);
  
  return medication;
}

/**
 * Update an existing medication
 */
export async function updateMedication(
  id: string,
  data: UpdateMedicationInput,
  clientId: number,
  userId: string
) {
  // Validate ID
  const validatedParams = MedicationIdSchema.parse({ id });
  const numericId = parseInt(validatedParams.id, 10);
  
  // Check if medication exists
  const existingMedication = await medicationRepository.getMedicationById(numericId, clientId);
  if (!existingMedication) {
    throw new Error('Medication not found');
  }
  
  // Check for name conflicts if name is being updated
  if (data.medication_name && data.medication_name !== existingMedication.name) {
    const nameExists = await medicationRepository.medicationExistsByName(
      data.medication_name,
      clientId,
      numericId
    );
    
    if (nameExists) {
      throw new Error('A medication with this name already exists for this client');
    }
  }
  
  const medication = await medicationRepository.updateMedication(
    numericId,
    data,
    clientId,
    userId
  );
  
  return medication;
}

/**
 * Delete a medication
 */
export async function deleteMedication(
  id: string,
  clientId: number
) {
  // Validate ID
  const validatedParams = MedicationIdSchema.parse({ id });
  const numericId = parseInt(validatedParams.id, 10);
  
  // Check if medication exists
  const existingMedication = await medicationRepository.getMedicationById(numericId, clientId);
  if (!existingMedication) {
    throw new Error('Medication not found');
  }
  
  const result = await medicationRepository.deleteMedication(numericId, clientId);
  
  return result;
}

/**
 * Get medication statistics
 */
export async function getMedicationStats(clientId: number) {
  const stats = await medicationRepository.getMedicationStats(clientId);
  return stats;
}
