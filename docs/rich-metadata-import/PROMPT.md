# Claude Web Implementation Prompt

> **Copy this entire document and provide it to Claude Web to start implementation**

---

## Project Context

You are implementing the **Rich Metadata Import** feature for a media player application. This feature enhances the existing metadata import system by creating normalized database tables for tags, categories, and performers instead of storing everything as JSON.

### Current System
- Media files stored with UUID-based filenames
- Metadata stored in generic JSON fields
- Filtering requires JSON parsing (slow for large libraries)

### New System
- Normalized tables: `tags`, `categories`, `performers`
- Junction tables for many-to-many relationships
- Fast JOIN-based queries
- Case-insensitive matching (no duplicates like "Action" vs "action")

---

## Specification Location

All specification documents are in:
- `.spec-workflow/specs/rich-metadata-import/requirements.md`
- `.spec-workflow/specs/rich-metadata-import/design.md`
- `.spec-workflow/specs/rich-metadata-import/tasks.md`

Quick reference docs in:
- `docs/rich-metadata-import/TASKS.md` - Task checklist
- `docs/rich-metadata-import/SPEC_SUMMARY.md` - Complete overview

---

## Example Metadata Structure

Video files have corresponding `.info.json` files with this structure:

```json
{
  "stored_name": "0b4accfa-4ce3-4511-b8e5-25b3167b5298",
  "display_name": "Secretaries 4 - Scene 3",
  "tags": [
    "brunette",
    "hungarian",
    "bubble butt",
    "secretary",
    "office",
    "blowjob"
  ],
  "categories": [
    "Big Ass",
    "Big Tits",
    "Brunette",
    "HD Porn"
  ],
  "pornstars": [],
  "extension": "mp4",
  "id": "ph5952b413d0f8e",
  "title": "Secretaries 4 - Scene 3",
  "thumbnail": "https://ei.phncdn.com/videos/201706/27/122148731/original/(m=eaAaGwObaaaa)(mh=pfkhIqiT70rkwSGs)12.jpg",
  "duration": 1404,
  "webpage_url": "https://www.pornhub.com/view_video.php?viewkey=ph5952b413d0f8e",
  "formats": ["240p", "480p", "720p", "hls-2054"],
  "downloaded_format": "hls-2054",
  "provider": "pornhub",
  "primary_tag": "Combat_Zone"
}
```

---

## Database Architecture

### New Tables

#### tags
```sql
CREATE TABLE tags (
  id INT/SERIAL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,  -- Case-insensitive
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### categories
Same structure as tags.

#### performers
Same structure as tags (name VARCHAR(255)).

#### media_file_tags (junction)
```sql
CREATE TABLE media_file_tags (
  media_file_uuid VARCHAR(36) NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (media_file_uuid, tag_id),
  FOREIGN KEY (media_file_uuid) REFERENCES media_files(uuid) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

#### media_file_categories (junction)
Same structure as media_file_tags.

#### media_file_performers (junction)
Same structure as media_file_tags.

### Enhanced media_files Table

Add columns:
- `display_name` VARCHAR(255) - Human-readable title
- `provider` VARCHAR(100) - Source provider (pornhub, youtube, etc.)
- `provider_id` VARCHAR(255) - Provider's video ID
- `webpage_url` VARCHAR(512) - Original source URL
- `thumbnail` VARCHAR(512) - Thumbnail image URL
- `duration` INT - Video length in seconds
- `downloaded_format` VARCHAR(50) - Format that was downloaded
- `available_formats` JSON/JSONB - Array of available formats
- `creator` VARCHAR(255) - Video creator/uploader
- `primary_tag_id` INT - Foreign key to tags(id)

---

## Technology Stack

**Backend (TypeScript/Node.js)**:
- Database adapters for MySQL and PostgreSQL
- Service layer: `MediaLoaderService` orchestrates imports
- Utilities for metadata parsing and manager operations
- Transaction-based operations for data integrity

**Key Patterns**:
- DatabaseAdapter pattern (abstraction over MySQL/PostgreSQL)
- Manager utilities (TagManager, CategoryManager, PerformerManager)
- Pure functions for parsing (no side effects)
- Transaction-safe batch processing

---

## Implementation Tasks

You will implement 12 tasks sequentially:

1. **Database Migration** - Create tables and add columns
2. **TypeScript Models** - Define interfaces
3. **TagManager** - Tag CRUD and associations
4. **CategoryManager** - Category CRUD and associations
5. **PerformerManager** - Performer CRUD and associations
6. **MetadataParser** - Parse and validate metadata
7. **MediaLoaderService Enhancement** - Orchestrate import
8. **TagManager Tests** - Unit tests
9. **CategoryManager & PerformerManager Tests** - Unit tests
10. **MetadataParser Tests** - Unit tests
11. **Integration Tests** - Full workflow tests
12. **E2E Tests** - API and query validation

Each task has:
- Clear file path
- Detailed objectives
- Success criteria
- Reference files to study
- Detailed implementation prompt in tasks.md

---

## Key Requirements

### Case-Insensitive Matching
- Tag "Action" and "action" must be treated as the same tag
- Normalize names to lowercase before database operations
- Use LOWER() function in unique constraints

### Transaction Safety
- Multi-step operations must be atomic (rollback on failure)
- Use DatabaseAdapter transaction methods
- Example: Creating media file + associations = 1 transaction

### Error Handling
- Metadata parsing errors must not stop batch processing
- Log errors, continue with other files
- Graceful degradation: import basic info if rich metadata fails

### Performance
- Batch operations when possible
- Use JOIN queries (not JSON parsing) for filtering
- Index all foreign key columns
- Target: <10s for 100 files, <500ms queries on 100k files

### Backward Compatibility
- Existing media_files records must remain valid
- New columns default to NULL
- Service works if metadata is missing

---

## File Structure

```
backend/
├── src/
│   ├── migrations/
│   │   └── 003_rich_metadata_schema.ts  (NEW)
│   ├── models/
│   │   ├── Tag.ts  (NEW)
│   │   ├── Category.ts  (NEW)
│   │   ├── Performer.ts  (NEW)
│   │   └── MediaFile.ts  (ENHANCE)
│   ├── utils/
│   │   ├── TagManager.ts  (NEW)
│   │   ├── CategoryManager.ts  (NEW)
│   │   ├── PerformerManager.ts  (NEW)
│   │   ├── MetadataParser.ts  (NEW)
│   │   ├── MetadataReader.ts  (EXISTING - use as reference)
│   │   └── UUIDExtractor.ts  (EXISTING - use as-is)
│   ├── services/
│   │   └── MediaLoaderService.ts  (ENHANCE)
│   └── adapters/
│       └── DatabaseAdapter.ts  (EXISTING - use for all DB ops)
└── tests/
    ├── utils/
    │   ├── TagManager.test.ts  (NEW)
    │   ├── CategoryManager.test.ts  (NEW)
    │   ├── PerformerManager.test.ts  (NEW)
    │   └── MetadataParser.test.ts  (NEW)
    └── services/
        └── MediaLoaderService.integration.test.ts  (ENHANCE)
```

---

## Code Examples

### Using DatabaseAdapter (Correct)
```typescript
// CORRECT: Use DatabaseAdapter methods
const result = await this.adapter.query(
  'SELECT * FROM tags WHERE LOWER(name) = LOWER(?)',
  [tagName]
);
```

### Case-Insensitive Insert/Query
```typescript
// Normalize before insert
const normalizedName = tagName.toLowerCase();

// Use LOWER() in queries for case-insensitive matching
const query = 'SELECT id FROM tags WHERE LOWER(name) = ?';
const result = await adapter.query(query, [normalizedName]);
```

### Transaction Pattern
```typescript
// Start transaction
await adapter.execute('BEGIN');

try {
  // Multiple operations
  await adapter.execute('INSERT INTO tags ...', [name]);
  await adapter.execute('INSERT INTO media_file_tags ...', [uuid, tagId]);

  // Commit if all succeed
  await adapter.execute('COMMIT');
} catch (error) {
  // Rollback on any error
  await adapter.execute('ROLLBACK');
  throw error;
}
```

### Parsing Metadata (Correct)
```typescript
// CORRECT: Pure function, handles missing fields
export function extractDisplayName(metadata: any): string {
  // Fallback chain
  if (metadata.display_name) return metadata.display_name;
  if (metadata.title) return metadata.title;
  // Use filename as last resort
  return metadata.stored_name || 'Unknown';
}

// CORRECT: Handle arrays safely
export function extractTags(metadata: any): string[] {
  if (!metadata.tags || !Array.isArray(metadata.tags)) {
    return [];
  }
  return metadata.tags
    .map((tag: string) => tag.trim().toLowerCase())
    .filter((tag: string) => tag.length > 0);
}
```

---

## Testing Approach

### Unit Tests
- Mock DatabaseAdapter completely (no real database)
- Test each function/method independently
- Cover edge cases: empty arrays, null, special characters
- Verify SQL queries are parameterized (inspect adapter calls)

### Integration Tests
- Use real test database with migration applied
- Test full workflow: scan → read → parse → store
- Verify associations created correctly
- Test update scenarios (add/remove tags)
- Verify transaction rollback

### E2E Tests
- Test through public API (not internal methods)
- Import test files with metadata
- Query by tag/category/performer
- Measure performance
- Verify user-facing functionality

---

## Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// Don't write raw SQL outside migrations
const sql = `INSERT INTO tags (name) VALUES ('${tagName}')`;

// Don't use string concatenation (SQL injection risk)
const query = `SELECT * FROM tags WHERE name = '${name}'`;

// Don't throw on missing metadata (breaks batch processing)
if (!metadata.tags) throw new Error('Tags required');

// Don't create circular dependencies
import { MediaLoaderService } from '../services/MediaLoaderService';  // NO

// Don't skip transaction boundaries
await this.insertTag(name);  // Not atomic!
await this.associateWithMedia(uuid, tagId);  // Could fail leaving orphan
```

### ✅ Do This Instead
```typescript
// Use DatabaseAdapter with parameterized queries
await adapter.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);

// Use placeholders for safety
const query = 'SELECT * FROM tags WHERE name = ?';
await adapter.query(query, [name]);

// Handle missing fields gracefully
const tags = metadata.tags || [];

// Keep dependencies clean
// Utilities should not import services

// Use transactions for multi-step operations
await adapter.execute('BEGIN');
try {
  await this.insertTag(name);
  await this.associateWithMedia(uuid, tagId);
  await adapter.execute('COMMIT');
} catch (error) {
  await adapter.execute('ROLLBACK');
  throw error;
}
```

---

## Getting Started

1. **Read Specification Documents**:
   - Start with `SPEC_SUMMARY.md` for complete overview
   - Review `requirements.md` for what needs to be built
   - Study `design.md` for how to build it
   - Use `tasks.md` for detailed implementation prompts

2. **Study Existing Code**:
   - `backend/src/migrations/001_initial_schema.ts` - Migration patterns
   - `backend/src/adapters/DatabaseAdapter.ts` - Database operations
   - `backend/src/services/MediaLoaderService.ts` - Current import logic
   - `backend/src/utils/MetadataReader.ts` - Metadata reading

3. **Start Task 1**:
   - Read the detailed prompt in `tasks.md` for Task 1
   - Create `backend/src/migrations/003_rich_metadata_schema.ts`
   - Follow the migration pattern from existing migrations
   - Test on both MySQL and PostgreSQL if possible

4. **Continue Sequentially**:
   - Complete each task before moving to next
   - Test thoroughly after each task
   - Mark status in `docs/rich-metadata-import/TASKS.md`

---

## Questions & Clarifications

### Database Questions
- **Q**: Do I need to support both MySQL and PostgreSQL?
  - **A**: Yes, the codebase supports both. Use DatabaseAdapter for abstraction.

### Implementation Questions
- **Q**: Should TagManager, CategoryManager, and PerformerManager have identical structure?
  - **A**: Yes, they should be nearly identical for consistency and maintainability.

- **Q**: What if metadata parsing fails for one file?
  - **A**: Log the error, continue processing other files (graceful degradation).

### Testing Questions
- **Q**: Do I need to write tests immediately?
  - **A**: No, implement functionality first (Tasks 1-7), then write tests (Tasks 8-12).

---

## Success Criteria

### Functionality
- ✅ Migration creates all tables correctly
- ✅ Media files import with rich metadata
- ✅ Tags/categories/performers associated correctly
- ✅ Case-insensitive matching works ("Action" == "action")
- ✅ Queries by tag/category/performer return correct results
- ✅ Performance targets met (<10s import, <500ms queries)

### Code Quality
- ✅ All TypeScript compiles without errors
- ✅ No SQL injection vulnerabilities (parameterized queries only)
- ✅ Transactions used for multi-step operations
- ✅ Error handling doesn't break batch processing
- ✅ Backward compatible (existing code still works)

### Testing
- ✅ >80% code coverage
- ✅ All edge cases tested
- ✅ Integration tests pass
- ✅ E2E tests validate user functionality

---

## Ready to Start?

You now have all the context needed to implement this feature. Start with:
1. Read `SPEC_SUMMARY.md` for complete overview
2. Read `.spec-workflow/specs/rich-metadata-import/tasks.md` Task 1 detailed prompt
3. Create the database migration
4. Test the migration
5. Move to Task 2

Good luck! 🚀
