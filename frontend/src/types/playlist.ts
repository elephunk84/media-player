/**
 * Playlist Types
 *
 * Type definitions for playlist data matching the backend API.
 */

/**
 * Playlist model representing a collection of clips
 */
export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  clipCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Clip within a playlist (includes ordering and video info)
 */
export interface PlaylistClip {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  startTime: number;
  endTime: number;
  order: number;
  videoId: number;
  inheritedMetadata: Record<string, unknown>;
  customMetadata: Record<string, unknown>;
  video?: {
    id: number;
    title: string;
    filePath: string;
    isAvailable: boolean;
  };
}

/**
 * Playlist with all clips included
 */
export interface PlaylistWithClips extends Playlist {
  clips: PlaylistClip[];
}

/**
 * Input for creating a new playlist
 */
export interface CreatePlaylistData {
  name: string;
  description?: string;
}

/**
 * Input for updating an existing playlist
 */
export interface UpdatePlaylistData {
  name?: string;
  description?: string;
}

/**
 * Input for adding a clip to a playlist
 */
export interface AddClipToPlaylistData {
  clipId: number;
  order: number;
}

/**
 * Input for reordering clips in a playlist
 */
export interface ReorderClipsData {
  clipOrders: Array<{
    clipId: number;
    order: number;
  }>;
}
