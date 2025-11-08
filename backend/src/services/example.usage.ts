/**
 * VideoService Usage Examples
 *
 * This file demonstrates how to use the VideoService class.
 */

import { VideoService } from './VideoService';
import { createDatabaseAdapter, loadFullDatabaseConfig } from '../config';
import { VideoSearchCriteria, SortDirection } from '../models';

/**
 * Example 1: Scanning videos from a directory
 */
async function scanVideosExample(): Promise<void> {
  try {
    // Load configuration and create adapter
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    // Create service instance
    const videoService = new VideoService(adapter);

    // Scan videos directory
    const mountPath = process.env.VIDEO_MOUNT_PATH || '/media/videos';
    console.info(`Scanning videos from: ${mountPath}`);

    const newVideos = await videoService.scanVideos(mountPath);

    console.info(`\nScan Results:`);
    console.info(`- Total files found: ${newVideos.length}`);

    newVideos.forEach((video, index) => {
      console.info(`\n${index + 1}. ${video.title}`);
      console.info(`   Path: ${video.filePath}`);
      console.info(`   Size: ${(video.fileSize || 0) / 1024 / 1024} MB`);
      console.info(`   ID: ${video.id}`);
    });

    await adapter.disconnect();
  } catch (error) {
    console.error('Error scanning videos:', error);
    throw error;
  }
}

/**
 * Example 2: Getting a video by ID
 */
async function getVideoExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    // Get video by ID
    const videoId = 1;
    const video = await videoService.getVideoById(videoId);

    if (video) {
      console.info(`\nVideo Details:`);
      console.info(`Title: ${video.title}`);
      console.info(`Description: ${video.description || 'N/A'}`);
      console.info(`Tags: ${video.tags.join(', ') || 'None'}`);
      console.info(`Duration: ${video.duration}s`);
      console.info(`Resolution: ${video.resolution}`);
      console.info(`Available: ${video.isAvailable ? 'Yes' : 'No'}`);
      console.info(`Created: ${video.createdAt.toLocaleString()}`);
    } else {
      console.info(`Video ${videoId} not found`);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
}

/**
 * Example 3: Updating video metadata
 */
async function updateVideoExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    const videoId = 1;

    // Update video metadata
    await videoService.updateVideoMetadata(videoId, {
      title: 'Updated Movie Title',
      description: 'This is an updated description with more details',
      tags: ['action', 'sci-fi', 'thriller'],
      customMetadata: {
        director: 'John Doe',
        year: 2024,
        rating: 8.5,
        actors: ['Actor 1', 'Actor 2'],
      },
    });

    console.info(`Video ${videoId} updated successfully`);

    // Verify update
    const updatedVideo = await videoService.getVideoById(videoId);
    if (updatedVideo) {
      console.info(`\nUpdated Video:`);
      console.info(`Title: ${updatedVideo.title}`);
      console.info(`Tags: ${updatedVideo.tags.join(', ')}`);
      console.info(`Custom Metadata:`, updatedVideo.customMetadata);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
}

/**
 * Example 4: Searching for videos
 */
async function searchVideosExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    // Simple text search
    console.info('\n--- Simple Text Search ---');
    const textSearchResults = await videoService.searchVideos({
      query: 'action',
    });
    console.info(`Found ${textSearchResults.length} videos matching "action"`);

    // Search with filters
    console.info('\n--- Advanced Search ---');
    const advancedCriteria: VideoSearchCriteria = {
      query: 'movie',
      tags: ['action', 'thriller'],
      isAvailable: true,
      duration: {
        min: 3600, // At least 1 hour
      },
      sort: [{ field: 'created_at', direction: SortDirection.DESC }],
      pagination: {
        limit: 10,
        offset: 0,
      },
    };

    const advancedResults = await videoService.searchVideos(advancedCriteria);

    console.info(`Found ${advancedResults.length} videos`);
    advancedResults.forEach((video, index) => {
      console.info(
        `${index + 1}. ${video.title} - ${video.duration}s - Tags: ${video.tags.join(', ')}`
      );
    });

    // Search by date range
    console.info('\n--- Search by Date Range ---');
    const dateRangeResults = await videoService.searchVideos({
      createdAt: {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      },
    });
    console.info(`Found ${dateRangeResults.length} videos created in 2024`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
}

/**
 * Example 5: Getting all videos
 */
async function getAllVideosExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    // Get all available videos
    const availableVideos = await videoService.getAllVideos(false);
    console.info(`\nTotal available videos: ${availableVideos.length}`);

    // Get video count
    const totalCount = await videoService.getVideoCount(false);
    const totalCountWithUnavailable = await videoService.getVideoCount(true);

    console.info(`Available videos: ${totalCount}`);
    console.info(`Total videos (including unavailable): ${totalCountWithUnavailable}`);
    console.info(`Unavailable videos: ${totalCountWithUnavailable - totalCount}`);

    await adapter.disconnect();
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

/**
 * Example 6: Deleting a video (soft delete)
 */
async function deleteVideoExample(): Promise<void> {
  try {
    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    const videoId = 1;

    // Get video before deletion
    const videoBefore = await videoService.getVideoById(videoId);
    console.info(`\nBefore deletion:`);
    console.info(`Video ${videoId} available: ${videoBefore?.isAvailable}`);

    // Delete video (soft delete)
    await videoService.deleteVideo(videoId);
    console.info(`\nVideo ${videoId} deleted`);

    // Get video after deletion
    const videoAfter = await videoService.getVideoById(videoId);
    console.info(`\nAfter deletion:`);
    console.info(`Video ${videoId} available: ${videoAfter?.isAvailable}`);
    console.info('(Video still exists in database but marked as unavailable)');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

/**
 * Example 7: Complete workflow
 */
async function completeWorkflowExample(): Promise<void> {
  try {
    console.info('=== Complete Video Management Workflow ===\n');

    const { type, config } = loadFullDatabaseConfig();
    const adapter = createDatabaseAdapter(type);
    await adapter.connect(config);

    const videoService = new VideoService(adapter);

    // Step 1: Scan videos
    console.info('Step 1: Scanning videos...');
    const mountPath = process.env.VIDEO_MOUNT_PATH || '/media/videos';
    const newVideos = await videoService.scanVideos(mountPath);
    console.info(`✓ Found ${newVideos.length} new video(s)\n`);

    if (newVideos.length > 0) {
      const firstVideo = newVideos[0];

      // Step 2: Update metadata
      console.info('Step 2: Updating metadata...');
      await videoService.updateVideoMetadata(firstVideo.id, {
        title: 'Awesome Movie',
        tags: ['action', 'adventure'],
        customMetadata: {
          year: 2024,
          director: 'Famous Director',
        },
      });
      console.info(`✓ Updated video ${firstVideo.id}\n`);

      // Step 3: Search for it
      console.info('Step 3: Searching for updated video...');
      const searchResults = await videoService.searchVideos({
        tags: ['action'],
      });
      console.info(`✓ Found ${searchResults.length} video(s) with "action" tag\n`);

      // Step 4: Get statistics
      console.info('Step 4: Getting statistics...');
      const count = await videoService.getVideoCount();
      console.info(`✓ Total videos in library: ${count}\n`);
    }

    console.info('=== Workflow Complete ===');

    await adapter.disconnect();
  } catch (error) {
    console.error('Error in workflow:', error);
    throw error;
  }
}

// Export examples for documentation
export {
  scanVideosExample,
  getVideoExample,
  updateVideoExample,
  searchVideosExample,
  getAllVideosExample,
  deleteVideoExample,
  completeWorkflowExample,
};
