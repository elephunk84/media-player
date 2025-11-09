/**
 * Authentication Helper for E2E Tests
 *
 * Provides reusable authentication utilities for Playwright tests.
 */

import { Page, expect } from '@playwright/test';

export interface LoginCredentials {
  username: string;
  password: string;
}

export const DEFAULT_TEST_USER: LoginCredentials = {
  username: 'testuser',
  password: 'testpass123',
};

/**
 * Login to the application
 *
 * @param page - Playwright page object
 * @param credentials - Login credentials (defaults to test user)
 */
export async function login(page: Page, credentials: LoginCredentials = DEFAULT_TEST_USER): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="username"]', credentials.username);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to videos page
  await expect(page).toHaveURL('/videos', { timeout: 10000 });
}

/**
 * Logout from the application
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  await logoutButton.click();

  // Wait for redirect to login page
  await expect(page).toHaveURL('/login', { timeout: 5000 });
}

/**
 * Check if user is logged in
 *
 * @param page - Playwright page object
 * @returns True if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on a protected page and not redirected to login
  const currentUrl = page.url();
  return !currentUrl.includes('/login');
}

/**
 * Get authentication token from local storage
 *
 * @param page - Playwright page object
 * @returns JWT token or null if not found
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('token') || localStorage.getItem('authToken') || null;
  });
}

/**
 * Set authentication token in local storage
 *
 * @param page - Playwright page object
 * @param token - JWT token to set
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((tokenValue) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('authToken', tokenValue);
  }, token);
}

/**
 * Clear authentication from local storage
 *
 * @param page - Playwright page object
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  });
}
