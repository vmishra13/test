/**
 * CLIENT ROUTES - Main Entry Point
 * 
 * This file serves as the main entry point for all client-related routes.
 * It imports and uses the refactored controller/service pattern.
 * 
 * The business logic has been moved to:
 * - Controllers: handle HTTP requests/responses
 * - Services: handle business logic and validation
 * - Repositories: handle data access
 * - DTOs: define data transfer objects
 * - Validators: handle input validation
 */

import { Router } from 'express';
import clientRoutes from './routes/client.routes';

const router = Router();

// Mount client routes
router.use('/', clientRoutes);

export default router;
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
        userCount: client._count.users,
        // messageGroupCount: client._count.msgGroup, // Removed - table doesn't exist
        locations: client.locations,
        contacts: client.contacts,
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