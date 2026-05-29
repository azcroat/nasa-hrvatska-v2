import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    // Coverage instrumentation significantly slows UI loop-tests (14–29 question cycles,
    // word-tile builds). 30 s covers these while still catching genuine infinite loops.
    testTimeout: 30000,
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'scripts/**/*.test.mjs',
      'functions/api/**/*.test.{js,mjs}',
    ],
    exclude: [
      'e2e/**',
      'node_modules/**',
      // Firestore rules tests require the Firebase Emulator — run with: npm run test:rules
      'src/tests/firestore-rules.test.js',
      // Emulator-only: real Firestore merge-semantics check (needs 127.0.0.1:8080).
      // Run: npx firebase emulators:exec --only firestore "vitest run src/tests/firestore-merge-semantics.test.js"
      'src/tests/firestore-merge-semantics.test.js',
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
        // Capacitor-native hooks — require native bridge / platform APIs;
        // isNative() always returns false in jsdom so Android/iOS branches are unreachable
        'src/lib/platform.ts',
        'src/hooks/useAndroidBackButton.ts',
        'src/hooks/useAndroidMicPermission.ts',
        // Pure React state (useState only, no business logic to assert)
        'src/hooks/useAppScreenState.ts',
        // Trivial context wrapper (no business logic)
        'src/context/StatsContext.tsx',
        // Barrel re-exports only
        'src/lib/appData.ts',
        // Firebase Analytics — external SDK, requires live Firebase; no-op when unavailable
        'src/lib/analytics.ts',
        // Error reporter — production branches (sendBeacon/fetch) never run in test env
        // because vitest always sets import.meta.env.DEV=true; only DEV branch is reachable.
        'src/lib/errorReporter.ts',
        // Pure data files — no executable logic to assert (constants, word lists, verb pairs)
        'src/lib/frequency500.ts',
        'src/lib/aspectPairs.ts',
        'src/lib/constants/**',
        'src/tests/**',
        'dist/**',
        // Navigation orchestrator — async data loading + all setters from App; integration-level concern
        'src/hooks/useScreenLauncher.ts',
      ],
      thresholds: {
        // Coverage thresholds set aspirationally on 2026-04-19. After the FIX-12
        // useAward.ts coverage sprint (b942f7c — 61 new branch-coverage tests
        // bringing useAward.ts branches to 88.55%), global branches reached
        // 83.13%, so the temporary 78% relaxation has been restored to 80%.
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
