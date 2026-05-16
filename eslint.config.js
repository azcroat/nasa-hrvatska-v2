import js from '@eslint/js';
import tseslint from 'typescript-eslint';
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
      // Off in src — data.jsx and lib files use bracket notation throughout for
      // legitimate key-based lookups (vocabulary maps, stat counters, etc.).
      // Functions files use eslint-disable-next-line where needed.
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
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
      'react/display-name': 'off',              // HOC display names are optional
      'react/no-unknown-property': 'error',
      'react/jsx-key': 'error',                 // Missing key= in lists — runtime error
      'react/no-array-index-key': 'off',        // Many list items have no stable ID
      'react/prop-types': 'off',                // TypeScript/JSDoc covers this
      'react/no-unescaped-entities': 'off',     // Croatian strings contain apostrophes — harmless

      // ── React Hooks ─────────────────────────────────────────────────────
      // These two rules catch the class of bugs that burned us:
      // stale closures, missing deps, conditional hook calls
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── General quality ─────────────────────────────────────────────────
      'no-unused-vars': ['warn', {
        // Don't check function args — components often accept props they don't always use
        args: 'none',
        // Ignore vars/destructured values starting with _ (intentional placeholder)
        varsIgnorePattern: '^_',
        // ESLint 9 changed caughtErrors default to 'all'; ignore _ and e in catch blocks
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_|^e$',
      }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'no-undef': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'off',              // Legacy code — cleanup deferred
      'prefer-const': 'off',        // Style preference — deferred
      'no-empty': 'off',            // Intentional empty catch blocks exist throughout
      'no-useless-escape': 'off',   // Escaped characters in Croatian data strings — harmless
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
      // Same Croatian data files (grammar.js etc.) now live under functions/api/content/_data/
      // for Cloudflare Functions consumption; escapes are harmless string literals.
      'no-useless-escape': 'off',
    },
  },

  // TypeScript source files — type-aware linting for converted .ts/.tsx files
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}'],
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'none',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_|^e$',
      }],
      // Allow .js extensions in imports (Vite resolves .ts transparently)
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      // Migration: @ts-nocheck marks files with pre-existing type violations being
      // progressively fixed. Banning it during migration would force 2000+ type fixes
      // before any TypeScript coverage is possible. Remove this override once all
      // @ts-nocheck markers have been resolved.
      '@typescript-eslint/ban-ts-comment': 'error',
      // The following rules were already off for .jsx files and must stay off for .tsx
      // during migration — same code patterns exist throughout (React && expr, escapes, etc.)
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-useless-escape': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'no-empty': 'off',
    },
  },
  // React hooks plugin for TypeScript files (mirrors .js/.jsx block above)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': 'off',
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
