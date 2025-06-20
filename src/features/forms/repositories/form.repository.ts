/**
 * FORM REPOSITORY - Database access layer
 * 
 * This file handles all database operations for form_master.
 * It provides a clean abstraction layer between the service and database.
 */

import prismaPostgres from '@/db/postgres/client';
import { Prisma } from '@/db/postgres/generated/postgres-client';
import type { CreateFormDto, UpdateFormDto, FormQueryDto } from '../dto';

// ===================================================================
// 🎯 REPOSITORY FUNCTIONS
// ===================================================================

/**
 * Get all forms with filtering and pagination
 */
export async function getForms(params: {
  page: number;
  limit: number;
  clientId: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const { page, limit, clientId, search, sortBy = 'name', sortOrder = 'asc' } = params;
  const skip = (page - 1) * limit;

  try {
    // Build where clause with multi-tenant isolation
    const where: Prisma.form_masterWhereInput = {
      clientid: clientId,
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: Prisma.form_masterOrderByWithRelationInput = {};
    if (sortBy === 'crDate') {
      orderBy.crdate = sortOrder as Prisma.SortOrder;
    } else if (sortBy === 'modDate') {
      orderBy.moddate = sortOrder as Prisma.SortOrder;
    } else {
      orderBy.name = sortOrder as Prisma.SortOrder;
    }

    // Execute queries in parallel for better performance
    const [forms, total] = await Promise.all([
      prismaPostgres.form_master.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prismaPostgres.form_master.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching forms:', error);
    throw new Error('Failed to fetch forms');
  }
}

/**
 * Get form by ID with client isolation
 */
export async function getFormById(id: number, clientId: number) {
  try {
    const form = await prismaPostgres.form_master.findFirst({
      where: {
        id,
        clientid: clientId,
      },
    });

    return form;
  } catch (error) {
    console.error('Error fetching form by ID:', error);
    throw new Error('Failed to fetch form');
  }
}

/**
 * Create a new form
 */
export async function createForm(
  data: CreateFormDto & { clientId: number; modUser: string }
) {
  try {
    const form = await prismaPostgres.form_master.create({
      data: {
        name: data.name,
        description: data.description || null,
        clientid: data.clientId,
        cruser: data.modUser,
        moduser: data.modUser,
        crdate: new Date(),
        moddate: new Date(),
      },
    });

    return form;
  } catch (error) {
    console.error('Error creating form:', error);
    
    // Check for unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Form name already exists for this client');
      }
    }
    
    throw new Error('Failed to create form');
  }
}

/**
 * Update form by ID with client isolation
 */
export async function updateForm(
  id: number,
  data: UpdateFormDto,
  clientId: number,
  modUser: string
) {
  try {
    // First check if form exists and belongs to client
    const existingForm = await getFormById(id, clientId);
    if (!existingForm) {
      return null;
    }

    const updatedForm = await prismaPostgres.form_master.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        moduser: modUser,
        moddate: new Date(),
      },
    });

    return updatedForm;
  } catch (error) {
    console.error('Error updating form:', error);
    
    // Check for unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Form name already exists for this client');
      }
    }
    
    throw new Error('Failed to update form');
  }
}

/**
 * Delete form by ID with client isolation
 */
export async function deleteForm(id: number, clientId: number) {
  try {
    // First check if form exists and belongs to client
    const existingForm = await getFormById(id, clientId);
    if (!existingForm) {
      return false;
    }

    await prismaPostgres.form_master.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Error deleting form:', error);
    throw new Error('Failed to delete form');
  }
}

/**
 * Check if form name exists for client (for uniqueness validation)
 */
export async function checkFormNameExists(
  name: string,
  clientId: number,
  excludeId?: number
) {
  try {
    const where: Prisma.form_masterWhereInput = {
      name: { equals: name, mode: 'insensitive' },
      clientid: clientId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const form = await prismaPostgres.form_master.findFirst({ where });
    return !!form;
  } catch (error) {
    console.error('Error checking form name existence:', error);
    throw new Error('Failed to check form name');
  }
}

/**
 * Get form statistics for a client
 */
export async function getFormStats(clientId: number) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalForms, formsThisMonth, latestForm] = await Promise.all([
      // Total forms count
      prismaPostgres.form_master.count({
        where: { clientid: clientId },
      }),

      // Forms created this month
      prismaPostgres.form_master.count({
        where: {
          clientid: clientId,
          crdate: { gte: startOfMonth },
        },
      }),

      // Latest form
      prismaPostgres.form_master.findFirst({
        where: { clientid: clientId },
        orderBy: { crdate: 'desc' },
      }),
    ]);

    return {
      totalForms,
      activeForms: totalForms, // All forms are considered active
      formsThisMonth,
      latestForm,
    };
  } catch (error) {
    console.error('Error fetching form statistics:', error);
    throw new Error('Failed to fetch form statistics');
  }
}

/**
 * Bulk delete forms with client isolation
 */
export async function bulkDeleteForms(ids: number[], clientId: number) {
  try {
    // First verify all forms exist and belong to the client
    const existingForms = await prismaPostgres.form_master.findMany({
      where: {
        id: { in: ids },
        clientid: clientId,
      },
      select: { id: true },
    });

    const existingIds = existingForms.map(form => form.id);

    if (existingIds.length === 0) {
      return 0;
    }

    const result = await prismaPostgres.form_master.deleteMany({
      where: {
        id: { in: existingIds },
        clientid: clientId,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error bulk deleting forms:', error);
    throw new Error('Failed to bulk delete forms');
  }
}
