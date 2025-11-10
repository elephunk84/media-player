/**
 * Models Module
 *
 * This module exports all data model interfaces and types
 * for the media player application.
 */

// Video models
export { Video, VideoMetadata, CreateVideoInput, UpdateVideoInput, VideoRow } from './Video';

// Clip models
export {
  Clip,
  ClipMetadata,
  ClipWithVideo,
  CreateClipInput,
  UpdateClipInput,
  ClipRow,
} from './Clip';

// Playlist models
export {
  Playlist,
  PlaylistClip,
  PlaylistWithClips,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddClipToPlaylistInput,
  ReorderPlaylistInput,
  PlaylistRow,
  PlaylistClipRow,
} from './Playlist';

// User models
export {
  User,
  UserPublic,
  CreateUserInput,
  LoginCredentials,
  ChangePasswordInput,
  AuthResponse,
  UserRow,
} from './User';

// Migration models
export { Migration, MigrationRow } from './Migration';

// Media file models (UUID-based)
export {
  MediaFile,
  MediaFileData,
  MetadataFile,
  CreateMediaFileInput,
  UpdateMediaFileInput,
  MediaFileRow,
} from './MediaFile';

// Search and filter types
export {
  FilterOperator,
  MetadataField,
  FilterCondition,
  MetadataFilter,
  SortDirection,
  SortCriteria,
  PaginationParams,
  DateRange,
  VideoSearchCriteria,
  ClipSearchCriteria,
  PlaylistSearchCriteria,
  PaginatedResponse,
} from './Search';
