/**
 * ClipService Usage Examples
 *
 * This file demonstrates how to use the ClipService class.
 */

import { ClipService, MetadataInheritanceConfig } from './ClipService';
import { VideoService } from './VideoService';
import { createDatabaseAdapter, loadFullDatabaseConfig } from '../config';

/**
 * Example 1: Creating a clip with default metadata inheritance
 */
async function createClipExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    // Create a clip from a video
    const clip = await clipService.createClip({
      videoId: 1,
      name: 'Best Action Scene',
      description: 'The most intense action sequence',
      startTime: 120, // 2 minutes
      endTime: 180, // 3 minutes
      customMetadata: {
        category: 'highlights',
        rating: 5,
      },
    });

    console.info('\nClip Created:');
    console.info(`ID: ${clip.id}`);
    console.info(`Name: ${clip.name}`);
    console.info(`Duration: ${clip.duration}s (${clip.startTime}s - ${clip.endTime}s)`);
    console.info(`Inherited Metadata:`, clip.inheritedMetadata);
    console.info(`Custom Metadata:`, clip.customMetadata);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error creating clip:', error);
    throw error;
  }
}

/**
 * Example 2: Creating a clip with custom metadata inheritance
 */
async function createClipWithCustomInheritanceExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    // Configure which fields to inherit
    const inheritanceConfig: MetadataInheritanceConfig = {
      fieldsToInherit: ['title', 'tags', 'resolution', 'customMetadata'],
    };

    const clipService = new ClipService(adapter, inheritanceConfig);

    const clip = await clipService.createClip({
      videoId: 1,
      name: 'Opening Scene',
      startTime: 0,
      endTime: 60,
    });

    console.info('\nClip with Custom Inheritance:');
    console.info(`Inherited fields: ${Object.keys(clip.inheritedMetadata).join(', ')}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Example 3: Getting a clip by ID
 */
async function getClipExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    const clipId = 1;
    const clip = await clipService.getClipById(clipId);

    if (clip) {
      console.info('\nClip Details:');
      console.info(`Name: ${clip.name}`);
      console.info(`Description: ${clip.description || 'N/A'}`);
      console.info(`Time Range: ${clip.startTime}s - ${clip.endTime}s`);
      console.info(`Duration: ${clip.duration}s`);
      console.info(`Source Video ID: ${clip.videoId}`);
      console.info(`Created: ${clip.createdAt.toLocaleString()}`);
    } else {
      console.info(`Clip ${clipId} not found`);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching clip:', error);
    throw error;
  }
}

/**
 * Example 4: Getting all clips for a video
 */
async function getClipsByVideoExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    const videoId = 1;
    const clips = await clipService.getClipsByVideo(videoId);

    console.info(`\nFound ${clips.length} clip(s) for video ${videoId}:`);
    clips.forEach((clip, index) => {
      console.info(
        `${index + 1}. ${clip.name} (${clip.startTime}s-${clip.endTime}s) - ${clip.duration}s`
      );
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching clips:', error);
    throw error;
  }
}

/**
 * Example 5: Updating clip metadata
 */
async function updateClipMetadataExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    const clipId = 1;

    // Update only custom metadata (does NOT affect source video)
    await clipService.updateClipMetadata(clipId, {
      name: 'Updated Clip Name',
      description: 'Updated description',
      customMetadata: {
        category: 'favorites',
        rating: 5,
        tags: ['must-watch', 'epic'],
      },
    });

    console.info(`\nClip ${clipId} metadata updated`);

    // Verify update
    const updatedClip = await clipService.getClipById(clipId);
    if (updatedClip) {
      console.info(`Name: ${updatedClip.name}`);
      console.info(`Custom Metadata:`, updatedClip.customMetadata);
      console.info('\nNote: Source video was NOT modified');
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error updating clip:', error);
    throw error;
  }
}

/**
 * Example 6: Updating clip time range
 */
async function updateClipTimeRangeExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    const clipId = 1;

    // Get original clip
    const originalClip = await clipService.getClipById(clipId);
    console.info('\nOriginal Clip:');
    console.info(`Time Range: ${originalClip?.startTime}s - ${originalClip?.endTime}s`);
    console.info(`Duration: ${originalClip?.duration}s`);

    // Update time range (validates against video duration)
    await clipService.updateClipMetadata(clipId, {
      startTime: 150,
      endTime: 200,
    });

    // Get updated clip
    const updatedClip = await clipService.getClipById(clipId);
    console.info('\nUpdated Clip:');
    console.info(`Time Range: ${updatedClip?.startTime}s - ${updatedClip?.endTime}s`);
    console.info(`Duration: ${updatedClip?.duration}s`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error updating time range:', error);
    throw error;
  }
}

/**
 * Example 7: Finding orphaned clips
 */
async function findOrphanedClipsExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    // Get clips whose source video is unavailable
    const orphanedClips = await clipService.getOrphanedClips();

    console.info(`\nOrphaned Clips: ${orphanedClips.length}`);

    if (orphanedClips.length > 0) {
      console.info('\nClips referencing unavailable videos:');
      orphanedClips.forEach((clip) => {
        console.info(`- Clip ${clip.id}: "${clip.name}" (video ${clip.videoId})`);
      });

      console.info('\nThese clips can be:');
      console.info('1. Deleted to clean up');
      console.info('2. Kept for when the video becomes available again');
    } else {
      console.info('No orphaned clips found - all clips have available source videos');
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error finding orphaned clips:', error);
    throw error;
  }
}

/**
 * Example 8: Deleting a clip
 */
async function deleteClipExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    const clipId = 1;

    // Get clip before deletion
    const clipBefore = await clipService.getClipById(clipId);
    console.info('\nBefore deletion:');
    console.info(`Clip ${clipId}: ${clipBefore?.name}`);

    // Delete clip (does NOT affect source video)
    await clipService.deleteClip(clipId);
    console.info(`\nClip ${clipId} deleted`);

    // Verify deletion
    const clipAfter = await clipService.getClipById(clipId);
    console.info(`Clip ${clipId} exists: ${clipAfter !== null}`);

    console.info('\nNote: Source video was NOT affected by clip deletion');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error deleting clip:', error);
    throw error;
  }
}

/**
 * Example 9: Getting clips with video information
 */
async function getClipsWithVideoExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    // Get all clips with source video information
    const clipsWithVideo = await clipService.getClipsWithVideo();

    console.info(`\nClips with Source Video Information:`);
    clipsWithVideo.forEach((clip, index) => {
      console.info(`\n${index + 1}. ${clip.name}`);
      console.info(`   Duration: ${clip.duration}s (${clip.startTime}s - ${clip.endTime}s)`);
      if (clip.video) {
        console.info(`   Source: ${clip.video.title} (${clip.video.duration}s total)`);
      }
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching clips with video:', error);
    throw error;
  }
}

/**
 * Example 10: Validation error handling
 */
async function validationErrorExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const clipService = new ClipService(adapter);

    console.info('\n--- Testing Validation Errors ---\n');

    // Test 1: Invalid time range (start >= end)
    try {
      await clipService.createClip({
        videoId: 1,
        name: 'Invalid Clip',
        startTime: 100,
        endTime: 50, // End before start
      });
    } catch (error) {
      console.info('✓ Caught invalid time range:', (error as Error).message);
    }

    // Test 2: Time exceeds video duration
    try {
      await clipService.createClip({
        videoId: 1,
        name: 'Invalid Clip',
        startTime: 0,
        endTime: 999999, // Way beyond video duration
      });
    } catch (error) {
      console.info('✓ Caught time exceeds duration:', (error as Error).message);
    }

    // Test 3: Empty name
    try {
      await clipService.createClip({
        videoId: 1,
        name: '',
        startTime: 0,
        endTime: 10,
      });
    } catch (error) {
      console.info('✓ Caught empty name:', (error as Error).message);
    }

    // Test 4: Non-existent video
    try {
      await clipService.createClip({
        videoId: 999999,
        name: 'Test',
        startTime: 0,
        endTime: 10,
      });
    } catch (error) {
      console.info('✓ Caught non-existent video:', (error as Error).message);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error in validation examples:', error);
    throw error;
  }
}

/**
 * Example 11: Complete workflow
 */
async function completeWorkflowExample(): Promise<void> {
  try {
    console.info('=== Complete Clip Management Workflow ===\n');

    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);
    const clipService = new ClipService(adapter);

    // Step 1: Get a video
    console.info('Step 1: Getting source video...');
    const videos = await videoService.getAllVideos(true);
    if (videos.length === 0) {
      console.info('No videos found. Please scan videos first.');
      await adapter.disconnect();
      return;
    }
    const sourceVideo = videos[0];
    console.info(`✓ Found video: ${sourceVideo.title} (${sourceVideo.duration}s)\n`);

    // Step 2: Create clips
    console.info('Step 2: Creating clips...');
    const clip1 = await clipService.createClip({
      videoId: sourceVideo.id,
      name: 'Opening Scene',
      startTime: 0,
      endTime: Math.min(60, sourceVideo.duration),
    });
    console.info(`✓ Created clip: ${clip1.name}\n`);

    // Step 3: Get all clips for video
    console.info('Step 3: Listing clips for video...');
    const clips = await clipService.getClipsByVideo(sourceVideo.id);
    console.info(`✓ Found ${clips.length} clip(s)\n`);

    // Step 4: Update clip metadata
    console.info('Step 4: Updating clip metadata...');
    await clipService.updateClipMetadata(clip1.id, {
      customMetadata: {
        category: 'intro',
        importance: 'high',
      },
    });
    console.info(`✓ Updated clip metadata\n`);

    // Step 5: Check for orphaned clips
    console.info('Step 5: Checking for orphaned clips...');
    const orphaned = await clipService.getOrphanedClips();
    console.info(`✓ Found ${orphaned.length} orphaned clip(s)\n`);

    // Step 6: Get statistics
    console.info('Step 6: Getting statistics...');
    const totalClips = await clipService.getClipCount();
    const videoClips = await clipService.getClipCount(sourceVideo.id);
    console.info(`✓ Total clips: ${totalClips}`);
    console.info(`✓ Clips for this video: ${videoClips}\n`);

    console.info('=== Workflow Complete ===');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error in workflow:', error);
    throw error;
  }
}

// Export examples for documentation
export {
  createClipExample,
  createClipWithCustomInheritanceExample,
  getClipExample,
  getClipsByVideoExample,
  updateClipMetadataExample,
  updateClipTimeRangeExample,
  findOrphanedClipsExample,
  deleteClipExample,
  getClipsWithVideoExample,
  validationErrorExample,
  completeWorkflowExample,
};
