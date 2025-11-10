# Testing Guide - Metronome Overlay

> How to test the metronome overlay implementation

## Overview

This guide explains how to test each component of the metronome system. Testing ensures code works correctly and catches regressions early.

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E       │  ← Few, expensive, slow
        │   Tests     │
        ├─────────────┤
        │ Integration │  ← Some, medium cost
        │   Tests     │
        ├─────────────┤
        │    Unit     │  ← Many, cheap, fast
        │   Tests     │
        └─────────────┘
```

**For this project**:
- Many unit tests (utilities, pure functions)
- Some component tests (React components)
- Some integration tests (hooks, services)
- Few E2E tests (critical user flows)

## Manual Testing

For Claude Web (no test framework available), use manual testing:

### 1. Browser Console Testing

Test utilities and services directly in browser console:

**Example: Testing timing calculations**
```javascript
// Open browser console (F12)
// Paste utility functions

function bpmToMilliseconds(bpm) {
  return (60 / bpm) * 1000;
}

// Test
console.log('60 BPM:', bpmToMilliseconds(60)); // Should be 1000
console.log('120 BPM:', bpmToMilliseconds(120)); // Should be 500
console.log('30 BPM:', bpmToMilliseconds(30)); // Should be 2000
```

**Example: Testing MetronomeEngine**
```javascript
// In browser console
const engine = new MetronomeEngine();

let beatCount = 0;
let timestamps = [];

engine.on('beat', (info) => {
  beatCount++;
  timestamps.push(Date.now());
  console.log(`Beat ${beatCount}:`, info);
});

// Start at 60 BPM
engine.start({
  bpm: 60,
  pattern: { beats: ['strong'], length: 1, accentBeat: null },
  // ... other config
});

// After a few beats, check timing
setTimeout(() => {
  const diffs = [];
  for (let i = 1; i < timestamps.length; i++) {
    diffs.push(timestamps[i] - timestamps[i-1]);
  }
  console.log('Average interval:', diffs.reduce((a,b) => a+b) / diffs.length);
  console.log('Should be ~1000ms for 60 BPM');
  engine.stop();
}, 5000);
```

### 2. Component Visual Testing

Create a test page to verify components:

**Create**: `frontend/src/pages/MetronomeTestPage.tsx`
```typescript
import React, { useState } from 'react';
import { FlashEffect } from '../components/visualEffects/FlashEffect';
import { PulseEffect } from '../components/visualEffects/PulseEffect';
import { BorderEffect } from '../components/visualEffects/BorderEffect';

export function MetronomeTestPage() {
  const [showFlash, setShowFlash] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showBorder, setShowBorder] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Metronome Visual Effects Test</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowFlash(true)}>Test Flash</button>
        <button onClick={() => setShowPulse(true)}>Test Pulse</button>
        <button onClick={() => setShowBorder(true)}>Test Border</button>
      </div>

      {showFlash && (
        <FlashEffect
          intensity={1}
          duration={300}
          config={{ color: '#ffffff', opacity: 0.5 }}
          onComplete={() => setShowFlash(false)}
        />
      )}

      {showPulse && (
        <PulseEffect
          intensity={1}
          duration={500}
          config={{
            color: '#ff0000',
            opacity: 0.7,
            size: 30,
            position: { x: 50, y: 50, preset: 'center' },
            shape: 'circle',
          }}
          onComplete={() => setShowPulse(false)}
        />
      )}

      {showBorder && (
        <BorderEffect
          intensity={1}
          duration={400}
          config={{
            color: '#00ff00',
            opacity: 0.8,
            thickness: 10,
          }}
          onComplete={() => setShowBorder(false)}
        />
      )}
    </div>
  );
}
```

**Add route** in your router:
```typescript
<Route path="/test/metronome" element={<MetronomeTestPage />} />
```

**Test visually**:
1. Navigate to `/test/metronome`
2. Click each button
3. Verify effects appear and disappear correctly

### 3. Hook Testing

Test hooks in a simple component:

```typescript
import React from 'react';
import { useMetronome } from '../hooks/useMetronome';
import { useVideoPlayer } from '../hooks/useVideoPlayer';

export function MetronomeHookTest() {
  const player = useVideoPlayer();
  const metronome = useMetronome(player);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Metronome Hook Test</h2>

      <div>
        <p>Enabled: {metronome.enabled ? 'Yes' : 'No'}</p>
        <p>Running: {metronome.isRunning ? 'Yes' : 'No'}</p>
        <p>BPM: {metronome.config.bpm}</p>
        <p>Current Beat: {metronome.currentBeat}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={metronome.toggle}>Toggle</button>
        <button onClick={metronome.start}>Start</button>
        <button onClick={metronome.stop}>Stop</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          BPM:
          <input
            type="range"
            min="30"
            max="300"
            value={metronome.config.bpm}
            onChange={(e) => metronome.updateConfig({ bpm: Number(e.target.value) })}
          />
          {metronome.config.bpm}
        </label>
      </div>
    </div>
  );
}
```

**Test**:
1. Verify state updates when buttons clicked
2. Check BPM slider updates config
3. Watch current beat increment
4. Ensure no errors in console

## Unit Testing (If Using Jest)

If you set up Jest, use these patterns:

### Testing Pure Functions

```typescript
// timingCalculations.test.ts
import {
  bpmToMilliseconds,
  millisecondsToBPM,
  validateBPM,
} from '../timingCalculations';

describe('timingCalculations', () => {
  describe('bpmToMilliseconds', () => {
    it('converts 60 BPM to 1000ms', () => {
      expect(bpmToMilliseconds(60)).toBe(1000);
    });

    it('converts 120 BPM to 500ms', () => {
      expect(bpmToMilliseconds(120)).toBe(500);
    });

    it('throws error for invalid BPM', () => {
      expect(() => bpmToMilliseconds(0)).toThrow();
      expect(() => bpmToMilliseconds(29)).toThrow();
      expect(() => bpmToMilliseconds(301)).toThrow();
    });
  });

  describe('validateBPM', () => {
    it('returns true for valid BPM', () => {
      expect(validateBPM(30)).toBe(true);
      expect(validateBPM(60)).toBe(true);
      expect(validateBPM(300)).toBe(true);
    });

    it('returns false for invalid BPM', () => {
      expect(validateBPM(29)).toBe(false);
      expect(validateBPM(301)).toBe(false);
      expect(validateBPM(0)).toBe(false);
    });
  });
});
```

### Testing Classes

```typescript
// MetronomeEngine.test.ts
import { MetronomeEngine } from '../MetronomeEngine';

describe('MetronomeEngine', () => {
  let engine: MetronomeEngine;

  beforeEach(() => {
    engine = new MetronomeEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it('initializes correctly', () => {
    expect(engine.isRunning()).toBe(false);
    expect(engine.getCurrentBeat()).toBe(0);
  });

  it('starts and emits beat events', (done) => {
    let beatCount = 0;

    engine.on('beat', (info) => {
      beatCount++;
      expect(info.beatNumber).toBeGreaterThanOrEqual(0);
      expect(info.intensity).toBeDefined();

      if (beatCount === 3) {
        engine.stop();
        done();
      }
    });

    engine.start({
      bpm: 120, // Fast for quick test
      pattern: { beats: ['strong'], length: 1, accentBeat: null },
      // ... other config
    });
  });

  it('stops correctly', () => {
    engine.start({ /* config */ });
    expect(engine.isRunning()).toBe(true);

    engine.stop();
    expect(engine.isRunning()).toBe(false);
  });
});
```

### Testing React Components

```typescript
// FlashEffect.test.tsx
import { render, screen } from '@testing-library/react';
import { FlashEffect } from '../FlashEffect';

describe('FlashEffect', () => {
  it('renders with correct styles', () => {
    const { container } = render(
      <FlashEffect
        intensity={0.5}
        duration={300}
        config={{ color: '#ff0000', opacity: 0.5 }}
      />
    );

    const effect = container.querySelector('.flash-effect');
    expect(effect).toBeInTheDocument();

    const styles = window.getComputedStyle(effect!);
    expect(styles.getPropertyValue('--flash-color')).toBe('#ff0000');
  });

  it('calls onComplete after duration', async () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();

    render(
      <FlashEffect
        intensity={1}
        duration={300}
        config={{ color: '#ffffff', opacity: 1 }}
        onComplete={onComplete}
      />
    );

    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(onComplete).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
```

### Testing Hooks

```typescript
// useMetronome.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useMetronome } from '../useMetronome';

describe('useMetronome', () => {
  const mockPlayerState = {
    playing: false,
    currentTime: 0,
    duration: 100,
    playerRef: { current: null },
    // ... other required fields
  };

  it('initializes with default config', () => {
    const { result } = renderHook(() => useMetronome(mockPlayerState));

    expect(result.current.enabled).toBe(false);
    expect(result.current.config.bpm).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it('toggles enabled state', () => {
    const { result } = renderHook(() => useMetronome(mockPlayerState));

    expect(result.current.enabled).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.enabled).toBe(true);
  });

  it('updates BPM', () => {
    const { result } = renderHook(() => useMetronome(mockPlayerState));

    act(() => {
      result.current.updateConfig({ bpm: 120 });
    });

    expect(result.current.config.bpm).toBe(120);
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useMetronome(mockPlayerState));

    const disposeSpy = jest.spyOn(result.current.engineRef.current!, 'dispose');

    unmount();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
```

## Integration Testing

Test how components work together:

### Example: Metronome + Video Player Integration

```typescript
// Manual integration test
export function MetronomeIntegrationTest() {
  const [videoId] = useState(1);

  return (
    <div>
      <h2>Metronome Integration Test</h2>
      <VideoPlayer videoId={videoId} metronomeEnabled={true} />

      <div style={{ marginTop: '20px' }}>
        <h3>Test Checklist:</h3>
        <ul>
          <li>✓ Metronome button appears in video controls</li>
          <li>✓ Click metronome button - settings should appear</li>
          <li>✓ Adjust BPM - beats should update</li>
          <li>✓ Play video - metronome should start</li>
          <li>✓ Pause video - metronome should pause</li>
          <li>✓ Seek video - metronome should resync</li>
          <li>✓ Visual effects appear on beats</li>
          <li>✓ Audio plays on beats (if enabled)</li>
        </ul>
      </div>
    </div>
  );
}
```

## Testing Checklist by Component

### Timing Utilities

- [ ] `bpmToMilliseconds`: 60 BPM = 1000ms, 120 BPM = 500ms
- [ ] `calculateBeatDuration`: Returns value within randomization range
- [ ] `applyTempoChange`: Accelerates/decelerates correctly, respects bounds
- [ ] `validateBPM`: Accepts 30-300, rejects outside range

### MetronomeEngine

- [ ] Initializes without errors
- [ ] Starts and emits beat events
- [ ] Beat timing is accurate (±5ms)
- [ ] Pattern loops correctly
- [ ] BPM changes apply in real-time
- [ ] Pause/resume works
- [ ] Stops cleanly
- [ ] Disposes properly (no memory leaks)

### AudioScheduler

- [ ] Loads built-in sounds
- [ ] Loads custom sounds
- [ ] Plays sounds at correct times
- [ ] Volume control works
- [ ] Master volume applies correctly
- [ ] Handles missing audio buffers gracefully

### Visual Effects

**FlashEffect**:
- [ ] Appears instantly at full opacity
- [ ] Fades out smoothly
- [ ] Color applies correctly
- [ ] Opacity scales with intensity
- [ ] Doesn't block interactions

**PulseEffect**:
- [ ] Starts small, expands
- [ ] Fades out while expanding
- [ ] Shapes render correctly (circle, square, diamond, star)
- [ ] Position is accurate
- [ ] Size scales with intensity

**BorderEffect**:
- [ ] Appears at full thickness
- [ ] Shrinks and fades
- [ ] Color applies correctly
- [ ] Thickness scales with intensity
- [ ] Doesn't affect layout

### Hooks

**useMetronome**:
- [ ] Initializes with default config
- [ ] Toggle changes enabled state
- [ ] Start/stop work correctly
- [ ] Config updates apply
- [ ] Syncs with video player (play/pause/seek)
- [ ] Cleans up on unmount

**useMetronomeAudio**:
- [ ] Initializes AudioScheduler
- [ ] Plays sounds on beats
- [ ] Volume control works
- [ ] Sound type changes apply
- [ ] Custom sound loading works
- [ ] Handles errors gracefully

**useMetronomeVisuals**:
- [ ] Triggers visual effects on beats
- [ ] Clears effects after duration
- [ ] Respects enabled state

**useMetronomePresets**:
- [ ] Loads presets from localStorage
- [ ] Saves new presets
- [ ] Loads existing presets
- [ ] Deletes presets
- [ ] Exports to JSON
- [ ] Imports from JSON
- [ ] Validates imported data
- [ ] Handles storage quota errors

### UI Components

**MetronomeControls**:
- [ ] Toggle button works
- [ ] BPM slider updates config
- [ ] BPM value displays correctly
- [ ] Settings button opens panel
- [ ] Active state shows visually
- [ ] Keyboard accessible

**MetronomeSettingsPanel**:
- [ ] Opens and closes correctly
- [ ] Tabs switch content
- [ ] All settings update config in real-time
- [ ] Pattern editor works
- [ ] Visual controls work
- [ ] Audio controls work
- [ ] Preset management works
- [ ] Close button works
- [ ] Escape key closes panel

**MetronomeOverlay**:
- [ ] Integrates all hooks correctly
- [ ] Visual effects render
- [ ] Controls appear
- [ ] Settings panel toggles
- [ ] Error messages display
- [ ] Doesn't block video controls

### VideoPlayer Integration

- [ ] Metronome button appears
- [ ] Metronome syncs with video playback
- [ ] Metronome pauses when video pauses
- [ ] Metronome resyncs on video seek
- [ ] Existing VideoPlayer features still work
- [ ] No visual glitches or overlaps

## E2E Testing (Manual)

### Scenario 1: First Time User

1. Open video player
2. Click metronome button (in controls)
3. Settings panel should open
4. Default settings visible (60 BPM, flash effect, click sound)
5. Click video to start playback
6. Metronome should start automatically
7. Visual flash should appear on beats
8. Audio click should play (if not muted)

**Expected**: User can enable and use metronome with defaults

### Scenario 2: Adjust BPM

1. Enable metronome (from Scenario 1)
2. Adjust BPM slider to 120
3. Beats should immediately speed up to 2 per second
4. Visual and audio should sync with new BPM

**Expected**: BPM changes apply in real-time

### Scenario 3: Custom Pattern

1. Open settings panel
2. Go to Pattern tab
3. Enable pattern mode
4. Set pattern: [strong, medium, medium, light]
5. Start metronome
6. Observe beat intensities cycle through pattern
7. Visual brightness should vary
8. Audio volume should vary

**Expected**: Custom pattern plays with varying intensities

### Scenario 4: Visual Customization

1. Open settings, go to Visual tab
2. Change effect to "pulse"
3. Change color to red
4. Adjust size to 50%
5. Change position to top-right
6. Start metronome
7. Red pulse should appear in top-right corner

**Expected**: Visual customizations apply correctly

### Scenario 5: Save and Load Preset

1. Configure metronome (BPM 90, pulse effect, drum sound)
2. Go to Presets tab
3. Enter name "Workout"
4. Click Save
5. Preset appears in list
6. Change settings (BPM 60, flash effect, click sound)
7. Click "Workout" preset to load
8. Settings should restore to BPM 90, pulse, drum

**Expected**: Presets save and restore correctly

### Scenario 6: Video Sync

1. Load a video
2. Enable metronome
3. Play video - metronome plays
4. Pause video - metronome pauses
5. Seek to 30 seconds - metronome resyncs
6. Resume video - metronome continues in sync

**Expected**: Metronome stays synchronized with video

### Scenario 7: Error Handling

1. Try to load invalid custom sound file (e.g., .txt file)
2. Error message should display
3. Metronome should continue with previous sound

4. Try to save 51st preset (if possible)
5. Error about storage limit
6. Prompt to delete old presets

**Expected**: Errors handled gracefully with helpful messages

## Performance Testing

### Timing Accuracy

```javascript
// In browser console
const engine = new MetronomeEngine();
const timestamps = [];

engine.on('beat', (info) => {
  timestamps.push(Date.now());
});

engine.start({ bpm: 60, /* ... */ });

// After 10 beats
setTimeout(() => {
  engine.stop();

  // Calculate intervals
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i-1]);
  }

  const avg = intervals.reduce((a,b) => a+b) / intervals.length;
  const deviation = Math.max(...intervals) - Math.min(...intervals);

  console.log('Average interval:', avg, 'ms (expected: 1000ms)');
  console.log('Max deviation:', deviation, 'ms (should be <10ms)');

  // Pass if avg is 995-1005ms and deviation <10ms
}, 11000);
```

**Expected**: Average interval 1000±5ms, max deviation <10ms

### Frame Rate

```javascript
// Check visual effects don't drop frames
let frameCount = 0;
let lastTime = performance.now();

function checkFrameRate() {
  frameCount++;
  const now = performance.now();

  if (now - lastTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastTime = now;
  }

  requestAnimationFrame(checkFrameRate);
}

checkFrameRate();

// Enable metronome with visual effects
// FPS should stay at 60 (or monitor refresh rate)
```

**Expected**: FPS stays at 60 (no drops below 55)

### Memory Leaks

```javascript
// Open Chrome DevTools -> Memory
// Take heap snapshot (Snapshot 1)

// Enable metronome, let run for 30 seconds
// Disable metronome

// Take another snapshot (Snapshot 2)
// Compare snapshots

// Look for:
// - Detached DOM nodes
// - Unreleased event listeners
// - Large arrays/objects not garbage collected
```

**Expected**: Memory returns to near baseline after stopping

## Testing Tips

1. **Test incrementally**: Test each component as you build it

2. **Use console.log**: For debugging timing and state issues

3. **Browser DevTools**:
   - Console for errors
   - Network for audio file loading
   - Performance for timing/FPS
   - Memory for leak detection

4. **Test in multiple browsers**: Chrome, Firefox, Safari, Edge

5. **Test edge cases**:
   - Min/max BPM (30, 300)
   - Min/max pattern length (2, 32)
   - Rapid enable/disable
   - Changing settings during playback

6. **Test error scenarios**:
   - Invalid audio files
   - Storage quota exceeded
   - AudioContext unavailable

## When to Test

- **During development**: Test each component as you build
- **After each task**: Verify success criteria
- **Before integration**: Test components work in isolation
- **After integration**: Test components work together
- **Before marking complete**: Run full test checklist

## Success Criteria

Component is ready when:

1. ✅ Manual tests pass
2. ✅ No console errors
3. ✅ Timing accuracy verified (±5ms)
4. ✅ Visual effects render smoothly (60 FPS)
5. ✅ Audio plays without artifacts
6. ✅ Memory doesn't leak
7. ✅ User experience is smooth
8. ✅ Error handling works

## Next Steps

1. Read this guide completely
2. Set up test pages as you build components
3. Test incrementally, not all at once
4. Document any issues you find
5. Fix issues before moving to next task
