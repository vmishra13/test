import { v4 as uuidv4 } from 'uuid';
import { User, Role } from '../models/user.model';

// In-memory users storage
const users: User[] = [
  // Add a default admin user for testing with plain text password
  {
    id: uuidv4(),
    username: 'admin@reliacare.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.SUPER_ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Find a user by username
 */
export const findByUsername = async (username: string): Promise<User | undefined> => {
  return users.find(user => user.username === username);
};

/**
 * Find a user by ID
 */
export const findById = async (id: string): Promise<User | undefined> => {
  return users.find(user => user.id === id);
};

/**
 * Create a new user
 */
export const create = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  const newUser: User = {
    ...user,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);
  return newUser;
};

// Export as a group for convenience
export const userRepository = {
  findByUsername,
  findById,
  create,
};
