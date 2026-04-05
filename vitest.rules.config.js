/**
 * Vitest config for Firestore security rules tests.
 * These tests require the Firebase Emulator and cannot run in the normal jsdom environment.
 * Run via: firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.js"
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/firestore-rules.test.js'],
    globals: true,
    // No jsdom — tests run in Node against the Firestore Emulator
    environment: 'node',
  },
});
