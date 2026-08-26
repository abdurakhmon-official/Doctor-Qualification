/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },

  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
};
