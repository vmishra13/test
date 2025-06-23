/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Set test environment to Node.js
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "json",
    "lcov",
    "clover"
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/shared/constants/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@config$': '<rootDir>/src/config/index',
    '^@shared$': '<rootDir>/src/shared/index',
    '^@db$': '<rootDir>/src/db/index',
    '^@config/logger$': '<rootDir>/src/tests/__mocks__/logger.ts'
  },

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  
  // Separate test patterns (you can use these with --testNamePattern)
  // Unit tests: *.unit.test.ts
  // Integration tests: *.integration.test.ts
  // E2E tests: *.e2e.test.ts

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\\\dist\\\\",
    "modmed-module-extracted/"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'CommonJS',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        isolatedModules: true
      }
    }]
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};

export default config;
