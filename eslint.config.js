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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      // Prevent bypassing abstraction barriers
      'no-restricted-syntax': ['warn',
        {
          selector: 'CallExpression[callee.name="String"][arguments.length=1]',
          message: 'Avoid String() coercion on AST objects. Use readBack() → prettyPrint() for Values, or .prettyPrint() for Core nodes.',
        },
        {
          selector: 'TemplateLiteral > TemplateLiteralExpression > Identifier[name=/^(value|val|expr|core|goal|term)$/i]',
          message: 'Avoid template-literal interpolation of AST objects. Use readBack() → prettyPrint().',
        },
      ],
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
  // Frontend-specific rules: prevent importing interpreter internals
  {
    files: ['web-react/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error',
        {
          patterns: [
            { group: ['@pie/evaluator/*'], message: 'Frontend must not import evaluator internals. Use protocol types.' },
            { group: ['@pie/typechecker/*'], message: 'Frontend must not import typechecker internals. Use protocol types.' },
            { group: ['@pie/types/value'], message: 'Frontend must not import Value types. Use protocol string representations.' },
            { group: ['@pie/types/core'], message: 'Frontend must not import Core types. Use protocol string representations.' },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js'],
  },
];
