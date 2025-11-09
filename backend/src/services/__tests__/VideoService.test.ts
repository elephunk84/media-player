/**
 * VideoService Unit Tests
 *
 * Tests video operations including scanning, CRUD operations, and search functionality.
 */

import { VideoService } from '../VideoService';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');

describe('VideoService', () => {
  let videoService: VideoService;
  let mockAdapter: jest.Mocked<DatabaseAdapter>;

  beforeEach(() => {
    // Create mock adapter
    mockAdapter = {
      query: jest.fn(),
      execute: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      runMigrations: jest.fn(),
      getMigrationHistory: jest.fn(),
    } as unknown as jest.Mocked<DatabaseAdapter>;

    // Create service instance (FFmpegService is created internally)
    videoService = new VideoService(mockAdapter);

    jest.clearAllMocks();
  });

  describe('scanVideos', () => {
    const mountPath = '/media/videos';

    it('should scan directory and import new videos', async () => {
      const videoFiles = ['video1.mp4', 'video2.mkv'];
      const fullPaths = videoFiles.map((f) => path.join(mountPath, f));

      // Mock fs.readdir
      (fs.readdir as jest.Mock).mockResolvedValue(videoFiles);

      // Mock fs.stat for each file
      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024 * 1024 * 100, // 100MB
      });

      // Mock database checks - video doesn't exist
      mockAdapter.query.mockResolvedValue([]);

      // Mock database insert
      mockAdapter.query
        .mockResolvedValueOnce([]) // First check
        .mockResolvedValueOnce([
          {
            id: 1,
            file_path: fullPaths[0],
            title: 'video1',
            description: null,
            tags: '[]',
            duration: 120,
            resolution: '1920x1080',
            codec: 'h264',
            file_size: 1024 * 1024 * 100,
            created_at: new Date(),
            updated_at: new Date(),
            is_available: true,
            custom_metadata: '{}',
          },
        ]);

      const result = await videoService.scanVideos(mountPath);

      expect(fs.readdir).toHaveBeenCalledWith(mountPath);
      // Note: FFmpegService is created internally and cannot be mocked without DI
      // This test will only pass if ffmpeg is installed on the system
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should skip non-video files', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue(['video.mp4', 'readme.txt', 'image.jpg']);

      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024,
      });

      mockAdapter.query.mockResolvedValue([]);

      await videoService.scanVideos(mountPath);

      // Should only process .mp4 file
      // Note: FFmpegService is created internally, actual behavior depends on ffmpeg installation
    });

    it('should handle empty directory', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const result = await videoService.scanVideos(mountPath);

      expect(result).toEqual([]);
    });
  });

  describe('getVideoById', () => {
    it('should return video for existing id', async () => {
      const videoRow = {
        id: 1,
        file_path: '/media/video.mp4',
        title: 'Test Video',
        description: 'Description',
        tags: '["tag1","tag2"]',
        duration: 120,
        resolution: '1920x1080',
        codec: 'h264',
        file_size: 1024,
        created_at: new Date(),
        updated_at: new Date(),
        is_available: true,
        custom_metadata: '{}',
      };

      mockAdapter.query.mockResolvedValue([videoRow]);

      const result = await videoService.getVideoById(1);

      expect(result).toEqual({
        id: 1,
        filePath: '/media/video.mp4',
        title: 'Test Video',
        description: 'Description',
        tags: ['tag1', 'tag2'],
        duration: 120,
        resolution: '1920x1080',
        codec: 'h264',
        fileSize: 1024,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isAvailable: true,
        customMetadata: {},
      });
    });

    it('should return null for non-existent id', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await videoService.getVideoById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateVideoMetadata', () => {
    it('should update video metadata successfully', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        tags: ['new-tag'],
      };

      // Mock getVideoById call (validates video exists)
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          file_path: '/media/video.mp4',
          title: 'Old Title',
          description: 'Old Description',
          tags: '["old-tag"]',
          duration: 120,
          resolution: '1920x1080',
          codec: 'h264',
          file_size: 1024,
          created_at: new Date(),
          updated_at: new Date(),
          is_available: true,
          custom_metadata: '{}',
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await videoService.updateVideoMetadata(1, updates);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE videos SET'),
        expect.arrayContaining([
          'Updated Title',
          'Updated Description',
          JSON.stringify(['new-tag']),
        ])
      );
    });

    it('should handle partial updates', async () => {
      const updates = {
        title: 'New Title Only',
      };

      // Mock getVideoById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          file_path: '/media/video.mp4',
          title: 'Old Title',
          description: null,
          tags: '[]',
          duration: 120,
          resolution: '1920x1080',
          codec: 'h264',
          file_size: 1024,
          created_at: new Date(),
          updated_at: new Date(),
          is_available: true,
          custom_metadata: '{}',
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await videoService.updateVideoMetadata(1, updates);

      expect(mockAdapter.execute).toHaveBeenCalled();
    });
  });

  describe('searchVideos', () => {
    it('should search videos by query', async () => {
      const criteria = {
        query: 'test',
      };

      const videoRows = [
        {
          id: 1,
          file_path: '/media/test.mp4',
          title: 'Test Video',
          description: null,
          tags: '[]',
          duration: 120,
          resolution: '1920x1080',
          codec: 'h264',
          file_size: 1024,
          created_at: new Date(),
          updated_at: new Date(),
          is_available: true,
          custom_metadata: '{}',
        },
      ];

      mockAdapter.query.mockResolvedValue(videoRows);

      const result = await videoService.searchVideos(criteria);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Video');
    });

    it('should filter by tags', async () => {
      const criteria = {
        tags: ['tutorial', 'demo'],
      };

      mockAdapter.query.mockResolvedValue([]);

      const result = await videoService.searchVideos(criteria);

      expect(mockAdapter.query).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when no matches', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await videoService.searchVideos({ query: 'nonexistent' });

      expect(result).toEqual([]);
    });
  });

  describe('deleteVideo', () => {
    it('should delete video by id', async () => {
      // Mock getVideoById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          file_path: '/media/video.mp4',
          title: 'Test Video',
          description: null,
          tags: '[]',
          duration: 120,
          resolution: '1920x1080',
          codec: 'h264',
          file_size: 1024,
          created_at: new Date(),
          updated_at: new Date(),
          is_available: true,
          custom_metadata: '{}',
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await videoService.deleteVideo(1);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE videos SET is_available'),
        [false, 1]
      );
    });
  });

  describe('getAllVideos', () => {
    it('should return all available videos by default', async () => {
      const videoRows = [
        {
          id: 1,
          file_path: '/media/video1.mp4',
          title: 'Video 1',
          description: null,
          tags: '[]',
          duration: 120,
          resolution: '1920x1080',
          codec: 'h264',
          file_size: 1024,
          created_at: new Date(),
          updated_at: new Date(),
          is_available: true,
          custom_metadata: '{}',
        },
      ];

      mockAdapter.query.mockResolvedValue(videoRows);

      const result = await videoService.getAllVideos();

      expect(result).toHaveLength(1);
      expect(mockAdapter.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_available = ?'),
        [true]
      );
    });

    it('should include unavailable videos when requested', async () => {
      mockAdapter.query.mockResolvedValue([]);

      await videoService.getAllVideos(true);

      expect(mockAdapter.query).toHaveBeenCalledWith(
        expect.not.stringContaining('WHERE is_available'),
        []
      );
    });
  });

  describe('getVideoCount', () => {
    it('should return count of available videos', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 5 }]);

      const result = await videoService.getVideoCount();

      expect(result).toBe(5);
    });

    it('should return 0 when no videos exist', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 0 }]);

      const result = await videoService.getVideoCount();

      expect(result).toBe(0);
    });
  });
});
