import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { prismaPostgres } from '@/db/postgres/client';

const router = Router();

/**
 * GET /roles
 * Get all roles
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Only admins can view roles
    if (!user.roles.includes('SUPER_ADMIN') && !user.roles.includes('CLIENT_ADMIN')) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Access denied. Admin role required.')
      );
      return;
    }

    const roles = await prismaPostgres.role.findMany({
      include: {
        _count: {
          select: {
            userRole: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(StatusCodes.OK).json(
      ApiResponse.success({
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          userCount: role._count.userRole,
          createdAt: role.crDate
        }))
      }, 'Roles retrieved successfully')
    );
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve roles')
    );
  }
});

/**
 * POST /roles
 * Create a new role (Super Admin only)
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

    const { name, description } = req.body;

    if (!name) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Role name is required')
      );
      return;
    }

    const role = await prismaPostgres.role.create({
      data: {
        name,
        description,
        crUser: user.id.toString(),
        modUser: user.id.toString()
      }
    });

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(role, 'Role created successfully')
    );
  } catch (error) {
    console.error('Create role error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create role')
    );
  }
});

export default router;