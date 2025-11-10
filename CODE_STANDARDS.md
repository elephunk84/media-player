# Code Standards - Metronome Overlay

> Code style guide for implementing the metronome overlay feature

## Overview

This document defines the code standards for the metronome implementation. Follow these patterns to ensure consistent, maintainable code that matches the existing codebase.

## General Principles

### 1. Follow Existing Patterns

The project already has established patterns. Match them:

**Existing pattern** (from VideoPlayer.tsx):
```typescript
// Import React
import React, { useEffect, useRef } from 'react';

// Import hooks
import { useVideoPlayer } from '../hooks/useVideoPlayer';

// Import types
import type { Video } from '../types/video';

// Import styles
import './VideoPlayer.css';
```

**Your code should follow**:
```typescript
import React, { useEffect, useRef } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import type { MetronomeConfig } from '../types/metronome';
import './MetronomeOverlay.css';
```

### 2. TypeScript First

Everything should be fully typed:
- ✅ All function parameters typed
- ✅ All return types explicit
- ✅ No `any` types (use `unknown` if needed)
- ✅ Proper interface definitions
- ✅ Generic types where appropriate

### 3. Functional Style

Prefer functional programming:
- ✅ Pure functions when possible
- ✅ Immutable data
- ✅ Functional React components (no classes)
- ✅ Custom hooks for reusable logic

## TypeScript Standards

### Interface Naming

Use PascalCase for interfaces:
```typescript
// ✅ Good
interface MetronomeConfig { }
interface BeatInfo { }
interface UseMetronomeReturn { }

// ❌ Bad
interface metronomeConfig { }
interface beat_info { }
interface IMetronomeReturn { }  // Don't use I prefix
```

### Type vs Interface

Use `interface` for object shapes:
```typescript
// ✅ Good
interface MetronomeConfig {
  bpm: number;
  enabled: boolean;
}
```

Use `type` for unions, primitives, and complex types:
```typescript
// ✅ Good
type BeatIntensity = 'light' | 'medium' | 'strong' | 'silent';
type SoundType = 'click' | 'beep' | 'drum' | 'snap' | 'woodblock' | 'custom';
```

### Discriminated Unions

For types that vary by a discriminator:
```typescript
// ✅ Good - Discriminated union
type VisualConfig =
  | { visualStyle: 'flash'; color: string; opacity: number }
  | { visualStyle: 'pulse'; color: string; opacity: number; shape: Shape }
  | { visualStyle: 'border'; color: string; thickness: number }
  | { visualStyle: 'none' };

// Usage with type narrowing
function render(config: VisualConfig) {
  switch (config.visualStyle) {
    case 'pulse':
      // TypeScript knows config.shape exists here
      return <PulseEffect shape={config.shape} />;
    case 'flash':
      // TypeScript knows config.shape does NOT exist
      return <FlashEffect />;
  }
}
```

### Explicit Return Types

Always specify function return types:
```typescript
// ✅ Good
function bpmToMilliseconds(bpm: number): number {
  return (60 / bpm) * 1000;
}

// ❌ Bad
function bpmToMilliseconds(bpm: number) {
  return (60 / bpm) * 1000;
}
```

### Type Imports

Use `type` imports for types:
```typescript
// ✅ Good
import type { MetronomeConfig, BeatInfo } from '../types/metronome';
import { MetronomeEngine } from '../services/metronome/MetronomeEngine';

// ❌ Bad (mixing type and value imports)
import { MetronomeConfig, BeatInfo, MetronomeEngine } from '../services/metronome';
```

## React Standards

### Functional Components

Use function declarations:
```typescript
// ✅ Good
export function MetronomeOverlay(props: MetronomeOverlayProps) {
  return <div>...</div>;
}

// ❌ Bad
export const MetronomeOverlay: React.FC<MetronomeOverlayProps> = (props) => {
  return <div>...</div>;
};
```

### Props Interface

Define props interface above component:
```typescript
// ✅ Good
interface MetronomeControlsProps {
  enabled: boolean;
  bpm: number;
  onToggle: () => void;
  onBPMChange: (bpm: number) => void;
}

export function MetronomeControls(props: MetronomeControlsProps) {
  // Destructure in body
  const { enabled, bpm, onToggle, onBPMChange } = props;
  // ...
}

// Or destructure in parameters
export function MetronomeControls({
  enabled,
  bpm,
  onToggle,
  onBPMChange,
}: MetronomeControlsProps) {
  // ...
}
```

### Hooks

Custom hooks start with `use`:
```typescript
// ✅ Good
export function useMetronome(playerState: UseVideoPlayerReturn) {
  // ...
}

// ❌ Bad
export function metronome(playerState: UseVideoPlayerReturn) {
  // ...
}
```

Hook return type interface:
```typescript
// ✅ Good
export interface UseMetronomeReturn {
  enabled: boolean;
  config: MetronomeConfig;
  toggle: () => void;
  start: () => void;
  stop: () => void;
  updateConfig: (partial: Partial<MetronomeConfig>) => void;
  engineRef: React.MutableRefObject<MetronomeEngine | null>;
}

export function useMetronome(playerState: UseVideoPlayerReturn): UseMetronomeReturn {
  // ...
}
```

### State Management

Use useState for simple state:
```typescript
const [enabled, setEnabled] = useState(false);
const [config, setConfig] = useState<MetronomeConfig>(DEFAULT_CONFIG);
```

Use useReducer for complex state:
```typescript
// If state has many related fields and complex update logic
const [state, dispatch] = useReducer(metronomeReducer, initialState);
```

### useEffect Dependencies

Always list all dependencies:
```typescript
// ✅ Good
useEffect(() => {
  if (config.syncToVideo && playerState.playing) {
    engine.resume();
  }
}, [config.syncToVideo, playerState.playing]); // All dependencies listed

// ❌ Bad
useEffect(() => {
  if (config.syncToVideo && playerState.playing) {
    engine.resume();
  }
}, []); // Missing dependencies
```

Use useCallback for functions passed as props:
```typescript
const handleToggle = useCallback(() => {
  setEnabled(prev => !prev);
}, []); // No dependencies - function is stable
```

### Event Handlers

Name handlers with `handle` prefix:
```typescript
// ✅ Good
function handleToggle() { }
function handleBPMChange(bpm: number) { }
function handlePresetLoad(id: string) { }

// ❌ Bad
function toggle() { }
function onBPMChange(bpm: number) { }
function loadPreset(id: string) { }
```

## Service/Class Standards

### Class Structure

Order class members:
```typescript
export class MetronomeEngine {
  // 1. Private properties
  private audioContext: AudioContext | null = null;
  private schedulerTimer: number | null = null;
  private config: MetronomeConfig | null = null;

  // 2. Constants
  private readonly SCHEDULE_AHEAD_TIME = 0.1;

  // 3. Constructor
  constructor() {
    // ...
  }

  // 4. Public methods
  start(config: MetronomeConfig): void { }
  stop(): void { }

  // 5. Private methods
  private scheduleBeats(): void { }
  private emitBeat(info: BeatInfo): void { }
}
```

### Method Documentation

Document public methods with JSDoc:
```typescript
/**
 * Start the metronome with given configuration
 * @param config - Metronome configuration object
 * @throws {Error} If Web Audio API is not supported
 */
start(config: MetronomeConfig): void {
  // ...
}
```

## Naming Conventions

### Variables

Use camelCase:
```typescript
const currentBeat = 0;
const audioContext = new AudioContext();
const nextBeatTime = 0;
```

### Constants

Use UPPER_SNAKE_CASE:
```typescript
const DEFAULT_BPM = 60;
const MAX_PATTERN_LENGTH = 32;
const SCHEDULE_AHEAD_TIME = 0.1;
```

### Files

Use PascalCase for components/classes:
```
MetronomeEngine.ts
MetronomeOverlay.tsx
FlashEffect.tsx
```

Use camelCase for utilities:
```
timingCalculations.ts
audioLoader.ts
```

### CSS Classes

Use BEM (Block Element Modifier):
```css
/* Block */
.metronome-controls { }

/* Element */
.metronome-controls__toggle { }
.metronome-controls__bpm-slider { }

/* Modifier */
.metronome-controls__toggle--active { }
```

## Error Handling

### Throw Errors for Invalid Input

```typescript
// ✅ Good
function validateBPM(bpm: number): void {
  if (bpm < 30 || bpm > 300) {
    throw new Error(`BPM must be between 30 and 300, got ${bpm}`);
  }
}

// ❌ Bad
function validateBPM(bpm: number): boolean {
  return bpm >= 30 && bpm <= 300;
}
```

### Try-Catch for Expected Errors

```typescript
// ✅ Good
async function loadAudioFile(url: string): Promise<AudioBuffer> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Failed to load audio file:', error);
    throw new Error(`Audio loading failed: ${error.message}`);
  }
}
```

### User-Facing Error Messages

```typescript
// ✅ Good
setError('Failed to load audio file. Please try a different file or sound type.');

// ❌ Bad
setError('decodeAudioData() failed with DOMException: EncodingError');
```

## Comments and Documentation

### JSDoc for Public APIs

```typescript
/**
 * Calculate beat duration with optional randomization
 *
 * @param bpm - Beats per minute (30-300)
 * @param randomization - Percentage of randomization (0-50)
 * @returns Beat duration in milliseconds
 *
 * @example
 * ```typescript
 * calculateBeatDuration(60, 0)    // Returns 1000
 * calculateBeatDuration(60, 20)   // Returns 800-1200
 * ```
 */
export function calculateBeatDuration(bpm: number, randomization: number): number {
  // ...
}
```

### Inline Comments

Use comments sparingly, only when code isn't self-explanatory:
```typescript
// ✅ Good - Explains WHY
// Use look-ahead scheduling to maintain accurate timing
// even when main thread is busy
while (nextBeatTime < currentTime + SCHEDULE_AHEAD_TIME) {
  scheduleBeat();
}

// ❌ Bad - States WHAT (obvious from code)
// Loop while next beat time is less than current time plus schedule ahead time
while (nextBeatTime < currentTime + SCHEDULE_AHEAD_TIME) {
  scheduleBeat();
}
```

### TODO Comments

Format TODOs consistently:
```typescript
// TODO: Add support for custom shapes (star, heart)
// TODO: Optimize beat scheduling for low-power devices
// FIXME: Memory leak when rapidly toggling metronome
```

## CSS Standards

### BEM Naming

```css
/* Block */
.metronome-overlay { }

/* Element */
.metronome-overlay__controls { }
.metronome-overlay__settings-panel { }

/* Modifier */
.metronome-overlay__controls--hidden { }
```

### CSS Custom Properties

Use CSS variables for theming:
```css
.flash-effect {
  background-color: var(--flash-color);
  opacity: var(--flash-opacity);
  transition: opacity var(--flash-duration) ease-out;
}
```

### GPU-Accelerated Properties

Use transform and opacity for animations:
```css
/* ✅ Good - GPU accelerated */
.pulse-effect {
  transform: scale(0.1);
  opacity: 1;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.pulse-effect--active {
  transform: scale(1);
  opacity: 0;
}

/* ❌ Bad - Triggers layout reflow */
.pulse-effect-bad {
  width: 10px;
  height: 10px;
  transition: width 300ms, height 300ms;
}

.pulse-effect-bad--active {
  width: 100px;
  height: 100px;
}
```

## Import Order

Group imports in this order:
```typescript
// 1. React imports
import React, { useState, useEffect, useCallback } from 'react';

// 2. Third-party imports
import videojs from 'video.js';

// 3. Internal hooks
import { useMetronome } from '../hooks/useMetronome';
import { useMetronomeAudio } from '../hooks/useMetronomeAudio';

// 4. Internal components
import { MetronomeControls } from './MetronomeControls';
import { FlashEffect } from './visualEffects/FlashEffect';

// 5. Types (use type imports)
import type { MetronomeConfig, BeatInfo } from '../types/metronome';
import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer';

// 6. Styles
import './MetronomeOverlay.css';
```

## File Structure

Organize files by feature:
```
frontend/src/
├── types/
│   └── metronome.ts           # All metronome types
├── utils/
│   └── metronome/
│       ├── timingCalculations.ts
│       └── audioLoader.ts
├── services/
│   └── metronome/
│       ├── MetronomeEngine.ts
│       ├── AudioScheduler.ts
│       └── PatternManager.ts
├── hooks/
│   ├── useMetronome.ts
│   ├── useMetronomeAudio.ts
│   ├── useMetronomeVisuals.ts
│   └── useMetronomePresets.ts
├── components/
│   ├── MetronomeOverlay.tsx
│   ├── MetronomeOverlay.css
│   ├── MetronomeControls.tsx
│   ├── MetronomeControls.css
│   ├── MetronomeSettingsPanel.tsx
│   ├── MetronomeSettingsPanel.css
│   └── visualEffects/
│       ├── FlashEffect.tsx
│       ├── FlashEffect.css
│       ├── PulseEffect.tsx
│       ├── PulseEffect.css
│       ├── BorderEffect.tsx
│       └── BorderEffect.css
```

## Testing Standards

See `TESTING_GUIDE.md` for detailed testing standards.

Quick reference:
- ✅ Test public APIs, not implementation details
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Arrange-Act-Assert pattern

## Performance Standards

### Avoid Unnecessary Re-renders

```typescript
// ✅ Good - Stable reference
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);

// ❌ Bad - New function every render
const handleClick = () => {
  setCount(count + 1);
};
```

### Memoize Expensive Computations

```typescript
// ✅ Good
const sortedBeats = useMemo(() => {
  return beats.sort((a, b) => a.timestamp - b.timestamp);
}, [beats]);

// ❌ Bad - Sorts on every render
const sortedBeats = beats.sort((a, b) => a.timestamp - b.timestamp);
```

### Debounce Frequent Updates

```typescript
// For BPM slider (updates frequently)
const debouncedUpdateBPM = useMemo(
  () => debounce((bpm: number) => {
    metronome.updateConfig({ bpm });
  }, 100),
  []
);
```

## Accessibility Standards

### ARIA Labels

```typescript
<button
  aria-label="Enable metronome"
  aria-pressed={enabled}
>
  Toggle
</button>

<input
  type="range"
  aria-label="Beats per minute"
  aria-valuemin={30}
  aria-valuemax={300}
  aria-valuenow={bpm}
/>
```

### Keyboard Navigation

```typescript
// Support Escape key to close panels
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && panelOpen) {
      setPanelOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [panelOpen]);
```

### Focus Management

```typescript
// Return focus to trigger button when panel closes
const triggerButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (!panelOpen) {
    triggerButtonRef.current?.focus();
  }
}, [panelOpen]);
```

## Git Commit Standards

Use conventional commits:
```
feat: add metronome timing engine
fix: correct beat scheduling timing drift
refactor: extract audio loading logic to utility
test: add unit tests for timing calculations
docs: update metronome user guide
style: format MetronomeEngine with prettier
```

## Summary Checklist

Before submitting code, verify:

- ✅ TypeScript: All types defined, no `any`
- ✅ Naming: Follows conventions (camelCase, PascalCase, etc.)
- ✅ Comments: JSDoc on public APIs
- ✅ Errors: Handled gracefully with user-friendly messages
- ✅ Hooks: Proper dependencies, cleanup in useEffect
- ✅ Performance: useCallback, useMemo where appropriate
- ✅ Accessibility: ARIA labels, keyboard support
- ✅ Testing: Manual testing passes success criteria
- ✅ Formatting: Consistent indentation and style
- ✅ Imports: Organized and using type imports for types
