/**
 * Jest Test Setup
 * 
 * This file runs before all tests to set up the testing environment
 */

import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;
const originalInfo = console.info;

beforeAll(() => {
  // Suppress console output during tests for cleaner output
  console.log = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  // Keep error logs for debugging failed tests
  // console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
  console.info = originalInfo;
});

// Global test utilities can be added here
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
}

// Export any test utilities
export {};
