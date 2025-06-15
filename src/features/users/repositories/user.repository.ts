import prismaPostgres from '@db/postgres/client';
import bcrypt from 'bcrypt';
import {
  UserWithAuthData,
  UserWithPassword,
  UserUpdateInput,
  UserRoleAssignment,
} from '../validators/user.validators';
import {
  UserProfile,
  UserSearchQuery,
  UserSearchResult,
  CreatedUserSummary,
  type UserCreationData,
} from '../dto/user.dto';
import type {
  CreateUserWithRolesData,
  CreateUserResult,
  ClientValidationResult,
  UserTypeValidationResult,
} from '../dto/registration.dto';
import type { CoreRole } from '@shared/constants';

// ===================================================================
// 🎯 AUTHENTICATION-FOCUSED QUERIES
// ===================================================================

/**
 * Find user with all authentication data (for login)
 * Includes: user + client + userType + roles + passwords
 */
export async function findUserWithAuthData(
  loginName: string,
  clientId?: number,
): Promise<UserWithAuthData | null> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        loginName,
        ...(clientId && { clientId }),
        status: { not: -99 }, // Exclude deleted users
      },
      include: {
        client: true,
        userType: true,
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithAuthData | null;
  } catch (error) {
    throw new Error(`Failed to find user with auth data: ${error}`);
  }
}

/**
 * Find user with password for authentication validation
 */
export async function findUserWithPassword(
  loginName: string,
  clientId?: number,
): Promise<UserWithPassword | null> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        loginName,
        ...(clientId && { clientId }),
        status: { not: -99 },
      },
      include: {
        password: {
          orderBy: { crDate: 'desc' },
          take: 1, // Get most recent password
        },
        client: true,
        userType: true,
      },
    });

    return user as UserWithPassword | null;
  } catch (error) {
    throw new Error(`Failed to find user with password: ${error}`);
  }
}

/**
 * Find user by ID with authentication context
 */
export async function findUserById(userId: number): Promise<UserWithAuthData | null> {
  try {
    const user = await prismaPostgres.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        client: true,
        userType: true,
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithAuthData | null;
  } catch (error) {
    throw new Error(`Failed to find user by ID: ${error}`);
  }
}

/**
 * Find user by email (for password reset, etc.)
 */
export async function findUserByEmail(
  email: string,
  clientId?: number,
): Promise<UserWithAuthData | null> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        email,
        ...(clientId && { clientId }),
        status: { not: -99 },
      },
      include: {
        client: true,
        userType: true,
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    return user as UserWithAuthData | null;
  } catch (error) {
    throw new Error(`Failed to find user by email: ${error}`);
  }
}

// ===================================================================
// 🎯 USER REGISTRATION AND CREATION
// ===================================================================

/**
 * Create new user with transaction support
 */
export async function createUser(
  userData: UserCreationData,
  crUser: string,
): Promise<CreatedUserSummary> {
  try {
    return await prismaPostgres.$transaction(async tx => {
      // 1. Create the user
      const newUser = await tx.user.create({
        data: {
          clientId: userData.clientId,
          userTypeId: userData.userTypeId,
          loginName: userData.loginName,
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          dob: userData.dob ? new Date(userData.dob) : null,
          mrn: userData.mrn || null,
          gender: userData.gender || null,
          timeZone: userData.timeZone || null,
          status: 1, // Active status
          crUser,
        },
      });

      // 2. Create password record
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      await tx.password.create({
        data: {
          userId: newUser.id,
          password: hashedPassword,
          crUser,
        },
      });

      // 3. Assign roles if provided
      if (userData.roleIds && userData.roleIds.length > 0) {
        const roleAssignments = userData.roleIds.map(roleId => ({
          userId: newUser.id,
          roleId,
          clientId: userData.clientId,
          crUser,
        }));

        await tx.user_role.createMany({
          data: roleAssignments,
        });
      }

      return {
        id: newUser.id,
        loginName: newUser.loginName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        clientId: newUser.clientId,
        userTypeId: newUser.userTypeId,
        status: newUser.status,
        createdAt: newUser.crDate,
      };
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('loginName')) {
        throw new Error('Login name already exists');
      }
      if (target?.includes('email')) {
        throw new Error('Email already exists');
      }
    }
    throw new Error(`Failed to create user: ${error}`);
  }
}

/**
 * Check if login name exists
 */
export async function isLoginNameTaken(loginName: string, clientId?: number): Promise<boolean> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        loginName,
        ...(clientId && { clientId }),
      },
      select: { id: true },
    });

    return !!user;
  } catch (error) {
    throw new Error(`Failed to check login name: ${error}`);
  }
}

/**
 * Check if email exists
 */
export async function isEmailTaken(email: string, clientId?: number): Promise<boolean> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        email,
        ...(clientId && { clientId }),
      },
      select: { id: true },
    });

    return !!user;
  } catch (error) {
    throw new Error(`Failed to check email: ${error}`);
  }
}

// ===================================================================
// 🎯 USER PROFILE MANAGEMENT
// ===================================================================

/**
 * Get complete user profile
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    const user = await prismaPostgres.user.findUnique({
      where: { id: userId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            timeZone: true,
            logo: true,
          },
        },
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userRole: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        contact: {
          select: {
            id: true,
            type: true,
            value: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      loginName: user.loginName,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      dob: user.dob,
      mrn: user.mrn,
      gender: user.gender,
      timeZone: user.timeZone,
      profilePicture: user.profilePicture,
      passExpireInDays: user.passExpireInDays,
      status: user.status,
      client: user.client,
      userType: user.userType,
      roles: user.userRole.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        assignedAt: ur.crDate,
        assignedBy: ur.crUser,
      })),
      contacts: user.contact.map(c => ({
        id: c.id,
        type: c.type,
        value: c.value,
      })),
      createdAt: user.crDate,
      updatedAt: user.modDate,
    };
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error}`);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updateData: UserUpdateInput,
  modUser: string,
): Promise<UserProfile> {
  try {
    const updatedUser = await prismaPostgres.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        modUser,
        modDate: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            timeZone: true,
            logo: true,
          },
        },
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userRole: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        contact: {
          select: {
            id: true,
            type: true,
            value: true,
          },
        },
      },
    });

    return {
      id: updatedUser.id,
      loginName: updatedUser.loginName,
      firstName: updatedUser.firstName,
      middleName: updatedUser.middleName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      dob: updatedUser.dob,
      mrn: updatedUser.mrn,
      gender: updatedUser.gender,
      timeZone: updatedUser.timeZone,
      profilePicture: updatedUser.profilePicture,
      passExpireInDays: updatedUser.passExpireInDays,
      status: updatedUser.status,
      client: updatedUser.client,
      userType: updatedUser.userType,
      roles: updatedUser.userRole.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        assignedAt: ur.crDate,
        assignedBy: ur.crUser,
      })),
      contacts: updatedUser.contact.map(c => ({
        id: c.id,
        type: c.type,
        value: c.value,
      })),
      createdAt: updatedUser.crDate,
      updatedAt: updatedUser.modDate,
    };
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error}`);
  }
}

// ===================================================================
// 🎯 USER SEARCH AND LISTING
// ===================================================================

/**
 * Search users with pagination and filtering
 */
export async function searchUsers(
  query: UserSearchQuery,
): Promise<{ users: UserSearchResult[]; total: number }> {
  try {
    const {
      query: searchQuery,
      clientId,
      userTypeId,
      roleId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'loginName',
      sortOrder = 'asc',
    } = query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: { not: -99 }, // Exclude deleted users
    };

    if (searchQuery) {
      where.OR = [
        { loginName: { contains: searchQuery, mode: 'insensitive' } },
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (clientId) where.clientId = clientId;
    if (userTypeId) where.userTypeId = userTypeId;
    if (status !== undefined) where.status = status;

    if (roleId) {
      where.userRole = {
        some: {
          roleId,
        },
      };
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prismaPostgres.user.findMany({
        where,
        include: {
          userType: {
            select: { name: true },
          },
          userRole: {
            include: {
              role: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prismaPostgres.user.count({ where }),
    ]);

    const searchResults: UserSearchResult[] = users.map(user => ({
      id: user.id,
      loginName: user.loginName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      userType: user.userType.name,
      roles: user.userRole.map(ur => ur.role.name),
      createdAt: user.crDate,
      // Note: lastLogin would need to be tracked separately
    }));

    return { users: searchResults, total };
  } catch (error) {
    throw new Error(`Failed to search users: ${error}`);
  }
}

// ===================================================================
// 🎯 ROLE MANAGEMENT
// ===================================================================

/**
 * Assign role to user
 */
export async function assignRole(assignment: UserRoleAssignment): Promise<void> {
  try {
    await prismaPostgres.user_role.create({
      data: assignment,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('User already has this role assigned');
    }
    throw new Error(`Failed to assign role: ${error}`);
  }
}

/**
 * Remove role from user
 */
export async function removeRole(userId: number, roleId: number, clientId: number): Promise<void> {
  try {
    await prismaPostgres.user_role.deleteMany({
      where: {
        userId,
        roleId,
        clientId,
      },
    });
  } catch (error) {
    throw new Error(`Failed to remove role: ${error}`);
  }
}

/**
 * Get user roles
 */
export async function getUserRoles(userId: number, clientId?: number): Promise<string[]> {
  try {
    const userRoles = await prismaPostgres.user_role.findMany({
      where: {
        userId,
        ...(clientId && { clientId }),
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return userRoles.map(ur => ur.role.name);
  } catch (error) {
    throw new Error(`Failed to get user roles: ${error}`);
  }
}

// ===================================================================
// 🎯 PASSWORD MANAGEMENT
// ===================================================================

/**
 * Update user password
 */
export async function updatePassword(
  userId: number,
  newPassword: string,
  crUser: string,
): Promise<void> {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prismaPostgres.password.create({
      data: {
        userId,
        password: hashedPassword,
        crUser,
      },
    });
  } catch (error) {
    throw new Error(`Failed to update password: ${error}`);
  }
}

/**
 * Verify user password
 */
export async function verifyPassword(userId: number, password: string): Promise<boolean> {
  try {
    const userPassword = await prismaPostgres.password.findFirst({
      where: { userId },
      orderBy: { crDate: 'desc' },
      take: 1,
    });

    if (!userPassword) return false;

    return await bcrypt.compare(password, userPassword.password);
  } catch (error) {
    throw new Error(`Failed to verify password: ${error}`);
  }
}

// ===================================================================
// 🎯 USER STATUS MANAGEMENT
// ===================================================================

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: number,
  status: number,
  modUser: string,
): Promise<void> {
  try {
    await prismaPostgres.user.update({
      where: { id: userId },
      data: {
        status,
        modUser,
        modDate: new Date(),
      },
    });
  } catch (error) {
    throw new Error(`Failed to update user status: ${error}`);
  }
}

/**
 * Soft delete user
 */
export async function softDeleteUser(userId: number, modUser: string): Promise<void> {
  try {
    await prismaPostgres.user.update({
      where: { id: userId },
      data: {
        status: -99, // Deleted status
        modUser,
        modDate: new Date(),
      },
    });
  } catch (error) {
    throw new Error(`Failed to delete user: ${error}`);
  }
}

// ===================================================================
// 🎯 ANALYTICS AND REPORTING
// ===================================================================

/**
 * Get user analytics
 */
export async function getUserAnalytics(clientId?: number): Promise<any> {
  try {
    const where = {
      status: { not: -99 },
      ...(clientId && { clientId }),
    };

    const [totalUsers, activeUsers, usersByType, usersByRole, recentRegistrations] =
      await Promise.all([
        prismaPostgres.user.count({ where }),
        prismaPostgres.user.count({ where: { ...where, status: 1 } }),
        prismaPostgres.user.groupBy({
          by: ['userTypeId'],
          where,
          _count: true,
        }),
        prismaPostgres.user_role.groupBy({
          by: ['roleId'],
          where: { user: where },
          _count: true,
        }),
        prismaPostgres.user.count({
          where: {
            ...where,
            crDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByType: usersByType.reduce(
        (acc, item) => {
          acc[item.userTypeId] = item._count;
          return acc;
        },
        {} as Record<number, number>,
      ),
      usersByRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.roleId] = item._count;
          return acc;
        },
        {} as Record<number, number>,
      ),
      recentRegistrations,
    };
  } catch (error) {
    throw new Error(`Failed to get user analytics: ${error}`);
  }
}

// ===================================================================
// 🎯 REGISTRATION-SPECIFIC FUNCTIONS (ADD THESE)
// ===================================================================

/**
 * Create user with roles in a transaction (for registration service)
 * This is a wrapper around your existing createUser function
 */
export async function createUserWithRoles(
  data: CreateUserWithRolesData,
): Promise<CreateUserResult> {
  try {
    return await prismaPostgres.$transaction(async tx => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          ...data.userData,
          firstName: data.userData.firstName || '',
          lastName: data.userData.lastName || '',
          email: data.userData.email || '',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              timeZone: true,
            },
          },
          userType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // 2. Create password
      await tx.password.create({
        data: {
          userId: user.id,
          password: data.password,
          status: 1, // Active
          crUser: data.createdBy,
        },
      });

      // 3. Assign roles
      const roleAssignments = data.roleIds.map(roleId => ({
        userId: user.id,
        clientId: data.userData.clientId,
        roleId: roleId,
        crUser: data.createdBy,
      }));

      await tx.user_role.createMany({
        data: roleAssignments,
      });

      // 4. Get assigned roles
      const roles = await tx.role.findMany({
        where: {
          id: {
            in: data.roleIds,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      // 5. Transform result to match CreateUserResult interface
      // Handle missing phoneNumber field by adding it explicitly
      const result: CreateUserResult = {
        user: {
          id: user.id,
          loginName: user.loginName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          timeZone: user.timeZone,
          profilePicture: user.profilePicture,
          clientId: user.clientId,
          userTypeId: user.userTypeId,
          status: user.status,
          crUser: user.crUser,
          crDate: user.crDate,
          modUser: user.modUser,
          modDate: user.modDate,
          client: {
            id: user.client.id,
            name: user.client.name,
            timeZone: user.client.timeZone,
          },
          userType: {
            id: user.userType.id,
            name: user.userType.name,
            description: user.userType.description,
          },
        },
        roles: roles,
      };

      return result;
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('loginName')) {
        throw new Error('User with this login name already exists');
      }
      if (target?.includes('email')) {
        throw new Error('User with this email already exists');
      }
    }
    throw new Error(`Failed to create user with roles: ${error.message}`);
  }
}

/**
 * Find client by ID with validation result format
 */
export async function findClientById(clientId: number): Promise<ClientValidationResult | null> {
  try {
    const client = await prismaPostgres.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!client) return null;

    const status = client.status ?? 0; // Default to 0 if null

    return {
      id: client.id,
      name: client.name,
      status,
      isActive: status === 1,
    };
  } catch (error: any) {
    throw new Error(`Failed to find client: ${error.message}`);
  }
}

/**
 * Find user type by ID with validation result format
 */
export async function findUserTypeById(
  userTypeId: number,
): Promise<UserTypeValidationResult | null> {
  try {
    const userType = await prismaPostgres.user_type.findUnique({
      where: { id: userTypeId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!userType) return null;

    return {
      id: userType.id,
      name: userType.name,
      description: userType.description ?? undefined, // Convert null to undefined
      isValid: true,
    };
  } catch (error: any) {
    throw new Error(`Failed to find user type: ${error.message}`);
  }
}

/**
 * Find roles by names (for role validation and ID resolution)
 */
export async function findRolesByNames(
  roleNames: CoreRole[],
): Promise<Array<{ id: number; name: string }>> {
  try {
    return await prismaPostgres.role.findMany({
      where: {
        name: {
          in: roleNames,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to find roles by names: ${error.message}`);
  }
}

/**
 * Get user registration statistics (enhanced version of your getUserAnalytics)
 */
export async function getUserRegistrationStats(clientId: number): Promise<{
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  recentRegistrations: number;
}> {
  try {
    const where = {
      clientId,
      status: { not: -99 },
    };

    // Get total users
    const totalUsers = await prismaPostgres.user.count({ where });

    // Get active users
    const activeUsers = await prismaPostgres.user.count({
      where: {
        ...where,
        status: 1,
      },
    });

    // Get users by role with role names
    const roleStats = await prismaPostgres.user_role.groupBy({
      by: ['roleId'],
      where: { clientId },
      _count: {
        userId: true,
      },
    });

    const usersByRole: Record<string, number> = {};
    for (const stat of roleStats) {
      const role = await prismaPostgres.role.findUnique({
        where: { id: stat.roleId },
        select: { name: true },
      });
      if (role) {
        usersByRole[role.name] = stat._count.userId;
      }
    }

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await prismaPostgres.user.count({
      where: {
        ...where,
        crDate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      recentRegistrations,
    };
  } catch (error: any) {
    throw new Error(`Failed to get registration statistics: ${error.message}`);
  }
}

/**
 * Find user by login name (simplified version for registration checks)
 */
export async function findUserByLoginName(loginName: string) {
  try {
    return await prismaPostgres.user.findUnique({
      where: { loginName },
      select: {
        id: true,
        loginName: true,
        email: true,
        clientId: true,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to find user by login name: ${error.message}`);
  }
}

/**
 * Get all roles (for registration form dropdowns)
 */
export async function getAllRoles(): Promise<
  Array<{ id: number; name: string; description: string | null }>
> {
  try {
    return await prismaPostgres.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to get all roles: ${error.message}`);
  }
}

/**
 * Get all user types (for registration form dropdowns)
 */
export async function getAllUserTypes(): Promise<
  Array<{ id: number; name: string; description: string | null }>
> {
  try {
    return await prismaPostgres.user_type.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to get all user types: ${error.message}`);
  }
}

/**
 * Check if user exists in client (for permission validation)
 */
export async function userExistsInClient(userId: number, clientId: number): Promise<boolean> {
  try {
    const user = await prismaPostgres.user.findFirst({
      where: {
        id: userId,
        clientId: clientId,
      },
    });

    return !!user;
  } catch (error: any) {
    throw new Error(`Failed to check user existence in client: ${error.message}`);
  }
}

export interface GetUsersFilters {
  page: number;
  limit: number;
  clientId?: number;
  role?: string;
  excludeRoles?: string[];
  status?: string;
  search?: string;
  sort?: 'asc' | 'desc';
}

export interface GetUsersResult {
  users: Array<{
    id: number;
    loginName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    status: number;
    crDate: Date;
    client: {
      id: number;
      name: string;
    };
    userType: {
      id: number;
      name: string;
    };
    roles: Array<{
      id: number;
      name: string;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Get users with advanced filtering and pagination
 */
export async function getUsersWithFilters(filters: GetUsersFilters): Promise<GetUsersResult> {
  try {
    const { page, limit, clientId, role, excludeRoles, status, search, sort } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: { not: -99 }, // Exclude deleted users
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = parseInt(status);
    }

    if (search) {
      where.OR = [
        { loginName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filtering through user_role junction table
    if (role || excludeRoles) {
      const roleConditions: any = {};

      if (role) {
        roleConditions.some = {
          role: {
            name: role,
          },
        };
      }

      if (excludeRoles && excludeRoles.length > 0) {
        roleConditions.none = {
          role: {
            name: { in: excludeRoles },
          },
        };
      }

      where.userRole = roleConditions;
    }

    // Get total count
    const total = await prismaPostgres.user.count({ where });

    // Get users with relations
    const users = await prismaPostgres.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ crDate: sort }, { loginName: 'asc' }],
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        userType: {
          select: {
            id: true,
            name: true,
          },
        },
        userRole: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      users: users.map(user => ({
        id: user.id,
        loginName: user.loginName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status!,
        crDate: user.crDate,
        client: user.client,
        userType: user.userType,
        roles: user.userRole.map(ur => ur.role),
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to get users with filters: ${error.message}`);
  }
}
