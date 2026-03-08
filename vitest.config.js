import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
