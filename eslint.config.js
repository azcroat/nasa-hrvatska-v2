import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  // Ignore build output and scripts
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'public/**'],
  },

  // Base JS rules
  js.configs.recommended,

  // Security rules — applied everywhere (src + Cloudflare functions)
  {
    files: ['src/**/*.{js,jsx}', 'functions/**/*.js'],
    plugins: { security },
    rules: {
      // Catches: regex injection, unsafe eval, object injection via bracket notation,
      // non-literal require, non-literal fs paths, buffer constructor misuse
      ...security.configs.recommended.rules,
      // Downgrade noisy object-injection warnings — too many false positives
      // in data.jsx array lookups. Real injection risks are still caught.
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
    },
  },

  // React + hooks rules for all source files
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── React core ──────────────────────────────────────────────────────
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',        // React 17+ auto-import
      'react/display-name': 'warn',
      'react/no-unknown-property': 'error',
      'react/jsx-key': 'error',                 // Missing key= in lists
      'react/no-array-index-key': 'warn',       // Index as key is fragile
      'react/prop-types': 'off',                // TypeScript checkJs replaces PropTypes validation
      'react/no-unescaped-entities': 'warn',    // Stylistic — not a runtime bug

      // ── React Hooks ─────────────────────────────────────────────────────
      // These two rules catch the class of bugs that burned us:
      // stale closures, missing deps, conditional hook calls
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── General quality ─────────────────────────────────────────────────
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'no-undef': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'warn',             // Legacy code uses var — warn until cleaned up
      'prefer-const': 'warn',
      'no-empty': 'warn',           // Intentional empty catch blocks exist throughout
      'no-useless-escape': 'warn',  // Escaped apostrophes in data strings — harmless
    },
  },

  // Cloudflare Functions — Node/worker globals
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser, // Cloudflare Workers have a browser-like env
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },

  // Test files — relax some rules
  {
    files: ['src/tests/**/*.{js,jsx}', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
