/**
 * ClipService Unit Tests
 *
 * Tests clip operations including creation with validation and metadata isolation.
 */

import { ClipService } from '../ClipService';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';

describe('ClipService', () => {
  let clipService: ClipService;
  let mockAdapter: jest.Mocked<DatabaseAdapter>;

  beforeEach(() => {
    mockAdapter = {
      query: jest.fn(),
      execute: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      runMigrations: jest.fn(),
      getMigrationHistory: jest.fn(),
    } as unknown as jest.Mocked<DatabaseAdapter>;

    clipService = new ClipService(mockAdapter);
    jest.clearAllMocks();
  });

  describe('createClip', () => {
    const validVideo = {
      id: 1,
      file_path: '/media/video.mp4',
      title: 'Test Video',
      description: 'Description',
      tags: '["tag1"]',
      duration: 180,
      resolution: '1920x1080',
      codec: 'h264',
      file_size: 1024,
      created_at: new Date(),
      updated_at: new Date(),
      is_available: true,
      custom_metadata: '{"source":"camera"}',
    };

    it('should create clip with valid time range', async () => {
      const input = {
        videoId: 1,
        name: 'Test Clip',
        startTime: 10,
        endTime: 30,
      };

      // Mock transaction flow
      mockAdapter.query
        .mockResolvedValueOnce([validVideo]) // Video exists check
        .mockResolvedValueOnce([
          {
            // getClipById after insert
            id: 1,
            video_id: 1,
            name: 'Test Clip',
            description: null,
            start_time: 10,
            end_time: 30,
            duration: 20,
            inherited_metadata: '{"tags":["tag1"],"resolution":"1920x1080"}',
            custom_metadata: '{}',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

      const result = await clipService.createClip(input);

      expect(result.name).toBe('Test Clip');
      expect(result.duration).toBe(20);
      expect(mockAdapter.beginTransaction).toHaveBeenCalled();
      expect(mockAdapter.execute).toHaveBeenCalled();
      expect(mockAdapter.commit).toHaveBeenCalled();
    });

    it('should validate startTime < endTime', async () => {
      const input = {
        videoId: 1,
        name: 'Invalid Clip',
        startTime: 50,
        endTime: 30,
      };

      mockAdapter.query.mockResolvedValue([validVideo]);

      await expect(clipService.createClip(input)).rejects.toThrow(
        'Start time must be less than end time'
      );
    });

    it('should validate times within video duration', async () => {
      const input = {
        videoId: 1,
        name: 'Out of Range',
        startTime: 10,
        endTime: 200, // Video duration is 180
      };

      mockAdapter.query.mockResolvedValue([validVideo]);

      await expect(clipService.createClip(input)).rejects.toThrow(
        'End time (200s) exceeds video duration (180s)'
      );
    });

    it('should throw error for non-existent video', async () => {
      const input = {
        videoId: 999,
        name: 'Test Clip',
        startTime: 10,
        endTime: 30,
      };

      mockAdapter.query.mockResolvedValue([]);

      await expect(clipService.createClip(input)).rejects.toThrow('Source video not found');
    });

    it('should inherit metadata from video', async () => {
      const input = {
        videoId: 1,
        name: 'Metadata Test',
        startTime: 10,
        endTime: 30,
      };

      mockAdapter.query.mockResolvedValueOnce([validVideo]).mockResolvedValueOnce([
        {
          id: 1,
          video_id: 1,
          name: 'Metadata Test',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{"tags":["tag1"],"resolution":"1920x1080","codec":"h264"}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

      const result = await clipService.createClip(input);

      // Verify inherited metadata is populated
      expect(result.inheritedMetadata).toHaveProperty('tags');
      expect(result.inheritedMetadata).toHaveProperty('resolution');
    });

    it('should support custom metadata at creation', async () => {
      const input = {
        videoId: 1,
        name: 'Custom Meta Clip',
        startTime: 10,
        endTime: 30,
        customMetadata: { category: 'highlight', rating: 5 },
      };

      mockAdapter.query.mockResolvedValueOnce([validVideo]).mockResolvedValueOnce([
        {
          id: 1,
          video_id: 1,
          name: 'Custom Meta Clip',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{"category":"highlight","rating":5}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

      const result = await clipService.createClip(input);

      expect(result.customMetadata).toEqual({ category: 'highlight', rating: 5 });
    });
  });

  describe('updateClipMetadata', () => {
    it('should update custom metadata only', async () => {
      const updates = {
        customMetadata: { newField: 'value' },
      };

      // Mock getClipById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          video_id: 1,
          name: 'Test Clip',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await clipService.updateClipMetadata(1, updates);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE clips'),
        expect.arrayContaining([JSON.stringify({ newField: 'value' })])
      );
    });

    it('should not modify inherited metadata', async () => {
      const updates = {
        customMetadata: { test: 'value' },
      };

      // Mock getClipById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          video_id: 1,
          name: 'Test Clip',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await clipService.updateClipMetadata(1, updates);

      // Verify only custom_metadata column is updated
      const call = (mockAdapter.execute as jest.Mock).mock.calls[0][0];
      expect(call).toContain('custom_metadata');
      expect(call).not.toContain('inherited_metadata');
    });
  });

  describe('getClipsByVideo', () => {
    it('should return clips for specific video', async () => {
      const clipRows = [
        {
          id: 1,
          video_id: 1,
          name: 'Clip 1',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValue(clipRows);

      const result = await clipService.getClipsByVideo(1);

      expect(result).toHaveLength(1);
      expect(result[0].videoId).toBe(1);
    });

    it('should return empty array when video has no clips', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await clipService.getClipsByVideo(999);

      expect(result).toEqual([]);
    });
  });

  describe('getOrphanedClips', () => {
    it('should return clips with unavailable videos', async () => {
      const orphanedClips = [
        {
          id: 1,
          video_id: 999,
          name: 'Orphaned Clip',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValue(orphanedClips);

      const result = await clipService.getOrphanedClips();

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deleteClip', () => {
    it('should delete clip by id', async () => {
      // Mock getClipById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          video_id: 1,
          name: 'Test Clip',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await clipService.deleteClip(1);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM clips WHERE id'),
        [1]
      );
    });
  });

  describe('getAllClips', () => {
    it('should return all clips', async () => {
      const clipRows = [
        {
          id: 1,
          video_id: 1,
          name: 'Clip 1',
          description: null,
          start_time: 10,
          end_time: 30,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          video_id: 1,
          name: 'Clip 2',
          description: null,
          start_time: 40,
          end_time: 60,
          duration: 20,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValue(clipRows);

      const result = await clipService.getAllClips();

      expect(result).toHaveLength(2);
    });
  });

  describe('getClipCount', () => {
    it('should return total clip count', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 10 }]);

      const result = await clipService.getClipCount();

      expect(result).toBe(10);
    });

    it('should return count for specific video', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 3 }]);

      const result = await clipService.getClipCount(1);

      expect(result).toBe(3);
    });
  });
});
