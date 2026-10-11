import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // E2E (Playwright) lives in e2e/ and is run via `npm run test:e2e`, not vitest.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});
