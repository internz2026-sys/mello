import { defineConfig, devices } from '@playwright/test';

/**
 * mellō Playwright configuration.
 * Web app must be running at http://localhost:3000 before running tests.
 * Start it with: cd apps/web && npm run dev
 */
export default defineConfig({
  testDir: './tests',
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // ─── MVP browser ──────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ─── Optional browsers (uncomment to enable) ──────────────────────────────
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
