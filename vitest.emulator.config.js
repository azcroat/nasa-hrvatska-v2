import { defineConfig } from 'vitest/config';

// Dedicated config for emulator-backed tests (Firestore on 127.0.0.1:8080).
// Kept separate from vitest.config.js so the default `vitest run` never tries
// to run these without an emulator. Invoke via firebase emulators:exec, e.g.:
//   npx firebase emulators:exec --only firestore \
//     "npx vitest run --config vitest.emulator.config.js"
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    include: ['src/tests/firestore-merge-semantics.test.js'],
  },
});
