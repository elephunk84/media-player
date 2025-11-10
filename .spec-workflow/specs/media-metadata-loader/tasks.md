# Tasks Document

## Phase 1: Database Schema & Models

- [x] 1.1. Create database migration for media_files table
  - File: `backend/src/migrations/00N_create_media_files_table.ts` (where N is next migration number)
  - Create migration to add media_files table with UUID, file paths, and metadata fields
  - Support both MySQL and PostgreSQL syntax
  - Purpose: Establish database schema for UUID-based media storage
  - _Leverage: `src/migrations/001_initial_schema.ts`, `src/adapters/DatabaseAdapter.ts`_
  - _Requirements: REQ-5, Design: Database Schema Extension_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Database Engineer specializing in migrations and schema design | Task: Create a database migration file following the existing migration pattern from src/migrations/001_initial_schema.ts. The migration must create a media_files table with columns: id (primary key, auto-increment), uuid (VARCHAR(36)/UUID unique), file_path (VARCHAR(512)), absolute_path (VARCHAR(1024)), file_size (BIGINT), extension (VARCHAR(10)), metadata_file_path (VARCHAR(1024) nullable), metadata (JSON/JSONB), created_at (TIMESTAMP), updated_at (TIMESTAMP), is_available (BOOLEAN). Include indexes on uuid, file_path, and created_at. Must support both MySQL and PostgreSQL syntax by detecting database type. Follow the Migration interface from src/types/database.ts with up() and down() methods. | Restrictions: Do not modify existing migrations, maintain transaction safety, ensure rollback capability with down() method, follow existing migration naming conventions | Leverage: Study src/migrations/001_initial_schema.ts for migration structure, use src/adapters/DatabaseAdapter.ts for query execution | Success: Migration file compiles without errors, up() creates all tables and indexes correctly for both MySQL and PostgreSQL, down() cleanly removes all objects, migration integrates with existing MigrationRunner. After completion, use log-implementation tool to record this task with artifacts including the migration file details, then mark task as completed in tasks.md._

- [x] 1.2. Create MediaFile model interfaces and types
  - File: `backend/src/models/MediaFile.ts`
  - Define MediaFile, MediaFileRow, CreateMediaFileInput interfaces
  - Add type conversions between database rows and model objects
  - Purpose: Establish type-safe data structures for media files
  - _Leverage: `src/models/Video.ts`, `src/models/index.ts`_
  - _Requirements: REQ-5, Design: MediaFile Model_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in data modeling and type systems | Task: Create comprehensive MediaFile model interfaces following the pattern from src/models/Video.ts. Define three main interfaces: (1) MediaFile with readonly id, uuid string, filePath string, absolutePath string, fileSize number, extension string, metadataFilePath string | null, metadata Record<string, unknown>, readonly createdAt Date, updatedAt Date, isAvailable boolean; (2) MediaFileRow matching database column names (snake_case) with metadata as string (JSON in DB); (3) CreateMediaFileInput for insertions with optional fields. Add helper type MediaFileData for internal processing. All interfaces must have JSDoc comments explaining each field. | Restrictions: Follow existing model patterns exactly, use readonly for immutable fields, maintain consistency with Video model structure, ensure database column names match schema from task 1.1 | Leverage: Copy patterns from src/models/Video.ts for structure, reference src/models/index.ts for export patterns | Success: All interfaces compile with strict TypeScript mode, proper separation between model and database representations, clear input types for CRUD operations, comprehensive JSDoc documentation. After completion, use log-implementation tool to record this task with artifacts including all interface definitions, then mark task as completed in tasks.md._

- [x] 1.3. Export MediaFile model in models index
  - File: `backend/src/models/index.ts` (modify existing)
  - Add exports for MediaFile interfaces and types
  - Purpose: Make MediaFile types available throughout the application
  - _Leverage: `src/models/index.ts`_
  - _Requirements: REQ-5_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer with module organization expertise | Task: Add exports for MediaFile model to src/models/index.ts following the existing export pattern. Export MediaFile, MediaFileRow, CreateMediaFileInput, and any other public types from MediaFile.ts. Maintain alphabetical ordering of exports. | Restrictions: Do not modify existing exports, maintain file organization, follow existing export patterns | Leverage: Follow exact export pattern from existing model exports in src/models/index.ts | Success: MediaFile types are properly exported and accessible via import from 'src/models', no compilation errors, maintains consistency with other model exports. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

## Phase 2: Core Utilities

- [x] 2.1. Create UUIDExtractor utility
  - File: `backend/src/utils/UUIDExtractor.ts`
  - Implement static methods for UUID extraction and validation
  - Support UUID v4 format with case-insensitive matching
  - Purpose: Extract UUIDs from video filenames using regex patterns
  - _Leverage: None (new utility)_
  - _Requirements: REQ-2, Design: UUIDExtractor Component_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Utility Developer specializing in string parsing and regex patterns | Task: Create UUIDExtractor utility class with three static methods: (1) extract(filename: string): string | null - extracts first valid UUID v4 from filename using regex pattern /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, returns null if none found; (2) isValidUUID(uuid: string): boolean - validates UUID v4 format; (3) extractAll(filename: string): string[] - returns array of all UUIDs found. Handle edge cases: empty strings, special characters, multiple UUIDs. Add comprehensive JSDoc comments. | Restrictions: Use static methods only (no instance state), case-insensitive matching, must validate UUID v4 format specifically (version 4 in third group), no external dependencies | Leverage: None, pure utility implementation | Success: All methods work correctly with various filename formats, regex correctly matches UUID v4 format, handles edge cases gracefully, comprehensive unit tests pass. After completion, use log-implementation tool to record this task with artifacts including all function signatures and regex pattern, then mark task as completed in tasks.md._

- [x] 2.2. Create MetadataReader utility
  - File: `backend/src/utils/MetadataReader.ts`
  - Implement class for finding and reading metadata JSON files
  - Support async file operations with proper error handling
  - Purpose: Locate and parse *.info.json files from metadata directory structure
  - _Leverage: `fs/promises`, `path`_
  - _Requirements: REQ-3, REQ-4, Design: MetadataReader Component_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in file system operations and async I/O | Task: Create MetadataReader class with constructor accepting metadataBasePath string. Implement three methods: (1) async findMetadataFile(uuid: string): Promise<string | null> - checks /mnt/Metadata/{uuid}/ directory for *.info.json files, returns first file found alphabetically or null; (2) async readMetadata(filePath: string): Promise<MetadataFile> - reads and parses JSON file, returns MetadataFile object with filePath, content (parsed JSON), fileSize, modifiedAt; (3) async getMetadataForUUID(uuid: string): Promise<MetadataFile | null> - combines find and read operations. Define MetadataFile interface with proper types. Handle errors: directory not found, file not found, permission denied, malformed JSON. Use fs.readdir, fs.stat, fs.readFile from fs/promises. Add comprehensive error messages and JSDoc. | Restrictions: Use async/await, no synchronous file operations, validate JSON is object (not array/primitive), handle all file system errors gracefully, use path.join for cross-platform compatibility | Leverage: Use fs/promises for async operations, path module for path handling | Success: Successfully finds and reads metadata files, handles all error cases gracefully with descriptive messages, JSON parsing validates structure, works on both Unix and Windows paths. After completion, use log-implementation tool to record this task with artifacts including class methods and interface definition, then mark task as completed in tasks.md._

- [x] 2.3. Add UUID validation to validation utilities
  - File: `backend/src/utils/validation.ts` (modify existing)
  - Add validateUUID and sanitizeUUID functions
  - Purpose: Provide validation functions for UUID fields
  - _Leverage: `src/utils/validation.ts`, `src/utils/UUIDExtractor.ts`_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Validation Engineer specializing in input sanitization and validation | Task: Add UUID validation functions to existing src/utils/validation.ts file. Implement two functions: (1) validateUUID(uuid: string | null | undefined, fieldName: string = 'UUID'): string - validates UUID is non-empty and matches UUID v4 format using UUIDExtractor.isValidUUID(), throws ValidationError if invalid, returns trimmed lowercase UUID; (2) sanitizeUUID(uuid: string): string - converts UUID to lowercase and trims whitespace. Follow existing validation function patterns in the file. | Restrictions: Follow existing validation patterns exactly, throw ValidationError for invalid input, maintain consistency with other validators in file, no external validation libraries | Leverage: Use UUIDExtractor.isValidUUID() for validation, follow patterns from existing validators like validatePositiveInteger(), ValidationError class | Success: Functions integrate seamlessly with existing validation utilities, proper error messages, consistent with existing validation patterns, handles edge cases (null, undefined, whitespace). After completion, use log-implementation tool to record this task with artifacts including function signatures, then mark task as completed in tasks.md._

- [x] 2.4. Export utility functions in utils index
  - File: `backend/src/utils/index.ts` (modify existing)
  - Add exports for UUIDExtractor and MetadataReader
  - Purpose: Make utilities available throughout the application
  - _Leverage: `src/utils/index.ts`_
  - _Requirements: REQ-2, REQ-3_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Module Organization Specialist | Task: Add exports for new utilities to src/utils/index.ts. Export UUIDExtractor from './UUIDExtractor', export MetadataReader and MetadataFile interface from './MetadataReader'. Maintain alphabetical ordering of exports. | Restrictions: Do not modify existing exports, follow existing export patterns, maintain file organization | Leverage: Follow existing export patterns in src/utils/index.ts | Success: New utilities are properly exported and importable via 'src/utils', no compilation errors, alphabetically ordered. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

## Phase 3: Service Layer

- [x] 3.1. Create MediaLoaderService with configuration
  - File: `backend/src/services/MediaLoaderService.ts`
  - Implement service class with constructor and configuration options
  - Set up dependencies (DatabaseAdapter, FileScanner, utilities)
  - Purpose: Create foundation for media loading orchestration
  - _Leverage: `src/services/VideoService.ts`, `src/adapters/DatabaseAdapter.ts`, `src/utils/FileScanner.ts`_
  - _Requirements: REQ-6, REQ-10, Design: MediaLoaderService Component_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Service Layer Architect specializing in business logic orchestration | Task: Create MediaLoaderService class following VideoService pattern. Define MediaLoaderOptions interface with fields: videoPath (string, default '/mnt/Videos'), metadataPath (string, default '/mnt/Metadata'), batchSize (number, default 100), dryRun (boolean, default false), verbose (boolean, default false). Define LoaderStatistics interface with: totalFilesFound, successCount, failedCount, missingMetadataCount, alreadyExistsCount, processingTimeMs, errors array of {file: string, error: string}. Implement constructor accepting DatabaseAdapter and Partial<MediaLoaderOptions>, initializing FileScanner and MetadataReader instances. Add private fields for adapter, options, fileScanner, metadataReader. Add placeholder loadMedia() method returning Promise<LoaderStatistics>. Use JSDoc comments extensively. | Restrictions: Follow VideoService patterns exactly, use dependency injection for adapter, do not implement business logic yet (next task), maintain type safety | Leverage: Study src/services/VideoService.ts constructor and pattern, use src/adapters/DatabaseAdapter.ts interface, instantiate FileScanner and MetadataReader | Success: Service class structure complete with proper DI, configuration interface well-defined, compiles without errors, follows existing service patterns. After completion, use log-implementation tool to record this task with artifacts including class structure and interfaces, then mark task as completed in tasks.md._

- [x] 3.2. Implement MediaLoaderService core loading logic
  - File: `backend/src/services/MediaLoaderService.ts` (continue from 3.1)
  - Implement loadMedia() method with complete workflow
  - Add private helper methods for processing
  - Purpose: Orchestrate the complete media loading workflow
  - _Leverage: `src/utils/FileScanner.ts`, `src/utils/UUIDExtractor.ts`, `src/utils/MetadataReader.ts`_
  - _Requirements: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5, REQ-6, Design: Data Flow_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in workflow orchestration and error handling | Task: Implement complete loadMedia() workflow in MediaLoaderService. Main method should: (1) Start timer, (2) Scan video directory using fileScanner.scanDirectory(), (3) Initialize statistics, (4) Loop through files in batches calling processVideoFile() for each, (5) Update statistics, (6) Return LoaderStatistics. Implement private async processVideoFile(scannedFile: ScannedFile): Promise<'success' | 'failed' | 'missing-metadata' | 'already-exists'> which: (1) Extracts UUID using UUIDExtractor.extract(), (2) Returns 'failed' if no UUID, (3) Checks if exists via checkExisting(), (4) Returns 'already-exists' if found, (5) Gets metadata via metadataReader.getMetadataForUUID(), (6) Calls upsertMediaFile() with data, (7) Returns appropriate status. Implement private async checkExisting(uuid: string): Promise<boolean> checking database. Implement private async upsertMediaFile(data: MediaFileData) inserting to media_files table. Add try-catch blocks for error handling, continue processing on individual failures, log verbose output if enabled. | Restrictions: Handle all errors gracefully without stopping batch processing, validate all inputs before database operations, use transactions for database writes, respect dryRun flag (skip DB writes) | Leverage: Use fileScanner for directory scanning, UUIDExtractor for UUID extraction, metadataReader for metadata loading, DatabaseAdapter for queries | Success: Complete workflow processes all files, handles errors without stopping, respects configuration options, returns accurate statistics, verbose logging works. After completion, use log-implementation tool to record this task with artifacts including all methods and workflow steps, then mark task as completed in tasks.md._

- [x] 3.3. Add batch processing and transactions to MediaLoaderService
  - File: `backend/src/services/MediaLoaderService.ts` (continue from 3.2)
  - Implement batch transaction logic for efficient database writes
  - Add progress logging for long-running operations
  - Purpose: Optimize performance with batch operations and provide user feedback
  - _Leverage: `src/adapters/DatabaseAdapter.ts`_
  - _Requirements: REQ-6, REQ-9_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Performance Engineer specializing in database optimization and batch processing | Task: Add batch processing to loadMedia() method. Split file array into batches of options.batchSize. For each batch: (1) Start transaction with adapter.beginTransaction(), (2) Process all files in batch, (3) Commit transaction with adapter.commit() on success or rollback with adapter.rollback() on failure, (4) Log progress after each batch. Implement private logProgress(current: number, total: number, startTime: number): void displaying: files processed (current/total), percentage complete, estimated time remaining (after 10 files). Calculate ETA based on average processing time per file. Log progress every 10 files or every batch, whichever is more frequent. Handle transaction failures by processing failed batch individually (without transaction) to isolate problematic files. | Restrictions: Commit transactions only on batch success, rollback on any batch error then retry individually, calculate accurate ETA after sufficient samples, log progress without flooding console | Leverage: Use DatabaseAdapter transaction methods (beginTransaction, commit, rollback), follow transaction pattern from existing services | Success: Batch processing improves performance, transactions maintain data integrity, progress logging provides accurate feedback, failed batches are handled gracefully by individual retry. After completion, use log-implementation tool to record this task with artifacts including batch processing logic and progress calculation, then mark task as completed in tasks.md._

- [x] 3.4. Implement idempotency in MediaLoaderService
  - File: `backend/src/services/MediaLoaderService.ts` (continue from 3.3)
  - Add update logic for existing records when metadata changes
  - Implement comparison logic to detect metadata changes
  - Purpose: Make the loader safe to re-run without duplicating data
  - _Leverage: `src/adapters/DatabaseAdapter.ts`_
  - _Requirements: REQ-8_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Data Engineer specializing in idempotent operations and data integrity | Task: Enhance checkExisting() to return existing MediaFileRow if found (change return type to Promise<MediaFileRow | null>). Modify processVideoFile() to: (1) If record exists, compare metadata using compareMetadata() helper, (2) If metadata changed, call updateMediaFile() instead of upsertMediaFile(), (3) Return 'already-exists' if no changes. Implement private compareMetadata(existing: MediaFileRow, newData: MetadataFile): boolean doing deep JSON comparison. Implement private async updateMediaFile(uuid: string, metadata: Record<string, unknown>, metadataFilePath: string): Promise<void> executing UPDATE query. Add 'updatedCount' to LoaderStatistics. Log appropriate messages for updates vs. skips in verbose mode. | Restrictions: Deep compare metadata JSON (not reference equality), only update if actual changes detected, preserve createdAt timestamp, update updatedAt timestamp | Leverage: Use JSON.stringify for metadata comparison, DatabaseAdapter for UPDATE queries | Success: Re-running loader doesn't create duplicates, metadata changes are detected and updated, unchanged files are skipped efficiently, statistics reflect updates vs. skips. After completion, use log-implementation tool to record this task with artifacts including idempotency logic and comparison methods, then mark task as completed in tasks.md._

- [x] 3.5. Export MediaLoaderService in services index
  - File: `backend/src/services/index.ts` (modify existing)
  - Add exports for MediaLoaderService and related types
  - Purpose: Make service available throughout the application
  - _Leverage: `src/services/index.ts`_
  - _Requirements: All service requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Module Organization Specialist | Task: Add exports for MediaLoaderService to src/services/index.ts. Export MediaLoaderService class, MediaLoaderOptions interface, LoaderStatistics interface from './MediaLoaderService'. Maintain alphabetical ordering of exports. | Restrictions: Do not modify existing exports, follow existing patterns, maintain organization | Leverage: Follow existing service export patterns in src/services/index.ts | Success: Service and types properly exported, no compilation errors, alphabetically ordered. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

## Phase 4: CLI Interface

- [x] 4.1. Create CLI directory and command script
  - File: `backend/src/cli/loadMedia.ts`
  - Create CLI entry point with argument parsing
  - Implement help display and usage information
  - Purpose: Provide command-line interface for media loading
  - _Leverage: `src/server.ts`, `src/config/database.ts`_
  - _Requirements: REQ-10_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: CLI Developer specializing in command-line interfaces and user experience | Task: Create CLI script at backend/src/cli/loadMedia.ts following server.ts initialization pattern. Import dotenv at top and call dotenv.config(). Implement parseArgs() function parsing process.argv for flags: --video-path <path>, --metadata-path <path>, --batch-size <number>, --dry-run (boolean flag), --verbose (boolean flag), --help (boolean flag). Implement displayHelp() function showing: usage syntax, description, all available flags with explanations, examples. Implement main() async function that: (1) Parses args, (2) Shows help if --help flag, (3) Loads database config from environment using loadFullDatabaseConfig(), (4) Creates and connects DatabaseAdapter, (5) Creates MediaLoaderService with options, (6) Calls loadMedia() and displays results, (7) Handles errors and exits appropriately. Add process.exit(0) on success, process.exit(1) on error. Use console.info for output. | Restrictions: Use process.argv directly or commander library, validate all arguments, handle missing required config gracefully, proper error messages | Leverage: Follow src/server.ts database initialization pattern, use src/config/database.ts for config loading, use MediaLoaderService | Success: CLI runs from command line, parses all arguments correctly, help display is clear and useful, handles errors gracefully with proper exit codes. After completion, use log-implementation tool to record this task with artifacts including CLI interface and argument parsing, then mark task as completed in tasks.md._

- [x] 4.2. Add CLI output formatting and reporting
  - File: `backend/src/cli/loadMedia.ts` (continue from 4.1)
  - Implement formatted statistics display
  - Add colored output for better readability
  - Purpose: Provide clear, user-friendly output from CLI
  - _Leverage: None (optional: chalk library for colors)_
  - _Requirements: REQ-6, REQ-9_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: UX Developer specializing in CLI user interfaces | Task: Enhance main() function to display formatted results after loadMedia() completes. Implement displayResults(stats: LoaderStatistics): void function that prints: (1) Header with separator line, (2) Summary statistics (total files, success count, failed count, missing metadata count, already exists count, updated count), (3) Processing time in human-readable format (seconds or minutes), (4) Processing rate (files per second), (5) Error list if any errors occurred (file path and error message for each), (6) Footer with separator line. Use console.info for output. Optionally use chalk library for colored output (green for success, red for errors, yellow for warnings). Format numbers with commas for readability. Calculate processing rate as files per second. | Restrictions: Keep output clean and readable, don't clutter with excessive output unless --verbose, ensure statistics are accurate, format time appropriately (1.5s vs 90.0s vs 1.5m) | Leverage: Use LoaderStatistics from service, optionally import chalk for colors | Success: Output is clear and professional, statistics are accurate and well-formatted, errors are displayed helpfully, colored output enhances readability (if using chalk). After completion, use log-implementation tool to record this task with artifacts including output formatting methods, then mark task as completed in tasks.md._

- [x] 4.3. Add package.json script for CLI command
  - File: `backend/package.json` (modify existing)
  - Add npm script for running media loader CLI
  - Purpose: Provide convenient npm command for running the loader
  - _Leverage: `backend/package.json`_
  - _Requirements: REQ-10_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOps Engineer specializing in build tooling and npm scripts | Task: Add CLI command to backend/package.json scripts section. Add script "load-media": "ts-node src/cli/loadMedia.ts" for development use. Add script "load-media:prod": "node dist/cli/loadMedia.js" for production use (after build). Ensure scripts section is properly formatted. Add comment above scripts explaining usage if needed. | Restrictions: Do not modify existing scripts, maintain JSON formatting, ensure paths are correct relative to package.json | Leverage: Follow existing script patterns in package.json, use ts-node for development, compiled JS for production | Success: npm run load-media works in development, npm run load-media:prod works after build, scripts are properly formatted. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

## Phase 5: Testing

- [x] 5.1. Create unit tests for UUIDExtractor
  - File: `backend/src/utils/__tests__/UUIDExtractor.test.ts`
  - Test all UUID extraction and validation scenarios
  - Purpose: Ensure UUID extraction works correctly in all cases
  - _Leverage: Jest testing framework, `src/__tests__/setup/testHelpers.ts`_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer specializing in unit testing and edge case coverage | Task: Create comprehensive test suite for UUIDExtractor. Test extract() with: valid UUID in filename, UUID with uppercase letters, UUID in middle of filename, multiple UUIDs (returns first), no UUID in filename, empty string, special characters in filename, UUID v1/v2/v3/v5 format (should not match v4). Test isValidUUID() with: valid UUID v4, invalid UUID formats, empty string, null/undefined (should handle gracefully), UUID with uppercase (should work). Test extractAll() with: multiple valid UUIDs, no UUIDs, mixed valid/invalid UUIDs. Use Jest's describe/it blocks. Include edge cases and error scenarios. Add descriptive test names. | Restrictions: Test pure function behavior only, no mocking needed, cover all branches, test edge cases thoroughly | Leverage: Use Jest testing framework patterns from existing tests, reference testHelpers if needed | Success: All tests pass, 100% code coverage for UUIDExtractor, edge cases covered, test names are descriptive. After completion, use log-implementation tool to record this task with artifacts including test coverage details, then mark task as completed in tasks.md._

- [x] 5.2. Create unit tests for MetadataReader
  - File: `backend/src/utils/__tests__/MetadataReader.test.ts`
  - Test metadata file discovery and parsing
  - Mock file system operations for isolated testing
  - Purpose: Ensure metadata reading works correctly with various scenarios
  - _Leverage: Jest, `fs/promises` mocking_
  - _Requirements: REQ-3, REQ-4_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer with expertise in mocking and async testing | Task: Create comprehensive test suite for MetadataReader using Jest. Mock fs/promises module using jest.mock(). Test findMetadataFile() with: UUID with metadata file exists, UUID with no metadata directory, UUID with empty metadata directory, UUID with multiple .info.json files (returns first alphabetically), permission denied error. Test readMetadata() with: valid JSON file, malformed JSON file, empty JSON file, file not found, permission denied. Test getMetadataForUUID() with combined scenarios. Set up beforeEach to reset mocks. Use Jest mock functions for fs.readdir, fs.stat, fs.readFile. Create mock file system structure in test. Test async operations properly with async/await. | Restrictions: Mock all file system operations (no real file access), test error scenarios thoroughly, ensure async tests complete, clean up mocks between tests | Leverage: Use jest.mock() for fs/promises, use Jest async patterns, reference existing async test patterns | Success: All tests pass, file system is properly mocked, async operations tested correctly, error scenarios covered, no actual file system access during tests. After completion, use log-implementation tool to record this task with artifacts including mock strategies, then mark task as completed in tasks.md._

- [x] 5.3. Create unit tests for MediaLoaderService
  - File: `backend/src/services/__tests__/MediaLoaderService.test.ts`
  - Test service orchestration with mocked dependencies
  - Test error handling and edge cases
  - Purpose: Ensure service logic works correctly in isolation
  - _Leverage: Jest, `src/__tests__/setup/testHelpers.ts`_
  - _Requirements: All service requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer specializing in service layer testing and mocking | Task: Create comprehensive test suite for MediaLoaderService. Mock DatabaseAdapter, FileScanner, MetadataReader dependencies. Test loadMedia() with: successful processing of multiple files, files with missing metadata, files with no UUID, files that already exist, database errors, mixed success/failure scenarios. Test processVideoFile() with each status return value. Test checkExisting() for both found and not found. Test upsertMediaFile() for successful insert. Test batch processing logic. Test transaction commits and rollbacks. Test idempotency (re-running doesn't duplicate). Test dry-run mode (no DB writes). Test verbose logging. Create mock implementations returning test data. Use beforeEach for test setup. Verify mock function calls with proper arguments. | Restrictions: Mock all external dependencies completely, test business logic in isolation, no database or file system access, verify statistics are accurate | Leverage: Use Jest mocking (jest.fn()), reference existing service tests like VideoService.test.ts, use testHelpers for common patterns | Success: All tests pass, dependencies properly mocked, business logic thoroughly tested, statistics calculations verified, error handling covered, dry-run mode tested. After completion, use log-implementation tool to record this task with artifacts including test structure and mocking patterns, then mark task as completed in tasks.md._

- [x] 5.4. Create integration tests for complete workflow
  - File: `backend/src/__tests__/integration/mediaLoader.integration.test.ts`
  - Test end-to-end workflow with real database
  - Create test fixtures for video files and metadata
  - Purpose: Verify complete system works together correctly
  - _Leverage: `src/__tests__/setup/testDb.ts`, `src/__tests__/setup/testHelpers.ts`_
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Integration Test Engineer specializing in end-to-end testing | Task: Create integration test suite testing complete media loading workflow. Use real test database (following testDb.ts patterns). Create test setup: (1) Create temp directories for test videos and metadata, (2) Generate test video files with UUID filenames, (3) Create corresponding metadata directories with .info.json files, (4) Run migration to create media_files table. Test scenarios: (1) Load videos with metadata successfully, (2) Load videos without metadata, (3) Re-run loader (idempotency test), (4) Load with changed metadata (update test), (5) Handle malformed metadata JSON. After each test: (1) Query database to verify data, (2) Validate statistics are accurate, (3) Clean up test files and database. Use beforeAll for database setup, afterAll for teardown, beforeEach/afterEach for test-specific setup. Use fs/promises for real file operations in temp directory. | Restrictions: Use test database only (not production), clean up all test data, use unique UUIDs for tests, ensure tests don't interfere with each other | Leverage: Use testDb.ts for database setup, testHelpers for utilities, follow existing integration test patterns from videos.integration.test.ts | Success: All integration tests pass, database operations work correctly, test data is properly cleaned up, tests can run in any order, temp files are created and removed. After completion, use log-implementation tool to record this task with artifacts including integration test scenarios, then mark task as completed in tasks.md._

## Phase 6: Documentation & Finalization

- [x] 6.1. Add JSDoc documentation to all public APIs
  - Files: All service, model, and utility files
  - Add comprehensive JSDoc comments
  - Document parameters, return types, and examples
  - Purpose: Provide inline documentation for maintainability
  - _Leverage: Existing JSDoc patterns from codebase_
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Technical Writer specializing in API documentation | Task: Add or enhance JSDoc comments for all public methods and interfaces across media loader components. For each class: add class-level JSDoc with @example. For each public method: add method JSDoc with @param for parameters (with types and descriptions), @returns for return value (with type and description), @throws for errors, @example showing usage. For each interface: add interface JSDoc and field descriptions. Follow existing JSDoc patterns from VideoService.ts and other services. Ensure examples are realistic and helpful. Include edge cases in documentation where relevant. | Restrictions: Do not modify code functionality, follow JSDoc syntax exactly, maintain consistency with existing documentation style, don't document private methods extensively | Leverage: Follow JSDoc patterns from VideoService.ts and FileScanner.ts, use existing documentation as templates | Success: All public APIs have comprehensive JSDoc, examples are clear and functional, documentation is consistent, TypeScript compiler recognizes all doc comments. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

- [x] 6.2. Create README documentation for media loader
  - File: `backend/src/cli/README.md`
  - Document CLI usage, options, and examples
  - Add troubleshooting section
  - Purpose: Provide user guide for media loader CLI
  - _Leverage: Project README.md structure_
  - _Requirements: REQ-10, all requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Technical Writer specializing in user documentation | Task: Create comprehensive README.md in backend/src/cli/ directory documenting the media loader. Include sections: (1) Overview - what the loader does, (2) Prerequisites - required environment setup, (3) Installation - how to set up, (4) Configuration - environment variables needed (DB config, VIDEO_PATH, METADATA_PATH), (5) Usage - command syntax and examples for development and production, (6) CLI Options - detailed description of all flags with examples, (7) Directory Structure - expected structure of /mnt/Videos and /mnt/Metadata, (8) Output - explanation of statistics and what they mean, (9) Examples - multiple real-world usage examples (first run, re-run, dry-run, verbose mode), (10) Troubleshooting - common issues and solutions (directory not found, permission errors, database errors, malformed metadata), (11) Idempotency - explain safe re-running behavior. Use markdown formatting with code blocks and clear headings. | Restrictions: Keep documentation clear and concise, provide realistic examples, don't duplicate information from main README, focus on CLI-specific usage | Leverage: Follow structure from main project README.md, reference existing documentation style | Success: Documentation is comprehensive and easy to follow, examples work as shown, troubleshooting covers common issues, formatting is clean. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

- [x] 6.3. Update main README with media loader information
  - File: `README.md` (modify existing)
  - Add section about media metadata loader feature
  - Update project features list
  - Purpose: Document new feature in main project README
  - _Leverage: `README.md` existing structure_
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Technical Writer with project documentation expertise | Task: Update main README.md to document media loader feature. Add to Features section: new bullet point "Media Metadata Loading - Automated UUID-based video and metadata ingestion from file system". Add new section after "Development" titled "Media Loader CLI" with subsections: (1) Quick Start with basic usage example, (2) Link to detailed documentation (backend/src/cli/README.md), (3) Configuration overview. Keep additions concise (main details in CLI README). Maintain existing README formatting and style. Update table of contents if present. | Restrictions: Do not modify existing sections significantly, maintain consistent formatting, keep additions brief with link to detailed docs | Leverage: Follow existing README structure and formatting patterns | Success: README includes media loader information, formatting is consistent, links work correctly, information is appropriately brief with reference to detailed docs. After completion, use log-implementation tool to record this task, then mark task as completed in tasks.md._

- [ ] 6.4. Final testing and validation
  - Files: All media loader components
  - Run all tests and verify they pass
  - Test CLI manually with various scenarios
  - Purpose: Validate complete implementation before marking spec complete
  - _Leverage: All tests created in Phase 5_
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-metadata-loader, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Lead specializing in final validation and acceptance testing | Task: Perform comprehensive final validation. (1) Run all unit tests (npm test) and verify 100% pass, (2) Run integration tests and verify pass, (3) Build project (npm run build) and verify no errors, (4) Manually test CLI in development mode: test with test data (create temp /mnt/Videos with UUID filenames and /mnt/Metadata/{UUID}/*.info.json files), run with default options, run with --dry-run, run with --verbose, run with custom paths, test --help flag, (5) Verify database contains correct data after load, (6) Test re-running (idempotency), (7) Test error scenarios (missing directory, malformed JSON, permission denied), (8) Verify all documentation is accurate, (9) Check code quality (npm run lint if available). Document any issues found and fix before completing. | Restrictions: All tests must pass, CLI must work in all documented scenarios, documentation must match implementation | Leverage: Use all tests from Phase 5, follow manual testing checklist from design doc | Success: All tests pass, CLI works correctly in all scenarios, documentation is accurate, no known issues remaining, implementation meets all requirements. After completion, use log-implementation tool to record this task with comprehensive validation results, then mark task as completed in tasks.md. After marking complete, the spec is ready for use._
