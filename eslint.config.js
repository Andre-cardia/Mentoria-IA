import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const testFiles = [
  '**/*.{test,spec}.{js,jsx}',
]

export default defineConfig([
  globalIgnores([
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.vite/**',
    '.vercel/**',
    '_bmad/**',
    '_bmad-output/**',
    '.agents/**',
    '.claude/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}', '*.jsx'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['server/**/*.js', 'api/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: { ...globals.nodeBuiltin, __dirname: 'readonly' },
    },
  },
  {
    files: testFiles,
  },
])
