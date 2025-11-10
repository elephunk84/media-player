# Rich Metadata Import - Documentation

Complete documentation package for implementing the Rich Metadata Import feature using Claude Web.

---

## 📁 Files in This Directory

### 1. **PROMPT.md** - Start Here for Claude Web
**Purpose**: Copy this entire file and provide it to Claude Web to begin implementation.

**Contains**:
- Complete project context
- Example metadata structure
- Database architecture overview
- Technology stack
- Code examples (correct vs incorrect patterns)
- Common pitfalls to avoid
- Getting started instructions

**When to use**: First thing to read when starting implementation with Claude Web.

---

### 2. **SPEC_SUMMARY.md** - Complete Specification Overview
**Purpose**: Comprehensive summary of the entire specification in one document.

**Contains**:
- Executive summary and business value
- All 11 requirements
- Complete database schema (6 tables)
- Architecture and data flow diagrams
- Implementation tasks breakdown
- Example metadata JSON with mapping
- Query examples
- Performance targets
- Testing strategy
- Success criteria

**When to use**: Need to understand the complete picture before diving into implementation.

---

### 3. **TASKS.md** - Implementation Checklist
**Purpose**: Step-by-step task checklist with quick reference.

**Contains**:
- 12 numbered tasks with status checkboxes
- Objective for each task
- Files to create/modify
- Success criteria
- Reference files to study
- Implementation guidelines
- Code examples

**When to use**: Track progress, see what's next, quick reference during implementation.

---

## 📚 Full Specification Location

The detailed specification documents are in:

```
.spec-workflow/specs/rich-metadata-import/
├── requirements.md    (11 requirements with EARS acceptance criteria)
├── design.md          (Complete technical design, schemas, architecture)
└── tasks.md           (12 detailed tasks with implementation prompts)
```

---

## 🚀 Quick Start Guide

### For Claude Web Implementation

1. **Read PROMPT.md** (5-10 minutes)
   - Copy the entire file
   - Provide it to Claude Web as context
   - This gives Claude all necessary background

2. **Read SPEC_SUMMARY.md** (10-15 minutes)
   - Understand the complete specification
   - Review database schema
   - Study example metadata mapping

3. **Open TASKS.md** (ongoing reference)
   - See the 12 tasks you'll implement
   - Track your progress with checkboxes
   - Reference during implementation

4. **Start Task 1** (Database Migration)
   - Read detailed prompt in `.spec-workflow/specs/rich-metadata-import/tasks.md`
   - Create migration file
   - Test on MySQL and PostgreSQL

5. **Continue Sequentially** (Tasks 2-12)
   - Complete each task
   - Mark status in TASKS.md
   - Test thoroughly before moving on

---

## 📋 Implementation Workflow

```
┌─────────────────────────────────────────┐
│ 1. Read PROMPT.md                       │
│    → Get complete context               │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. Read SPEC_SUMMARY.md                 │
│    → Understand what to build           │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. Open TASKS.md                        │
│    → See task checklist                 │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. For each task:                       │
│    a. Read detailed prompt in tasks.md  │
│    b. Study reference files             │
│    c. Implement                         │
│    d. Test                              │
│    e. Mark complete [ ] → [x]           │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. All tasks complete!                  │
│    → Feature ready for production       │
└─────────────────────────────────────────┘
```

---

## 🎯 What Gets Built

### Database (6 new tables)
- `tags` - Individual tags
- `categories` - Individual categories
- `performers` - Individual performers
- `media_file_tags` - Video ↔ Tags junction
- `media_file_categories` - Video ↔ Categories junction
- `media_file_performers` - Video ↔ Performers junction

### Enhanced media_files (10 new columns)
- display_name, provider, provider_id
- webpage_url, thumbnail, duration
- downloaded_format, available_formats
- creator, primary_tag_id

### New Utilities (4 files)
- **TagManager** - Tag CRUD and associations
- **CategoryManager** - Category CRUD and associations
- **PerformerManager** - Performer CRUD and associations
- **MetadataParser** - Parse and validate metadata

### Enhanced Service (1 file)
- **MediaLoaderService** - Orchestrates import workflow

### TypeScript Models (4 files)
- Tag, Category, Performer interfaces
- Enhanced MediaFile interface
- Supporting interfaces (ParsedRichMetadata, etc.)

### Tests (4 test files)
- TagManager, CategoryManager, PerformerManager unit tests
- MetadataParser unit tests
- MediaLoaderService integration tests
- E2E tests for API queries

---

## 💡 Key Features

### 1. Normalized Database Schema
- Tags/categories/performers in separate tables
- Many-to-many relationships via junction tables
- Fast JOIN queries instead of JSON parsing

### 2. Case-Insensitive Matching
- "Action" and "action" treated as same tag
- Prevents duplicates
- Uses LOWER() function in unique constraints

### 3. Transaction Safety
- Multi-step operations are atomic
- Rollback on any failure
- All-or-nothing imports

### 4. Graceful Error Handling
- Metadata parsing errors don't stop batch
- Partial metadata still imports
- Comprehensive error logging

### 5. Backward Compatible
- Existing media_files records remain valid
- New columns default to NULL
- System works without rich metadata

---

## 📊 Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Import 100 files | <10 seconds | With rich metadata |
| Query by tag (10k videos) | <100ms | Using JOIN |
| Query by tag (100k videos) | <500ms | Using JOIN |
| Filter by multiple tags | <1 second | AND logic |
| Count by tag | <200ms | Aggregate query |

---

## ✅ Success Checklist

Before considering the feature complete:

**Functionality**:
- [ ] Migration runs on both MySQL and PostgreSQL
- [ ] All 6 tables created with correct schemas
- [ ] 10 columns added to media_files
- [ ] Tags import and associate correctly
- [ ] Categories import and associate correctly
- [ ] Performers import and associate correctly
- [ ] Case-insensitive matching works ("Action" == "action")
- [ ] Queries return correct results
- [ ] Backward compatible (existing data works)

**Performance**:
- [ ] Import 100 files in <10 seconds
- [ ] Queries on 100k videos in <500ms
- [ ] No memory leaks
- [ ] Indexes improve query speed

**Code Quality**:
- [ ] All TypeScript compiles without errors
- [ ] No SQL injection vulnerabilities (parameterized queries)
- [ ] Transactions used for multi-step operations
- [ ] Error handling doesn't break batch processing
- [ ] >80% test coverage
- [ ] Code follows project conventions

**Testing**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Edge cases covered
- [ ] Error scenarios tested

---

## 🔗 Related Documentation

### Specification Files
- `.spec-workflow/specs/rich-metadata-import/requirements.md`
- `.spec-workflow/specs/rich-metadata-import/design.md`
- `.spec-workflow/specs/rich-metadata-import/tasks.md`

### Existing Code References
- `backend/src/migrations/001_initial_schema.ts` - Migration patterns
- `backend/src/migrations/002_create_media_files_table.ts` - Media files table
- `backend/src/adapters/DatabaseAdapter.ts` - Database operations
- `backend/src/services/MediaLoaderService.ts` - Current import logic
- `backend/src/utils/MetadataReader.ts` - Metadata reading

---

## 🆘 Getting Help

### Where to Look First

1. **Implementation Questions**: Check PROMPT.md "Common Pitfalls" section
2. **Requirements Clarification**: Read requirements.md
3. **Technical Details**: Read design.md
4. **Task Details**: Read tasks.md for specific task
5. **Examples**: Check SPEC_SUMMARY.md for query examples

### Common Questions

**Q: Do I implement all tasks in one session?**
A: No, implement sequentially. Test after each task.

**Q: Can I modify the database schema?**
A: Only in Task 1 (migration). Follow the design exactly.

**Q: What if I find a better way to implement something?**
A: Stick to the specification first. Optimizations can come later.

**Q: Do I need to support both MySQL and PostgreSQL?**
A: Yes, the codebase supports both. Use DatabaseAdapter.

**Q: What if metadata parsing fails?**
A: Log error, continue processing other files (graceful degradation).

---

## 📈 Implementation Timeline Estimate

| Phase | Tasks | Est. Time | Focus |
|-------|-------|-----------|-------|
| Phase 1 | 1-2 | 2-4 hours | Database & Models |
| Phase 2 | 3-7 | 6-10 hours | Business Logic |
| Phase 3 | 8-12 | 4-8 hours | Testing |
| **Total** | **1-12** | **12-22 hours** | **Complete Feature** |

*Estimates assume familiarity with TypeScript, databases, and testing frameworks.*

---

## 🎓 Learning Resources

### Before Starting
- Understand TypeScript interfaces
- Know SQL basics (CREATE TABLE, JOIN, INSERT)
- Familiar with async/await in JavaScript
- Basic understanding of transactions

### During Implementation
- Review existing migrations for patterns
- Study DatabaseAdapter interface
- Look at existing tests for test patterns
- Reference design.md for schemas

---

## 🏁 Ready to Start?

1. Open **PROMPT.md** in this directory
2. Copy the entire contents
3. Provide to Claude Web as context
4. Follow the "Getting Started" section
5. Begin with Task 1 (Database Migration)

Good luck with the implementation! 🚀

---

*Last Updated: 2025-11-10*
*Specification Version: 1.0*
*Status: Ready for Implementation*
