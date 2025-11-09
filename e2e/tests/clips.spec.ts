/**
 * Clip Creation E2E Tests
 *
 * Tests creating clips from videos with UI interactions.
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

test.describe('Clip Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to clip creation UI from video page', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Should see clip creation interface
    await expect(page.locator('text=Create Clip, button:has-text("Create Clip")')).toBeVisible();
  });

  test('should create clip with UI controls', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    // Wait for video player to load
    await page.waitForTimeout(2000);

    // Find clip creation controls
    const setStartButton = page.locator('button:has-text("Set Start")').first();
    const setEndButton = page.locator('button:has-text("Set End")').first();
    const clipNameInput = page.locator('input[name="clipName"], input[placeholder*="Clip"], input[id*="clip"]').first();
    const createClipButton = page.locator('button:has-text("Create Clip")').first();

    // Set start time
    await setStartButton.click();
    await page.waitForTimeout(500);

    // Play video a bit then set end time
    const playButton = page.locator('button[title*="Play"], .vjs-play-control').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(3000); // Play for 3 seconds
      await playButton.click(); // Pause
    }

    await setEndButton.click();
    await page.waitForTimeout(500);

    // Enter clip name
    await clipNameInput.fill('E2E Test Clip');

    // Create the clip
    await createClipButton.click();

    // Should show success message or redirect
    await expect(page.locator('text=Clip created, text=Success')).toBeVisible({ timeout: 10000 });
  });

  test('should validate clip times', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    await page.waitForTimeout(2000);

    // Try to create clip without setting times
    const clipNameInput = page.locator('input[name="clipName"], input[placeholder*="Clip"]').first();
    const createClipButton = page.locator('button:has-text("Create Clip")').first();

    await clipNameInput.fill('Invalid Clip');

    // Create button should be disabled without times
    if (await createClipButton.isVisible()) {
      const isDisabled = await createClipButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('should require clip name', async ({ page }) => {
    // Navigate to video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    await page.waitForTimeout(2000);

    const setStartButton = page.locator('button:has-text("Set Start")').first();
    const setEndButton = page.locator('button:has-text("Set End")').first();
    const createClipButton = page.locator('button:has-text("Create Clip")').first();

    // Set times but not name
    await setStartButton.click();
    await page.waitForTimeout(1000);
    await setEndButton.click();

    // Create button should be disabled without name
    const isDisabled = await createClipButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should browse existing clips', async ({ page }) => {
    // Navigate to clips page
    const clipsLink = page.locator('a:has-text("Clips"), nav >> text=Clips').first();
    await clipsLink.click();

    // Should see clips page with seed data clips
    await expect(page.locator('h1')).toContainText('Clips');
    await expect(page.locator('text=Test Clip 1')).toBeVisible();
    await expect(page.locator('text=Test Clip 2')).toBeVisible();
  });

  test('should view clip details', async ({ page }) => {
    // Navigate to clips page
    const clipsLink = page.locator('a:has-text("Clips"), nav >> text=Clips').first();
    await clipsLink.click();

    // Click on a clip
    await page.locator('text=Test Clip 1').first().click();

    // Should see clip detail page
    await expect(page).toHaveURL(/\/clips\/\d+/);
    await expect(page.locator('h1, h2')).toContainText('Test Clip 1');
  });

  test('should play clip', async ({ page }) => {
    // Navigate to clips page
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    // Click on a clip
    await page.locator('text=Test Clip 1').first().click();
    await expect(page).toHaveURL(/\/clips\/\d+/);

    // Wait for video player
    await page.waitForTimeout(2000);

    // Check that video player is present
    const videoPlayer = page.locator('video, .video-js').first();
    await expect(videoPlayer).toBeVisible();

    // Play the clip
    const playButton = page.locator('button[title*="Play"], .vjs-play-control, .vjs-big-play-button').first();
    await playButton.click();

    await page.waitForTimeout(1000);

    // Clip should be playing
    await expect(page.locator('.vjs-playing, button[title*="Pause"]')).toBeVisible({ timeout: 5000 });
  });

  test('should display clip metadata', async ({ page }) => {
    // Navigate to clips page and select a clip
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    await page.locator('text=Test Clip 1').first().click();
    await expect(page).toHaveURL(/\/clips\/\d+/);

    // Should display clip start and end times
    await expect(page.locator('text=Start Time, text=End Time, text=Duration')).toBeVisible();
  });

  test('should edit clip metadata', async ({ page }) => {
    // Navigate to clip detail page
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    await page.locator('text=Test Clip 1').first().click();
    await expect(page).toHaveURL(/\/clips\/\d+/);

    // Look for edit button or metadata editor
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Add Field")').first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Add custom metadata
      const keyInput = page.locator('input[placeholder*="Key"]').first();
      const valueInput = page.locator('input[placeholder*="Value"]').first();

      await keyInput.fill('testKey');
      await valueInput.fill('testValue');

      // Save metadata
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();

      // Should show success or update
      await expect(page.locator('text=Saved, text=Updated, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter clips', async ({ page }) => {
    // Navigate to clips page
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    // Look for search/filter
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Clip 1');

      // Should show only matching clip
      await expect(page.locator('text=Test Clip 1')).toBeVisible();
      await expect(page.locator('text=Test Clip 2')).not.toBeVisible();
    }
  });
});
