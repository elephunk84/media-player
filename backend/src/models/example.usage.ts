/**
 * Model Usage Examples
 *
 * This file demonstrates how to use the model interfaces and types.
 */

import {
  Video,
  CreateVideoInput,
  UpdateVideoInput,
  CreateClipInput,
  Playlist,
  User,
  UserPublic,
  VideoSearchCriteria,
  FilterOperator,
  SortDirection,
  MetadataFilter,
  PaginatedResponse,
} from './index';

/**
 * Example 1: Creating a video
 */
function createVideoExample(): CreateVideoInput {
  const videoInput: CreateVideoInput = {
    filePath: '/movies/action/example.mp4',
    title: 'Example Action Movie',
    description: 'An exciting action movie',
    tags: ['action', 'adventure', 'thriller'],
    duration: 7200, // 2 hours in seconds
    resolution: '1920x1080',
    codec: 'h264',
    fileSize: 2147483648, // 2GB
    customMetadata: {
      director: 'John Doe',
      year: 2024,
      rating: 'PG-13',
      cast: ['Actor 1', 'Actor 2'],
    },
  };

  return videoInput;
}

/**
 * Example 2: Updating a video
 */
function updateVideoExample(): UpdateVideoInput {
  const updateInput: UpdateVideoInput = {
    title: 'Updated Title',
    tags: ['action', 'sci-fi'], // Replace tags
    customMetadata: {
      rating: 'R', // Update rating
      awards: ['Best Picture'], // Add new field
    },
  };

  return updateInput;
}

/**
 * Example 3: Working with a video object
 */
function workWithVideoExample(video: Video): void {
  console.info(`Video: ${video.title}`);
  console.info(`Duration: ${video.duration} seconds`);
  console.info(`Tags: ${video.tags.join(', ')}`);
  console.info(`Available: ${video.isAvailable ? 'Yes' : 'No'}`);

  // Cannot modify readonly fields (TypeScript will error)
  // video.id = 123; // ❌ Error: Cannot assign to 'id' because it is a read-only property
  // video.createdAt = new Date(); // ❌ Error: Cannot assign to 'createdAt'

  // Can modify regular fields
  video.title = 'New Title'; // ✅ OK
  video.tags.push('new-tag'); // ✅ OK
}

/**
 * Example 4: Creating a clip
 */
function createClipExample(): CreateClipInput {
  const clipInput: CreateClipInput = {
    videoId: 1,
    name: 'Best Scene',
    description: 'The most exciting scene from the movie',
    startTime: 3600, // 1 hour
    endTime: 3900, // 1 hour 5 minutes
    inheritedMetadata: {
      director: 'John Doe',
      year: 2024,
    },
    customMetadata: {
      category: 'highlights',
      rating: 5,
    },
  };

  return clipInput;
}

/**
 * Example 5: Working with playlists
 */
function workWithPlaylistExample(): void {
  // Playlist with clips
  const playlist: Playlist = {
    id: 1,
    name: 'Action Highlights',
    description: 'Best action scenes compilation',
    createdAt: new Date(),
    updatedAt: new Date(),
    clips: [
      { clipId: 1, order: 0 },
      { clipId: 3, order: 1 },
      { clipId: 5, order: 2 },
    ],
  };

  console.info(`Playlist: ${playlist.name}`);
  console.info(`Clips: ${playlist.clips?.length ?? 0}`);

  // Sort clips by order
  const sortedClips = playlist.clips?.sort((a, b) => a.order - b.order);
  console.info(
    'Clip order:',
    sortedClips?.map((c) => c.clipId)
  );
}

/**
 * Example 6: User authentication
 */
function userAuthenticationExample(user: User): UserPublic {
  // Convert User to UserPublic (remove sensitive fields)
  const publicUser: UserPublic = {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };

  // Never expose passwordHash
  // console.log(publicUser.passwordHash); // ❌ Property doesn't exist on UserPublic

  return publicUser;
}

/**
 * Example 7: Building search criteria
 */
function buildSearchCriteriaExample(): VideoSearchCriteria {
  // Advanced search with filters
  const advancedSearch: VideoSearchCriteria = {
    query: 'movie',
    tags: ['action'],
    isAvailable: true,
    duration: {
      min: 3600, // At least 1 hour
      max: 10800, // At most 3 hours
    },
    fileSize: {
      min: 1073741824, // At least 1GB
    },
    resolution: ['1920x1080', '3840x2160'], // Full HD or 4K
    createdAt: {
      from: new Date('2024-01-01'),
      to: new Date('2024-12-31'),
    },
    metadata: [
      {
        path: 'director',
        operator: FilterOperator.EQUALS,
        value: 'John Doe',
      },
      {
        path: 'rating',
        operator: FilterOperator.IN,
        value: ['PG', 'PG-13', 'R'],
      },
      {
        path: 'year',
        operator: FilterOperator.GREATER_THAN_OR_EQUAL,
        value: 2020,
      },
    ],
    sort: [
      { field: 'createdAt', direction: SortDirection.DESC },
      { field: 'title', direction: SortDirection.ASC },
    ],
    pagination: {
      limit: 20,
      offset: 0,
    },
  };

  return advancedSearch;
}

/**
 * Example 8: Using metadata filters
 */
function metadataFilterExamples(): MetadataFilter[] {
  const filters: MetadataFilter[] = [
    // Exact match
    {
      path: 'director',
      operator: FilterOperator.EQUALS,
      value: 'Christopher Nolan',
    },

    // Substring search
    {
      path: 'title',
      operator: FilterOperator.CONTAINS,
      value: 'Dark Knight',
    },

    // Numeric comparison
    {
      path: 'year',
      operator: FilterOperator.BETWEEN,
      value: [2000, 2020],
    },

    // Array contains
    {
      path: 'genres',
      operator: FilterOperator.IN,
      value: ['action', 'sci-fi', 'thriller'],
    },

    // Nested path (dot notation)
    {
      path: 'ratings.imdb',
      operator: FilterOperator.GREATER_THAN,
      value: 7.5,
    },

    // Check for null/undefined
    {
      path: 'subtitle',
      operator: FilterOperator.IS_NULL,
    },
  ];

  return filters;
}

/**
 * Example 9: Working with paginated responses
 */
function handlePaginatedResponse(response: PaginatedResponse<Video>): void {
  console.info(`Showing ${response.items.length} of ${response.total} videos`);
  console.info(`Page ${response.page} of ${response.totalPages}`);

  response.items.forEach((video, index) => {
    console.info(`${index + 1}. ${video.title} (${video.duration}s)`);
  });

  if (response.hasNext) {
    console.info('Next page available');
  }

  if (response.hasPrev) {
    console.info('Previous page available');
  }
}

/**
 * Example 10: Type-safe metadata handling
 */
function typeSafeMetadataExample(video: Video): void {
  // Custom metadata is Record<string, unknown>
  const metadata = video.customMetadata;

  // Need to check types before using
  if (typeof metadata.director === 'string') {
    console.info(`Director: ${metadata.director}`);
  }

  if (typeof metadata.year === 'number') {
    console.info(`Year: ${metadata.year}`);
  }

  if (Array.isArray(metadata.cast)) {
    const cast = metadata.cast as string[];
    console.info(`Cast: ${cast.join(', ')}`);
  }

  // Type guard function for better type safety
  function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  if (isStringArray(metadata.cast)) {
    // TypeScript now knows metadata.cast is string[]
    console.info(`Number of actors: ${metadata.cast.length}`);
  }
}

// Export examples for documentation
export {
  createVideoExample,
  updateVideoExample,
  workWithVideoExample,
  createClipExample,
  workWithPlaylistExample,
  userAuthenticationExample,
  buildSearchCriteriaExample,
  metadataFilterExamples,
  handlePaginatedResponse,
  typeSafeMetadataExample,
};
