/**
 * EXERCISE REPOSITORY - Database access layer
 * 
 * This file handles all database operations for exercise master.
 * It provides a clean abstraction layer between the service and database.
 */

import prismaPostgres from '@/db/postgres/client';
import { Prisma } from '@/db/postgres/generated/postgres-client';
import type { CreateExerciseInput, UpdateExerciseInput } from '../dto/exercise.dto';

// ===================================================================
// 🎯 REPOSITORY FUNCTIONS
// ===================================================================

/**
 * Get all exercises with filtering and pagination
 */
export async function getExercises(params: {
  page: number;
  limit: number;
  search?: string;
  media_type?: string;
  frequencyPeriod?: string;
  unit?: string;
  sort: 'asc' | 'desc';
}) {
  const { page, limit, search, media_type, frequencyPeriod, unit, sort } = params;
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: Prisma.exercise_masterWhereInput = {};

  // Search across multiple fields
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { purpose: { contains: search, mode: 'insensitive' } },
      { procedure: { contains: search, mode: 'insensitive' } },
      { note: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (media_type) {
    where.media_type = media_type as any;
  }

  if (frequencyPeriod) {
    where.frequencyPeriod = frequencyPeriod as any;
  }

  if (unit) {
    where.unit = unit as any;
  }

  // Execute query with pagination
  const [exercises, total] = await Promise.all([
    prismaPostgres.exercise_master.findMany({
      where,
      skip,
      take: limit,
      orderBy: { title: sort },
    }),
    prismaPostgres.exercise_master.count({ where }),
  ]);

  return {
    exercises,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: number) {
  const exercise = await prismaPostgres.exercise_master.findUnique({
    where: { id },
  });

  return exercise;
}

/**
 * Create a new exercise
 */
export async function createExercise(
  data: CreateExerciseInput,
  userId: string
) {
  const exercise = await prismaPostgres.exercise_master.create({
    data: {
      title: data.title,
      description: data.description,
      purpose: data.purpose,
      media_type: data.media_type as any,
      media_url: data.media_url,
      frequencyPeriod: data.frequencyPeriod as any,
      unit: data.unit as any,
      value: data.value,
      setUnit: data.setUnit,
      repetition: data.repetition,
      procedure: data.procedure,
      note: data.note,
      show_checkbox: data.show_checkbox,
      crUser: userId,
      modUser: userId,
    },
  });

  return exercise;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  id: number,
  data: UpdateExerciseInput,
  userId: string
) {
  const exercise = await prismaPostgres.exercise_master.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.purpose !== undefined && { purpose: data.purpose }),
      ...(data.media_type && { media_type: data.media_type as any }),
      ...(data.media_url !== undefined && { media_url: data.media_url }),
      ...(data.frequencyPeriod && { frequencyPeriod: data.frequencyPeriod as any }),
      ...(data.unit && { unit: data.unit as any }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.setUnit !== undefined && { setUnit: data.setUnit }),
      ...(data.repetition !== undefined && { repetition: data.repetition }),
      ...(data.procedure !== undefined && { procedure: data.procedure }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.show_checkbox !== undefined && { show_checkbox: data.show_checkbox }),
      modUser: userId,
      modDate: new Date(),
    },
  });

  return exercise;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(id: number) {
  const exercise = await prismaPostgres.exercise_master.delete({
    where: { id },
  });

  return exercise;
}

/**
 * Check if exercise exists by title
 */
export async function exerciseExistsByTitle(
  title: string,
  excludeId?: number
) {
  const where: Prisma.exercise_masterWhereInput = {
    title: { equals: title, mode: 'insensitive' },
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const exercise = await prismaPostgres.exercise_master.findFirst({
    where,
    select: { id: true },
  });

  return !!exercise;
}

/**
 * Get exercise statistics
 */
export async function getExerciseStats() {
  const [
    total,
    byMediaType,
    byUnit,
    byFrequencyPeriod,
  ] = await Promise.all([
    prismaPostgres.exercise_master.count(),
    prismaPostgres.exercise_master.groupBy({
      by: ['media_type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prismaPostgres.exercise_master.groupBy({
      by: ['unit'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prismaPostgres.exercise_master.groupBy({
      by: ['frequencyPeriod'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total,
    byMediaType,
    byUnit,
    byFrequencyPeriod,
  };
}
