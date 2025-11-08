# Requirements Document

## Introduction

This document defines the requirements for a self-hosted web media player application that provides advanced video playback, organization, and clip management capabilities. The application will be deployed as a Docker container, serving video files from mounted storage volumes. Users can search, filter, and organize videos with rich metadata, create time-based markers and clips within videos, build playlists from clips, and manage content through a secure local authentication system.

The media player addresses the need for a self-hosted video management solution with professional-grade clip marking and playlist creation capabilities, similar to tools used in video editing and content production workflows.

## Alignment with Product Vision

This feature establishes the foundation for a self-hosted media management platform that prioritizes user control, data ownership, and advanced content organization capabilities. The clip/marker system enables users to work with video content at a granular level, supporting workflows common in content creation, research, and media analysis.

## Requirements

### Requirement 1: Video File Management

**User Story:** As a media consumer, I want the application to serve video files from mounted Docker volumes, so that I can access my video library through a web interface without duplicating files.

#### Acceptance Criteria

1. WHEN the Docker container starts THEN the system SHALL scan mounted volume paths for video files
2. WHEN video files are added to mounted volumes THEN the system SHALL detect new files within 60 seconds
3. WHEN video files are removed from mounted volumes THEN the system SHALL update the database to reflect unavailable files
4. IF a video file path becomes unavailable THEN the system SHALL mark the video as unavailable but retain metadata and associated clips
5. WHEN serving video content THEN the system SHALL support HLS/DASH adaptive bitrate streaming for optimal playback performance

### Requirement 2: Database Abstraction Layer

**User Story:** As a system administrator, I want the application to support both MySQL and PostgreSQL databases through an agnostic adapter pattern, so that I can choose the database that best fits my infrastructure.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL load the appropriate database adapter based on configuration
2. WHEN database operations are performed THEN the system SHALL use a unified interface that abstracts database-specific implementations
3. IF the database type is changed in configuration THEN the system SHALL connect using the new adapter without code changes
4. WHEN executing queries THEN the adapter SHALL translate operations to database-specific syntax
5. IF either database adapter fails THEN the system SHALL provide meaningful error messages indicating the failure point

### Requirement 3: Database Schema Management and Migrations

**User Story:** As a system administrator, I want the application to automatically manage database schema creation and migrations, so that database structure stays synchronized with application versions.

#### Acceptance Criteria

1. WHEN the application starts for the first time THEN the system SHALL create all required tables and indexes
2. WHEN the application version includes schema changes THEN the system SHALL detect and execute pending migrations automatically
3. WHEN migrations are executed THEN the system SHALL record migration history in the database
4. IF a migration fails THEN the system SHALL roll back the transaction and prevent application startup
5. WHEN querying migration status THEN the system SHALL provide the current schema version and list of applied migrations

### Requirement 4: Video Metadata Management

**User Story:** As a media consumer, I want to store rich metadata for each video, so that I can organize and find content effectively.

#### Acceptance Criteria

1. WHEN a video is added THEN the system SHALL allow storing metadata fields including: title, description, tags, duration, resolution, codec, file size, upload date, and custom fields
2. WHEN metadata is updated THEN the system SHALL persist changes immediately to the database
3. WHEN viewing a video THEN the system SHALL display all associated metadata
4. IF metadata extraction is available THEN the system SHALL auto-populate technical metadata (duration, resolution, codec) from video file headers
5. WHEN custom metadata fields are defined THEN the system SHALL support string, number, date, and boolean value types

### Requirement 5: Advanced Search and Filtering

**User Story:** As a media consumer, I want to search and filter videos using multiple criteria, so that I can quickly find specific content in large libraries.

#### Acceptance Criteria

1. WHEN searching THEN the system SHALL support full-text search across title, description, and tags
2. WHEN filtering THEN the system SHALL support combining multiple filter criteria using AND/OR logic
3. WHEN filtering by metadata THEN the system SHALL support operators including: equals, contains, greater than, less than, between, is empty, is not empty
4. WHEN search results are displayed THEN the system SHALL show matching videos with relevant metadata highlighted
5. WHEN filtering by custom fields THEN the system SHALL apply type-appropriate operators (numeric comparisons for numbers, date ranges for dates, etc.)
6. IF no results match the search criteria THEN the system SHALL display a clear "no results" message with suggestions to refine the search

### Requirement 6: Marker and Clip Creation

**User Story:** As a media consumer, I want to mark specific time ranges within videos as clips, so that I can isolate and access interesting segments without editing the source file.

#### Acceptance Criteria

1. WHEN watching a video THEN the system SHALL provide controls to set start and end timestamps for a clip
2. WHEN creating a clip THEN the system SHALL require a start time, end time, and optional name/description
3. WHEN a clip is saved THEN the system SHALL store the clip as a database record linked to the source video
4. WHEN viewing a clip THEN the system SHALL play only the marked time range from the source video file
5. WHEN creating a clip THEN the system SHALL validate that start time is before end time and both are within video duration
6. WHEN clips are listed THEN the system SHALL display clip name, duration, and preview thumbnail
7. IF a source video is unavailable THEN the system SHALL indicate that associated clips cannot be played

### Requirement 7: Clip Metadata Inheritance and Isolation

**User Story:** As a media consumer, I want clips to inherit some metadata from their source videos while allowing independent metadata modifications, so that clips can be organized separately from their source content.

#### Acceptance Criteria

1. WHEN a clip is created THEN the system SHALL automatically copy specified metadata fields from the source video (configurable inheritance rules)
2. WHEN clip metadata is modified THEN the system SHALL update only the clip record without affecting source video metadata
3. WHEN source video metadata is modified THEN the system SHALL NOT automatically update inherited clip metadata
4. WHEN viewing a clip THEN the system SHALL clearly distinguish between inherited and clip-specific metadata
5. WHEN deleting a source video THEN the system SHALL preserve clip records but mark them as orphaned

### Requirement 8: Clip Playlist Management

**User Story:** As a media consumer, I want to create playlists composed of clips from multiple videos, so that I can organize content into curated collections.

#### Acceptance Criteria

1. WHEN creating a playlist THEN the system SHALL allow adding clips from any video in the library
2. WHEN adding clips to a playlist THEN the system SHALL allow specifying the playback order
3. WHEN playing a playlist THEN the system SHALL play clips sequentially according to the defined order
4. WHEN a playlist is played THEN the system SHALL transition automatically between clips
5. WHEN reordering playlist items THEN the system SHALL update the sequence immediately
6. WHEN a clip is deleted THEN the system SHALL remove it from all playlists that contain it
7. IF a playlist contains orphaned clips THEN the system SHALL skip unavailable clips during playback and display a warning

### Requirement 9: User Authentication and Authorization

**User Story:** As a system administrator, I want a local authentication system, so that only authorized users can access the media library.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL require users to log in before accessing any content
2. WHEN a user logs in THEN the system SHALL validate credentials against locally stored user accounts
3. WHEN authentication succeeds THEN the system SHALL create a secure session token
4. WHEN a user accesses protected resources THEN the system SHALL validate the session token
5. IF authentication fails THEN the system SHALL display an error message and not grant access
6. WHEN a user logs out THEN the system SHALL invalidate the session token
7. WHEN creating a user account THEN the system SHALL hash passwords using a secure algorithm (bcrypt or argon2)

### Requirement 10: Docker Deployment

**User Story:** As a system administrator, I want the application to run as a Docker container, so that I can deploy it consistently across different environments.

#### Acceptance Criteria

1. WHEN building the Docker image THEN the system SHALL include all required dependencies and runtime components
2. WHEN starting the container THEN the system SHALL accept environment variables for configuration (database connection, mounted paths, port)
3. WHEN mounting volumes THEN the system SHALL support read-only mounts for video files and read-write mounts for database storage
4. WHEN the container starts THEN the system SHALL verify all required volume mounts are present
5. IF required configuration is missing THEN the system SHALL log clear error messages and exit with a non-zero status code
6. WHEN the container stops THEN the system SHALL gracefully close database connections and complete in-flight requests

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: Each module should have a single, well-defined purpose (e.g., separate modules for video scanning, database operations, clip management, authentication)
- **Modular Design**: Database adapters, video processors, and API endpoints should be isolated and independently testable
- **Dependency Management**: Minimize coupling between layers (presentation, business logic, data access)
- **Clear Interfaces**: Define TypeScript interfaces for database adapters, video metadata, clips, and playlists

### Performance

- **Video Streaming**: Support adaptive bitrate streaming (HLS/DASH) for smooth playback on varying network conditions
- **Search Response Time**: Full-text search queries should return results within 500ms for libraries up to 10,000 videos
- **Database Queries**: Metadata retrieval and clip lookups should complete within 100ms under normal load
- **Concurrent Streaming**: Support at least 10 concurrent video streams without degradation
- **File Scanning**: Initial video library scan should process at least 100 files per minute

### Security

- **Authentication**: Implement secure password hashing (bcrypt or argon2) with minimum 12 rounds
- **Session Management**: Use HTTP-only, secure cookies for session tokens with configurable expiration
- **Input Validation**: Validate and sanitize all user inputs to prevent SQL injection and XSS attacks
- **File Access**: Restrict file system access to configured mounted volumes only
- **Database Credentials**: Support environment variable configuration for sensitive credentials (never hardcode)

### Reliability

- **Database Migrations**: Failed migrations must roll back completely to prevent partial schema updates
- **Video File Availability**: Application should continue functioning when some video files become temporarily unavailable
- **Error Handling**: All database errors and file I/O errors should be caught, logged, and handled gracefully
- **Data Integrity**: Clip timestamps and playlist ordering should be validated on every write operation

### Usability

- **Responsive Design**: Web interface should function on desktop browsers (Chrome, Firefox, Safari, Edge)
- **Video Player Controls**: Provide standard controls (play, pause, seek, volume, fullscreen) plus clip marking controls
- **Keyboard Shortcuts**: Support keyboard shortcuts for common actions (space for play/pause, arrow keys for seeking)
- **Visual Feedback**: Provide clear loading states, error messages, and success confirmations for all user actions
- **Clip Timeline Visualization**: Display clips as markers on the video timeline for easy identification of marked segments
