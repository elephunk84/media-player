/**
 * PlaylistService Usage Examples
 *
 * This file demonstrates how to use the PlaylistService class.
 */

import { PlaylistService } from './PlaylistService';
import { ClipService } from './ClipService';
import { VideoService } from './VideoService';
import { createDatabaseAdapter, loadFullDatabaseConfig } from '../config';

/**
 * Example 1: Creating a playlist
 */
async function createPlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    // Create a playlist
    const playlist = await playlistService.createPlaylist({
      name: 'Best Action Scenes',
      description: 'A collection of the most intense action moments',
    });

    console.info('\nPlaylist Created:');
    console.info(`ID: ${playlist.id}`);
    console.info(`Name: ${playlist.name}`);
    console.info(`Description: ${playlist.description || 'N/A'}`);
    console.info(`Created: ${playlist.createdAt.toLocaleString()}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

/**
 * Example 2: Adding clips to a playlist
 */
async function addClipsToPlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Add clips to end of playlist (order assigned automatically)
    await playlistService.addClipToPlaylist(playlistId, 1); // Order 0
    await playlistService.addClipToPlaylist(playlistId, 2); // Order 1
    await playlistService.addClipToPlaylist(playlistId, 3); // Order 2

    console.info('\nAdded 3 clips to playlist');

    // Add clip at specific position (shifts others)
    await playlistService.addClipToPlaylist(playlistId, 4, 1); // Insert at position 1

    console.info('Inserted clip at position 1 (others shifted)');

    // Get playlist to see final order
    const playlist = await playlistService.getPlaylistById(playlistId);
    console.info(`\nFinal playlist order (${playlist?.clips?.length || 0} clips):`);
    playlist?.clips?.forEach((pc) => {
      console.info(`  ${pc.order}: Clip ${pc.clipId} - ${pc.clip?.name}`);
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error adding clips:', error);
    throw error;
  }
}

/**
 * Example 3: Removing clips from a playlist
 */
async function removeClipsExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Get playlist before removal
    const before = await playlistService.getPlaylistById(playlistId);
    console.info(`\nBefore removal: ${before?.clips?.length || 0} clips`);

    // Remove a clip (automatically reorders remaining clips)
    await playlistService.removeClipFromPlaylist(playlistId, 2);

    // Get playlist after removal
    const after = await playlistService.getPlaylistById(playlistId);
    console.info(`After removal: ${after?.clips?.length || 0} clips`);

    console.info('\nRemaining clips:');
    after?.clips?.forEach((pc) => {
      console.info(`  ${pc.order}: Clip ${pc.clipId}`);
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error removing clips:', error);
    throw error;
  }
}

/**
 * Example 4: Reordering clips in a playlist
 */
async function reorderPlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Get current order
    const before = await playlistService.getPlaylistById(playlistId);
    console.info('\nBefore reordering:');
    before?.clips?.forEach((pc) => {
      console.info(`  ${pc.order}: Clip ${pc.clipId} - ${pc.clip?.name}`);
    });

    // Reorder clips atomically
    await playlistService.reorderPlaylist({
      playlistId,
      clipOrders: [
        { clipId: 3, order: 0 }, // Move clip 3 to first position
        { clipId: 1, order: 1 }, // Move clip 1 to second
        { clipId: 4, order: 2 }, // Move clip 4 to third
      ],
    });

    // Get new order
    const after = await playlistService.getPlaylistById(playlistId);
    console.info('\nAfter reordering:');
    after?.clips?.forEach((pc) => {
      console.info(`  ${pc.order}: Clip ${pc.clipId} - ${pc.clip?.name}`);
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error reordering playlist:', error);
    throw error;
  }
}

/**
 * Example 5: Getting a playlist by ID
 */
async function getPlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;
    const playlist = await playlistService.getPlaylistById(playlistId);

    if (playlist) {
      console.info('\nPlaylist Details:');
      console.info(`Name: ${playlist.name}`);
      console.info(`Description: ${playlist.description || 'N/A'}`);
      console.info(`Clips: ${playlist.clips?.length || 0}`);
      console.info(`Created: ${playlist.createdAt.toLocaleString()}`);

      if (playlist.clips && playlist.clips.length > 0) {
        console.info('\nClips in order:');
        playlist.clips.forEach((pc) => {
          const clip = pc.clip;
          console.info(
            `  ${pc.order}. ${clip?.name} (${clip?.startTime}s-${clip?.endTime}s) - ${clip?.duration}s`
          );
        });
      }
    } else {
      console.info(`Playlist ${playlistId} not found`);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

/**
 * Example 6: Finding orphaned clips in a playlist
 */
async function findOrphanedClipsExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Get orphaned clips (clips whose source video is unavailable)
    const orphanedClips = await playlistService.getOrphanedClips(playlistId);

    console.info(`\nOrphaned clips in playlist ${playlistId}: ${orphanedClips.length}`);

    if (orphanedClips.length > 0) {
      console.info("\nClips that won't play (source video unavailable):");
      orphanedClips.forEach((pc) => {
        const clip = pc.clip;
        console.info(
          `  Position ${pc.order}: Clip ${clip?.id} - "${clip?.name}" (video ${clip?.videoId})`
        );
      });

      console.info('\nOptions:');
      console.info('1. Remove orphaned clips from playlist');
      console.info('2. Wait for videos to become available again');
      console.info('3. Skip orphaned clips during playback');
    } else {
      console.info('No orphaned clips - all clips have available source videos');
    }

    // Get playlist without orphaned clips (default behavior)
    const playlistClean = await playlistService.getPlaylistById(playlistId, false);
    console.info(`\nPlayable clips: ${playlistClean?.clips?.length || 0}`);

    // Get playlist with orphaned clips included
    const playlistAll = await playlistService.getPlaylistById(playlistId, true);
    console.info(`Total clips (including orphaned): ${playlistAll?.clips?.length || 0}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error finding orphaned clips:', error);
    throw error;
  }
}

/**
 * Example 7: Updating playlist metadata
 */
async function updatePlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Update playlist name and description
    await playlistService.updatePlaylist(playlistId, {
      name: 'Ultimate Action Compilation',
      description: 'The best action scenes from all my favorite movies',
    });

    console.info(`\nPlaylist ${playlistId} updated`);

    // Verify update
    const updated = await playlistService.getPlaylistById(playlistId);
    console.info(`Name: ${updated?.name}`);
    console.info(`Description: ${updated?.description}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
}

/**
 * Example 8: Deleting a playlist
 */
async function deletePlaylistExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    const playlistId = 1;

    // Get playlist before deletion
    const before = await playlistService.getPlaylistById(playlistId);
    console.info('\nBefore deletion:');
    console.info(`Playlist ${playlistId}: ${before?.name} (${before?.clips?.length || 0} clips)`);

    // Delete playlist (cascade deletes all clip associations)
    await playlistService.deletePlaylist(playlistId);
    console.info(`\nPlaylist ${playlistId} deleted`);

    // Verify deletion
    const after = await playlistService.getPlaylistById(playlistId);
    console.info(`Playlist ${playlistId} exists: ${after !== null}`);

    console.info('\nNote: Clips themselves are NOT deleted, only the playlist associations');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

/**
 * Example 9: Getting all playlists
 */
async function getAllPlaylistsExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    // Get all playlists
    const playlists = await playlistService.getAllPlaylists();

    console.info(`\nTotal playlists: ${playlists.length}`);

    playlists.forEach((playlist, index) => {
      console.info(`\n${index + 1}. ${playlist.name}`);
      console.info(`   Created: ${playlist.createdAt.toLocaleString()}`);
    });

    // Get count
    const count = await playlistService.getPlaylistCount();
    console.info(`\nPlaylist count: ${count}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

/**
 * Example 10: Getting playlists with full clip details
 */
async function getPlaylistsWithClipsExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    // Get all playlists with clips
    const playlists = await playlistService.getPlaylistsWithClips();

    console.info(`\nPlaylists with clips: ${playlists.length}`);

    playlists.forEach((playlist) => {
      console.info(`\n${playlist.name} (${playlist.clips.length} clips):`);
      playlist.clips.forEach((pc) => {
        console.info(`  ${pc.order}. ${pc.clip.name} - ${pc.clip.duration}s`);
      });
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching playlists with clips:', error);
    throw error;
  }
}

/**
 * Example 11: Validation error handling
 */
async function validationErrorExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const playlistService = new PlaylistService(adapter);

    console.info('\n--- Testing Validation Errors ---\n');

    // Test 1: Adding non-existent clip
    try {
      await playlistService.addClipToPlaylist(1, 999999);
    } catch (error) {
      console.info('✓ Caught non-existent clip:', (error as Error).message);
    }

    // Test 2: Adding duplicate clip
    try {
      await playlistService.addClipToPlaylist(1, 1);
      await playlistService.addClipToPlaylist(1, 1); // Try to add same clip again
    } catch (error) {
      console.info('✓ Caught duplicate clip:', (error as Error).message);
    }

    // Test 3: Reordering with duplicate order indices
    try {
      await playlistService.reorderPlaylist({
        playlistId: 1,
        clipOrders: [
          { clipId: 1, order: 0 },
          { clipId: 2, order: 0 }, // Duplicate order
        ],
      });
    } catch (error) {
      console.info('✓ Caught duplicate order:', (error as Error).message);
    }

    // Test 4: Empty playlist name
    try {
      await playlistService.createPlaylist({
        name: '',
        description: 'Test',
      });
    } catch (error) {
      console.info('✓ Caught empty name:', (error as Error).message);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error in validation examples:', error);
    throw error;
  }
}

/**
 * Example 12: Complete workflow
 */
async function completeWorkflowExample(): Promise<void> {
  try {
    console.info('=== Complete Playlist Management Workflow ===\n');

    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);
    const clipService = new ClipService(adapter);
    const playlistService = new PlaylistService(adapter);

    // Step 1: Get some clips
    console.info('Step 1: Getting available clips...');
    const allClips = await clipService.getAllClips();
    if (allClips.length < 3) {
      console.info('Need at least 3 clips. Creating some...');
      const videos = await videoService.getAllVideos(true);
      if (videos.length === 0) {
        console.info('No videos found. Please scan videos first.');
        await adapter.disconnect();
        return;
      }

      const video = videos[0];
      for (let i = 0; i < 3; i++) {
        await clipService.createClip({
          videoId: video.id,
          name: `Clip ${i + 1}`,
          startTime: i * 30,
          endTime: (i + 1) * 30,
        });
      }
    }

    const clips = await clipService.getAllClips();
    console.info(`✓ Found ${clips.length} clip(s)\n`);

    // Step 2: Create playlist
    console.info('Step 2: Creating playlist...');
    const playlist = await playlistService.createPlaylist({
      name: 'My Compilation',
      description: 'A custom playlist of clips',
    });
    console.info(`✓ Created playlist: ${playlist.name}\n`);

    // Step 3: Add clips
    console.info('Step 3: Adding clips to playlist...');
    for (let i = 0; i < Math.min(3, clips.length); i++) {
      await playlistService.addClipToPlaylist(playlist.id, clips[i].id);
    }
    console.info(`✓ Added ${Math.min(3, clips.length)} clip(s)\n`);

    // Step 4: View playlist
    console.info('Step 4: Viewing playlist...');
    const playlistWithClips = await playlistService.getPlaylistById(playlist.id);
    console.info(`✓ ${playlistWithClips?.name}: ${playlistWithClips?.clips?.length || 0} clips\n`);

    // Step 5: Reorder clips
    if (playlistWithClips?.clips && playlistWithClips.clips.length >= 2) {
      console.info('Step 5: Reordering clips...');
      const clip1 = playlistWithClips.clips[0];
      const clip2 = playlistWithClips.clips[1];
      await playlistService.reorderPlaylist({
        playlistId: playlist.id,
        clipOrders: [
          { clipId: clip2.clipId, order: 0 },
          { clipId: clip1.clipId, order: 1 },
        ],
      });
      console.info('✓ Clips reordered\n');
    }

    // Step 6: Check for orphaned clips
    console.info('Step 6: Checking for orphaned clips...');
    const orphaned = await playlistService.getOrphanedClips(playlist.id);
    console.info(`✓ Found ${orphaned.length} orphaned clip(s)\n`);

    // Step 7: Statistics
    console.info('Step 7: Getting statistics...');
    const totalPlaylists = await playlistService.getPlaylistCount();
    console.info(`✓ Total playlists: ${totalPlaylists}\n`);

    console.info('=== Workflow Complete ===');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error in workflow:', error);
    throw error;
  }
}

// Export examples for documentation
export {
  createPlaylistExample,
  addClipsToPlaylistExample,
  removeClipsExample,
  reorderPlaylistExample,
  getPlaylistExample,
  findOrphanedClipsExample,
  updatePlaylistExample,
  deletePlaylistExample,
  getAllPlaylistsExample,
  getPlaylistsWithClipsExample,
  validationErrorExample,
  completeWorkflowExample,
};
