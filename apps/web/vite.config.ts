import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Proxy target follows E2E_API_PORT (see playwright.config.ts) so E2E can run
// the API on a non-default port locally; default is 4001.
const apiTarget = process.env.E2E_API_PORT
  ? `http://localhost:${process.env.E2E_API_PORT}`
  : 'http://localhost:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // E2E (Playwright) lives in e2e/ and is run via `npm run test:e2e`, not vitest.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
