import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      'e2e/**',
      'node_modules/**',
      // Firestore rules tests require the Firebase Emulator — run with: npm run test:rules
      'src/tests/firestore-rules.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        // Include both JS and TS variants — lib/hooks/context files were progressively
        // migrated to .ts/.tsx in prior sessions; new files use .ts by default.
        'src/lib/**/*.{js,jsx,ts,tsx}',
        'src/hooks/**/*.{js,jsx,ts,tsx}',
        'src/context/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        // Firebase integration — requires live Firestore/Auth (covered by E2E)
        'src/lib/firebase.ts',
        'src/hooks/useAuth.ts',
        'src/hooks/useSyncManager.ts',
        'src/hooks/useConversationMemory.js',   // Firestore subcollection reads/writes
        // Browser-only APIs — untestable in jsdom without heavy mocking
        'src/lib/audio.ts',
        'src/lib/crypto.ts',
        'src/lib/pushNotifications.ts',
        'src/lib/photos.ts',
        'src/lib/haptic.ts',
        'src/hooks/useNotifications.ts',
        'src/hooks/useOnlineStatus.ts',
        'src/hooks/useHaptic.ts',
        'src/hooks/useWhisperSTT.js',           // MediaRecorder + AudioContext + SpeechRecognition
        // Pure React state (useState only, no business logic to assert)
        'src/hooks/useAppScreenState.ts',
        // Trivial context wrapper (no business logic)
        'src/context/StatsContext.tsx',
        // Barrel re-exports only
        'src/lib/appData.ts',
        // Firebase Analytics — external SDK, requires live Firebase; no-op when unavailable
        'src/lib/analytics.ts',
        // Pure data files — no executable logic to assert (constants, word lists, verb pairs)
        'src/lib/frequency500.ts',
        'src/lib/aspectPairs.ts',
        'src/lib/constants/**',
        'src/tests/**',
        'dist/**',
      ],
      thresholds: {
        // Coverage thresholds raised to 80% (2026-04-19, Task 1: Test Coverage Improvement Plan).
        // Current coverage: statements=47.4%, branches=46.83%, functions=57.08%, lines=50.74%.
        // Tests will fail until new component tests are added to meet this threshold.
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
