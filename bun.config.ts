import { defineConfig } from 'bun';

export default defineConfig({
  test: {
    root: './',
    testMatch: ['**/*.test.tsx', '**/*.test.ts'],
    testTimeout: 10000,
    preact: false,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
});