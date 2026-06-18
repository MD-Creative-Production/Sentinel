module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'apps/dashboard/tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: { node: true },
  ignorePatterns: ['.eslintrc.js', 'dist/**'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Files outside all tsconfigs — lint without type-aware rules
      files: ['observability/**/*.ts', 'prisma/**/*.ts', 'src/**/*.ts', 'apps/web/**/*.ts', 'apps/web/**/*.tsx', 'env.d.ts'],
      parserOptions: {
        project: null,
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
