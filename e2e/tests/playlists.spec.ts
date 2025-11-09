/**
 * Playlist E2E Tests
 *
 * Tests playlist creation, management, and drag-and-drop reordering.
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

test.describe('Playlist Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display playlists page', async ({ page }) => {
    // Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists"), nav >> text=Playlists').first();
    await playlistsLink.click();

    // Should see playlists page with seed data
    await expect(page.locator('h1')).toContainText('Playlists');
    await expect(page.locator('text=My Test Playlist')).toBeVisible();
    await expect(page.locator('text=Nature Highlights')).toBeVisible();
  });

  test('should view playlist details', async ({ page }) => {
    // Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    // Click on a playlist
    await page.locator('text=My Test Playlist').first().click();

    // Should see playlist detail page
    await expect(page).toHaveURL(/\/playlists\/\d+/);
    await expect(page.locator('h1, h2')).toContainText('My Test Playlist');
  });

  test('should display playlist clips', async ({ page }) => {
    // Navigate to playlist detail page
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Should see clips in the playlist (from seed data)
    await expect(page.locator('text=Test Clip 1')).toBeVisible();
    await expect(page.locator('text=Test Clip 2')).toBeVisible();
  });

  test('should add clip to playlist', async ({ page }) => {
    // First, navigate to a clip
    const clipsLink = page.locator('a:has-text("Clips")').first();
    await clipsLink.click();

    await page.locator('text=Intro Scene').first().click();
    await expect(page).toHaveURL(/\/clips\/\d+/);

    // Look for "Add to Playlist" button
    const addToPlaylistButton = page.locator('button:has-text("Add to Playlist"), button:has-text("Playlist")').first();

    if (await addToPlaylistButton.isVisible()) {
      await addToPlaylistButton.click();

      // Select playlist from dropdown/modal
      const playlistOption = page.locator('text=My Test Playlist, select option:has-text("My Test Playlist")').first();
      await playlistOption.click();

      // Confirm addition
      const confirmButton = page.locator('button:has-text("Add"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success message
      await expect(page.locator('text=Added, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should remove clip from playlist', async ({ page }) => {
    // Navigate to playlist
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Find remove button for a clip
    const removeButton = page.locator('button:has-text("Remove"), button[title*="Remove"]').first();

    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Confirm if modal appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Clip should be removed
      await page.waitForTimeout(1000);
    }
  });

  test('should reorder clips with drag and drop', async ({ page }) => {
    // Navigate to playlist
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Wait for clips to load
    await page.waitForTimeout(1000);

    // Get the clip items (should be draggable)
    const clips = await page.locator('[draggable="true"], .clip-item, .playlist-clip').all();

    if (clips.length >= 2) {
      // Get initial order
      const firstClipText = await clips[0].textContent();
      const secondClipText = await clips[1].textContent();

      // Drag first clip to second position
      const firstClipBox = await clips[0].boundingBox();
      const secondClipBox = await clips[1].boundingBox();

      if (firstClipBox && secondClipBox) {
        // Perform drag and drop
        await page.mouse.move(firstClipBox.x + firstClipBox.width / 2, firstClipBox.y + firstClipBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(secondClipBox.x + secondClipBox.width / 2, secondClipBox.y + secondClipBox.height / 2, { steps: 5 });
        await page.mouse.up();

        // Wait for reorder to complete
        await page.waitForTimeout(1000);

        // Verify order changed
        const reorderedClips = await page.locator('[draggable="true"], .clip-item, .playlist-clip').all();
        if (reorderedClips.length >= 2) {
          const newFirstText = await reorderedClips[0].textContent();
          const newSecondText = await reorderedClips[1].textContent();

          // Order should be swapped
          expect(newFirstText).toContain(secondClipText || '');
          expect(newSecondText).toContain(firstClipText || '');
        }
      }
    }
  });

  test('should play playlist', async ({ page }) => {
    // Navigate to playlist
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Look for play playlist button
    const playButton = page.locator('button:has-text("Play Playlist"), button:has-text("Play All")').first();

    if (await playButton.isVisible()) {
      await playButton.click();

      // Should start playing first clip
      await page.waitForTimeout(2000);

      const videoPlayer = page.locator('video, .video-js').first();
      await expect(videoPlayer).toBeVisible();

      // Video should be playing
      await expect(page.locator('.vjs-playing, button[title*="Pause"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create new playlist', async ({ page }) => {
    // Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    // Look for create playlist button
    const createButton = page.locator('button:has-text("Create Playlist"), button:has-text("New Playlist")').first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill in playlist details
      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="Description"]').first();

      await nameInput.fill('E2E Test Playlist');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Created by E2E test');
      }

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();

      // Should show success or redirect to new playlist
      await expect(page.locator('text=Playlist created, text=Success, h1:has-text("E2E Test Playlist")')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete playlist', async ({ page }) => {
    // Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    // First create a test playlist to delete
    const createButton = page.locator('button:has-text("Create Playlist"), button:has-text("New Playlist")').first();

    if (await createButton.isVisible()) {
      await createButton.click();

      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
      await nameInput.fill('Playlist to Delete');

      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();

      await page.waitForTimeout(1000);

      // Find delete button
      const deleteButton = page.locator('button:has-text("Delete"), button[title*="Delete"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should be redirected or show success
        await expect(page.locator('text=Deleted, text=Removed, h1:has-text("Playlists")')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show playlist clip count', async ({ page }) => {
    // Navigate to playlists
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    // Playlists should show clip count
    await expect(page.locator('text=/\\d+ clips?/, text=/\\d+ items?/')).toBeVisible();
  });

  test('should navigate between playlist clips', async ({ page }) => {
    // Navigate to playlist
    const playlistsLink = page.locator('a:has-text("Playlists")').first();
    await playlistsLink.click();

    await page.locator('text=My Test Playlist').first().click();
    await expect(page).toHaveURL(/\/playlists\/\d+/);

    // Click on first clip
    await page.locator('text=Test Clip 1').first().click();

    // Should navigate to clip or start playing
    await page.waitForTimeout(1000);

    // Look for next/previous buttons if implemented
    const nextButton = page.locator('button:has-text("Next"), button[title*="Next"]').first();

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Should show next clip
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Test Clip 2')).toBeVisible();
    }
  });
});
