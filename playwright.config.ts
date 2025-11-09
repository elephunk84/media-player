/**
 * Playwright Configuration
 *
 * E2E test configuration for media player application.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E tests
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'docker-compose -f docker-compose.e2e.yml up',
    url: 'http://localhost',
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
});
