import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // Add custom rules here
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    // Console output is the interface of these command-line tools and tests.
    files: ['src/standalone.ts', 'src/pie-interpreter/solver/main.ts',
      'src/scheme-parser/compile-libs.ts', '**/__tests__/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    ignores: ['dist/**', '**/node_modules/**', '**/out/**', '**/*.d.ts', '*.config.js'],
  },
];
