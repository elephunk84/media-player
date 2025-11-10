# Metronome Overlay - Implementation Guide

> Guide for implementing the metronome overlay feature with Claude Web

## Overview

This guide explains how to approach implementing the metronome overlay feature step by step. Follow this workflow to ensure consistent, high-quality implementation.

## Before You Start

### 1. Read All Specification Documents

**Required reading** (in order):
1. `.spec-workflow/specs/metronome-overlay/requirements.md` - Understand WHAT to build
2. `.spec-workflow/specs/metronome-overlay/design.md` - Understand HOW to build it
3. `.spec-workflow/specs/metronome-overlay/tasks.md` - See detailed task breakdown
4. `TASKS.md` - Your main task checklist (this is your working document)
5. `CODE_STANDARDS.md` - Code style and patterns to follow
6. `TESTING_GUIDE.md` - How to test your code

### 2. Understand the Architecture

The metronome system has 4 layers:

```
┌─────────────────────────────────────────┐
│  UI Layer (React Components)            │
│  - MetronomeOverlay                     │
│  - MetronomeControls                    │
│  - MetronomeSettingsPanel               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Hook Layer (React State Management)    │
│  - useMetronome (orchestrator)          │
│  - useMetronomeAudio                    │
│  - useMetronomeVisuals                  │
│  - useMetronomePresets                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Service Layer (Core Logic)             │
│  - MetronomeEngine (timing)             │
│  - AudioScheduler (sound playback)      │
│  - PatternManager (pattern logic)       │
│  - PresetStorage (localStorage)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Utility Layer (Pure Functions)         │
│  - timingCalculations                   │
│  - audioLoader                          │
└─────────────────────────────────────────┘
```

**Key principle**: Bottom-up implementation. Build utilities first, then services, then hooks, then UI.

### 3. Set Up Your Environment

1. Make sure you're in the project directory:
   ```bash
   cd /Users/iainstott/HomeProjects/media-player
   ```

2. Check existing structure:
   ```bash
   ls frontend/src/
   ```

3. Verify you have access to existing code:
   - `frontend/src/components/VideoPlayer.tsx`
   - `frontend/src/hooks/useVideoPlayer.ts`
   - `frontend/src/types/video.ts`

## Implementation Workflow

### Step 1: Read the Task

For each task in `TASKS.md`:

1. Read the task description completely
2. Check the file path where code should go
3. Review the "What to implement" section
4. Understand the success criteria
5. Note any files you need to reference

### Step 2: Examine Existing Code

Before implementing, look at existing code for patterns:

**For Phase 1 (Types)**:
```bash
# Look at existing type patterns
cat frontend/src/types/video.ts
```

**For Phase 2-3 (Services)**:
```bash
# Check existing service patterns (if any)
find frontend/src -name "*.ts" -type f
```

**For Phase 4-6 (Components)**:
```bash
# Look at VideoPlayer component for patterns
cat frontend/src/components/VideoPlayer.tsx
cat frontend/src/hooks/useVideoPlayer.ts
```

### Step 3: Create the File/Code

**Always**:
1. Create directory if it doesn't exist:
   ```bash
   mkdir -p frontend/src/utils/metronome
   ```

2. Use the exact file path from the task

3. Follow the code example provided (adjust as needed)

4. Add proper imports:
   ```typescript
   import type { TypeName } from '../../types/metronome';
   ```

5. Include JSDoc comments:
   ```typescript
   /**
    * Description of function
    * @param param1 - Description
    * @returns Description
    */
   ```

### Step 4: Test Your Implementation

**For utilities and services**:
1. Create simple test in browser console or Node
2. Verify functions work as expected
3. Test edge cases (min/max values, null, undefined)

**For React components**:
1. Import in a test page
2. Render with sample props
3. Verify visual output
4. Test interactions

**For hooks**:
1. Use in a simple component
2. Verify state updates
3. Check cleanup (no memory leaks)

### Step 5: Verify Success Criteria

Check each success criterion listed in the task:
- ✅ Does it compile without errors?
- ✅ Does it work as described?
- ✅ Are edge cases handled?
- ✅ Is it properly documented?

### Step 6: Update Task Status

In `TASKS.md`, update the status:
```markdown
**Status**: [x]  <!-- Completed -->
```

### Step 7: Move to Next Task

Follow dependencies:
- Complete Phase 1 before Phase 2
- Complete Phase 2 before Phase 3 and 4
- And so on...

## Phase-Specific Guidance

### Phase 1: Type Definitions

**Goal**: Create TypeScript interfaces

**Approach**:
1. Copy the interface definitions from task
2. Create `frontend/src/types/metronome.ts`
3. Add JSDoc comments for clarity
4. Export everything
5. Test by importing in another file:
   ```typescript
   import type { MetronomeConfig } from './types/metronome';
   const config: MetronomeConfig = { /* ... */ };
   ```

**Common issues**:
- Forgot to export types
- Circular dependencies (avoid importing from other domain types)
- Missing discriminated union setup for VisualConfig

### Phase 2: Core Timing Engine

**Goal**: Build timing engine that maintains accurate beat timing

**Approach**:
1. Start with utilities (pure functions, easy to test)
2. Then MetronomeEngine (more complex)
3. Test timing accuracy by logging timestamps

**Testing timing accuracy**:
```typescript
const engine = new MetronomeEngine();
let lastTime = 0;
let beatCount = 0;

engine.on('beat', (info) => {
  const now = Date.now();
  if (lastTime > 0) {
    const diff = now - lastTime;
    console.log(`Beat ${beatCount}: ${diff}ms`);
  }
  lastTime = now;
  beatCount++;
});

engine.start({ bpm: 60, /* ... */ });
// Should log ~1000ms between beats for 60 BPM
```

**Common issues**:
- AudioContext not initialized (browser needs user interaction first)
- setTimeout not accurate enough (use Web Audio scheduling)
- Memory leaks (always clean up listeners and timers)

### Phase 3: Audio System

**Goal**: Play sounds at precise times

**Approach**:
1. Create placeholder audio files first (or find free sounds)
2. Test audio loading separately
3. Then integrate with engine

**Creating placeholder audio files**:
You can:
- Use online tools to generate simple beep sounds
- Download free sounds from freesound.org
- Create silent files for testing (Web Audio can generate tones)

**Testing audio**:
```typescript
const context = new AudioContext();
const scheduler = new AudioScheduler(context);

// Must interact with page first (browser security)
document.body.addEventListener('click', async () => {
  await scheduler.loadSound('click');
  scheduler.playBeat(1, 0.5, context.currentTime);
});
```

**Common issues**:
- AudioContext suspended until user interaction
- CORS issues loading audio files (use same origin)
- Audio files too large (keep under 1MB)

### Phase 4: Visual Effects

**Goal**: Render beat-synced visual overlays

**Approach**:
1. Create each effect component separately
2. Test with static props first
3. Then test with animated triggers

**Testing visual effects**:
```typescript
function TestVisual() {
  const [show, setShow] = React.useState(false);

  return (
    <>
      <button onClick={() => setShow(true)}>Trigger</button>
      {show && (
        <FlashEffect
          intensity={1}
          duration={300}
          config={{ color: '#ffffff', opacity: 0.5 }}
          onComplete={() => setShow(false)}
        />
      )}
    </>
  );
}
```

**Common issues**:
- CSS transitions not working (check browser support)
- Effects overlapping (ensure previous effect clears)
- Z-index conflicts with video controls
- Pointer events blocking video controls

### Phase 5: React Hooks

**Goal**: Connect engine to React lifecycle

**Approach**:
1. Start with useMetronome (main orchestrator)
2. Test it in isolation first
3. Then add audio and visual hooks

**Testing hooks**:
```typescript
function TestMetronome() {
  const player = useVideoPlayer(); // Mock this if needed
  const metronome = useMetronome(player);

  return (
    <div>
      <button onClick={metronome.toggle}>Toggle</button>
      <p>Enabled: {metronome.enabled ? 'Yes' : 'No'}</p>
      <p>BPM: {metronome.config.bpm}</p>
    </div>
  );
}
```

**Common issues**:
- Infinite re-render loops (use useCallback, useMemo)
- Stale closures in useEffect
- Memory leaks (missing cleanup in useEffect)
- Dependencies array incorrect

### Phase 6: UI Components

**Goal**: Build user interface

**Approach**:
1. Create simple controls first (MetronomeControls)
2. Test controls in isolation
3. Then build complex settings panel

**Component testing**:
```typescript
function TestControls() {
  const [bpm, setBpm] = React.useState(60);
  const [enabled, setEnabled] = React.useState(false);

  return (
    <MetronomeControls
      enabled={enabled}
      bpm={bpm}
      isRunning={enabled}
      onToggle={() => setEnabled(!enabled)}
      onBPMChange={setBpm}
      onOpenSettings={() => console.log('Open settings')}
    />
  );
}
```

**Common issues**:
- Controlled vs uncontrolled inputs (always use controlled)
- Event handlers not properly bound
- CSS not loading (check import paths)
- Accessibility issues (missing ARIA labels)

### Phase 7: VideoPlayer Integration

**Goal**: Add metronome to existing VideoPlayer

**Approach**:
1. Make minimal changes to VideoPlayer
2. Test that existing functionality still works
3. Verify metronome syncs with video

**Integration testing**:
1. Load a video
2. Enable metronome
3. Play video - metronome should play
4. Pause video - metronome should pause
5. Seek video - metronome should resync

**Common issues**:
- Breaking existing VideoPlayer features
- Z-index layering problems
- Video controls obscured by metronome UI

### Phase 8: Testing

**Goal**: Ensure code works reliably

**Approach**:
1. Write unit tests for utilities (easy)
2. Write tests for services (medium)
3. Write component tests (medium)
4. Write integration tests (harder)
5. Write E2E tests (hardest)

**Testing priority**:
1. **Critical**: Timing accuracy, audio playback, visual rendering
2. **Important**: Hook lifecycle, preset management
3. **Nice to have**: Edge cases, error scenarios

See `TESTING_GUIDE.md` for detailed testing instructions.

### Phase 9: Documentation

**Goal**: Help users understand the feature

**Approach**:
1. Write for non-technical users
2. Include screenshots (if possible)
3. Cover common use cases
4. Add troubleshooting section

## Debugging Tips

### Problem: Code doesn't compile

**Solution**:
1. Check import paths (relative imports)
2. Verify types are exported
3. Check for typos in type names
4. Make sure file extensions are correct (.ts vs .tsx)

### Problem: Timing is inaccurate

**Solution**:
1. Verify using Web Audio API (not setTimeout)
2. Check look-ahead scheduling is implemented
3. Log beat timestamps to console
4. Test in different browsers

### Problem: Audio doesn't play

**Solution**:
1. Check AudioContext state (suspended/running)
2. Require user interaction to start AudioContext
3. Verify audio files are loaded
4. Check volume levels (not muted, not zero)

### Problem: Visual effects don't show

**Solution**:
1. Check CSS is imported
2. Verify z-index (should be high, e.g., 9999)
3. Check opacity values (not zero)
4. Verify effect state is triggering

### Problem: Memory leaks

**Solution**:
1. Always clean up in useEffect return
2. Remove event listeners on dispose
3. Clear timeouts/intervals
4. Close AudioContext on unmount

### Problem: React re-renders too much

**Solution**:
1. Use useCallback for functions
2. Use useMemo for computed values
3. Check dependencies arrays in useEffect
4. Consider React.memo for components

## Best Practices

### 1. Start Simple

Don't implement all features at once:
- ✅ First: Basic 60 BPM click with flash effect
- ✅ Then: Add BPM control
- ✅ Then: Add patterns
- ✅ Then: Add audio/visual customization
- ✅ Finally: Add presets and advanced features

### 2. Test Incrementally

Test after each task:
- ✅ Write code
- ✅ Test it works
- ✅ Mark task complete
- ✅ Move to next task

Don't wait until the end to test everything.

### 3. Follow Existing Patterns

Look at how existing code is structured:
- ✅ VideoPlayer component structure
- ✅ useVideoPlayer hook patterns
- ✅ Type definitions in types/video.ts
- ✅ File organization

### 4. Keep It Modular

Each file should have one clear purpose:
- ✅ MetronomeEngine: Only timing logic
- ✅ AudioScheduler: Only audio playback
- ✅ FlashEffect: Only flash visual
- ✅ useMetronome: Only metronome orchestration

### 5. Document As You Go

Add comments and JSDoc:
```typescript
/**
 * Calculate beat duration with randomization
 * @param bpm - Beats per minute (30-300)
 * @param randomization - Percentage variation (0-50)
 * @returns Duration in milliseconds
 * @example
 * calculateBeatDuration(60, 0) // Returns 1000
 * calculateBeatDuration(60, 20) // Returns 800-1200
 */
```

### 6. Handle Errors Gracefully

Always handle errors:
```typescript
try {
  await loadAudioFile(file);
} catch (error) {
  console.error('Failed to load audio:', error);
  setError('Could not load audio file. Please try a different file.');
}
```

## Getting Help

If you get stuck:

1. **Re-read the spec**: Check requirements.md and design.md
2. **Check existing code**: See how similar features are implemented
3. **Simplify**: Break the problem into smaller pieces
4. **Test in isolation**: Test the specific function/component alone
5. **Ask for clarification**: Ask the user if you're unsure about requirements

## Progress Tracking

Update `TASKS.md` as you go:

```markdown
**Status**: [~]  <!-- In progress -->
```

```markdown
**Status**: [x]  <!-- Completed -->
```

```markdown
**Status**: [!]  <!-- Blocked - explain why -->
```

Keep notes about issues or decisions:
```markdown
**Status**: [x]
**Notes**: Changed BPM range to 40-240 based on testing. Original range was too wide.
```

## Definition of Done

A task is complete when:

1. ✅ Code compiles without errors
2. ✅ Code works as described in success criteria
3. ✅ Edge cases are handled
4. ✅ Errors are handled gracefully
5. ✅ Code follows CODE_STANDARDS.md
6. ✅ JSDoc comments are added
7. ✅ Manual testing passes
8. ✅ Task status updated in TASKS.md

## Next Steps

1. Read CODE_STANDARDS.md
2. Read TESTING_GUIDE.md
3. Open TASKS.md
4. Start with Task 1.1
5. Follow this guide as you work through tasks

Good luck! 🎵
