/**
 * Playlist Model
 *
 * Represents a collection of clips with specific ordering.
 */

import { Clip } from './Clip';

/**
 * Playlist clip association with ordering
 *
 * Represents a clip within a playlist with its position.
 */
export interface PlaylistClip {
  /**
   * ID of the clip in this playlist position
   */
  clipId: number;

  /**
   * Order/position of this clip in the playlist (0-based)
   */
  order: number;

  /**
   * Populated clip details (optional, filled via join)
   */
  clip?: Clip;
}

/**
 * Playlist model representing a collection of clips
 *
 * Matches the playlists table schema in the database.
 */
export interface Playlist {
  /**
   * Unique playlist identifier (auto-generated)
   */
  readonly id: number;

  /**
   * User-friendly name for the playlist
   */
  name: string;

  /**
   * Optional description of the playlist content
   */
  description: string | null;

  /**
   * Timestamp when the playlist was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the playlist was last updated
   */
  updatedAt: Date;

  /**
   * Ordered list of clips in this playlist
   * Populated from playlist_clips junction table
   */
  clips?: PlaylistClip[];
}

/**
 * Playlist with full clip details
 */
export interface PlaylistWithClips extends Playlist {
  /**
   * Ordered list of clips with full details
   */
  clips: Array<PlaylistClip & { clip: Clip }>;
}

/**
 * Playlist creation input (fields required to create a new playlist)
 */
export interface CreatePlaylistInput {
  name: string;
  description?: string | null;
}

/**
 * Playlist update input (fields that can be updated)
 */
export interface UpdatePlaylistInput {
  name?: string;
  description?: string | null;
}

/**
 * Add clip to playlist input
 */
export interface AddClipToPlaylistInput {
  playlistId: number;
  clipId: number;
  order: number;
}

/**
 * Reorder playlist input
 */
export interface ReorderPlaylistInput {
  playlistId: number;
  clipOrders: Array<{
    clipId: number;
    order: number;
  }>;
}

/**
 * Playlist database row (matches database column names with snake_case)
 */
export interface PlaylistRow {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Playlist clip junction table row (matches database column names with snake_case)
 */
export interface PlaylistClipRow {
  playlist_id: number;
  clip_id: number;
  order_index: number;
}
