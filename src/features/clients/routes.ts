import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { prismaPostgres } from '@/db/postgres/client';

const router = Router();

/**
 * GET /clients
 * Get all clients (Super Admin only)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Only super admin can view all clients
    if (!user.roles.includes('SUPER_ADMIN')) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Access denied. Super Admin role required.')
      );
      return;
    }

    const clients = await prismaPostgres.client.findMany({
      include: {
        clientLocation: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            user: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(StatusCodes.OK).json(
      ApiResponse.success({
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          description: client.description,
          timeZone: client.timeZone,
          status: client.status,
          logo: client.logo,
          website: client.website,
          userCount: client._count.user,
          locations: client.clientLocation,
          createdAt: client.crDate
        }))
      }, 'Clients retrieved successfully')
    );
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve clients')
    );
  }
});

/**
 * GET /clients/:id
 * Get client by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Users can only view their own client or super admin can view any
    if (user.clientId !== Number(id) && !user.roles.includes('SUPER_ADMIN')) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Access denied to this client')
      );
      return;
    }

    const client = await prismaPostgres.client.findUnique({
      where: { id: Number(id) },
      include: {
        clientLocation: true,
        contact: true,
        _count: {
          select: {
            user: true,
            msgGroup: true
          }
        }
      }
    });

    if (!client) {
      res.status(StatusCodes.NOT_FOUND).json(
        ApiResponse.error('Client not found')
      );
      return;
    }

    res.status(StatusCodes.OK).json(
      ApiResponse.success({
        id: client.id,
        name: client.name,
        description: client.description,
        timeZone: client.timeZone,
        status: client.status,
        logo: client.logo,
        favIcon: client.favIcon,
        language: client.language,
        website: client.website,
        extraInfo: client.extraInfo,
        userCount: client._count.user,
        messageGroupCount: client._count.msgGroup,
        locations: client.clientLocation,
        contacts: client.contact,
        createdAt: client.crDate,
        modifiedAt: client.modDate
      }, 'Client retrieved successfully')
    );
  } catch (error) {
    console.error('Get client error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve client')
    );
  }
});

/**
 * POST /clients
 * Create new client (Super Admin only)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.roles.includes('SUPER_ADMIN')) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Access denied. Super Admin role required.')
      );
      return;
    }

    const { name, description, timeZone, language, website } = req.body;

    if (!name) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Client name is required')
      );
      return;
    }

    const client = await prismaPostgres.client.create({
      data: {
        name,
        description,
        timeZone: timeZone || 'UTC',
        language: language || 'en',
        website,
        status: 1, // Active
        crUser: user.id.toString(),
        modUser: user.id.toString()
      }
    });

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(client, 'Client created successfully')
    );
  } catch (error) {
    console.error('Create client error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create client')
    );
  }
});

export default router;