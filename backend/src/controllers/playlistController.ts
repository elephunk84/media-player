/**
 * Playlist Controller
 *
 * Request handlers for playlist management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { PlaylistService } from '../services/PlaylistService';
import { CreatePlaylistInput, UpdatePlaylistInput, ReorderPlaylistInput } from '../models';
import { NotFoundError } from '../middleware/errors';

/**
 * Playlist controller class
 *
 * Handles HTTP requests for playlist operations and delegates business logic to PlaylistService.
 */
export class PlaylistController {
  private playlistService: PlaylistService;

  constructor(playlistService: PlaylistService) {
    this.playlistService = playlistService;
  }

  /**
   * GET /api/playlists
   *
   * List all playlists.
   *
   * @example
   * GET /api/playlists
   */
  async listPlaylists(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlists = await this.playlistService.getAllPlaylists();

      res.json({
        playlists,
        count: playlists.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/playlists/:id
   *
   * Get a single playlist by ID with ordered clips.
   *
   * Returns the playlist with all clips in order.
   * By default, excludes clips from unavailable videos (orphaned clips).
   *
   * Query params:
   * - includeOrphaned: boolean (default: false) - Include clips from unavailable videos
   *
   * @example
   * GET /api/playlists/1
   * GET /api/playlists/1?includeOrphaned=true
   */
  async getPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const includeOrphaned = req.query.includeOrphaned === 'true';

      const playlist = await this.playlistService.getPlaylistById(id, includeOrphaned);

      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/playlists
   *
   * Create a new playlist.
   *
   * Body (validated by Joi):
   * - name: string (required, 1-255 chars)
   * - description: string | null (optional)
   * - tags: string[] (optional)
   *
   * @example
   * POST /api/playlists
   * Body: {
   *   "name": "My Favorites",
   *   "description": "Collection of favorite clips",
   *   "tags": ["favorites"]
   * }
   */
  async createPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body is already validated by Joi middleware
      const input = req.body as CreatePlaylistInput;

      // Create playlist
      const playlist = await this.playlistService.createPlaylist(input);

      res.status(201).json({
        message: 'Playlist created successfully',
        playlist,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/playlists/:id
   *
   * Update a playlist.
   *
   * Body (all fields optional, at least one required):
   * - name: string (1-255 chars)
   * - description: string | null
   * - tags: string[]
   *
   * @example
   * PUT /api/playlists/1
   * Body: { "name": "Updated Name", "tags": ["updated"] }
   */
  async updatePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if playlist exists
      const playlist = await this.playlistService.getPlaylistById(id);
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      // Update playlist (validated by Joi middleware)
      await this.playlistService.updatePlaylist(id, req.body as UpdatePlaylistInput);

      // Get updated playlist
      const updatedPlaylist = await this.playlistService.getPlaylistById(id);

      res.json({
        message: 'Playlist updated successfully',
        playlist: updatedPlaylist,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/playlists/:id
   *
   * Delete a playlist.
   *
   * Note: This deletes the playlist and all clip associations,
   * but does not delete the clips or videos themselves.
   *
   * @example
   * DELETE /api/playlists/1
   */
  async deletePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Check if playlist exists
      const playlist = await this.playlistService.getPlaylistById(id);
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      // Delete playlist
      await this.playlistService.deletePlaylist(id);

      res.json({
        message: 'Playlist deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/playlists/:id/clips
   *
   * Add a clip to a playlist.
   *
   * Body (validated by Joi):
   * - clipId: number (required) - ID of clip to add
   * - order: number (optional) - Position to insert at (0-based index)
   *
   * If order is not specified, clip is added to the end.
   * If order is specified, existing clips at or after that position are shifted.
   *
   * @example
   * POST /api/playlists/1/clips
   * Body: { "clipId": 5 }
   *
   * POST /api/playlists/1/clips
   * Body: { "clipId": 5, "order": 2 }
   */
  async addClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlistId = Number(req.params.id);
      const { clipId, order } = req.body as { clipId: number; order?: number };

      // Check if playlist exists
      const playlist = await this.playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      // Add clip to playlist (service layer validates clip exists)
      await this.playlistService.addClipToPlaylist(playlistId, clipId, order);

      // Get updated playlist
      const updatedPlaylist = await this.playlistService.getPlaylistById(playlistId);

      res.status(201).json({
        message: 'Clip added to playlist successfully',
        playlist: updatedPlaylist,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/playlists/:id/clips/:clipId
   *
   * Remove a clip from a playlist.
   *
   * Query params:
   * - reorder: boolean (default: true) - Reorder remaining clips to eliminate gaps
   *
   * @example
   * DELETE /api/playlists/1/clips/5
   * DELETE /api/playlists/1/clips/5?reorder=false
   */
  async removeClip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlistId = Number(req.params.id);
      const clipId = Number(req.params.clipId);
      const reorder = req.query.reorder !== 'false'; // Default true

      // Check if playlist exists
      const playlist = await this.playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      // Remove clip from playlist
      await this.playlistService.removeClipFromPlaylist(playlistId, clipId, reorder);

      // Get updated playlist
      const updatedPlaylist = await this.playlistService.getPlaylistById(playlistId);

      res.json({
        message: 'Clip removed from playlist successfully',
        playlist: updatedPlaylist,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/playlists/:id/reorder
   *
   * Reorder clips in a playlist.
   *
   * This operation is ATOMIC - either all clips are reordered successfully,
   * or none are (transaction rollback on error).
   *
   * Body (validated by Joi):
   * - clipOrders: Array<{ clipId: number, order: number }> (required)
   *
   * The clipOrders array should contain all clips that need new positions.
   * Order indices must be unique (no duplicates).
   *
   * @example
   * PATCH /api/playlists/1/reorder
   * Body: {
   *   "clipOrders": [
   *     { "clipId": 5, "order": 0 },
   *     { "clipId": 3, "order": 1 },
   *     { "clipId": 7, "order": 2 }
   *   ]
   * }
   */
  async reorderClips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlistId = Number(req.params.id);

      // Check if playlist exists
      const playlist = await this.playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }

      // Reorder clips atomically (validated by Joi middleware)
      const body = req.body as { clipOrders: Array<{ clipId: number; order: number }> };
      const input: ReorderPlaylistInput = {
        playlistId,
        clipOrders: body.clipOrders,
      };

      await this.playlistService.reorderPlaylist(input);

      // Get updated playlist with new order
      const updatedPlaylist = await this.playlistService.getPlaylistById(playlistId);

      res.json({
        message: 'Playlist reordered successfully',
        playlist: updatedPlaylist,
      });
    } catch (error) {
      next(error);
    }
  }
}
