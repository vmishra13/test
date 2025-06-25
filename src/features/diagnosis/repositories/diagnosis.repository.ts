/**
 * DIAGNOSIS REPOSITORY - Database access layer
 * 
 * This file handles all database operations for diagnosis master.
 * It provides a clean abstraction layer between the service and database.
 */

import prismaPostgres from '@/db/postgres/client';
import { Prisma } from '@/db/postgres/generated/postgres-client';
import type { CreateDiagnosisInput, UpdateDiagnosisInput } from '../dto/diagnosis.dto';

// ===================================================================
// 🎯 REPOSITORY FUNCTIONS
// ===================================================================

/**
 * Get all diagnoses with filtering and pagination
 */
export async function getDiagnoses(params: {
  page: number;
  limit: number;
  search?: string;
  bodyArea?: string;
  groupType?: string;
  sort: 'asc' | 'desc';
}) {
  const { page, limit, search, bodyArea, groupType, sort } = params;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.diagnosis_masterWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bodyArea: { contains: search, mode: 'insensitive' } },
      { groupType: { contains: search, mode: 'insensitive' } },
      { leftICDCode: { contains: search, mode: 'insensitive' } },
      { rightICDCode: { contains: search, mode: 'insensitive' } },
      { bilateralICDCode: { contains: search, mode: 'insensitive' } },
      { noneICDCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (bodyArea) {
    where.bodyArea = { contains: bodyArea, mode: 'insensitive' };
  }

  if (groupType) {
    where.groupType = { contains: groupType, mode: 'insensitive' };
  }

  // Execute query with pagination
  const [diagnoses, total] = await Promise.all([
    prismaPostgres.diagnosis_master.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: sort },
    }),
    prismaPostgres.diagnosis_master.count({ where }),
  ]);

  return {
    data: diagnoses,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get diagnosis by ID
 */
export async function getDiagnosisById(id: number) {
  return await prismaPostgres.diagnosis_master.findUnique({
    where: { id },
  });
}

/**
 * Get diagnosis by name
 */
export async function getDiagnosisByName(name: string) {
  return await prismaPostgres.diagnosis_master.findUnique({
    where: { name },
  });
}

/**
 * Create new diagnosis
 */
export async function createDiagnosis(
  data: CreateDiagnosisInput,
  crUser: string
) {
  return await prismaPostgres.diagnosis_master.create({
    data: {
      ...data,
      crUser,
      modUser: crUser,
    },
  });
}

/**
 * Update diagnosis
 */
export async function updateDiagnosis(
  id: number,
  data: UpdateDiagnosisInput,
  modUser: string
) {
  return await prismaPostgres.diagnosis_master.update({
    where: { id },
    data: {
      ...data,
      modUser,
    },
  });
}

/**
 * Delete diagnosis
 */
export async function deleteDiagnosis(id: number) {
  return await prismaPostgres.diagnosis_master.delete({
    where: { id },
  });
}

/**
 * Check if diagnosis exists
 */
export async function diagnosisExists(id: number): Promise<boolean> {
  const count = await prismaPostgres.diagnosis_master.count({
    where: { id },
  });
  return count > 0;
}

/**
 * Check if diagnosis name exists (for create/update validation)
 */
export async function diagnosisNameExists(name: string, excludeId?: number): Promise<boolean> {
  const where: Prisma.diagnosis_masterWhereInput = { name };
  
  if (excludeId) {
    where.id = { not: excludeId };
  }

  const count = await prismaPostgres.diagnosis_master.count({ where });
  return count > 0;
}

/**
 * Get diagnoses by body area
 */
export async function getDiagnosesByBodyArea(bodyArea: string) {
  return await prismaPostgres.diagnosis_master.findMany({
    where: {
      bodyArea: { equals: bodyArea, mode: 'insensitive' },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get diagnoses by group type
 */
export async function getDiagnosesByGroupType(groupType: string) {
  return await prismaPostgres.diagnosis_master.findMany({
    where: {
      groupType: { equals: groupType, mode: 'insensitive' },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get unique body areas
 */
export async function getUniqueBodyAreas() {
  const result = await prismaPostgres.diagnosis_master.findMany({
    select: { bodyArea: true },
    distinct: ['bodyArea'],
    orderBy: { bodyArea: 'asc' },
  });
  
  return result.map(item => item.bodyArea);
}

/**
 * Get unique group types
 */
export async function getUniqueGroupTypes() {
  const result = await prismaPostgres.diagnosis_master.findMany({
    select: { groupType: true },
    distinct: ['groupType'],
    orderBy: { groupType: 'asc' },
  });
  
  return result.map(item => item.groupType);
}
