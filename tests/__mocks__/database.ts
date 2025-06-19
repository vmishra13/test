/**
 * Database Mock for Integration Tests
 * 
 * This provides mock implementations for database operations
 */

// Mock Prisma client for PostgreSQL
export const mockPrismaClient = {
  todo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Add other models as needed
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

// Mock MongoDB client if you're using it
export const mockMongoClient = {
  // Add MongoDB mock operations
  connect: jest.fn(),
  close: jest.fn(),
  collection: jest.fn(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  })),
};

// Helper function to reset all database mocks
export const resetDatabaseMocks = () => {
  Object.values(mockPrismaClient).forEach(mock => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach(fn => {
        if (jest.isMockFunction(fn)) {
          fn.mockReset();
        }
      });
    } else if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
  
  Object.values(mockMongoClient).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
};

export default {
  postgres: mockPrismaClient,
  mongodb: mockMongoClient,
  resetAll: resetDatabaseMocks,
};
