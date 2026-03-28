import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/tests/**', 'dist/**'],
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 35,
        lines: 40,
      },
    },
  },
});
