# Claude Web Prompts - Media Metadata Loader

This document contains ready-to-use prompts for implementing the Media Metadata Loader feature with Claude Web.

## Initial Prompt (Start Here)

Copy and paste this prompt to start the implementation:

```
I need you to implement the Media Metadata Loader feature for a Node.js/TypeScript backend project. This feature automates loading video files and their metadata from the file system into a database.

**Project Context:**
- Backend: Node.js 20, TypeScript 5, Express
- Database: MySQL or PostgreSQL (adapter pattern)
- Existing patterns: VideoService, FileScanner, database migrations

**What we're building:**
A system that:
1. Scans `/mnt/Videos` for video files with UUID-based filenames
2. Extracts UUIDs from filenames (e.g., `550e8400-e29b-41d4-a716-446655440000.mp4`)
3. Finds corresponding metadata in `/mnt/Metadata/{UUID}/*.info.json`
4. Loads video files and parsed metadata into `media_files` database table
5. Provides a CLI command to trigger loading

**Implementation Approach:**
Follow the tasks in `TASKS_MEDIA_LOADER.md` step by step. Reference `IMPLEMENTATION_GUIDE_MEDIA_LOADER.md` for detailed guidance.

**Start with Phase 1:**
Please begin with Task 1.1 - Create the database migration for the media_files table. Follow the pattern from `backend/src/migrations/001_initial_schema.ts` and support both MySQL and PostgreSQL.

Let me know if you need me to provide any existing files for reference.
```

## Phase-by-Phase Prompts

### Phase 1: Database Schema & Models

**After completing Task 1.1 (Migration):**
```
Great! The migration is complete. Now let's create the MediaFile model.

Please proceed with Task 1.2 - Create the MediaFile model interfaces in `backend/src/models/MediaFile.ts`. Follow the pattern from `backend/src/models/Video.ts`.

Define these interfaces:
- MediaFile (main model)
- MediaFileRow (database representation)
- CreateMediaFileInput (for insertions)
- MediaFileData (internal processing)
- MetadataFile (metadata file info)

Include comprehensive JSDoc comments for all interfaces and fields.
```

**After completing Phase 1:**
```
Excellent work on the models! Phase 1 is complete.

Let's verify the migration works:
1. Start the server: `npm run dev`
2. Check if the media_files table was created

Once verified, we'll move to Phase 2 - building the core utilities (UUIDExtractor and MetadataReader).

Ready to proceed with Task 2.1 - Creating the UUIDExtractor utility?
```

### Phase 2: Core Utilities

**Starting Phase 2:**
```
Now let's build the core utilities. These are pure, testable functions that will be used by the service layer.

Please start with Task 2.1 - Create the UUIDExtractor utility in `backend/src/utils/UUIDExtractor.ts`.

This utility should:
1. Extract UUID v4 from filenames using regex pattern: /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi
2. Validate UUID v4 format
3. Support case-insensitive matching
4. Have three static methods: extract(), isValidUUID(), extractAll()

Follow the complete code example in TASKS_MEDIA_LOADER.md for Task 2.1.
```

**After UUIDExtractor:**
```
Perfect! The UUIDExtractor is working. Now let's create the MetadataReader.

Please proceed with Task 2.2 - Create the MetadataReader utility in `backend/src/utils/MetadataReader.ts`.

This utility should:
1. Find *.info.json files in /mnt/Metadata/{UUID}/ directories
2. Read and parse JSON files
3. Handle errors gracefully (missing files, malformed JSON, permissions)
4. Use async/await with fs/promises (no synchronous operations)

The MetadataReader class should have:
- Constructor accepting metadataBasePath
- findMetadataFile(uuid) - locate metadata file
- readMetadata(filePath) - parse JSON file
- getMetadataForUUID(uuid) - combined find and read

Reference the complete code in TASKS_MEDIA_LOADER.md Task 2.2.
```

**After completing Phase 2:**
```
Great job! All utilities are complete. Let's test them before moving to Phase 3.

Can you create simple unit tests for:
1. UUIDExtractor.extract() with various filename formats
2. MetadataReader.findMetadataFile() with mock fs operations

Once tests pass, we'll move to Phase 3 - building the MediaLoaderService.
```

### Phase 3: Service Layer

**Starting Phase 3:**
```
Now we'll build the MediaLoaderService - the orchestrator that uses our utilities.

Please start with Task 3.1 - Create the MediaLoaderService foundation in `backend/src/services/MediaLoaderService.ts`.

This task creates the class structure with:
1. MediaLoaderOptions interface (configuration)
2. LoaderStatistics interface (return value)
3. Constructor with dependency injection
4. Placeholder loadMedia() method

Follow the VideoService pattern for service structure. Reference TASKS_MEDIA_LOADER.md Task 3.1 for complete code.
```

**After Service Foundation:**
```
Good foundation! Now let's implement the core loading logic.

Please proceed with Task 3.2 - Implement the complete workflow in MediaLoaderService.

Add these methods:
1. loadMedia() - main entry point, orchestrates workflow
2. processVideoFile() - handles single file processing
3. checkExisting() - queries database for existing records
4. upsertMediaFile() - inserts new records
5. updateMediaFile() - updates existing records
6. compareMetadata() - detects metadata changes
7. logProgress() - displays progress during processing

The workflow should:
- Scan video directory using FileScanner
- For each file: extract UUID, find metadata, insert/update database
- Handle errors gracefully (continue processing on failures)
- Return comprehensive statistics

Reference TASKS_MEDIA_LOADER.md Task 3.2 for complete implementation.
```

**After Core Logic:**
```
Excellent! The service is processing files. Now let's add batch processing for performance.

Task 3.3 is optional but recommended - it adds transaction support for batch operations:
- Process files in configurable batches (default 100)
- Wrap each batch in a transaction
- Commit on success, rollback on failure
- Retry failed batches individually

This improves performance significantly with large file counts.

Would you like to add batch processing, or should we proceed to Phase 4 (CLI)?
```

### Phase 4: CLI Interface

**Starting Phase 4:**
```
Now let's create the command-line interface so users can run the media loader.

Please start with Task 4.1 - Create the CLI script in `backend/src/cli/loadMedia.ts`.

The CLI should:
1. Parse command-line arguments (--video-path, --metadata-path, --batch-size, --dry-run, --verbose, --help)
2. Display help information when --help is used
3. Initialize database connection
4. Create and run MediaLoaderService
5. Display formatted results
6. Exit with appropriate status codes (0 = success, 1 = error)

Follow the pattern from `backend/src/server.ts` for database initialization.

Reference TASKS_MEDIA_LOADER.md Task 4.1 for complete code.
```

**After CLI Command:**
```
Great! Now let's add nice output formatting.

Please proceed with Task 4.2 - Add formatted statistics display to the CLI.

Create a displayResults() function that shows:
- Total files found
- Success/failure counts
- Missing metadata count
- Already existing count
- Updated count
- Processing time (human-readable)
- Processing rate (files/second)
- Error list (if any errors occurred)

Use console.info for output and optionally add colors with chalk library.

Reference TASKS_MEDIA_LOADER.md Task 4.2 for formatting examples.
```

**After Phase 4:**
```
Perfect! The CLI is complete. Let's add npm scripts for convenience.

Task 4.3 - Add these scripts to backend/package.json:
```json
{
  "scripts": {
    "load-media": "ts-node src/cli/loadMedia.ts",
    "load-media:prod": "node dist/cli/loadMedia.js"
  }
}
```

Now you can test the CLI:
```bash
npm run load-media -- --help
npm run load-media -- --dry-run --verbose
```

Ready for Phase 5 (Testing)?
```

### Phase 5: Testing

**Starting Phase 5:**
```
Now let's add comprehensive test coverage to ensure quality.

Please start with Task 5.1 - Create unit tests for UUIDExtractor in `backend/src/utils/__tests__/UUIDExtractor.test.ts`.

Test scenarios:
- Valid UUID extraction from various filename formats
- UUID with uppercase letters (should normalize to lowercase)
- UUID in middle of filename
- Multiple UUIDs (returns first)
- No UUID in filename (returns null)
- Invalid UUID formats (v1, v2, v3, v5 - should not match v4)
- Empty string, special characters
- isValidUUID() validation
- extractAll() with multiple UUIDs

Use Jest testing framework. Reference existing tests in `backend/src/services/__tests__/` for patterns.
```

**After Utility Tests:**
```
Good test coverage for utilities! Now let's test the service layer.

Please proceed with Task 5.3 - Create unit tests for MediaLoaderService in `backend/src/services/__tests__/MediaLoaderService.test.ts`.

Mock all dependencies:
- DatabaseAdapter (query, execute)
- FileScanner (scanDirectory)
- MetadataReader (getMetadataForUUID)

Test scenarios:
- Successful processing of multiple files
- Files with missing metadata
- Files with no UUID
- Files that already exist
- Files with changed metadata (updates)
- Database errors
- Mixed success/failure scenarios
- Dry-run mode (no DB writes)
- Verbose logging
- Statistics accuracy

Reference TASKS_MEDIA_LOADER.md Task 5.3 for test structure.
```

**After All Tests:**
```
Excellent test coverage! Let's run all tests to verify everything works:

```bash
npm test
```

If all tests pass, we're ready for Phase 6 (Documentation and final validation).
```

### Phase 6: Documentation & Finalization

**Starting Phase 6:**
```
Final phase! Let's document everything for maintainability.

Task 6.1 - Add JSDoc comments to all public APIs:
- MediaLoaderService class and public methods
- UUIDExtractor static methods
- MetadataReader class and methods
- All interfaces

Follow JSDoc patterns from existing services like VideoService.

Include:
- @param descriptions with types
- @returns descriptions with types
- @throws for potential errors
- @example with realistic usage

Reference existing JSDoc in VideoService.ts for style.
```

**After JSDoc:**
```
Good documentation! Now let's create user-facing documentation.

Task 6.2 - Create `backend/src/cli/README.md` documenting:
1. Overview - what the media loader does
2. Prerequisites - required setup
3. Installation - setup steps
4. Configuration - environment variables
5. Usage - command syntax and examples
6. CLI Options - detailed flag descriptions
7. Directory Structure - expected file organization
8. Output - statistics explanation
9. Examples - real-world usage scenarios
10. Troubleshooting - common issues and solutions

Keep it clear and concise with plenty of examples.
```

**Final Task:**
```
Almost done! Final validation.

Task 6.4 - Complete testing and validation:

1. Run all tests: `npm test` ✓
2. Build project: `npm run build` ✓
3. Run linter: `npm run lint` (if available) ✓

4. Manual CLI testing:
   - Help flag: `npm run load-media -- --help`
   - Dry run: `npm run load-media -- --dry-run --verbose`
   - Actual load: Create test files and run `npm run load-media`
   - Re-run: Run again to test idempotency
   - Changed metadata: Modify a .info.json file and re-run

5. Database verification:
   - Check records were created
   - Verify UUID uniqueness
   - Check metadata JSON is valid

6. Error scenario testing:
   - Missing directory
   - Malformed JSON
   - Invalid UUID

Document any issues found and fix before marking complete.

Once everything passes, the implementation is complete! 🎉
```

## Troubleshooting Prompts

### If Compilation Errors Occur

```
I'm seeing TypeScript compilation errors. Let's debug this:

1. Show me the exact error messages
2. Check if all imports are correct
3. Verify interface definitions match usage
4. Ensure all required fields are provided

Common issues:
- Missing type imports
- Incorrect interface field names
- Type mismatches between model and database row
- Missing null checks

Let's fix these errors one by one.
```

### If Tests Are Failing

```
Some tests are failing. Let's investigate:

1. Show me the failing test output
2. Check if mocks are properly set up
3. Verify expected vs actual values
4. Ensure async operations are properly awaited

Common issues:
- Mock not returning expected data
- Async test not waiting for completion
- Incorrect assertion expectations
- Test isolation issues (shared state)

Let's debug the failing tests systematically.
```

### If Database Operations Fail

```
Database operations are failing. Let's diagnose:

1. Check database connection is established
2. Verify table exists (run migration)
3. Check SQL syntax for both MySQL and PostgreSQL
4. Verify parameter placeholders are correct ('?')

Common issues:
- Table not created (migration didn't run)
- SQL syntax differences (MySQL vs PostgreSQL)
- Incorrect parameter binding
- Transaction not committed

Let's check each potential issue.
```

### If File Operations Fail

```
File system operations are failing. Let's check:

1. Verify paths are correct (absolute vs relative)
2. Check directory permissions
3. Ensure files exist at expected locations
4. Verify path separator handling (Windows vs Unix)

Common issues:
- Incorrect path construction
- Missing directories
- Permission denied errors
- Case-sensitive vs case-insensitive file systems

Let's test file operations in isolation.
```

## Completion Checklist Prompt

```
Let's verify the implementation is complete and working correctly:

**Code Quality:**
- [ ] All files compile without TypeScript errors
- [ ] No ESLint warnings or errors
- [ ] All imports are properly organized
- [ ] JSDoc comments on all public APIs

**Functionality:**
- [ ] Database migration creates media_files table
- [ ] UUIDExtractor correctly extracts UUIDs from filenames
- [ ] MetadataReader finds and parses .info.json files
- [ ] MediaLoaderService orchestrates complete workflow
- [ ] CLI accepts all documented arguments
- [ ] Statistics are accurately calculated

**Testing:**
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual CLI testing succeeds
- [ ] Idempotency verified (can re-run safely)
- [ ] Error scenarios handled gracefully

**Documentation:**
- [ ] README explains usage clearly
- [ ] JSDoc comments are comprehensive
- [ ] Examples are realistic and helpful
- [ ] Troubleshooting section covers common issues

**Performance:**
- [ ] Processes 10+ files per second
- [ ] Memory usage is reasonable
- [ ] Batch processing works efficiently

If all checkboxes are checked, the implementation is complete! 🎉

Any areas that need attention?
```

## Quick Reference Commands

### Development
```bash
# Start server (runs migrations)
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- UUIDExtractor.test

# Build for production
npm run build

# Run linter
npm run lint
```

### Media Loader CLI
```bash
# Show help
npm run load-media -- --help

# Dry run with verbose output
npm run load-media -- --dry-run --verbose

# Load with custom paths
npm run load-media -- --video-path /custom/videos --metadata-path /custom/metadata

# Production (after build)
npm run load-media:prod
```

### Database
```bash
# MySQL: Check table
mysql -u root -p -e "DESCRIBE media_files"

# MySQL: View records
mysql -u root -p -e "SELECT * FROM media_files LIMIT 10"

# PostgreSQL: Check table
psql -U postgres -d media_player -c "\d media_files"

# PostgreSQL: View records
psql -U postgres -d media_player -c "SELECT * FROM media_files LIMIT 10"
```

---

**Remember:** Work through tasks sequentially, test frequently, and ask for clarification if anything is unclear!
