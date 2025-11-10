# Media Metadata Loader - Implementation Guide

This guide provides step-by-step workflow guidance for implementing the Media Metadata Loader feature.

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Workflow](#implementation-workflow)
4. [Phase-Specific Guidance](#phase-specific-guidance)
5. [Testing Strategy](#testing-strategy)
6. [Debugging Tips](#debugging-tips)
7. [Best Practices](#best-practices)

## Before You Start

### Prerequisites Checklist

- [ ] Read requirements document: `.spec-workflow/specs/media-metadata-loader/requirements.md`
- [ ] Read design document: `.spec-workflow/specs/media-metadata-loader/design.md`
- [ ] Understand existing codebase patterns:
  - [ ] `backend/src/services/VideoService.ts` - Service pattern
  - [ ] `backend/src/utils/FileScanner.ts` - File scanning utility
  - [ ] `backend/src/models/Video.ts` - Model structure
  - [ ] `backend/src/migrations/001_initial_schema.ts` - Migration pattern
- [ ] Set up development environment:
  - [ ] Node.js 20+ installed
  - [ ] TypeScript compiler working
  - [ ] Database running (MySQL or PostgreSQL)
  - [ ] Can run `npm test` successfully

### Understanding the Problem

**What are we building?**

A system that:
1. Scans `/mnt/Videos` for video files with UUID filenames
2. Extracts UUIDs from filenames (e.g., `550e8400-e29b-41d4-a716-446655440000.mp4`)
3. Finds corresponding metadata in `/mnt/Metadata/{UUID}/*.info.json`
4. Loads video files and metadata into `media_files` database table
5. Provides a CLI command to trigger the loading process

**Why is this needed?**

- Automates tedious manual data entry
- Ensures all video content is properly cataloged
- Enables future features that depend on video metadata
- Provides foundation for content management

## Architecture Overview

### Component Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  loadMedia.ts - Command-line interface with arg parsing     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Service Layer                            │
│  MediaLoaderService - Orchestrates workflow                 │
│  - loadMedia()           Main entry point                    │
│  - processVideoFile()    Process single file                │
│  - checkExisting()       Check for duplicates               │
│  - upsertMediaFile()     Database insert                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼────┐ ┌──────▼──────┐ ┌──▼─────────┐
│  Utilities   │ │  Utilities   │ │  Existing  │
│ UUIDExtractor│ │MetadataReader│ │FileScanner │
│              │ │              │ │            │
│ - extract()  │ │ - find()     │ │ - scan()   │
│ - validate() │ │ - read()     │ │            │
└──────────────┘ └──────────────┘ └────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Data Layer                              │
│  MediaFile Model - TypeScript interfaces                    │
│  DatabaseAdapter - Query execution                          │
│  media_files table - Storage                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **CLI invoked** → MediaLoaderService.loadMedia()
2. **Scan videos** → FileScanner returns ScannedFile[]
3. **For each file**:
   - Extract UUID → UUIDExtractor.extract()
   - Check exists → DatabaseAdapter.query()
   - Find metadata → MetadataReader.getMetadataForUUID()
   - Insert/update → DatabaseAdapter.execute()
4. **Return statistics** → Display in CLI

## Implementation Workflow

### Recommended Order

Follow this order to minimize dependencies and maximize testability:

**Phase 1: Foundation (Database & Models)**
```
1.1 → 1.2 → 1.3
```
- Establishes data structures
- Can test migrations immediately

**Phase 2: Utilities (Building Blocks)**
```
2.1 → 2.2 → 2.3 → 2.4
```
- Build independently testable utilities
- Each utility can be unit tested in isolation

**Phase 3: Service (Business Logic)**
```
3.1 → 3.2 → (test) → 3.3 → (test) → 3.4 → (test) → 3.5
```
- Build service incrementally
- Test after each major addition

**Phase 4: CLI (User Interface)**
```
4.1 → 4.2 → 4.3
```
- Build CLI after service is working
- Can test manually immediately

**Phase 5: Testing (Quality Assurance)**
```
5.1 → 5.2 → 5.3 → 5.4
```
- Add comprehensive test coverage
- Integration tests verify end-to-end

**Phase 6: Documentation (Finalization)**
```
6.1 → 6.2 → 6.3 → 6.4
```
- Document for maintainability
- Final validation

### Testing at Each Phase

**After Phase 1:**
```bash
# Verify migration runs
npm run dev  # Should create media_files table
```

**After Phase 2:**
```bash
# Run utility tests
npm test -- UUIDExtractor.test
npm test -- MetadataReader.test
```

**After Phase 3:**
```bash
# Run service tests
npm test -- MediaLoaderService.test
```

**After Phase 4:**
```bash
# Test CLI manually
npm run load-media -- --help
npm run load-media -- --dry-run --verbose
```

**After Phase 5:**
```bash
# Run all tests
npm test
```

## Phase-Specific Guidance

### Phase 1: Database Schema & Models

**Focus:** Get data structures right first

**Key Decisions:**
- UUID column type: VARCHAR(36) for MySQL, UUID for PostgreSQL
- Metadata storage: JSON for MySQL, JSONB for PostgreSQL
- Indexes: uuid (unique), file_path, created_at

**Testing Approach:**
```bash
# Start server to run migrations
npm run dev

# Check table was created
# MySQL:
mysql -u root -p -e "DESCRIBE media_files"

# PostgreSQL:
psql -U postgres -d media_player -c "\d media_files"
```

**Common Issues:**
- Migration number conflicts: Check existing migrations, use next number
- Database type detection: Test with both MySQL and PostgreSQL
- JSON vs JSONB: Ensure correct type for each database

### Phase 2: Core Utilities

**Focus:** Build pure, testable utilities

**UUID Extractor:**
- Regex pattern: `/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi`
- Version 4 specific: '4' in third group, '8', '9', 'a', or 'b' in fourth group
- Case-insensitive matching

**Metadata Reader:**
- Async file operations: Use `fs/promises`, never synchronous methods
- Error handling: Distinguish between "not found" vs "permission denied"
- JSON validation: Ensure parsed content is an object, not array/primitive

**Testing Approach:**
```typescript
// Test UUID extraction
const uuid = UUIDExtractor.extract('550e8400-e29b-41d4-a716-446655440000.mp4');
expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');

// Test metadata reading
const reader = new MetadataReader('/test/path');
const metadata = await reader.getMetadataForUUID('test-uuid');
expect(metadata).toBeDefined();
```

### Phase 3: Service Layer

**Focus:** Orchestrate workflow with proper error handling

**Service Structure:**
- Constructor: Initialize dependencies
- Public methods: loadMedia() only
- Private methods: processVideoFile(), checkExisting(), upsertMediaFile()

**Batch Processing Strategy:**
```typescript
// Process in batches for efficiency
for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);

  // Begin transaction
  await adapter.beginTransaction();

  try {
    for (const file of batch) {
      await processVideoFile(file);
    }
    await adapter.commit();
  } catch (error) {
    await adapter.rollback();
    // Retry individually
  }
}
```

**Idempotency Implementation:**
```typescript
// Check if exists
const existing = await checkExisting(uuid);

if (existing) {
  // Compare metadata
  const hasChanged = compareMetadata(existing, newMetadata);

  if (hasChanged) {
    // Update
    await updateMediaFile(uuid, newMetadata);
    return 'updated';
  } else {
    // Skip
    return 'already-exists';
  }
}

// Insert new
await upsertMediaFile(data);
return 'success';
```

**Progress Logging:**
```typescript
// Log every 10 files or at end
if ((i + 1) % 10 === 0 || i === files.length - 1) {
  const percentage = ((i + 1) / files.length * 100).toFixed(1);
  console.info(`Progress: ${i + 1}/${files.length} (${percentage}%)`);
}
```

### Phase 4: CLI Interface

**Focus:** User-friendly command-line experience

**Argument Parsing:**
```typescript
function parseArgs(): MediaLoaderOptions {
  const args = process.argv.slice(2);
  const options: Partial<MediaLoaderOptions> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--video-path':
        options.videoPath = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      // ... more flags
    }
  }

  return options;
}
```

**Output Formatting:**
```typescript
function displayResults(stats: LoaderStatistics): void {
  console.info('');
  console.info('='.repeat(60));
  console.info('Media Loading Complete');
  console.info('='.repeat(60));
  console.info(`Total files found:    ${stats.totalFilesFound}`);
  console.info(`Successfully loaded:  ${stats.successCount}`);
  console.info(`Failed:               ${stats.failedCount}`);
  console.info(`Missing metadata:     ${stats.missingMetadataCount}`);
  console.info(`Already existed:      ${stats.alreadyExistsCount}`);
  console.info(`Updated:              ${stats.updatedCount}`);
  console.info(`Processing time:      ${(stats.processingTimeMs / 1000).toFixed(2)}s`);
  console.info('='.repeat(60));
}
```

### Phase 5: Testing

**Focus:** Comprehensive test coverage

**Unit Testing Strategy:**

```typescript
// Mock external dependencies
jest.mock('../adapters/DatabaseAdapter');
jest.mock('../utils/FileScanner');
jest.mock('../utils/MetadataReader');

describe('MediaLoaderService', () => {
  let service: MediaLoaderService;
  let mockAdapter: jest.Mocked<DatabaseAdapter>;

  beforeEach(() => {
    mockAdapter = {
      query: jest.fn(),
      execute: jest.fn(),
      // ... other methods
    } as any;

    service = new MediaLoaderService(mockAdapter);
  });

  it('should process files successfully', async () => {
    // Setup mocks
    mockAdapter.query.mockResolvedValue([]);
    mockAdapter.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });

    // Test
    const stats = await service.loadMedia();

    // Verify
    expect(stats.successCount).toBeGreaterThan(0);
  });
});
```

**Integration Testing Strategy:**

```typescript
describe('Media Loader Integration', () => {
  let adapter: DatabaseAdapter;

  beforeAll(async () => {
    // Setup test database
    adapter = createDatabaseAdapter('mysql');
    await adapter.connect(testConfig);
    await adapter.runMigrations();
  });

  beforeEach(async () => {
    // Create test files
    await createTestVideoFiles();
    await createTestMetadataFiles();
  });

  afterEach(async () => {
    // Clean up test data
    await adapter.execute('DELETE FROM media_files', []);
    await deleteTestFiles();
  });

  it('should load media files with metadata', async () => {
    const service = new MediaLoaderService(adapter, {
      videoPath: '/tmp/test-videos',
      metadataPath: '/tmp/test-metadata',
    });

    const stats = await service.loadMedia();

    expect(stats.successCount).toBe(5); // If we created 5 test files

    // Verify database
    const rows = await adapter.query('SELECT * FROM media_files', []);
    expect(rows.length).toBe(5);
  });
});
```

### Phase 6: Documentation

**Focus:** Maintainability and usability

**JSDoc Standards:**
```typescript
/**
 * Extract the first valid UUID v4 from a filename
 *
 * Performs case-insensitive matching and returns the UUID in lowercase.
 *
 * @param filename - Filename to extract UUID from
 * @returns First valid UUID found, or null if none found
 *
 * @example
 * ```typescript
 * UUIDExtractor.extract('550e8400-e29b-41d4-a716-446655440000.mp4');
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
static extract(filename: string): string | null {
  // Implementation
}
```

**README Structure:**
1. Overview - What it does
2. Prerequisites - What's needed
3. Installation - How to set up
4. Configuration - Environment variables
5. Usage - Command examples
6. Options - Flag descriptions
7. Examples - Real-world scenarios
8. Troubleshooting - Common issues

## Testing Strategy

### Test Pyramid

```
        E2E Tests (Few)
       /               \
    Integration Tests
   /                    \
  Unit Tests (Many)
```

**Unit Tests (70% of tests):**
- Test each utility in isolation
- Mock all external dependencies
- Fast execution (<100ms per test)

**Integration Tests (25% of tests):**
- Test service with real database
- Test complete workflows
- Moderate execution (<1s per test)

**E2E Tests (5% of tests):**
- Test CLI with real files
- Test actual user workflows
- Slower execution (1-5s per test)

### Manual Testing Checklist

**Before committing code:**

- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run lint` - no linting errors
- [ ] Build project: `npm run build` - no compilation errors
- [ ] Test CLI: `npm run load-media -- --help` - help displays
- [ ] Test dry-run: `npm run load-media -- --dry-run` - no DB writes
- [ ] Test actual load: `npm run load-media` - files loaded
- [ ] Check database: Verify records exist
- [ ] Test re-run: Run again - no duplicates
- [ ] Test with changed metadata: Update JSON file, re-run - updates record

## Debugging Tips

### Common Issues and Solutions

**Issue: "No valid UUID found in filename"**
- Check filename format: UUID must be 8-4-4-4-12 hexadecimal
- Check UUID version: Must be version 4 (has '4' in third group)
- Try: `UUIDExtractor.extract(filename)` in Node REPL to test

**Issue: "Metadata file not found"**
- Check directory exists: `/mnt/Metadata/{UUID}/`
- Check file extension: Must be `*.info.json` (case-insensitive)
- Check permissions: Process must have read access
- Try: `ls /mnt/Metadata/{UUID}/` to verify

**Issue: "Failed to parse JSON"**
- Check JSON syntax: Use `jq` or JSON validator
- Check file encoding: Should be UTF-8
- Check for BOM: May cause parse errors
- Try: `cat file.info.json | jq .` to validate

**Issue: "Database connection failed"**
- Check environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- Check database is running: `mysql --version` or `psql --version`
- Check network connectivity: `ping DB_HOST`
- Try: Connect manually with mysql/psql client

**Issue: "Transaction rollback"**
- Check database logs for specific error
- Test single file processing: Use `--batch-size 1`
- Check for constraint violations: UUID unique constraint
- Try: Process files individually to isolate issue

### Debugging Techniques

**Enable verbose logging:**
```bash
npm run load-media -- --verbose
```

**Use Node debugger:**
```bash
node --inspect-brk dist/cli/loadMedia.js
# Open chrome://inspect in Chrome
```

**Test individual components:**
```typescript
// In Node REPL
const { UUIDExtractor } = require('./dist/utils/UUIDExtractor');
const uuid = UUIDExtractor.extract('test-file.mp4');
console.log(uuid);
```

**Check database state:**
```sql
-- Count records
SELECT COUNT(*) FROM media_files;

-- View recent records
SELECT * FROM media_files ORDER BY created_at DESC LIMIT 10;

-- Check for duplicates
SELECT uuid, COUNT(*) FROM media_files GROUP BY uuid HAVING COUNT(*) > 1;
```

## Best Practices

### Code Quality

1. **Type Safety**: Use strict TypeScript, no `any` types
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Use appropriate log levels (info, warn, error)
4. **Documentation**: JSDoc for all public methods
5. **Testing**: Aim for 80%+ code coverage

### Performance

1. **Batch Processing**: Process files in batches (100 default)
2. **Transactions**: Use transactions for batch inserts
3. **Async Operations**: Use async/await, no blocking operations
4. **Memory Management**: Stream large files, don't load entirely

### Security

1. **Path Validation**: Sanitize all file paths
2. **SQL Injection**: Use parameterized queries only
3. **Input Validation**: Validate all user input
4. **Error Messages**: Don't expose sensitive information

### Maintainability

1. **Single Responsibility**: Each class/function has one job
2. **DRY Principle**: Don't repeat code
3. **KISS Principle**: Keep it simple
4. **Documentation**: Code should be self-explanatory

## Next Steps

After completing implementation:

1. **Code Review**: Have another developer review
2. **Performance Testing**: Test with 1000+ files
3. **Edge Case Testing**: Test unusual scenarios
4. **Documentation Review**: Ensure docs are accurate
5. **User Acceptance**: Test with actual data
6. **Deployment**: Deploy to staging environment

## Getting Help

If you get stuck:

1. **Check existing code**: Look at similar implementations (VideoService, FileScanner)
2. **Read documentation**: Requirements and design documents
3. **Run tests**: See which tests are failing and why
4. **Enable verbose logging**: Get more information about what's happening
5. **Ask for help**: Provide specific error messages and context

---

**Remember:** Take it one task at a time. Test frequently. Ask questions early.
