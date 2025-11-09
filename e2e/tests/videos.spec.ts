/**
 * Video Browsing and Playback E2E Tests
 *
 * Tests video library browsing, searching, filtering, and video playback.
 */

import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/videos');
}

test.describe('Video Browsing and Playback', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display video library', async ({ page }) => {
    // Should see the videos page
    await expect(page.locator('h1')).toContainText('Videos');

    // Should display test videos from seed data
    await expect(page.locator('text=Test Video 1')).toBeVisible();
    await expect(page.locator('text=Test Video 2')).toBeVisible();
    await expect(page.locator('text=Sample Documentary')).toBeVisible();
  });

  test('should search videos by title', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Search for "Documentary"
    await searchInput.fill('Documentary');

    // Should show only matching video
    await expect(page.locator('text=Sample Documentary')).toBeVisible();
    await expect(page.locator('text=Test Video 1')).not.toBeVisible();
  });

  test('should filter videos', async ({ page }) => {
    // Look for filter controls (if implemented)
    const filterButton = page.locator('button:has-text("Filter"), select[name*="filter"]').first();

    if (await filterButton.isVisible()) {
      await filterButton.click();
      // Verify filter options are available
      await expect(page.locator('text=Resolution, text=Duration, text=Tags')).toBeVisible();
    }
  });

  test('should navigate to video detail page', async ({ page }) => {
    // Click on first video
    const videoCard = page.locator('text=Test Video 1').first();
    await videoCard.click();

    // Should navigate to video detail page
    await expect(page).toHaveURL(/\/videos\/\d+/);
    await expect(page.locator('h1, h2')).toContainText('Test Video 1');
  });

  test('should display video player', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Check that video player is present
    const videoPlayer = page.locator('video, .video-js').first();
    await expect(videoPlayer).toBeVisible();

    // Check for video player controls
    await expect(page.locator('button[title*="Play"], .vjs-play-control')).toBeVisible();
  });

  test('should play video when play button clicked', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Wait for video player to load
    await page.waitForTimeout(2000);

    // Find and click play button
    const playButton = page.locator('button[title*="Play"], .vjs-play-control, .vjs-big-play-button').first();
    await playButton.click();

    // Wait a moment for playback to start
    await page.waitForTimeout(1000);

    // Video should be playing (pause button should be visible instead)
    const pauseButton = page.locator('button[title*="Pause"], .vjs-playing').first();
    await expect(pauseButton).toBeVisible({ timeout: 5000 });
  });

  test('should display video metadata', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Check for metadata display
    await expect(page.locator('text=Duration, text=Resolution, text=File Size')).toBeVisible();
  });

  test('should navigate back to video library', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Find back button or navigation link
    const backButton = page.locator('button:has-text("Back"), a:has-text("Videos"), a:has-text("Library")').first();
    await backButton.click();

    // Should be back at videos page
    await expect(page).toHaveURL('/videos');
  });

  test('should show video duration', async ({ page }) => {
    // Video cards should display duration
    await expect(page.locator('text=/\\d+:\\d+/, text=/\\d+ min/')).toBeVisible();
  });

  test('should handle missing videos gracefully', async ({ page }) => {
    // Try to access non-existent video
    await page.goto('/videos/99999');

    // Should show error message or redirect
    const errorMessage = page.locator('text=Not Found, text=Video not found, text=Error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});
