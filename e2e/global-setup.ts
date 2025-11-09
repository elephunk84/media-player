/**
 * Playwright Global Setup
 *
 * Runs before all E2E tests to ensure test environment is ready.
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');

  const baseURL = config.projects[0].use.baseURL || 'http://localhost';

  // Wait for frontend to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`⏳ Waiting for frontend at ${baseURL}...`);

  let retries = 0;
  const maxRetries = 30; // 30 seconds

  while (retries < maxRetries) {
    try {
      const response = await page.goto(baseURL, { timeout: 2000 });
      if (response && response.ok()) {
        console.log('✓ Frontend is ready');
        break;
      }
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        console.error('✗ Frontend did not become ready in time');
        throw new Error('Frontend not ready');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Wait for backend to be ready
  console.log('⏳ Waiting for backend API...');

  retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await page.goto(`${baseURL.replace('localhost', 'localhost:3001')}/health`, {
        timeout: 2000,
      });
      if (response && response.ok()) {
        console.log('✓ Backend API is ready');
        break;
      }
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        console.log('⚠ Backend health check not available (continuing anyway)');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await browser.close();

  console.log('✓ E2E test environment is ready');
  console.log('');
}

export default globalSetup;
