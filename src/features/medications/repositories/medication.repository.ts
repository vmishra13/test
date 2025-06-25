/**
 * MEDICATION REPOSITORY - Database access layer
 * 
 * This file handles all database operations for medication master.
 * It provides a clean abstraction layer between the service and database.
 */

import prismaPostgres from '@/db/postgres/client';
import { Prisma } from '@/db/postgres/generated/postgres-client';
import type { CreateMedicationInput, UpdateMedicationInput } from '../dto/medication.dto';

// ===================================================================
// 🎯 REPOSITORY FUNCTIONS
// ===================================================================

/**
 * Get all medications with filtering and pagination
 */
export async function getMedications(params: {
  page: number;
  limit: number;
  search?: string;
  dosageForm?: string;
  manufacturer?: string;
  sort: 'asc' | 'desc';
  clientId: number;
}) {
  const { page, limit, search, dosageForm, manufacturer, sort, clientId } = params;
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: Prisma.medication_masterWhereInput = {
    clientId,
  };

  // Search across multiple fields
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { identifier: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { manufacturer: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (dosageForm) {
    where.dosageForm = dosageForm as any;
  }

  if (manufacturer) {
    where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
  }

  // Execute query with pagination
  const [medications, total] = await Promise.all([
    prismaPostgres.medication_master.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: sort },
    }),
    prismaPostgres.medication_master.count({ where }),
  ]);

  return {
    medications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single medication by ID
 */
export async function getMedicationById(id: number, clientId: number) {
  const medication = await prismaPostgres.medication_master.findFirst({
    where: { id, clientId },
  });

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
  const medication = await prismaPostgres.medication_master.create({
    data: {
      name: data.medication_name,
      identifier: data.generic_name,
      code: data.brand_name,
      dosageForm: data.dosage_form as any,
      strength: data.strength,
      manufacturer: data.manufacturer,
      description: data.indication,
      clientId,
      crUser: userId,
      modUser: userId,
    },
  });

  return medication;
}

/**
 * Update an existing medication
 */
export async function updateMedication(
  id: number,
  data: UpdateMedicationInput,
  clientId: number,
  userId: string
) {
  const medication = await prismaPostgres.medication_master.update({
    where: { id },
    data: {
      ...(data.medication_name && { name: data.medication_name }),
      ...(data.generic_name && { identifier: data.generic_name }),
      ...(data.brand_name && { code: data.brand_name }),
      ...(data.dosage_form && { dosageForm: data.dosage_form as any }),
      ...(data.strength && { strength: data.strength }),
      ...(data.manufacturer && { manufacturer: data.manufacturer }),
      ...(data.indication && { description: data.indication }),
      modUser: userId,
      modDate: new Date(),
    },
  });

  return medication;
}

/**
 * Delete a medication
 */
export async function deleteMedication(id: number, clientId: number) {
  const medication = await prismaPostgres.medication_master.delete({
    where: { id },
  });

  return medication;
}

/**
 * Check if medication exists by name
 */
export async function medicationExistsByName(
  name: string,
  clientId: number,
  excludeId?: number
) {
  const where: Prisma.medication_masterWhereInput = {
    name: { equals: name, mode: 'insensitive' },
    clientId,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const medication = await prismaPostgres.medication_master.findFirst({
    where,
    select: { id: true },
  });

  return !!medication;
}

/**
 * Get medication statistics
 */
export async function getMedicationStats(clientId: number) {
  const [
    total,
    byDosageForm,
    byManufacturer,
  ] = await Promise.all([
    prismaPostgres.medication_master.count({
      where: { clientId },
    }),
    prismaPostgres.medication_master.groupBy({
      by: ['dosageForm'],
      where: { clientId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prismaPostgres.medication_master.groupBy({
      by: ['manufacturer'],
      where: { clientId, manufacturer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total,
    byDosageForm,
    byManufacturer,
  };
}
