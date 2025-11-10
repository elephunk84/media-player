# Prompt for Claude Web

> Copy and paste this prompt to Claude Web to start implementing the metronome overlay feature

---

## Initial Prompt

```
I need your help implementing a metronome overlay feature for a React + TypeScript video player application. This is a comprehensive feature with detailed specifications already created.

**Project**: Media Player (React + TypeScript + Video.js)
**Location**: /Users/iainstott/HomeProjects/media-player
**Feature**: Metronome Overlay with synchronized audio and visual beats

## What You'll Find

I have complete specifications ready:

1. **TASKS.md** - Your main task checklist with detailed implementation instructions
2. **IMPLEMENTATION_GUIDE.md** - How to approach the implementation workflow
3. **CODE_STANDARDS.md** - Code style and patterns to follow
4. **TESTING_GUIDE.md** - How to test your implementations

Additional detailed specifications:
- `.spec-workflow/specs/metronome-overlay/requirements.md` - Feature requirements
- `.spec-workflow/specs/metronome-overlay/design.md` - Technical design
- `.spec-workflow/specs/metronome-overlay/tasks.md` - Detailed task breakdown

## Getting Started

Please follow these steps:

1. **Read the guides first** (in this order):
   - Read IMPLEMENTATION_GUIDE.md - Understand the workflow
   - Read CODE_STANDARDS.md - Understand code style
   - Read TESTING_GUIDE.md - Understand testing approach

2. **Review the architecture** from the guides:
   - 4 layers: UI → Hooks → Services → Utilities
   - Bottom-up implementation (build utilities first)

3. **Open TASKS.md** - This is your working document with:
   - 29 tasks across 9 phases
   - Each task has complete code examples
   - Clear success criteria for each task
   - File paths where code should go

4. **Start with Phase 1, Task 1.1**:
   - Create TypeScript interfaces in `frontend/src/types/metronome.ts`
   - The task has the complete code to implement
   - Test it compiles and works
   - Mark status as [x] when complete

5. **Work through tasks sequentially**:
   - Complete Phase 1 before Phase 2
   - Test each task before moving to the next
   - Update task status in TASKS.md as you go

## Implementation Approach

For each task:
1. Read the task description completely
2. Check existing code for patterns (if referenced)
3. Create/modify the file at the specified path
4. Use the code example provided (adjust as needed)
5. Test according to success criteria
6. Update task status to [x]
7. Move to next task

## Key Points

- **All specifications are complete** - You have everything needed
- **Each task has code examples** - You don't need to design from scratch
- **Test incrementally** - Test each component as you build it
- **Follow existing patterns** - Match the existing VideoPlayer component style
- **Local media only** - No remote sources, all local videos

## Feature Overview

The metronome overlay provides:
- Synchronized audio beats (BPM 30-300)
- Visual beat indicators (flash, pulse, border effects)
- Custom beat patterns with intensity levels
- Full audio/visual customization
- Preset management (save/load configurations)
- Integration with video player (auto-sync with play/pause/seek)

## Project Context

Existing relevant files you can reference:
- `frontend/src/components/VideoPlayer.tsx` - Video player component
- `frontend/src/hooks/useVideoPlayer.ts` - Video player hook
- `frontend/src/types/video.ts` - Type definitions pattern

## Questions to Ask

If you need clarification:
1. What specific part of the task is unclear?
2. Are you stuck on a specific error or issue?
3. Do you need help understanding existing code patterns?
4. Are there dependencies or requirements you're missing?

## Ready to Start?

Let me know when you've:
1. Read IMPLEMENTATION_GUIDE.md
2. Read CODE_STANDARDS.md
3. Reviewed TASKS.md

Then tell me: "Ready to start Task 1.1" and I'll guide you through implementing the TypeScript interfaces.

We'll work through this methodically, one task at a time, testing as we go.
```

---

## Follow-up Prompts

After Claude Web confirms it's read the guides, use these prompts for each phase:

### Starting Phase 1 (Types)

```
Let's start with Phase 1, Task 1.1: Create TypeScript Interfaces

**Task**: Create all TypeScript interfaces in `frontend/src/types/metronome.ts`

**What to do**:
1. Create the file: frontend/src/types/metronome.ts
2. Copy the interface definitions from TASKS.md Task 1.1
3. Make sure all interfaces are exported
4. Add JSDoc comments for clarity

**Success criteria**:
- File compiles without errors
- All types are exported
- Discriminated unions work for VisualConfig

After you create the file, test it by trying to import a type:
```typescript
import type { MetronomeConfig } from './types/metronome';
```

Let me know when Task 1.1 is complete and working, then we'll move to Phase 2.
```

### Starting Phase 2 (Core Engine)

```
Great! Phase 1 is complete. Let's start Phase 2: Core Timing Engine

We'll build this bottom-up:
1. Task 2.1: Timing utilities (pure functions)
2. Task 2.2: MetronomeEngine class
3. Task 2.3: PatternManager service

**Start with Task 2.1**: Create `frontend/src/utils/metronome/timingCalculations.ts`

This file contains pure functions for timing math. It's the easiest to test.

**What to do**:
1. Create directory: frontend/src/utils/metronome/
2. Create file: timingCalculations.ts
3. Implement the functions from TASKS.md Task 2.1
4. Test in browser console:
   - bpmToMilliseconds(60) should return 1000
   - validateBPM(60) should return true
   - validateBPM(29) should return false

Let me know when Task 2.1 works and you've tested it.
```

### Starting Phase 3 (Audio)

```
Phase 2 complete! Now let's add audio playback.

**Phase 3 has 2 tasks**:
1. Task 3.1: Audio file loader utility
2. Task 3.2: AudioScheduler class

**Note about audio files**: You'll need simple audio files in `public/sounds/`.
For now, you can:
- Create placeholder files
- Use online tools to generate simple beep sounds
- Download free sounds from freesound.org
- Or we can test with Web Audio generated tones

**Start with Task 3.1**: Create `frontend/src/utils/metronome/audioLoader.ts`

This handles loading and validating audio files.

Let me know when you're ready to start Task 3.1.
```

### Starting Phase 4 (Visual Effects)

```
Audio system complete! Now let's add visual effects.

**Phase 4 has 4 tasks** (can do in parallel):
1. Task 4.1: FlashEffect component
2. Task 4.2: PulseEffect component
3. Task 4.3: BorderEffect component
4. Task 4.4: VisualEffectRenderer (factory component)

**Start with Task 4.1**: Create `frontend/src/components/visualEffects/FlashEffect.tsx`

This is a React component that renders a full-screen flash.

**Testing tip**: Create a test button that triggers the flash manually:
```typescript
<button onClick={() => setShowFlash(true)}>Test Flash</button>
```

Let me know when Task 4.1 works and you can see the flash effect.
```

### Starting Phase 5 (Hooks)

```
Visual effects work! Now let's connect everything with React hooks.

**Phase 5 has 4 hooks**:
1. Task 5.1: useMetronome (main orchestrator) - START HERE
2. Task 5.2: useMetronomeAudio
3. Task 5.3: useMetronomeVisuals
4. Task 5.4: useMetronomePresets

**Start with Task 5.1**: Create `frontend/src/hooks/useMetronome.ts`

This is the main hook that orchestrates everything. It:
- Manages MetronomeEngine
- Syncs with video player
- Provides controls (toggle, start, stop)

**Important**: This hook receives `playerState` from `useVideoPlayer`. You can mock this for testing.

Let me know when Task 5.1 is working.
```

### Starting Phase 6 (UI Components)

```
Hooks complete! Now let's build the user interface.

**Phase 6 has 3 UI components**:
1. Task 6.1: MetronomeControls (simple controls) - START HERE
2. Task 6.2: MetronomeSettingsPanel (comprehensive settings)
3. Task 6.3: MetronomeOverlay (main container)

**Start with Task 6.1**: Create `frontend/src/components/MetronomeControls.tsx`

This creates the basic controls (toggle button, BPM slider).

**Testing**: Create a test page that renders MetronomeControls with mock props.

Let me know when Task 6.1 renders correctly.
```

### Starting Phase 7 (Integration)

```
UI components complete! Now let's integrate into the VideoPlayer.

**Phase 7 has 1 task**:
Task 7: Integrate MetronomeOverlay into VideoPlayer

**What to do**:
1. Open `frontend/src/components/VideoPlayer.tsx`
2. Import MetronomeOverlay
3. Add MetronomeOverlay as a sibling to the video element
4. Pass playerInstance to it

**Important**: Test that existing VideoPlayer functionality still works!

Let me know when metronome appears in the video player.
```

### Starting Phase 8 (Testing)

```
Integration complete! Now let's add comprehensive tests.

**Phase 8 has 5 testing tasks**:
1. Task 8.1: Unit tests for timing utilities
2. Task 8.2: Unit tests for MetronomeEngine
3. Task 8.3: Component tests for visual effects
4. Task 8.4: Integration tests for hooks
5. Task 8.5: E2E tests for user workflows

Since you don't have a test framework set up, use manual testing from TESTING_GUIDE.md.

**Focus on**:
- Timing accuracy (log beat timestamps)
- Visual effects work correctly
- Audio plays without issues
- Presets save and load
- Video sync works

Let me know when you've completed manual testing.
```

### Starting Phase 9 (Documentation)

```
Testing complete! Final task: User documentation.

**Phase 9 has 1 task**:
Task 9: Create user documentation in `docs/METRONOME.md`

**What to include**:
- Overview of the feature
- How to use basic controls
- Settings panel explanation
- Preset management
- Troubleshooting common issues
- Keyboard shortcuts

Use TASKS.md Task 9 as a template.

Let me know when documentation is complete!
```

---

## Troubleshooting Prompts

If Claude Web gets stuck, use these:

### Compilation Errors

```
I see compilation errors. Let's debug:

1. What's the exact error message?
2. Which file is causing the error?
3. Have you imported all necessary types?
4. Are import paths correct (relative paths)?

Common issues:
- Missing type exports
- Wrong import path (should be relative: '../types/metronome')
- Typo in type name
- Missing React import for .tsx files
```

### Code Not Working

```
Let's debug why it's not working:

1. Are there any errors in the browser console?
2. Have you tested the component/function in isolation?
3. Did you follow the code example from TASKS.md exactly?
4. Have you checked existing code for similar patterns?

Let's add some console.log statements to see what's happening.
```

### Timing Issues

```
Timing issues can be tricky. Let's check:

1. Are you using Web Audio API (not setTimeout)?
2. Is look-ahead scheduling implemented?
3. Log beat timestamps to console:

```javascript
engine.on('beat', (info) => {
  console.log('Beat at:', Date.now(), 'Expected:', info.timestamp * 1000);
});
```

The difference should be <5ms.
```

### Memory Leaks

```
Possible memory leak. Let's fix it:

1. Are you cleaning up in useEffect return?
2. Are event listeners removed on dispose?
3. Are timers cleared?
4. Is AudioContext closed on unmount?

Add this to useEffect:
```typescript
return () => {
  engineRef.current?.dispose();
  // Add any other cleanup
};
```
```

---

## Completion Prompt

```
Congratulations! All tasks complete! 🎉

Let's do a final review:

1. **Functionality check**:
   - [ ] Metronome toggle works
   - [ ] BPM adjustment works in real-time
   - [ ] Visual effects display on beats
   - [ ] Audio plays on beats
   - [ ] Patterns work with different intensities
   - [ ] Presets save and load correctly
   - [ ] Video sync works (play/pause/seek)

2. **Code quality check**:
   - [ ] All TypeScript compiles without errors
   - [ ] No console errors during operation
   - [ ] Code follows CODE_STANDARDS.md
   - [ ] Comments and JSDoc added

3. **Performance check**:
   - [ ] Timing accuracy <±5ms
   - [ ] Visual effects at 60fps
   - [ ] No memory leaks

4. **Documentation check**:
   - [ ] User guide complete (docs/METRONOME.md)
   - [ ] All tasks marked [x] in TASKS.md

Is everything working correctly? If yes, the feature is complete!

If there are any issues, let me know and we'll fix them.
```
