import { test, expect } from '@playwright/test';

// Seeded todos (3) – defined in apps/api/src/services/todoStore.ts.
// The E2E API runs against an isolated, freshly seeded data file
// (e2e/global-setup.ts + playwright.config.ts), so the count is deterministic.
const seedCount = 3;

test.describe('Baseline – home page', () => {
  test('GET / returns 200 text/html', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });

  test('GET /index.html returns 200', async ({ request }) => {
    const res = await request.get('/index.html');
    expect(res.status()).toBe(200);
  });

  test('React mounts and renders without JS errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // HTML shell is correct
    await expect(page).toHaveTitle('Todo App');
    await expect(page.locator('#root')).toBeAttached();

    // JS bundle executed and React mounted
    await expect(page.locator('h1')).toHaveText('Todo App');

    // Full-stack path: API reachable -> fetch -> render
    const list = page.locator('[data-testid="todo-list"]');
    await expect(list).toBeVisible();
    await expect(list.locator('[data-testid^="todo-"]')).toHaveCount(seedCount);

    // No runtime failures during boot
    expect(pageErrors, pageErrors).toHaveLength(0);
    expect(consoleErrors, consoleErrors).toHaveLength(0);
  });
});
