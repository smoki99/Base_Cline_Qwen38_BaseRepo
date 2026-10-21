/**
 * E2E global setup: isolate the API's persistent store.
 * Wipes the dedicated E2E data directory before the run, so the API server
 * (started via playwright.config.ts with an isolated data-file path) seeds a
 * fresh store on first start and the seeded-count assertions stay
 * deterministic.
 * The real dev data (apps/api/data) is never touched.
 */
import fs from 'node:fs';
import path from 'node:path';

// Anchored to this file so it is independent of the working directory.
// NOTE: must live outside Playwright's managed test-results/ directory –
// Playwright wipes that directory during the run, which would delete the
// API's data file mid-test (ENOENT on persist).
const e2eDataDir = path.resolve(import.meta.dirname, '..', 'e2e-data');

export default async function globalSetup(): Promise<void> {
  fs.rmSync(e2eDataDir, { recursive: true, force: true });
}
