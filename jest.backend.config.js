/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/apps/backend/**/*.spec.ts', '<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strict: true,
        skipLibCheck: true,
        ignoreDeprecations: '6.0',
        types: ['jest', 'node'],
      },
    }],
  },
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/apps/backend/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/apps/backend/src/modules/$1',
  },
  collectCoverageFrom: ['apps/backend/src/**/*.ts', 'src/**/*.ts', '!**/*.module.ts'],
};
