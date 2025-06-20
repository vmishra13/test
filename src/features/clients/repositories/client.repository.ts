/**
 * CLIENT REPOSITORY - Data Access Layer
 * 
 * Pure database operations for client management
 * Follows the same pattern as users repository for consistency
 */

import { prismaPostgres } from '@/db/postgres/client';
import type { 
  ClientFilters, 
  CreateClientRequest, 
  UpdateClientRequest,
  ClientExtraInfo 
} from '../dto/client.dto';

// ===================================================================
// 🔍 READ OPERATIONS
// ===================================================================

/**
 * Get clients with filters and pagination
 */
export async function getClientsWithFilters(filters: ClientFilters) {
  const skip = (filters.page - 1) * filters.limit;
  
  const whereClause: any = {};
  
  // Add search filter
  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  
  // Add status filter
  if (filters.status !== undefined) {
    whereClause.status = filters.status;
  }
  
  const orderBy = { name: filters.sort };
  
  // Build include clause based on requirements
  const include: any = {};
  
  if (filters.includeLocations) {
    include.locations = {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        status: true,
      },
    };
  }
  
  if (filters.includeContacts) {
    include.contacts = {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isPrimary: true,
      },
    };
  }
  
  if (filters.includeCounts) {
    include._count = {
      select: {
        users: true,
        locations: true,
      },
    };
  }
  
  const [clients, total] = await Promise.all([
    prismaPostgres.client.findMany({
      where: whereClause,
      include,
      orderBy,
      skip,
      take: filters.limit,
    }),
    prismaPostgres.client.count({ where: whereClause }),
  ]);
  
  return {
    clients,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

/**
 * Find client by ID with optional includes
 */
export async function findClientById(
  id: number, 
  options: {
    includeLocations?: boolean;
    includeContacts?: boolean;
    includeCounts?: boolean;
  } = {}
) {
  const include: any = {};
  
  if (options.includeLocations) {
    include.locations = true;
  }
  
  if (options.includeContacts) {
    include.contacts = true;
  }
  
  if (options.includeCounts) {
    include._count = {
      select: {
        users: true,
        locations: true,
      },
    };
  }
  
  return await prismaPostgres.client.findUnique({
    where: { id },
    include,
  });
}

/**
 * Check if client exists and is active
 */
export async function isClientActive(id: number): Promise<boolean> {
  const client = await prismaPostgres.client.findUnique({
    where: { id },
    select: { status: true },
  });
  
  return client?.status === 1;
}

/**
 * Find client by name (for uniqueness validation)
 */
export async function findClientByName(name: string) {
  return await prismaPostgres.client.findFirst({
    where: { 
      name: { 
        equals: name, 
        mode: 'insensitive' 
      } 
    },
  });
}

// ===================================================================
// ✏️ WRITE OPERATIONS
// ===================================================================

/**
 * Create new client
 */
export async function createClient(data: CreateClientRequest, createdBy: string) {
  return await prismaPostgres.client.create({
    data: {
      name: data.name,
      description: data.description,
      timeZone: data.timeZone || 'UTC',
      language: data.language || 'en',
      website: data.website,
      logo: data.logo,
      favIcon: data.favIcon,
      extraInfo: data.extraInfo as any, // JSON field
      status: 1, // Active by default
      crUser: createdBy,
      modUser: createdBy,
    },
    include: {
      _count: {
        select: {
          users: true,
          locations: true,
        },
      },
    },
  });
}

/**
 * Update client
 */
export async function updateClient(
  id: number, 
  data: UpdateClientRequest, 
  modifiedBy: string
) {
  return await prismaPostgres.client.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.timeZone && { timeZone: data.timeZone }),
      ...(data.language && { language: data.language }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.favIcon !== undefined && { favIcon: data.favIcon }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.extraInfo !== undefined && { extraInfo: data.extraInfo as any }),
      modUser: modifiedBy,
      modDate: new Date(),
    },
    include: {
      _count: {
        select: {
          users: true,
          locations: true,
        },
      },
    },
  });
}

/**
 * Update client status (activate/deactivate)
 */
export async function updateClientStatus(
  id: number, 
  status: number, 
  modifiedBy: string
) {
  return await prismaPostgres.client.update({
    where: { id },
    data: {
      status,
      modUser: modifiedBy,
      modDate: new Date(),
    },
  });
}

/**
 * Soft delete client (set status to inactive)
 */
export async function softDeleteClient(id: number, deletedBy: string) {
  return await updateClientStatus(id, 0, deletedBy);
}

// ===================================================================
// 📊 ANALYTICS & STATISTICS
// ===================================================================

/**
 * Get client statistics
 */
export async function getClientStats() {
  const [totalClients, activeClients, inactiveClients] = await Promise.all([
    prismaPostgres.client.count(),
    prismaPostgres.client.count({ where: { status: 1 } }),
    prismaPostgres.client.count({ where: { status: 0 } }),
  ]);
  
  return {
    total: totalClients,
    active: activeClients,
    inactive: inactiveClients,
  };
}

/**
 * Get client user counts
 */
export async function getClientUserCounts() {
  return await prismaPostgres.client.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
