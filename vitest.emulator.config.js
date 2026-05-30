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
    // Both emulator-backed suites. They must run via THIS config (not the main
    // one) because vitest 4 honors the main config's `exclude` even for an
    // explicitly-named file — so `vitest run src/tests/firestore-rules.test.js`
    // finds "no test files". This config has no such exclude.
    include: [
      'src/tests/firestore-merge-semantics.test.js',
      'src/tests/firestore-rules.test.js',
    ],
  },
});
