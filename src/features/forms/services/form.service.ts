/**
 * FORM SERVICE - Business logic layer
 * 
 * This file contains the business logic for form operations.
 * It acts as an intermediary between controllers and repositories.
 */

import * as formRepository from '../repositories/form.repository';
import type { CreateFormDto, UpdateFormDto, FormQueryDto } from '../dto';
import { 
  createFormSchema, 
  updateFormSchema, 
  formQuerySchema, 
  healthcareFormValidation 
} from '../validators';

// ===================================================================
// 🎯 SERVICE FUNCTIONS
// ===================================================================

/**
 * Get all forms with filtering and pagination
 */
export async function getAllForms(
  query: FormQueryDto, 
  clientId: number
) {
  // Validate query parameters
  const validatedQuery = formQuerySchema.parse(query);
  
  const params = {
    page: validatedQuery.page,
    limit: validatedQuery.limit,
    clientId,
    search: validatedQuery.search,
    sortBy: validatedQuery.sortBy,
    sortOrder: validatedQuery.sortOrder,
  };

  return await formRepository.getForms(params);
}

/**
 * Get form by ID with client validation
 */
export async function getFormById(id: number, clientId: number) {
  if (!id || id <= 0) {
    throw new Error('Invalid form ID');
  }

  const form = await formRepository.getFormById(id, clientId);
  
  if (!form) {
    throw new Error('Form not found or access denied');
  }

  return form;
}

/**
 * Create a new form with validation
 */
export async function createForm(
  data: CreateFormDto,
  clientId: number,
  modUser: string
) {
  // Validate input data
  const validatedData = createFormSchema.parse({
    ...data,
    clientId,
  });

  // Additional healthcare-specific validation
  await healthcareFormValidation.parseAsync({
    name: validatedData.name,
    description: validatedData.description,
  });

  // Check if form name already exists for this client
  const nameExists = await formRepository.checkFormNameExists(
    validatedData.name,
    clientId
  );

  if (nameExists) {
    throw new Error('Form name already exists for this organization');
  }

  // Create the form
  const formData = {
    name: validatedData.name,
    description: validatedData.description,
    clientId,
    modUser,
  };

  return await formRepository.createForm(formData);
}

/**
 * Update form with validation
 */
export async function updateForm(
  id: number,
  data: UpdateFormDto,
  clientId: number,
  modUser: string
) {
  if (!id || id <= 0) {
    throw new Error('Invalid form ID');
  }

  // Validate input data
  const validatedData = updateFormSchema.parse(data);

  // If name is being updated, check for uniqueness
  if (validatedData.name) {
    // Additional healthcare-specific validation
    await healthcareFormValidation.parseAsync({
      name: validatedData.name,
      description: validatedData.description,
    });

    const nameExists = await formRepository.checkFormNameExists(
      validatedData.name,
      clientId,
      id // Exclude current form from uniqueness check
    );

    if (nameExists) {
      throw new Error('Form name already exists for this organization');
    }
  }

  const updatedForm = await formRepository.updateForm(
    id,
    validatedData,
    clientId,
    modUser
  );

  if (!updatedForm) {
    throw new Error('Form not found or access denied');
  }

  return updatedForm;
}

/**
 * Delete form with validation
 */
export async function deleteForm(id: number, clientId: number) {
  if (!id || id <= 0) {
    throw new Error('Invalid form ID');
  }

  const deleted = await formRepository.deleteForm(id, clientId);

  if (!deleted) {
    throw new Error('Form not found or access denied');
  }

  return { success: true, message: 'Form deleted successfully' };
}

/**
 * Get form statistics for dashboard
 */
export async function getFormStatistics(clientId: number) {
  return await formRepository.getFormStats(clientId);
}

/**
 * Bulk delete forms
 */
export async function bulkDeleteForms(
  formIds: number[],
  clientId: number
) {
  if (!formIds || formIds.length === 0) {
    throw new Error('No form IDs provided');
  }

  if (formIds.length > 50) {
    throw new Error('Cannot delete more than 50 forms at once');
  }

  // Validate all IDs are positive integers
  const invalidIds = formIds.filter(id => !id || id <= 0);
  if (invalidIds.length > 0) {
    throw new Error('Invalid form IDs provided');
  }

  const deletedCount = await formRepository.bulkDeleteForms(formIds, clientId);

  return {
    success: true,
    message: `Successfully deleted ${deletedCount} form(s)`,
    deletedCount,
    requestedCount: formIds.length,
  };
}

/**
 * Validate form name availability
 */
export async function validateFormName(
  name: string,
  clientId: number,
  excludeId?: number
) {
  if (!name || name.trim().length === 0) {
    return { available: false, message: 'Form name is required' };
  }

  if (name.length > 255) {
    return { available: false, message: 'Form name too long (max 255 characters)' };
  }

  // Check healthcare naming conventions
  try {
    await healthcareFormValidation.parseAsync({ name });
  } catch (error) {
    return { 
      available: false, 
      message: 'Form name should follow healthcare naming conventions' 
    };
  }

  const exists = await formRepository.checkFormNameExists(
    name,
    clientId,
    excludeId
  );

  return {
    available: !exists,
    message: exists 
      ? 'Form name already exists for this organization' 
      : 'Form name is available',
  };
}

/**
 * Search forms with advanced filters
 */
export async function searchForms(
  searchTerm: string,
  clientId: number,
  options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new Error('Search term is required');
  }

  const params = {
    page: options?.page || 1,
    limit: options?.limit || 20,
    clientId,
    search: searchTerm.trim(),
    sortBy: options?.sortBy || 'name',
    sortOrder: options?.sortOrder || 'asc',
  };

  return await formRepository.getForms(params);
}

/**
 * Export forms data for reporting
 */
export async function exportForms(clientId: number) {
  const allForms = await formRepository.getForms({
    page: 1,
    limit: 1000, // Reasonable limit for export
    clientId,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Transform data for export
  const exportData = allForms.data.map(form => ({
    ID: form.id,
    Name: form.name,
    Description: form.description || '',
    CreatedBy: form.crUser,
    CreatedDate: form.crDate ? form.crDate.toISOString().split('T')[0] : '',
    ModifiedBy: form.modUser,
    ModifiedDate: form.modDate ? form.modDate.toISOString().split('T')[0] : '',
  }));

  return {
    data: exportData,
    totalRecords: allForms.pagination.total,
    exportedAt: new Date().toISOString(),
    clientId,
  };
}

/**
 * Health check for form service
 */
export async function healthCheck() {
  try {
    // Test basic database connectivity through repository
    await formRepository.getForms({
      page: 1,
      limit: 1,
      clientId: 1, // Use a test client ID
    });
    
    return { 
      status: 'healthy',
      service: 'Form Service',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { 
      status: 'unhealthy',
      service: 'Form Service',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
