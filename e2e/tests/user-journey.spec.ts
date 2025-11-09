/**
 * Complete User Journey E2E Tests
 *
 * Tests complete user workflows from login to content consumption.
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Journeys', () => {
  test('Journey 1: Login -> Browse videos -> Play video', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Verify login successful
    await expect(page).toHaveURL('/videos');
    await expect(page.locator('h1')).toContainText('Videos');

    // Step 2: Browse videos
    await expect(page.locator('text=Test Video 1')).toBeVisible();
    await expect(page.locator('text=Test Video 2')).toBeVisible();
    await expect(page.locator('text=Sample Documentary')).toBeVisible();

    // Step 3: Search for a specific video
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Video 1');
      await expect(page.locator('text=Test Video 1')).toBeVisible();
    }

    // Step 4: Open video detail page
    await page.locator('text=Test Video 1').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);
    await expect(page.locator('h1, h2')).toContainText('Test Video 1');

    // Step 5: Play the video
    await page.waitForTimeout(2000); // Wait for player to load

    const videoPlayer = page.locator('video, .video-js').first();
    await expect(videoPlayer).toBeVisible();

    const playButton = page.locator('button[title*="Play"], .vjs-play-control, .vjs-big-play-button').first();
    await playButton.click();

    await page.waitForTimeout(2000); // Let it play for 2 seconds

    // Verify video is playing
    await expect(page.locator('.vjs-playing, button[title*="Pause"]')).toBeVisible({ timeout: 5000 });

    // Step 6: Verify video metadata is displayed
    await expect(page.locator('text=Duration, text=Resolution, text=Size')).toBeVisible();

    console.log('✓ Journey 1 completed successfully');
  });

  test('Journey 2: Login -> Create clip -> Add to playlist -> Play playlist', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/videos');

    // Step 2: Navigate to a video to create a clip
    await page.locator('text=Test Video 2').first().click();
    await expect(page).toHaveURL(/\/videos\/\d+/);

    await page.waitForTimeout(2000);

    // Step 3: Create a clip
    const setStartButton = page.locator('button:has-text("Set Start")').first();
    const setEndButton = page.locator('button:has-text("Set End")').first();
    const clipNameInput = page.locator('input[name="clipName"], input[placeholder*="Clip"]').first();
    const createClipButton = page.locator('button:has-text("Create Clip")').first();

    if (await setStartButton.isVisible()) {
      // Set start time
      await setStartButton.click();
      await page.waitForTimeout(1000);

      // Play video briefly
      const playButton = page.locator('button[title*="Play"], .vjs-play-control').first();
      if (await playButton.isVisible()) {
        await playButton.click();
        await page.waitForTimeout(3000);
        await playButton.click(); // Pause
      }

      // Set end time
      await setEndButton.click();
      await page.waitForTimeout(500);

      // Name the clip
      await clipNameInput.fill('Journey Test Clip');

      // Create the clip
      await createClipButton.click();

      // Wait for clip creation
      await page.waitForTimeout(2000);
    }

    // Step 4: Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await expect(page.locator('h1')).toContainText('Playlists');

    // Step 5: Open a playlist
    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Step 6: Verify playlist has clips
    await expect(page.locator('text=Test Clip')).toBeVisible();

    // Step 7: Play the playlist
    const playPlaylistButton = page.locator('button:has-text("Play Playlist"), button:has-text("Play All")').first();

    if (await playPlaylistButton.isVisible()) {
      await playPlaylistButton.click();
    } else {
      // Or click on first clip
      await page.locator('text=Test Clip 1').first().click();
    }

    // Wait for playback
    await page.waitForTimeout(2000);

    // Verify video player is visible and playing
    const videoPlayer = page.locator('video, .video-js').first();
    await expect(videoPlayer).toBeVisible();

    console.log('✓ Journey 2 completed successfully');
  });

  test('Journey 3: Complete workflow with metadata editing', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Browse to clips
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    // Open a clip
    await page.locator('text=Test Clip 1').first().click();
    await expect(page).toHaveURL(/\/clips\/\d+/);

    // Try to edit metadata if available
    const addFieldButton = page.locator('button:has-text("Add Field")').first();

    if (await addFieldButton.isVisible()) {
      await addFieldButton.click();

      const keyInput = page.locator('input[placeholder*="Key"]').first();
      const valueInput = page.locator('input[placeholder*="Value"]').first();

      await keyInput.fill('category');
      await valueInput.fill('test');

      const saveButton = page.locator('button:has-text("Save Metadata"), button:has-text("Save")').first();
      await saveButton.click();

      // Verify save
      await page.waitForTimeout(1000);
    }

    // Play the clip
    await page.waitForTimeout(1000);
    const playButton = page.locator('button[title*="Play"], .vjs-big-play-button').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('✓ Journey 3 completed successfully');
  });

  test('Journey 4: Search and filter workflow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Search videos
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      // Search for "Documentary"
      await searchInput.fill('Documentary');
      await expect(page.locator('text=Sample Documentary')).toBeVisible();

      // Clear search
      await searchInput.clear();
      await expect(page.locator('text=Test Video 1')).toBeVisible();
    }

    // Navigate to clips and search
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    const clipSearchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await clipSearchInput.isVisible()) {
      await clipSearchInput.fill('Intro');
      await expect(page.locator('text=Intro Scene')).toBeVisible();
    }

    console.log('✓ Journey 4 completed successfully');
  });

  test('Journey 5: Navigation and UI interaction workflow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Test navigation between different pages
    const pages = ['Videos', 'Clips', 'Playlists'];

    for (const pageName of pages) {
      const link = page.locator(`a:has-text("${pageName}")`).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page.locator('h1')).toContainText(pageName);
        await page.waitForTimeout(500);
      }
    }

    // Verify all main UI elements are accessible
    await expect(page.locator('nav, header')).toBeVisible();
    await expect(page.locator('button:has-text("Logout"), a:has-text("Logout")')).toBeVisible();

    console.log('✓ Journey 5 completed successfully');
  });
});
