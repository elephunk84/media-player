# Rich Metadata Import - Implementation Tasks

> **For Claude Web Implementation**
> Read `PROMPT.md` and `SPEC_SUMMARY.md` before starting.

## Quick Reference

- **Spec Location**: `.spec-workflow/specs/rich-metadata-import/`
  - `requirements.md` - Feature requirements (11 requirements with EARS criteria)
  - `design.md` - Technical design and database schema
  - `tasks.md` - Detailed task breakdown with prompts

## Task Status

- `[ ]` - Not started
- `[-]` - In progress
- `[x]` - Completed
- `[!]` - Blocked/Issue

---

## Implementation Tasks

### [ ] Task 1: Database Migration
**File**: `backend/src/migrations/003_rich_metadata_schema.ts`

**Objective**: Create normalized tables for tags, categories, and performers with junction tables.

**What to create**:
- 3 normalized tables: `tags`, `categories`, `performers` (id, name, timestamps)
- 3 junction tables: `media_file_tags`, `media_file_categories`, `media_file_performers`
- Add 10 columns to `media_files` table: display_name, provider, provider_id, webpage_url, thumbnail, duration, downloaded_format, available_formats, creator, primary_tag_id
- Indexes on all foreign keys and searchable columns
- CASCADE DELETE foreign keys
- Case-insensitive unique constraints (using LOWER())
- Support both MySQL and PostgreSQL syntax

**Reference Files**:
- `backend/src/migrations/001_initial_schema.ts` - MySQL/PostgreSQL patterns
- `backend/src/migrations/002_create_media_files_table.ts` - media_files structure

**Success Criteria**:
- Migration runs on both MySQL and PostgreSQL
- All 6 tables created with correct schemas
- 10 columns added to media_files with correct types
- Foreign keys with CASCADE DELETE work
- down() method cleanly rolls back all changes
- Existing media_files records remain valid (new columns NULL)

**After Completion**:
1. Mark as `[-]` in `.spec-workflow/specs/rich-metadata-import/tasks.md`
2. Run `log-implementation` with detailed artifacts
3. Mark as `[x]` when complete

---

### [ ] Task 2: TypeScript Model Interfaces
**Files**:
- `backend/src/models/Tag.ts`
- `backend/src/models/Category.ts`
- `backend/src/models/Performer.ts`
- `backend/src/models/MediaFile.ts` (enhance existing)

**Objective**: Create type-safe interfaces for all data structures.

**What to create**:
```typescript
// Tag.ts
export interface Tag {
  readonly id: number;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

// Category.ts
export interface Category {
  readonly id: number;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

// Performer.ts
export interface Performer {
  readonly id: number;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

// ParsedRichMetadata (new interface)
export interface ParsedRichMetadata {
  displayName: string;
  provider: string | null;
  providerId: string | null;
  webpageUrl: string | null;
  thumbnail: string | null;
  duration: number | null;
  downloadedFormat: string | null;
  availableFormats: string[];
  creator: string | null;
  primaryTag: string | null;
  tags: string[];
  categories: string[];
  performers: string[];
}

// ProviderInfo (new interface)
export interface ProviderInfo {
  provider: string | null;
  providerId: string | null;
  webpageUrl: string | null;
}

// FormatInfo (new interface)
export interface FormatInfo {
  downloadedFormat: string | null;
  availableFormats: string[];
}

// Enhance MediaFile with new fields
export interface MediaFile {
  readonly uuid: string;
  filePath: string;
  fileName: string;
  fileSize: number | null;
  fileExtension: string | null;

  // NEW: Rich metadata fields
  displayName: string | null;
  provider: string | null;
  providerId: string | null;
  webpageUrl: string | null;
  thumbnail: string | null;
  duration: number | null;
  downloadedFormat: string | null;
  availableFormats: string[] | null;
  creator: string | null;
  primaryTagId: number | null;

  // Existing fields
  metadata: Record<string, unknown> | null;
  metadataFilePath: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  lastScannedAt: Date;

  // Virtual associations (populated via JOIN)
  tags?: Tag[];
  categories?: Category[];
  performers?: Performer[];
}
```

**Reference Files**:
- `backend/src/models/Video.ts` - Existing model patterns
- `backend/src/models/Clip.ts` - Timestamp handling

**Success Criteria**:
- All interfaces compile without errors
- Match database schema exactly (camelCase for TS, snake_case in DB)
- Readonly fields for id and timestamps
- Nullable fields properly typed
- Supporting interfaces complete

---

### [ ] Task 3: TagManager Utility
**File**: `backend/src/utils/TagManager.ts`

**Objective**: Manage tag CRUD and media file associations.

**What to implement**:
- `findOrCreateTag(name: string): Promise<number>` - Find or create tag, return ID
- `findOrCreateTags(names: string[]): Promise<number[]>` - Batch operation
- `syncMediaFileTags(uuid: string, tagNames: string[]): Promise<void>` - Full sync (add new, remove old)
- `getTagsForMediaFile(uuid: string): Promise<Tag[]>` - Get all tags for a media file
- `removeMediaFileAssociations(uuid: string): Promise<void>` - Remove all tag associations
- Normalize names to lowercase for case-insensitive matching
- Use transactions for atomic operations
- Handle duplicate key errors gracefully

**Reference Files**:
- `backend/src/adapters/DatabaseAdapter.ts` - All database operations

**Success Criteria**:
- Case-insensitive matching prevents duplicates ("Action" == "action")
- All operations are transactional
- Batch operations are efficient
- Works with both MySQL and PostgreSQL
- Errors propagate properly to service layer

---

### [ ] Task 4: CategoryManager Utility
**File**: `backend/src/utils/CategoryManager.ts`

**Objective**: Mirror TagManager for categories.

**What to implement**:
- Same method signatures as TagManager
- Operates on `categories` table and `category_id` columns
- Identical patterns for consistency

**Reference Files**:
- `backend/src/utils/TagManager.ts` - Use as template

**Success Criteria**:
- Structurally identical to TagManager
- All TagManager features implemented
- Consistent error handling

---

### [ ] Task 5: PerformerManager Utility
**File**: `backend/src/utils/PerformerManager.ts`

**Objective**: Mirror TagManager for performers.

**What to implement**:
- Same method signatures as TagManager
- Operates on `performers` table and `performer_id` columns
- Identical patterns for consistency

**Reference Files**:
- `backend/src/utils/TagManager.ts` - Use as template

**Success Criteria**:
- Structurally identical to TagManager
- All TagManager features implemented
- Three manager utilities are consistent

---

### [ ] Task 6: MetadataParser Utility
**File**: `backend/src/utils/MetadataParser.ts`

**Objective**: Parse and validate rich metadata from .info.json files.

**What to implement**:
```typescript
// Main parser
export function parseRichMetadata(rawMetadata: any): ParsedRichMetadata

// Extraction functions (all pure, no side effects)
export function extractDisplayName(metadata: any): string  // display_name > title > filename
export function extractTags(metadata: any): string[]  // Normalize and trim
export function extractCategories(metadata: any): string[]
export function extractPerformers(metadata: any): string[]  // From pornstars array
export function extractProviderInfo(metadata: any): ProviderInfo
export function extractThumbnail(metadata: any): string | null  // Validate URL
export function extractDuration(metadata: any): number | null  // Validate integer
export function extractFormats(metadata: any): FormatInfo
export function validateMetadata(parsed: ParsedRichMetadata): ValidationResult
```

**Reference Files**:
- `backend/src/utils/MetadataReader.ts` - Metadata reading patterns
- `.spec-workflow/specs/rich-metadata-import/requirements.md` - Example JSON structure

**Success Criteria**:
- All functions are pure (no side effects, no database access)
- Handles missing/null fields gracefully (never throw)
- Display name fallback works: display_name > title > filename
- URL validation prevents invalid formats (http/https only)
- Duration validation ensures integers
- Array extraction handles empty/missing arrays
- Validation identifies all error scenarios

---

### [ ] Task 7: Enhance MediaLoaderService
**File**: `backend/src/services/MediaLoaderService.ts` (modify existing)

**Objective**: Integrate rich metadata parsing into import workflow.

**What to add**:
- `private async processRichMetadata(uuid: string, metadata: any): Promise<void>`
  - Parse metadata using MetadataParser
  - Update media_files columns (display_name, provider, thumbnail, etc.)
  - Call syncAssociations

- `private async syncAssociations(uuid: string, parsed: ParsedRichMetadata): Promise<void>`
  - Call TagManager.syncMediaFileTags()
  - Call CategoryManager.syncMediaFileCategories()
  - Call PerformerManager.syncMediaFilePerformers()
  - Update primary_tag_id if primary_tag exists

- Enhance `storeMediaFiles()` to call processRichMetadata after media file insert
- Update LoaderStatistics interface: add tagsCreated, categoriesCreated, performersCreated, associationsCreated
- Add error handling: catch metadata parsing errors, log, continue batch

**Reference Files**:
- Existing `backend/src/services/MediaLoaderService.ts` - Current batch logic

**Success Criteria**:
- Integrates into existing batch processing (100 files per batch)
- All operations within same transaction
- Metadata parsing errors don't stop batch
- Statistics track new entities correctly
- Backward compatible (works if metadata missing)
- updated_at only changes if data changed
- last_scanned_at always updates

---

### [ ] Task 8: TagManager Unit Tests
**File**: `backend/tests/utils/TagManager.test.ts`

**Objective**: Comprehensive unit tests for TagManager.

**Test Scenarios**:
- findOrCreateTag: new tag creates, existing tag reuses
- Case-insensitive matching: "Action" finds "action"
- findOrCreateTags: batch creates multiple correctly
- syncMediaFileTags: adds new, removes old, preserves unchanged
- Error handling: database errors propagate
- Edge cases: empty arrays, null, special characters

**Reference Files**:
- `backend/tests/adapters/MySQLAdapter.test.ts` - Mocking patterns

**Success Criteria**:
- All methods tested with mocked DatabaseAdapter
- Case-insensitive matching verified
- Transaction handling verified
- >80% code coverage

---

### [ ] Task 9: CategoryManager & PerformerManager Tests
**Files**:
- `backend/tests/utils/CategoryManager.test.ts`
- `backend/tests/utils/PerformerManager.test.ts`

**Objective**: Mirror TagManager test structure.

**Reference Files**:
- `backend/tests/utils/TagManager.test.ts` - Copy structure

**Success Criteria**:
- Identical test coverage as TagManager
- Both managers thoroughly tested
- Consistent test structure

---

### [ ] Task 10: MetadataParser Unit Tests
**File**: `backend/tests/utils/MetadataParser.test.ts`

**Test Scenarios**:
- extractDisplayName: fallback logic (display_name > title > filename)
- extractTags: array, empty, null, normalization
- extractPerformers: pornstars array extraction
- extractProviderInfo: all fields, missing fields
- extractThumbnail: valid/invalid URLs
- extractDuration: integer/string/null
- extractFormats: array and downloaded_format
- parseRichMetadata: calls all extractors correctly
- validateMetadata: catches all error types

**Reference Files**:
- Example JSON from requirements.md

**Success Criteria**:
- All functions tested independently
- Fallback logic verified
- Validation catches all errors
- >90% code coverage

---

### [ ] Task 11: Integration Tests
**File**: `backend/tests/services/MediaLoaderService.integration.test.ts`

**Test Scenarios**:
- Full import workflow with rich metadata
- Update existing media file (associations change)
- Missing metadata handled gracefully
- Statistics tracking accurate
- One file fails, others succeed
- Transaction rollback on error

**Reference Files**:
- Existing service integration tests
- `backend/e2e/seed/init-db.sql` - Test database setup

**Success Criteria**:
- Full workflow tested with real database
- Update scenarios verified
- Statistics accurate
- Transactions atomic
- Tests clean up after themselves

---

### [ ] Task 12: E2E Tests
**File**: `backend/e2e/tests/media-loader.e2e.test.ts` (enhance or create)

**Test Scenarios**:
- Import files with .info.json metadata
- Query media files by tags (API)
- Query media files by categories (API)
- Query media files by performers (API)
- Display names returned correctly
- Thumbnails and metadata returned
- Query performance < 500ms

**Success Criteria**:
- API queries return correct results
- Filtering by tag/category/performer works
- Performance targets met
- User-facing functionality validated

---

## Implementation Guidelines

### Database Operations
- Always use `DatabaseAdapter` methods
- Use parameterized queries (prevent SQL injection)
- Wrap multi-step operations in transactions
- Handle both MySQL and PostgreSQL syntax

### Case-Insensitive Matching
- Normalize names to lowercase before INSERT/SELECT
- Use LOWER() in queries
- Prevents: "Action" and "action" as duplicates

### Error Handling
- Metadata parsing errors: log, continue batch
- Database errors: rollback transaction, log
- Graceful degradation: import basic info if rich metadata fails

### Performance
- Use batch operations (findOrCreateTags vs multiple findOrCreateTag)
- JOIN queries (not JSON parsing) for filtering
- Index all foreign key columns
- Target: <10s for 100 files, <500ms queries on 100k files

---

## After Each Task

1. Mark task as `[-]` in `.spec-workflow/specs/rich-metadata-import/tasks.md`
2. Implement following detailed prompt in tasks.md
3. Use `log-implementation` tool with detailed artifacts:
   - List all functions/classes created
   - Include signatures and purposes
   - List files created/modified
   - Include code statistics

4. Mark task as `[x]` when complete

---

## Reference Materials

### Specification Documents
- `.spec-workflow/specs/rich-metadata-import/requirements.md` - Requirements with EARS criteria
- `.spec-workflow/specs/rich-metadata-import/design.md` - Complete technical design
- `.spec-workflow/specs/rich-metadata-import/tasks.md` - Detailed implementation prompts

### Example Metadata JSON
See requirements.md for complete example with all fields:
```json
{
  "stored_name": "uuid-here",
  "display_name": "Video Title",
  "tags": ["tag1", "tag2"],
  "categories": ["Category1"],
  "pornstars": ["Performer Name"],
  "provider": "pornhub",
  "id": "provider-id",
  "webpage_url": "https://...",
  "thumbnail": "https://...",
  "duration": 1404,
  "formats": ["240p", "480p", "720p"],
  "downloaded_format": "720p"
}
```

### Database Schema Reference
See design.md for complete SQL schemas for all 6 tables and enhanced media_files columns.

---

## Next Steps

1. Read `PROMPT.md` for context to provide Claude Web
2. Read `SPEC_SUMMARY.md` for complete specification overview
3. Start with Task 1 (Database Migration)
4. Work through tasks sequentially
5. Test each task before moving to next
6. Update task status as you progress
