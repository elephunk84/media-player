# Requirements Document

## Introduction

The Media Metadata Loader feature provides automated discovery, matching, and loading of video files with their associated metadata into the database. Video files are stored in a flat directory structure (`/mnt/Videos`) with UUID-based filenames, while metadata is organized in nested folders (`/mnt/Metadata/{UUID}/*.info.json`). This feature eliminates manual data entry and ensures video files are properly cataloged with their complete metadata.

**Value Proposition**: Automated media ingestion reduces manual work, prevents data entry errors, and ensures all video content is properly indexed and searchable within the application.

## Alignment with Product Vision

This feature aligns with the project's goal of managing local media files efficiently. By automating the ingestion process, it:
- Supports the core video player functionality by ensuring media is properly cataloged
- Enables future features like search, filtering, and playlist management by establishing metadata relationships
- Maintains data integrity through systematic validation and error handling
- Scales to handle large media libraries without manual intervention

## Requirements

### REQ-1: Video File Discovery

**User Story:** As a system administrator, I want the system to automatically discover all video files in the `/mnt/Videos` directory, so that I don't have to manually register each video file.

#### Acceptance Criteria

1. WHEN the media loader is executed THEN the system SHALL scan the `/mnt/Videos` directory
2. WHEN scanning the directory THEN the system SHALL identify all files with valid video extensions (.mp4, .mkv, .avi, .mov, .webm, .flv, .wmv, .m4v)
3. WHEN a file is found THEN the system SHALL extract the UUID portion from the filename
4. IF a filename does not contain a valid UUID format THEN the system SHALL log a warning and skip the file
5. WHEN scanning is complete THEN the system SHALL report the total number of video files discovered

### REQ-2: UUID Extraction

**User Story:** As a system, I need to extract UUIDs from video filenames, so that I can locate the corresponding metadata files.

#### Acceptance Criteria

1. WHEN a video filename is processed THEN the system SHALL extract the UUID using pattern matching
2. IF the filename contains a valid UUID v4 format (8-4-4-4-12 hexadecimal characters) THEN the system SHALL extract it
3. IF the UUID is embedded within the filename (e.g., `video_550e8400-e29b-41d4-a716-446655440000.mp4`) THEN the system SHALL extract the UUID portion
4. IF multiple UUIDs exist in the filename THEN the system SHALL use the first valid UUID found
5. WHEN UUID extraction fails THEN the system SHALL log the filename and reason for failure

### REQ-3: Metadata File Discovery

**User Story:** As a system, I need to locate metadata files for each video, so that I can associate complete information with each video file.

#### Acceptance Criteria

1. WHEN a video UUID is extracted THEN the system SHALL check for a corresponding folder at `/mnt/Metadata/{UUID}/`
2. IF the metadata folder exists THEN the system SHALL search for `*.info.json` files within that folder
3. WHEN multiple `*.info.json` files exist THEN the system SHALL use the first file found alphabetically
4. IF no metadata folder exists THEN the system SHALL log a warning and mark the video as "metadata missing"
5. IF the metadata folder exists but contains no `*.info.json` files THEN the system SHALL log an error and mark the video as "metadata invalid"

### REQ-4: Metadata Parsing and Validation

**User Story:** As a system, I need to parse and validate metadata JSON files, so that only well-formed data is stored in the database.

#### Acceptance Criteria

1. WHEN a `*.info.json` file is found THEN the system SHALL read and parse the JSON content
2. IF the JSON is malformed or unparseable THEN the system SHALL log an error with filename and parse error details
3. WHEN JSON parsing succeeds THEN the system SHALL validate that the content is a valid JSON object (not array or primitive)
4. IF the parsed JSON is empty (`{}`) THEN the system SHALL log a warning but continue processing
5. WHEN metadata parsing completes THEN the system SHALL store the raw JSON object for database insertion

### REQ-5: Database Storage Preparation

**User Story:** As a system, I need to prepare video and metadata for database storage, so that the data can be persisted and queried.

#### Acceptance Criteria

1. WHEN a video file and metadata are successfully matched THEN the system SHALL create a data structure containing:
   - Video file path (absolute path)
   - Video filename
   - Extracted UUID
   - Metadata file path (absolute path)
   - Parsed metadata JSON object
   - Discovery timestamp
2. WHEN the database schema is not yet defined THEN the system SHALL store the complete metadata JSON as a flexible JSONB/TEXT field
3. IF database insertion fails THEN the system SHALL log the error and continue processing remaining files
4. WHEN all files are processed THEN the system SHALL report success/failure counts

### REQ-6: Batch Processing

**User Story:** As a system administrator, I want to process all video files in a single operation, so that I can efficiently import large media libraries.

#### Acceptance Criteria

1. WHEN the loader is executed THEN the system SHALL process all discovered video files sequentially or in controlled batches
2. IF the total number of files exceeds 100 THEN the system SHALL process in batches of 100 and report progress after each batch
3. WHEN processing a batch THEN the system SHALL continue processing even if individual files fail
4. IF a critical error occurs (e.g., database connection failure) THEN the system SHALL stop processing and report the error
5. WHEN batch processing completes THEN the system SHALL provide a summary report with:
   - Total files discovered
   - Successfully processed count
   - Failed files count
   - Missing metadata count
   - Processing duration

### REQ-7: Error Handling and Logging

**User Story:** As a system administrator, I want detailed error logs and handling, so that I can troubleshoot issues and ensure data quality.

#### Acceptance Criteria

1. WHEN any error occurs THEN the system SHALL log the error with:
   - Timestamp
   - Error type/category
   - Affected file(s)
   - Error message
   - Stack trace (for unexpected errors)
2. IF a video file cannot be read THEN the system SHALL log a file permission error and skip the file
3. IF a metadata file cannot be read THEN the system SHALL log the error and mark the video as "metadata read error"
4. WHEN processing completes THEN the system SHALL generate a summary log file with all errors and warnings
5. IF any critical errors occur THEN the system SHALL exit with a non-zero status code

### REQ-8: Idempotency and Re-run Safety

**User Story:** As a system administrator, I want to re-run the loader without duplicating data, so that I can safely retry after fixing errors.

#### Acceptance Criteria

1. WHEN a video file UUID already exists in the database THEN the system SHALL check for differences in metadata
2. IF metadata has changed THEN the system SHALL update the existing record (not create a duplicate)
3. IF metadata is identical THEN the system SHALL skip the file and log "already up-to-date"
4. WHEN the loader is re-run THEN the system SHALL only process new or changed files
5. IF a video file was previously marked as "missing metadata" but metadata now exists THEN the system SHALL update the record with the new metadata

### REQ-9: Progress Reporting

**User Story:** As a system administrator, I want real-time progress updates during processing, so that I can monitor long-running import operations.

#### Acceptance Criteria

1. WHEN processing begins THEN the system SHALL display a progress indicator showing:
   - Current file being processed (filename)
   - Files processed so far / Total files
   - Percentage complete
   - Estimated time remaining (after processing first 10 files)
2. WHEN a file is successfully processed THEN the system SHALL log a success message with the video UUID
3. IF processing takes longer than 5 seconds per file THEN the system SHALL log a warning about slow processing
4. WHEN processing completes THEN the system SHALL display a final summary with all statistics

### REQ-10: Command-Line Interface

**User Story:** As a system administrator, I want a simple command-line interface, so that I can easily trigger the media loading process.

#### Acceptance Criteria

1. WHEN the loader is invoked THEN the system SHALL accept command-line arguments for:
   - Video directory path (default: `/mnt/Videos`)
   - Metadata directory path (default: `/mnt/Metadata`)
   - Batch size (default: 100)
   - Dry-run mode (preview without database writes)
   - Verbose logging (enable detailed debug output)
2. IF the video directory does not exist THEN the system SHALL exit with an error message
3. IF the metadata directory does not exist THEN the system SHALL log a warning and continue (treating all videos as "missing metadata")
4. WHEN dry-run mode is enabled THEN the system SHALL process files but not write to the database
5. WHEN verbose logging is enabled THEN the system SHALL output debug information for each file processed

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: Separate concerns into distinct modules:
  - `VideoScanner` - Directory scanning and file discovery
  - `UUIDExtractor` - UUID pattern matching and extraction
  - `MetadataLoader` - Metadata file reading and parsing
  - `DatabaseWriter` - Database insertion and updates
  - `MediaLoaderOrchestrator` - Coordinates the loading process
- **Modular Design**: Each component should be independently testable and reusable
- **Dependency Management**: Use dependency injection for database connections and file system operations
- **Clear Interfaces**: Define TypeScript interfaces for all data structures passed between modules

### Performance

- **Processing Speed**: Process at least 10 files per second on standard hardware
- **Memory Efficiency**: Stream large files instead of loading entire contents into memory
- **Batch Processing**: Support configurable batch sizes to optimize database writes
- **Concurrency**: Support parallel processing of up to 10 files simultaneously (optional enhancement)

### Security

- **Path Traversal Prevention**: Validate all file paths to prevent directory traversal attacks
- **Input Validation**: Sanitize and validate all filenames and UUIDs before database insertion
- **File Permissions**: Verify read permissions before attempting to access files
- **JSON Injection Prevention**: Treat metadata JSON as untrusted data

### Reliability

- **Error Recovery**: Continue processing after individual file failures
- **Transaction Safety**: Wrap database operations in transactions where appropriate
- **Logging**: Comprehensive logging for all operations and errors
- **Idempotency**: Safe to re-run multiple times without data corruption

### Usability

- **Clear Progress Indicators**: Real-time feedback during long-running operations
- **Helpful Error Messages**: Descriptive error messages with actionable guidance
- **Dry-Run Mode**: Preview functionality before making database changes
- **Summary Reports**: Clear final report with success/failure statistics
