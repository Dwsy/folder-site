import { defineConfig } from 'bun';

export default defineConfig({
  test: {
    root: './',
    testMatch: ['**/*.test.tsx', '**/*.test.ts'],
    testTimeout: 10000,
    preact: false,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});