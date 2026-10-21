import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Repo root so that `npm run dev -w <workspace>` resolves the workspace.
// (import.meta.dirname: __dirname is unavailable in ES module scope)
const root = path.resolve(import.meta.dirname, '../..');

// API port for the E2E web server. Defaults to 4001; override with
// E2E_API_PORT when 4001 is occupied locally (e.g. by another service).
const apiPort = process.env.E2E_API_PORT || '4001';

// Web (vite) port. Defaults to 5173; override with E2E_WEB_PORT when 5173
// is occupied locally (e.g. by another service).
const webPort = process.env.E2E_WEB_PORT || '5173';

// The E2E API's persistent store – isolated from real dev data (apps/api/data)
// and from Playwright's managed test-results/ directory (Playwright wipes it).
// Wiped by e2e/global-setup.ts before each run; the API seeds a fresh store
// on first start, which keeps the seeded-count assertions deterministic.
const e2eApiDataFile = path.resolve(root, 'apps/web/e2e-data/todos.json');

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${webPort}`,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Chromium only for a fast, light baseline. Add firefox/webkit later if needed.
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // Start both servers ourselves (no manual `npm run dev`) with per-server
  // readiness checks so tests never race a half-started server.
  // E2E_API_PORT / E2E_WEB_PORT let local runs avoid ports already taken by
  // another service on the machine; CI and the default stay on 4001/5173.
  webServer: [
    {
      command: 'npm run dev -w api',
      cwd: root,
      url: `http://localhost:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        PORT: apiPort,
        TODO_DATA_FILE: e2eApiDataFile,
      },
    },
    {
      command: `npm run dev -w web -- --port ${webPort}`,
      cwd: root,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
