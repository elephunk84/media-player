/**
 * Authentication E2E Tests
 *
 * Tests user authentication flows including login, logout, and protected route access.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/videos');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message, .alert-error')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in valid credentials (from seed data)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Should redirect to videos page after successful login
    await expect(page).toHaveURL('/videos');
    await expect(page.locator('h1')).toContainText('Videos');
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/videos');

    // Reload page
    await page.reload();

    // Should still be on videos page (not redirected to login)
    await expect(page).toHaveURL('/videos');
    await expect(page.locator('h1')).toContainText('Videos');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/videos');

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should not access protected routes after logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/videos');

    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();

    // Try to access protected route
    await page.goto('/videos');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});
