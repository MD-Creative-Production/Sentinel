/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  rootDir: '.',
  testMatch: [
    '<rootDir>/apps/dashboard/**/*.spec.tsx',
    '<rootDir>/apps/dashboard/**/*.spec.ts',
    '<rootDir>/apps/web/**/*.spec.tsx',
    '<rootDir>/apps/web/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          jsx: 'react-jsx',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
          // Treat CSS imports as any — they are mocked anyway
          paths: {},
        },
        diagnostics: {
          ignoreCodes: ['TS2882', 'TS7016'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/__mocks__/styleMock.js',
  },
};
