const js = require('@eslint/js');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');
const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.playwright-browsers/**',
      'playwright-report/**',
      'test-results/**',
      'allure-results/**',
      'allure-report/**',
      'data/credentials/**'
    ]
  },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node
      },
      parser: tseslint.parser
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...tseslint.configs.recommended.reduce((acc, cfg) => ({ ...acc, ...(cfg.rules ?? {}) }), {}),
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    files: ['tests/**/*.ts', 'hooks/**/*.ts', 'fixtures/**/*.ts'],
    plugins: {
      playwright
    },
    rules: {
      ...playwright.configs.recommended.rules
    }
  }
];
