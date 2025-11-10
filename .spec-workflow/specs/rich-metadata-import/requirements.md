# Requirements Document

## Introduction

The Rich Metadata Import feature enhances the existing media file metadata system to capture and store comprehensive metadata from video download sources. Currently, the system stores basic file information and generic JSON metadata. This enhancement will structure the metadata storage to support provider-specific information, categorization, tagging, thumbnail URLs, format details, and content creator information.

This feature enables users to:
- Access rich metadata for each video file (tags, categories, descriptions)
- View original source information (provider URLs, IDs)
- Display thumbnails for video preview
- Track video formats and quality options
- Organize content by categories and tags
- Associate videos with performers/creators

The enhanced metadata structure supports the existing UUID-based media file system while maintaining compatibility with the current `MediaLoaderService` workflow.

## Alignment with Product Vision

This feature enhances the media management capabilities of the media-player system by:
- **Improving Content Discovery**: Rich tagging and categorization enable better search and filtering
- **Preserving Source Context**: Maintaining provider URLs and IDs enables content verification and re-downloading
- **Enhancing User Experience**: Thumbnails provide visual preview before playback
- **Supporting Content Organization**: Categories and tags enable logical grouping and playlists

## Requirements

### Requirement 1: Store Display Names

**User Story:** As a media library manager, I want to store both the stored filename (UUID) and a human-readable display name, so that I can present user-friendly titles while maintaining unique file identifiers.

#### Acceptance Criteria

1. WHEN a metadata file contains a `display_name` field THEN the system SHALL store it in a dedicated database column
2. WHEN a metadata file contains a `title` field and no `display_name` THEN the system SHALL use the title as the display name
3. WHEN neither `display_name` nor `title` exists THEN the system SHALL use the filename without extension as the display name
4. WHEN displaying media to users THEN the system SHALL show the display name, not the UUID filename

### Requirement 2: Store Provider Information

**User Story:** As a media library manager, I want to track which provider each video came from and its original source URL, so that I can verify content authenticity and re-download if needed.

#### Acceptance Criteria

1. WHEN a metadata file contains a `provider` field THEN the system SHALL store it as a string (e.g., "pornhub", "youtube")
2. WHEN a metadata file contains an `id` field THEN the system SHALL store it as the provider's unique identifier for the video
3. WHEN a metadata file contains a `webpage_url` field THEN the system SHALL store the original source URL
4. WHEN querying media files THEN the system SHALL support filtering by provider

### Requirement 3: Store Tags and Categories in Normalized Tables

**User Story:** As a media library user, I want videos to be tagged and categorized based on their content, so that I can find related videos and organize my library efficiently with fast queries.

#### Acceptance Criteria

1. WHEN the system stores tags THEN it SHALL create a separate `tags` table with each tag as a single row
2. WHEN the system stores categories THEN it SHALL create a separate `categories` table with each category as a single row
3. WHEN a tag or category already exists THEN the system SHALL reuse the existing record (no duplicates)
4. WHEN linking media files to tags THEN the system SHALL use a `media_file_tags` junction table with foreign keys
5. WHEN linking media files to categories THEN the system SHALL use a `media_file_categories` junction table with foreign keys
6. WHEN a metadata file contains a `tags` array THEN the system SHALL create/find each tag and create junction records
7. WHEN a metadata file contains a `categories` array THEN the system SHALL create/find each category and create junction records
8. WHEN a metadata file contains a `primary_tag` field THEN the system SHALL store a foreign key reference to the primary tag in the media_files table
9. WHEN querying media files by tag THEN the system SHALL use JOIN queries on the junction table (not JSON parsing)
10. WHEN querying media files by category THEN the system SHALL use JOIN queries on the junction table (not JSON parsing)
11. WHEN querying media files by primary tag THEN the system SHALL use a simple foreign key lookup
12. WHEN deleting a media file THEN the system SHALL cascade delete all junction table records
13. WHEN a tag/category has no associated media files THEN the system MAY optionally remove the orphaned tag/category record

### Requirement 4: Store Thumbnail Information

**User Story:** As a media library user, I want to see thumbnail previews of videos, so that I can visually identify content before playing.

#### Acceptance Criteria

1. WHEN a metadata file contains a `thumbnail` field THEN the system SHALL store the thumbnail URL
2. WHEN a metadata file contains multiple thumbnail URLs THEN the system SHALL store the highest quality thumbnail
3. WHEN retrieving media file information THEN the system SHALL include the thumbnail URL in the response
4. IF a thumbnail URL is stored THEN the system SHALL validate it is a valid URL format

### Requirement 5: Store Duration Information

**User Story:** As a media library user, I want to see how long each video is, so that I can plan my viewing time.

#### Acceptance Criteria

1. WHEN a metadata file contains a `duration` field in seconds THEN the system SHALL store it as an integer
2. WHEN displaying duration THEN the system SHALL format it as HH:MM:SS for readability
3. WHEN querying media files THEN the system SHALL support filtering by duration range (min/max)

### Requirement 6: Store Format Information

**User Story:** As a media library manager, I want to track which video format was downloaded and what formats were available, so that I can understand quality and re-download higher quality versions if needed.

#### Acceptance Criteria

1. WHEN a metadata file contains a `formats` array THEN the system SHALL store all available formats as a JSON array
2. WHEN a metadata file contains a `downloaded_format` field THEN the system SHALL store which format was actually downloaded
3. WHEN a metadata file contains a `format` field (singular) THEN the system SHALL store it as the downloaded format
4. WHEN querying media files THEN the system SHALL support filtering by downloaded format

### Requirement 7: Store Performer/Creator Information in Normalized Tables

**User Story:** As a media library user, I want to see which performers or creators are featured in each video, so that I can find more content from the same people efficiently.

#### Acceptance Criteria

1. WHEN the system stores performers THEN it SHALL create a separate `performers` table with each performer as a single row
2. WHEN a performer already exists THEN the system SHALL reuse the existing record (no duplicates)
3. WHEN linking media files to performers THEN the system SHALL use a `media_file_performers` junction table with foreign keys
4. WHEN a metadata file contains a `pornstars` array THEN the system SHALL create/find each performer and create junction records
5. WHEN a metadata file contains a `creators` or `uploader` field THEN the system SHALL store it in a `creator` column on the media_files table
6. WHEN querying media files by performer THEN the system SHALL use JOIN queries on the junction table (not JSON parsing)
7. WHEN querying media files by creator THEN the system SHALL use a simple column filter
8. WHEN deleting a media file THEN the system SHALL cascade delete all performer junction records
9. WHEN the performers array is empty THEN the system SHALL create no junction records (not store empty markers)

### Requirement 8: Define Normalized Table Schemas

**User Story:** As a database administrator, I want clear table schemas for tags, categories, and performers, so that the database structure is well-defined and maintainable.

#### Acceptance Criteria

1. WHEN creating the `tags` table THEN it SHALL have columns: `id` (primary key), `name` (unique, indexed), `created_at`, `updated_at`
2. WHEN creating the `categories` table THEN it SHALL have columns: `id` (primary key), `name` (unique, indexed), `created_at`, `updated_at`
3. WHEN creating the `performers` table THEN it SHALL have columns: `id` (primary key), `name` (unique, indexed), `created_at`, `updated_at`
4. WHEN creating the `media_file_tags` junction table THEN it SHALL have columns: `media_file_uuid` (FK to media_files.uuid), `tag_id` (FK to tags.id), composite primary key on both columns
5. WHEN creating the `media_file_categories` junction table THEN it SHALL have columns: `media_file_uuid` (FK to media_files.uuid), `category_id` (FK to categories.id), composite primary key on both columns
6. WHEN creating the `media_file_performers` junction table THEN it SHALL have columns: `media_file_uuid` (FK to media_files.uuid), `performer_id` (FK to performers.id), composite primary key on both columns
7. WHEN defining foreign keys THEN they SHALL use CASCADE DELETE to automatically remove junction records when media files are deleted
8. WHEN defining foreign keys THEN they SHALL use CASCADE DELETE to remove junction records when tags/categories/performers are deleted
9. WHEN creating indexes THEN the system SHALL create indexes on all foreign key columns for query performance
10. WHEN tag/category/performer names are stored THEN they SHALL be case-insensitive unique (handle "Action" vs "action" as the same)

### Requirement 9: Update Existing Records

**User Story:** As a media library manager, I want the metadata import process to update existing records when new metadata is found, so that my library stays current without duplicating entries.

#### Acceptance Criteria

1. WHEN importing metadata for an existing UUID THEN the system SHALL update the existing record, not create a duplicate
2. WHEN updating a record THEN the system SHALL only update fields that have changed
3. WHEN updating tags/categories/performers THEN the system SHALL add new associations and remove old ones that are no longer in the metadata
4. WHEN updating a record THEN the system SHALL update the `updated_at` timestamp
5. WHEN updating a record THEN the system SHALL update the `last_scanned_at` timestamp
6. IF metadata has not changed THEN the system SHALL only update `last_scanned_at`, not `updated_at`

### Requirement 10: Handle Missing Metadata Gracefully

**User Story:** As a media library manager, I want the system to handle incomplete metadata gracefully, so that videos with partial metadata can still be imported and used.

#### Acceptance Criteria

1. WHEN a required field is missing from metadata THEN the system SHALL use a sensible default value
2. WHEN an optional field is missing from metadata THEN the system SHALL store NULL or an empty value as appropriate
3. WHEN metadata parsing fails THEN the system SHALL log the error and continue processing other files
4. WHEN metadata JSON is malformed THEN the system SHALL log the error with the file path and continue

### Requirement 11: Maintain Backward Compatibility

**User Story:** As a system administrator, I want the new metadata schema to be backward compatible with existing data, so that my current media library continues to work during and after the upgrade.

#### Acceptance Criteria

1. WHEN the new schema is deployed THEN existing `media_files` records SHALL remain valid and accessible
2. WHEN migrating the database THEN the system SHALL add new columns with NULL defaults
3. WHEN querying legacy records THEN the system SHALL return NULL for fields that don't have values
4. WHEN the MediaLoaderService runs THEN it SHALL process both old and new metadata formats

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Metadata parsing logic should be separate from database operations
- **Modular Design**: Create reusable metadata validator and transformer utilities
- **Dependency Management**: Keep database adapter changes isolated from service layer logic
- **Clear Interfaces**: Define TypeScript interfaces for the enhanced metadata structure

### Performance
- **Import Speed**: The enhanced metadata import should not significantly slow down the existing MediaLoaderService batch processing
- **Query Performance**: Database queries filtering by tags, categories, or performers should complete in under 500ms for libraries up to 100,000 videos
- **Batch Size**: Maintain the existing batch size of 100 files per transaction
- **Index Strategy**: Add appropriate database indexes for new filterable fields without over-indexing

### Security
- **URL Validation**: Validate thumbnail URLs and webpage URLs to prevent injection attacks
- **Input Sanitization**: Sanitize all metadata text fields before storing to prevent XSS
- **SQL Injection Prevention**: Use parameterized queries for all database operations (already enforced by DatabaseAdapter)
- **File Path Validation**: Validate stored paths are within expected directories

### Reliability
- **Error Recovery**: Metadata parsing errors for one file should not stop processing of other files
- **Transaction Safety**: Database updates should be transactional (rollback on failure)
- **Idempotency**: Re-importing metadata for the same file should produce consistent results
- **Data Integrity**: Foreign key constraints and data type validation should prevent invalid data

### Usability
- **Clear Error Messages**: When metadata import fails, provide clear error messages with file paths and reasons
- **Progress Tracking**: Maintain existing statistics reporting (files processed, errors, etc.)
- **Dry-Run Mode**: Support dry-run mode to preview changes before applying them
- **Logging Verbosity**: Support verbose logging mode for debugging import issues
