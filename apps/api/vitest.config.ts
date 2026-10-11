import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run source tests; ignore the tsc build output in dist/.
    include: ['src/**/*.test.ts'],
  },
});
