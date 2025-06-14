import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';

const router = Router();

/**
 * GET /medications
 * List all medications
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // TODO: Implement actual database query
    const medications = [
      {
        id: 1,
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        description: 'Anti-inflammatory pain reliever',
        dosage: '200mg',
        frequency: 'Every 6 hours',
        type: 'Tablet',
        category: 'NSAID',
        sideEffects: ['Stomach upset', 'Dizziness'],
        contraindications: ['Kidney disease', 'Stomach ulcers'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Acetaminophen',
        genericName: 'Acetaminophen',
        brandName: 'Tylenol',
        description: 'Pain reliever and fever reducer',
        dosage: '500mg',
        frequency: 'Every 4-6 hours',
        type: 'Tablet',
        category: 'Analgesic',
        sideEffects: ['Rare allergic reactions'],
        contraindications: ['Liver disease'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    res.status(StatusCodes.OK).json(
      ApiResponse.success(medications, 'Medications retrieved successfully')
    );
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve medications')
    );
  }
});

/**
 * GET /medications/:medicationId
 * Get a specific medication
 */
router.get('/:medicationId', authenticate, async (req, res) => {
  try {
    const { medicationId } = req.params;
    
    // Validate medicationId is a number
    const id = parseInt(medicationId);
    if (isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Invalid medication ID')
      );
      return;
    }

    // TODO: Implement actual database query
    const medication = {
      id: id,
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      description: 'Anti-inflammatory pain reliever',
      dosage: '200mg',
      frequency: 'Every 6 hours',
      type: 'Tablet',
      category: 'NSAID',
      sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
      contraindications: ['Kidney disease', 'Stomach ulcers', 'Heart disease'],
      interactions: ['Blood thinners', 'ACE inhibitors'],
      instructions: [
        'Take with food to reduce stomach upset',
        'Do not exceed 1200mg in 24 hours',
        'Discontinue if rash appears'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(medication, 'Medication retrieved successfully')
    );
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve medication')
    );
  }
});

/**
 * POST /medications
 * Create a new medication
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      name,
      genericName,
      brandName,
      description,
      dosage,
      frequency,
      type,
      category,
      sideEffects,
      contraindications,
      interactions,
      instructions
    } = req.body;
    // Validation
    if (!name || !description || !dosage) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Name, description, and dosage are required')
      );
      return;
    }

    // TODO: Implement actual database creation
    const newMedication = {
      id: Date.now(),
      name,
      genericName: genericName || name,
      brandName: brandName || '',
      description,
      dosage,
      frequency: frequency || 'As needed',
      type: type || 'Tablet',
      category: category || 'General',
      sideEffects: sideEffects || [],
      contraindications: contraindications || [],
      interactions: interactions || [],
      instructions: instructions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(newMedication, 'Medication created successfully')
    );
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create medication')
    );
  }
});

/**
 * PUT /medications/:medicationId
 * Update a medication
 */
router.put('/:medicationId', authenticate, async (req, res) => {
  try {
    const { medicationId } = req.params;
    const { 
      name,
      genericName,
      brandName,
      description,
      dosage,
      frequency,
      type,
      category,
      sideEffects,
      contraindications,
      interactions,
      instructions
    } = req.body;

    // Validate medicationId is a number
    const id = parseInt(medicationId);
    if (isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Invalid medication ID')
      );
      return;
    }

    // TODO: Implement actual database update
    const updatedMedication = {
      id: id,
      name: name || 'Updated Medication',
      genericName: genericName || name || 'Updated Medication',
      brandName: brandName || '',
      description: description || 'Updated description',
      dosage: dosage || '100mg',
      frequency: frequency || 'As needed',
      type: type || 'Tablet',
      category: category || 'General',
      sideEffects: sideEffects || [],
      contraindications: contraindications || [],
      interactions: interactions || [],
      instructions: instructions || [],
      updatedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(updatedMedication, 'Medication updated successfully')
    );
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update medication')
    );
  }
});

/**
 * DELETE /medications/:medicationId
 * Delete a medication
 */
router.delete('/:medicationId', authenticate, async (req, res) => {
  try {
    const { medicationId } = req.params;

    // Validate medicationId is a number
    const id = parseInt(medicationId);
    if (isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Invalid medication ID')
      );
      return;
    }

    // TODO: Implement actual database deletion
    res.status(StatusCodes.OK).json(
      ApiResponse.success({ id }, 'Medication deleted successfully')
    );
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete medication')
    );
  }
});

/**
 * GET /medications/search
 * Search medications by name or category
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, category } = req.query;
    
    if (!q && !category) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Search query or category is required')
      );
      return;
    }

    // TODO: Implement actual database search
    const medications = [
      {
        id: 1,
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        category: 'NSAID',
        dosage: '200mg'
      }
    ];

    res.status(StatusCodes.OK).json(
      ApiResponse.success(medications, 'Search results retrieved successfully')
    );
  } catch (error) {
    console.error('Search medications error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to search medications')
    );
  }
});

export default router;