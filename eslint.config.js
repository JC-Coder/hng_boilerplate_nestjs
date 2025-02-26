import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        fetch: 'readonly',
        Express: 'readonly',
        BufferEncoding: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 13,
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/**/domain/**.*ts',
              from: './src/**/infra/**/*.ts',
            },
            {
              target: './src/**/domain/**.*ts',
              from: './src/**/usecases/**/*.ts',
            },
            {
              target: './src/**/domain/**.*ts',
              from: './src/**/app/**/*.ts',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['build/', 'public/', '/docs'],
  },
  {
    files: ['**/*.{js,ts,tsx,jsx}'],
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
];
