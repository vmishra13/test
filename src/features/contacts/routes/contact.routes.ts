import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { prismaPostgres } from '@/db/postgres/client';

const router = Router();

/**
 * GET /contacts
 * Get contacts for current user/client
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { type } = req.query;

    const whereClause: any = {
      OR: [
        { userId: user.id },
        { clientId: user.clientId }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const contacts = await prismaPostgres.contact.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        // clientLocation: { // Removed - not a direct relation on contact
        //   select: {
        //     id: true,
        //     name: true
        //   }
        // }
      },
      orderBy: { crDate: 'desc' }
    });

    res.status(StatusCodes.OK).json(
      ApiResponse.success({ contacts }, 'Contacts retrieved successfully')
    );
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve contacts')
    );
  }
});

/**
 * POST /contacts
 * Create a new contact
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, value, locationId, default: isDefault } = req.body;

    if (!type || !value) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Type and value are required')
      );
      return;
    }

    const contact = await prismaPostgres.contact.create({
      data: {
        type,
        value,
        userId: user.id,
        clientId: user.clientId,
        default: isDefault || false,
        status: 'active',
        crUser: user.id.toString(),
        modUser: user.id.toString(), // Add required modUser field
      }
    });

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(contact, 'Contact created successfully')
    );
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create contact')
    );
  }
});

export default router;