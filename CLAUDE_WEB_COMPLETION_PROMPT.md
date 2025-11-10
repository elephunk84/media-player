# Claude Web: Complete Outstanding Tasks

## Project Overview

You are working on a **Media Player** application with three feature specifications:

1. **Media Player** (main app) - Video player with clips, playlists, and authentication (90% complete)
2. **Metronome Overlay** - Beat-synchronized visual/audio overlay for videos (71% complete)
3. **Media Metadata Loader** - UUID-based video file and metadata import system (83% complete)

**Tech Stack:**
- Backend: Node.js + TypeScript + Express
- Frontend: React + TypeScript + Vite
- Database: MySQL/PostgreSQL (adapter pattern)
- Testing: Jest (backend), React Testing Library (frontend), Playwright (E2E)

**Current State:** All core functionality is implemented and working. What remains is primarily testing, documentation, and deployment configuration.

---

## Your Mission

Complete the 15 pending tasks across all specs to bring the project to production-ready status. Tasks are organized by priority below.

---

## 🔴 HIGH PRIORITY - Production Requirements

These tasks are required before the application can be considered production-ready.

### Task Group A: End-to-End Testing

**Files to create:**
- `e2e/metronome.spec.ts`
- `e2e/mediaLoader.spec.ts`
- `e2e/userFlows.spec.ts`

**Objective:** Create Playwright E2E tests covering critical user workflows.

**Test Scenarios to Implement:**

1. **Metronome E2E Tests** (`e2e/metronome.spec.ts`):
   ```typescript
   // Required test cases:
   - User can enable/disable metronome
   - User can adjust BPM with slider
   - Metronome syncs with video play/pause
   - Visual effects render on beats
   - User can create and load presets
   ```

2. **Media Loader E2E Tests** (`e2e/mediaLoader.spec.ts`):
   ```typescript
   // Required test cases:
   - CLI command loads video files
   - UUID extraction works correctly
   - Metadata JSON files are parsed
   - Database records are created
   - Error handling for missing files
   ```

3. **Core User Flows** (`e2e/userFlows.spec.ts`):
   ```typescript
   // Required test cases:
   - Login → Browse videos → Play video
   - Create clip → Add to playlist → Play playlist
   - Video playback with metronome enabled
   ```

**Reference existing tests:**
- Check `backend/src/__tests__/integration/*.test.ts` for patterns
- Check `frontend/src/components/__tests__/*.test.tsx` for React patterns

**Success criteria:**
- All critical user workflows covered
- Tests pass consistently
- No false positives/negatives
- Clear test descriptions

---

### Task Group B: Production Deployment Configuration

**Files to create/modify:**
- `docker-compose.prod.yml`
- `backend/Dockerfile.prod`
- `frontend/Dockerfile.prod`
- `.env.production.example`

**Objective:** Create production-ready Docker configuration with security and optimization.

**Requirements:**

1. **Multi-stage Docker builds:**
   ```dockerfile
   # Backend Dockerfile.prod
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS production
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   USER node
   CMD ["node", "dist/server.js"]
   ```

2. **Production docker-compose.yml:**
   ```yaml
   services:
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile.prod
       environment:
         - NODE_ENV=production
         - DB_TYPE=mysql
       volumes:
         - /mnt/Videos:/mnt/Videos:ro
         - /mnt/Metadata:/mnt/Metadata:ro

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile.prod
       ports:
         - "80:80"

     mysql:
       image: mysql:8.0
       volumes:
         - mysql_data:/var/lib/mysql
       environment:
         - MYSQL_ROOT_PASSWORD=<from-env>
   ```

3. **Environment configuration:**
   - Create `.env.production.example` with all required variables
   - Document each environment variable
   - Include security notes

**Reference:**
- Check existing `docker-compose.yml` for development setup
- Check `backend/src/config/database.ts` for required env vars

**Success criteria:**
- Production images are optimized (<500MB)
- Security: no root user, minimal attack surface
- Environment variables properly configured
- Volume mounts for video storage
- Database persistence configured

---

## 🟡 MEDIUM PRIORITY - Quality & Maintainability

These tasks improve code quality, maintainability, and developer experience.

### Task Group C: Metronome Test Suite

**Files to create:**
- `frontend/src/utils/metronome/__tests__/timingCalculations.test.ts`
- `frontend/src/services/metronome/__tests__/MetronomeEngine.test.ts`
- `frontend/src/components/visualEffects/__tests__/FlashEffect.test.tsx`
- `frontend/src/components/visualEffects/__tests__/PulseEffect.test.tsx`
- `frontend/src/components/visualEffects/__tests__/BorderEffect.test.tsx`
- `frontend/src/hooks/__tests__/useMetronome.test.ts`

**Objective:** Add comprehensive test coverage for metronome feature (currently 0% tested).

**Approach:**

1. **Timing Utilities Tests:**
   ```typescript
   // frontend/src/utils/metronome/__tests__/timingCalculations.test.ts
   import { bpmToMilliseconds, millisecondsToBPM, calculateBeatDuration } from '../timingCalculations';

   describe('timingCalculations', () => {
     test('bpmToMilliseconds converts 60 BPM to 1000ms', () => {
       expect(bpmToMilliseconds(60)).toBe(1000);
     });

     test('calculateBeatDuration applies randomization', () => {
       const duration = calculateBeatDuration(60, 20); // ±20%
       expect(duration).toBeGreaterThanOrEqual(800);
       expect(duration).toBeLessThanOrEqual(1200);
     });

     // Add more tests...
   });
   ```

2. **MetronomeEngine Tests (with mocks):**
   ```typescript
   // frontend/src/services/metronome/__tests__/MetronomeEngine.test.ts
   import { MetronomeEngine } from '../MetronomeEngine';

   // Mock Web Audio API
   const mockAudioContext = {
     currentTime: 0,
     state: 'running',
   };

   beforeAll(() => {
     (global as any).AudioContext = jest.fn(() => mockAudioContext);
   });

   describe('MetronomeEngine', () => {
     test('initializes without errors', () => {
       const engine = new MetronomeEngine();
       expect(engine).toBeDefined();
     });

     test('emits beat events when started', (done) => {
       const engine = new MetronomeEngine();
       engine.on('beat', (beatInfo) => {
         expect(beatInfo).toHaveProperty('beatNumber');
         done();
       });
       engine.start({ bpm: 60, /* config */ });
     });

     // Add more tests...
   });
   ```

3. **Visual Effects Component Tests:**
   ```typescript
   // frontend/src/components/visualEffects/__tests__/FlashEffect.test.tsx
   import { render } from '@testing-library/react';
   import { FlashEffect } from '../FlashEffect';

   describe('FlashEffect', () => {
     test('renders with correct opacity', () => {
       const { container } = render(
         <FlashEffect
           intensity={0.5}
           duration={300}
           config={{ color: '#ffffff', opacity: 0.5 }}
         />
       );

       const effect = container.querySelector('.flash-effect');
       expect(effect).toBeInTheDocument();
     });

     // Add more tests...
   });
   ```

4. **Hook Tests:**
   ```typescript
   // frontend/src/hooks/__tests__/useMetronome.test.ts
   import { renderHook, act } from '@testing-library/react-hooks';
   import { useMetronome } from '../useMetronome';

   describe('useMetronome', () => {
     test('initializes with default config', () => {
       const mockPlayerState = { playing: false, currentTime: 0 };
       const { result } = renderHook(() => useMetronome(mockPlayerState));

       expect(result.current.enabled).toBe(false);
       expect(result.current.config.bpm).toBe(60);
     });

     // Add more tests...
   });
   ```

**Reference:**
- Existing implementation in `frontend/src/utils/metronome/`
- Existing implementation in `frontend/src/services/metronome/`
- Existing component tests in `frontend/src/components/__tests__/`

**Success criteria:**
- >80% code coverage for metronome feature
- All pure functions have unit tests
- Components render without errors
- Hooks manage state correctly
- Tests are fast (<5s total)

---

### Task Group D: Frontend Component Test Coverage

**Files to create:**
- `frontend/src/components/__tests__/MetronomeControls.test.tsx`
- `frontend/src/components/__tests__/MetronomeOverlay.test.tsx`
- `frontend/src/components/__tests__/PlaylistCard.test.tsx`
- `frontend/src/components/__tests__/VideoCard.test.tsx`
- Additional tests as needed

**Objective:** Expand frontend test coverage beyond the 3 existing tests.

**Priority Components to Test:**

1. **MetronomeControls:**
   ```typescript
   test('toggle button enables metronome', () => {
     const onToggle = jest.fn();
     const { getByTestId } = render(
       <MetronomeControls
         enabled={false}
         bpm={60}
         isRunning={false}
         onToggle={onToggle}
         onBPMChange={jest.fn()}
         onOpenSettings={jest.fn()}
       />
     );

     fireEvent.click(getByTestId('metronome-toggle'));
     expect(onToggle).toHaveBeenCalled();
   });
   ```

2. **VideoCard, PlaylistCard:**
   - Test rendering with different props
   - Test click handlers
   - Test conditional rendering

**Reference:**
- `frontend/src/components/__tests__/VideoPlayer.test.tsx`
- `frontend/src/components/__tests__/ClipCreator.test.tsx`

**Success criteria:**
- All UI components have basic rendering tests
- User interactions tested
- Edge cases covered

---

### Task Group E: Documentation

**Files to create:**
- `backend/src/services/MediaLoaderService.ts` (add JSDoc)
- `backend/src/utils/UUIDExtractor.ts` (add JSDoc)
- `backend/src/utils/MetadataReader.ts` (add JSDoc)
- `docs/MEDIA_LOADER.md`
- `docs/METRONOME.md`
- `README.md` (update)

**Objective:** Complete documentation for media loader and metronome features.

**1. JSDoc Documentation:**

Add comprehensive JSDoc comments to all public APIs in the media loader:

```typescript
// backend/src/utils/UUIDExtractor.ts
/**
 * Extracts UUID from a filename.
 *
 * @param filename - The filename to extract UUID from (e.g., "12345678-1234-1234-1234-123456789abc.mp4")
 * @returns The extracted UUID or null if not found
 *
 * @example
 * extractUUID('abc-123.mp4'); // null
 * extractUUID('550e8400-e29b-41d4-a716-446655440000.mp4'); // '550e8400-e29b-41d4-a716-446655440000'
 */
export function extractUUID(filename: string): string | null {
  // ...
}
```

**2. Media Loader README:**

Create `docs/MEDIA_LOADER.md`:

```markdown
# Media Metadata Loader

## Overview
Loads video files and associated metadata from mounted directories.

## Usage

### CLI Command
\`\`\`bash
npm run load-media -- --videos-dir /mnt/Videos --metadata-dir /mnt/Metadata
\`\`\`

### Options
- `--videos-dir` - Directory containing video files with UUID filenames
- `--metadata-dir` - Directory containing metadata folders (UUID-named)
- `--dry-run` - Preview what would be loaded without database changes

## File Structure
\`\`\`
/mnt/Videos/
  550e8400-e29b-41d4-a716-446655440000.mp4

/mnt/Metadata/
  550e8400-e29b-41d4-a716-446655440000/
    video.info.json
\`\`\`

## Metadata JSON Format
\`\`\`json
{
  "title": "Video Title",
  "description": "Description",
  "duration": 120,
  "tags": ["tag1", "tag2"]
}
\`\`\`

## Implementation Details
- UUID Extraction: Regex pattern for UUID v4
- Idempotency: Safe to re-run (uses UUID as unique key)
- Error Handling: Logs errors, continues processing

## Troubleshooting
...
```

**3. Metronome User Guide:**

Create `docs/METRONOME.md`:

```markdown
# Metronome Overlay Feature

## Quick Start

1. Open a video in the player
2. Click the metronome icon in the controls
3. Adjust BPM using the slider (30-300)
4. Play the video - metronome syncs automatically

## Features

### Basic Controls
- **BPM Slider**: Adjust tempo (30-300 beats per minute)
- **Play/Pause**: Auto-syncs with video playback
- **Settings**: Access advanced configuration

### Visual Effects
Three visual styles available:
- **Flash**: Full-screen color flash on each beat
- **Pulse**: Expanding circle/shape
- **Border**: Animated border around video

### Audio
- Multiple sound types: click, beep, drum, snap, woodblock
- Custom sound upload support
- Volume control per beat intensity
- Master volume control

### Beat Patterns
Create custom patterns with different intensities:
- **Light**: Quiet beat
- **Medium**: Normal beat
- **Strong**: Emphasized beat
- **Silent**: No beat (visual only)

### Presets
Save and load metronome configurations:
1. Configure metronome as desired
2. Open settings → Presets tab
3. Enter preset name
4. Click "Save Preset"
5. Load anytime from preset list

## Keyboard Shortcuts
- `Ctrl+M`: Toggle metronome on/off
- `Escape`: Close settings panel

## Troubleshooting
...
```

**4. Update Main README:**

Add sections to `README.md`:
- Features overview (include metronome and media loader)
- Setup instructions
- Links to detailed documentation

**Success criteria:**
- All public APIs documented with JSDoc
- User guides are comprehensive and clear
- README provides good project overview
- Code examples are accurate

---

## 🟢 LOW PRIORITY - Nice-to-Have

### Task Group F: MetronomeSettingsPanel Implementation

**File:** `frontend/src/components/MetronomeSettingsPanel.tsx`

**Status:** This component is listed as incomplete, but verify first:

1. Check if settings are accessible elsewhere in the UI
2. Check `frontend/src/components/MetronomeOverlay.tsx` for inline settings
3. Only implement if truly missing

**If needed, implement a tabbed settings panel:**

```typescript
// frontend/src/components/MetronomeSettingsPanel.tsx
import React, { useState } from 'react';
import './MetronomeSettingsPanel.css';
import type { MetronomeConfig, MetronomePreset } from '../types/metronome';

interface MetronomeSettingsPanelProps {
  config: MetronomeConfig;
  presets: MetronomePreset[];
  onConfigChange: (config: Partial<MetronomeConfig>) => void;
  onLoadPreset: (id: string) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onClose: () => void;
}

type SettingsTab = 'basic' | 'pattern' | 'visual' | 'audio' | 'presets';

export function MetronomeSettingsPanel(props: MetronomeSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  return (
    <div className="metronome-settings-panel">
      <div className="metronome-settings-panel__header">
        <h3>Metronome Settings</h3>
        <button onClick={props.onClose}>×</button>
      </div>

      <div className="metronome-settings-panel__tabs">
        {/* Tab navigation */}
      </div>

      <div className="metronome-settings-panel__content">
        {activeTab === 'basic' && <BasicSettings {...props} />}
        {activeTab === 'pattern' && <PatternSettings {...props} />}
        {activeTab === 'visual' && <VisualSettings {...props} />}
        {activeTab === 'audio' && <AudioSettings {...props} />}
        {activeTab === 'presets' && <PresetSettings {...props} />}
      </div>
    </div>
  );
}

// Implement sub-components...
```

**Reference:**
- `frontend/src/components/MetronomeControls.tsx` for styling patterns
- Task file at `.spec-workflow/specs/metronome-overlay/tasks.md` line 1608-1728

---

## 📋 Execution Plan

### Recommended Order:

**Week 1 - High Priority:**
1. Production deployment configuration (Task Group B)
2. E2E tests for core workflows (Task Group A - userFlows.spec.ts)

**Week 2 - Testing:**
3. Metronome test suite (Task Group C)
4. Metronome E2E tests (Task Group A - metronome.spec.ts)
5. Media loader E2E tests (Task Group A - mediaLoader.spec.ts)

**Week 3 - Polish:**
6. Frontend component tests (Task Group D)
7. Documentation (Task Group E)
8. MetronomeSettingsPanel if needed (Task Group F)

### For Each Task:

1. **Read the task details** from the spec files:
   - `.spec-workflow/specs/metronome-overlay/tasks.md`
   - `.spec-workflow/specs/media-metadata-loader/tasks.md`
   - `.spec-workflow/specs/media-player/tasks.md`

2. **Review existing code** for patterns:
   - Search for similar implementations
   - Check test patterns in `__tests__` directories
   - Review component structure

3. **Implement and test:**
   - Write the code
   - Test manually
   - Run automated tests
   - Fix any issues

4. **Update task status:**
   - Change `- [ ]` to `- [x]` in the relevant tasks.md file
   - Commit your changes

---

## 🎯 Success Criteria - Project Completion

The project is **production-ready** when:

✅ All E2E tests pass consistently
✅ Production Docker configuration builds and runs
✅ Test coverage >70% overall
✅ All features documented
✅ No critical bugs
✅ Environment configuration documented
✅ All spec tasks marked complete (`- [x]`)

---

## 📚 Reference Materials

### Project Structure
```
media-player/
├── backend/
│   ├── src/
│   │   ├── adapters/          # Database adapters
│   │   ├── cli/               # CLI commands (loadMedia)
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Auth, validation, errors
│   │   ├── migrations/        # Database migrations
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utilities
│   └── __tests__/             # Backend tests
├── frontend/
│   └── src/
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks (useMetronome, etc.)
│       ├── services/          # Frontend services (metronome engine)
│       ├── utils/             # Utilities (metronome timing, etc.)
│       └── types/             # TypeScript types
├── e2e/                       # Playwright E2E tests
├── docs/                      # Documentation
└── .spec-workflow/            # Spec files
    └── specs/
        ├── media-player/
        ├── metronome-overlay/
        └── media-metadata-loader/
```

### Key Files to Reference

**Database:**
- `backend/src/adapters/DatabaseAdapter.ts` - Interface pattern
- `backend/src/adapters/MySQLAdapter.ts` - MySQL implementation
- `backend/src/migrations/001_initial_schema.ts` - Migration example

**Services:**
- `backend/src/services/VideoService.ts` - Service pattern
- `backend/src/services/MediaLoaderService.ts` - File scanning pattern

**Metronome:**
- `frontend/src/types/metronome.ts` - Type definitions
- `frontend/src/services/metronome/MetronomeEngine.ts` - Core engine
- `frontend/src/hooks/useMetronome.ts` - Main hook

**Testing:**
- `backend/src/services/__tests__/VideoService.test.ts` - Service test pattern
- `backend/src/__tests__/integration/videos.integration.test.ts` - Integration test pattern
- `frontend/src/components/__tests__/VideoPlayer.test.tsx` - Component test pattern

---

## 🚀 Getting Started

1. **Clone and setup** (if not already done):
   ```bash
   git clone <repo>
   cd media-player
   npm install
   ```

2. **Review current state:**
   ```bash
   # Check task completion status
   grep -c "^\- \[x\]" .spec-workflow/specs/*/tasks.md
   grep "^\- \[ \]" .spec-workflow/specs/*/tasks.md
   ```

3. **Start with Task Group B** (Production deployment):
   - Create `docker-compose.prod.yml`
   - Create production Dockerfiles
   - Test the production build

4. **Continue through the priority order** above

---

## Need Help?

- **Spec files**: Check `.spec-workflow/specs/[spec-name]/tasks.md` for detailed task descriptions
- **Design docs**: Check `.spec-workflow/specs/[spec-name]/design.md` for architecture
- **Requirements**: Check `.spec-workflow/specs/[spec-name]/requirements.md` for context
- **Existing patterns**: Search the codebase for similar implementations

---

Good luck! You've got this! 🎉
