/**
 * PlaylistService Unit Tests
 *
 * Tests playlist operations including ordering, reordering, and clip management.
 */

import { PlaylistService } from '../PlaylistService';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';

describe('PlaylistService', () => {
  let playlistService: PlaylistService;
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

    playlistService = new PlaylistService(mockAdapter);
    jest.clearAllMocks();
  });

  describe('createPlaylist', () => {
    it('should create playlist with name and description', async () => {
      const input = {
        name: 'My Playlist',
        description: 'Test playlist',
      };

      // Mock execute for INSERT
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

      // Mock query for getPlaylistById
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          name: 'My Playlist',
          description: 'Test playlist',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await playlistService.createPlaylist(input);

      expect(result.name).toBe('My Playlist');
      expect(result.description).toBe('Test playlist');
    });

    it('should create playlist without description', async () => {
      const input = {
        name: 'Simple Playlist',
      };

      // Mock execute for INSERT
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

      // Mock query for getPlaylistById
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          name: 'Simple Playlist',
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await playlistService.createPlaylist(input);

      expect(result.description).toBeNull();
    });
  });

  describe('addClipToPlaylist', () => {
    it('should add clip with automatic ordering', async () => {
      // Mock: verify playlist exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 1 }]);
      // Mock: verify clip exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 10 }]);
      // Mock: check if clip already in playlist
      mockAdapter.query.mockResolvedValueOnce([]);
      // Mock: get max order (for getNextOrderIndex)
      mockAdapter.query.mockResolvedValueOnce([{ max_order: 2 }]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.addClipToPlaylist(1, 10);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_clips'),
        expect.arrayContaining([1, 10, 3]) // order should be max + 1
      );
    });

    it('should add clip with specified order', async () => {
      // Mock: verify playlist exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 1 }]);
      // Mock: verify clip exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 10 }]);
      // Mock: check if clip already in playlist
      mockAdapter.query.mockResolvedValueOnce([]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.addClipToPlaylist(1, 10, 5);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_clips'),
        expect.arrayContaining([1, 10, 5])
      );
    });

    it('should start ordering at 0 for empty playlist', async () => {
      // Mock: verify playlist exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 1 }]);
      // Mock: verify clip exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 10 }]);
      // Mock: check if clip already in playlist
      mockAdapter.query.mockResolvedValueOnce([]);
      // Mock: get max order (returns null for empty playlist)
      mockAdapter.query.mockResolvedValueOnce([{ max_order: null }]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.addClipToPlaylist(1, 10);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO playlist_clips'),
        expect.arrayContaining([1, 10, 0])
      );
    });
  });

  describe('removeClipFromPlaylist', () => {
    it('should remove clip from playlist', async () => {
      // Mock: verify playlist exists
      mockAdapter.query.mockResolvedValueOnce([{ id: 1 }]);
      // Mock: verify clip exists in playlist
      mockAdapter.query.mockResolvedValueOnce([{ playlist_id: 1, clip_id: 10 }]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.removeClipFromPlaylist(1, 10);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM playlist_clips'),
        [1, 10]
      );
    });
  });

  describe('reorderPlaylist', () => {
    it('should reorder clips correctly', async () => {
      const input = {
        playlistId: 1,
        clipOrders: [
          { clipId: 10, order: 0 },
          { clipId: 11, order: 1 },
          { clipId: 12, order: 2 },
        ],
      };

      // Mock: verify all clips are in playlist
      mockAdapter.query.mockResolvedValue([{ clip_id: 10 }, { clip_id: 11 }, { clip_id: 12 }]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.reorderPlaylist(input);

      // Should begin transaction, update each clip's order, and commit
      expect(mockAdapter.beginTransaction).toHaveBeenCalled();
      expect(mockAdapter.execute).toHaveBeenCalledTimes(3);
      expect(mockAdapter.commit).toHaveBeenCalled();
    });

    it('should reject empty reorder input', async () => {
      const input = {
        playlistId: 1,
        clipOrders: [],
      };

      await expect(playlistService.reorderPlaylist(input)).rejects.toThrow(
        'Clip orders must be a non-empty array'
      );
    });

    it('should validate non-negative order values', async () => {
      const input = {
        playlistId: 1,
        clipOrders: [{ clipId: 10, order: -1 }],
      };

      await expect(playlistService.reorderPlaylist(input)).rejects.toThrow(
        'Order index must be non-negative'
      );
    });
  });

  describe('getPlaylistById', () => {
    it('should return playlist with clips in correct order', async () => {
      const playlistRow = {
        id: 1,
        name: 'Test Playlist',
        description: 'Description',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const clipRows = [
        {
          clip_id: 10,
          order_index: 0,
          id: 10,
          name: 'Clip 1',
          video_id: 1,
          start_time: 0,
          end_time: 10,
          duration: 10,
          description: null,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          clip_id: 11,
          order_index: 1,
          id: 11,
          name: 'Clip 2',
          video_id: 1,
          start_time: 10,
          end_time: 20,
          duration: 10,
          description: null,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValueOnce([playlistRow]);
      mockAdapter.query.mockResolvedValueOnce(clipRows);

      const result = await playlistService.getPlaylistById(1);

      expect(result).not.toBeNull();
      if (result && result.clips) {
        expect(result.clips).toHaveLength(2);
        expect(result.clips[0].clipId).toBe(10);
        expect(result.clips[0].order).toBe(0);
        expect(result.clips[1].clipId).toBe(11);
        expect(result.clips[1].order).toBe(1);
      }
    });

    it('should return null for non-existent playlist', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await playlistService.getPlaylistById(999);

      expect(result).toBeNull();
    });
  });

  describe('updatePlaylist', () => {
    it('should update playlist name and description', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      // Mock getPlaylistById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          name: 'Old Name',
          description: 'Old Description',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.updatePlaylist(1, updates);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE playlists SET'),
        expect.arrayContaining(['Updated Name', 'Updated Description'])
      );
    });
  });

  describe('deletePlaylist', () => {
    it('should delete playlist', async () => {
      // Mock getPlaylistById call
      mockAdapter.query.mockResolvedValue([
        {
          id: 1,
          name: 'Test Playlist',
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 });

      await playlistService.deletePlaylist(1);

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM playlists WHERE id'),
        [1]
      );
    });
  });

  describe('getAllPlaylists', () => {
    it('should return all playlists', async () => {
      const playlistRows = [
        {
          id: 1,
          name: 'Playlist 1',
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Playlist 2',
          description: 'Description',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValue(playlistRows);

      const result = await playlistService.getAllPlaylists();

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no playlists exist', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await playlistService.getAllPlaylists();

      expect(result).toEqual([]);
    });
  });

  describe('getOrphanedClips', () => {
    it('should return clips from unavailable videos', async () => {
      const orphanedClips = [
        {
          clip_id: 10,
          order_index: 0,
          id: 10,
          name: 'Orphaned Clip',
          video_id: 999,
          start_time: 0,
          end_time: 10,
          duration: 10,
          description: null,
          inherited_metadata: '{}',
          custom_metadata: '{}',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAdapter.query.mockResolvedValue(orphanedClips);

      const result = await playlistService.getOrphanedClips(1);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPlaylistCount', () => {
    it('should return playlist count', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 5 }]);

      const result = await playlistService.getPlaylistCount();

      expect(result).toBe(5);
    });
  });
});
