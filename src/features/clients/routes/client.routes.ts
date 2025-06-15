import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { validateJsonField, clientExtraInfoSchema } from '@/shared/schemas/json-schemas';
import type { ClientExtraInfo } from '@/shared/schemas/json-schemas';
import { ApiResponse } from '@/shared/utils/api-response';
import { prismaPostgres } from '@/db/postgres/client';

const router = Router();

/**
 * POST /clients
 * Create new client with Zod JSON validation
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

    const { name, description, timeZone, language, website, extraInfo } = req.body;

    if (!name) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Client name is required')
      );
      return;
    }

    // ✅ Validate extraInfo with Zod
    let sanitizedExtraInfo: ClientExtraInfo | null = null;
    if (extraInfo) {
      const validation = validateJsonField(extraInfo, clientExtraInfoSchema, 'extraInfo');
      
      if (!validation.success) {
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error('Invalid extraInfo format', validation.errors.join(', '))
        );
        return;
      }
      
      sanitizedExtraInfo = validation.data;
    }

    const client = await prismaPostgres.client.create({
      data: {
        name,
        description,
        timeZone: timeZone || 'UTC',
        language: language || 'en',
        website,
        extraInfo: sanitizedExtraInfo || undefined, // ✅ Type-safe validated JSON
        status: 1,
        crUser: user.id.toString(),
        modUser: user.id.toString()
      }
    });

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success({
        ...client,
        extraInfo: client.extraInfo as ClientExtraInfo // ✅ Type-safe response
      }, 'Client created successfully')
    );
  } catch (error) {
    console.error('Create client error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create client')
    );
  }
});