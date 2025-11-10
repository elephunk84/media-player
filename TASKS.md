# Metronome Overlay - Implementation Tasks

> **For Claude Web Implementation**
> This document provides step-by-step tasks for implementing the metronome overlay feature.
> Read `IMPLEMENTATION_GUIDE.md`, `CODE_STANDARDS.md`, and `TESTING_GUIDE.md` before starting.

## Quick Reference

- **Spec Location**: `.spec-workflow/specs/metronome-overlay/`
  - `requirements.md` - Feature requirements and user stories
  - `design.md` - Technical design and architecture
  - `tasks.md` - Original detailed task breakdown
- **Supporting Docs**:
  - `IMPLEMENTATION_GUIDE.md` - How to approach implementation
  - `CODE_STANDARDS.md` - Code style and patterns
  - `TESTING_GUIDE.md` - Testing approach

## Task Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked/Issue

---

## Phase 1: Type Definitions and Foundation

### Task 1.1: Create TypeScript Interfaces
**File**: `frontend/src/types/metronome.ts`

**Objective**: Define all TypeScript interfaces for the metronome system.

**What to implement**:
```typescript
// Core configuration
export interface MetronomeConfig {
  bpm: number; // 30-300
  enabled: boolean;
  pattern: BeatPattern;
  patternEnabled: boolean;
  randomization: number; // 0-50 percentage
  randomizationEnabled: boolean;
  tempoChange: TempoChangeConfig;
  tempoChangeEnabled: boolean;
  audio: AudioConfig;
  visual: VisualConfig;
  syncToVideo: boolean;
  continuousMode: boolean;
}

// Pattern definition
export interface BeatPattern {
  beats: BeatIntensity[];
  length: number; // 2-32
  accentBeat: number | null;
}

export type BeatIntensity = 'light' | 'medium' | 'strong' | 'silent';

// Beat event information
export interface BeatInfo {
  beatNumber: number;
  intensity: BeatIntensity;
  volume: number;
  timestamp: number;
}

// Tempo change configuration
export interface TempoChangeConfig {
  mode: 'accelerate' | 'decelerate' | 'cycle';
  changePerMinute: number;
  minBPM: number;
  maxBPM: number;
  resetOnStop: boolean;
}

// Audio configuration
export interface AudioConfig {
  soundType: SoundType;
  customSoundUrl: string | null;
  masterVolume: number; // 0-1
  muted: boolean;
  volumeVariation: boolean;
  volumeMap: {
    silent: 0;
    light: number;
    medium: number;
    strong: number;
  };
}

export type SoundType = 'click' | 'beep' | 'drum' | 'snap' | 'woodblock' | 'custom';

// Visual configuration (discriminated union)
export interface VisualConfigBase {
  enabled: boolean;
  color: string;
  opacity: number;
}

export type VisualConfig =
  | (VisualConfigBase & {
      visualStyle: 'flash';
    })
  | (VisualConfigBase & {
      visualStyle: 'pulse';
      size: number;
      position: Position;
      shape: Shape;
    })
  | (VisualConfigBase & {
      visualStyle: 'border';
      thickness: number;
    })
  | {
      visualStyle: 'none';
    };

export interface Position {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  preset: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
}

export type Shape = 'circle' | 'square' | 'diamond' | 'star';

// Preset
export interface MetronomePreset {
  id: string;
  name: string;
  description: string | null;
  config: MetronomeConfig;
  createdAt: string;
  updatedAt: string;
}

// Runtime state
export interface MetronomeState {
  initialized: boolean;
  running: boolean;
  currentBeat: number;
  lastBeatTimestamp: number | null;
  error: string | null;
  videoPlaying: boolean;
  videoCurrentTime: number;
}

// Visual effect
export interface BeatEffect {
  intensity: number;
  timestamp: number;
  duration: number;
}
```

**Success criteria**:
- All interfaces compile without errors
- Discriminated unions work (TypeScript narrows types)
- JSDoc comments added
- Exports all types

**Status**: [ ]

---

## Phase 2: Core Timing Engine

### Task 2.1: Timing Calculation Utilities
**File**: `frontend/src/utils/metronome/timingCalculations.ts`

**Objective**: Pure functions for BPM/timing conversions and calculations.

**What to implement**:
```typescript
/**
 * Convert BPM to milliseconds per beat
 * @param bpm - Beats per minute (30-300)
 * @returns Milliseconds per beat
 */
export function bpmToMilliseconds(bpm: number): number {
  if (bpm < 30 || bpm > 300) {
    throw new Error('BPM must be between 30 and 300');
  }
  return (60 / bpm) * 1000;
}

/**
 * Convert milliseconds to BPM
 */
export function millisecondsToBPM(ms: number): number {
  return (60 / ms) * 1000;
}

/**
 * Calculate beat duration with optional randomization
 */
export function calculateBeatDuration(bpm: number, randomization: number): number {
  const baseDuration = bpmToMilliseconds(bpm);
  if (randomization === 0) return baseDuration;

  const variation = baseDuration * (randomization / 100);
  const random = (Math.random() * 2 - 1) * variation;
  return baseDuration + random;
}

/**
 * Apply tempo change based on configuration
 */
export function applyTempoChange(
  currentBPM: number,
  config: TempoChangeConfig,
  elapsedMinutes: number
): number {
  let newBPM = currentBPM;

  switch (config.mode) {
    case 'accelerate':
      newBPM = currentBPM + (config.changePerMinute * elapsedMinutes);
      break;
    case 'decelerate':
      newBPM = currentBPM - (config.changePerMinute * elapsedMinutes);
      break;
    case 'cycle':
      // Oscillate between min and max
      const range = config.maxBPM - config.minBPM;
      const cycles = elapsedMinutes / 2; // Complete cycle every 2 minutes
      const phase = (cycles % 1) * Math.PI * 2;
      newBPM = config.minBPM + (range / 2) * (1 + Math.sin(phase));
      break;
  }

  // Clamp to bounds
  return Math.max(config.minBPM, Math.min(config.maxBPM, newBPM));
}

/**
 * Calculate which beat should be playing at given time
 */
export function calculateBeatFromTime(timeSeconds: number, bpm: number): number {
  const beatsPerSecond = bpm / 60;
  return Math.floor(timeSeconds * beatsPerSecond);
}

/**
 * Validate BPM is in valid range
 */
export function validateBPM(bpm: number): boolean {
  return bpm >= 30 && bpm <= 300;
}
```

**Success criteria**:
- All functions are pure (no side effects)
- Input validation included
- Edge cases handled
- JSDoc comments complete

**Status**: [ ]

---

### Task 2.2: MetronomeEngine Core Class
**File**: `frontend/src/services/metronome/MetronomeEngine.ts`

**Objective**: Core timing engine using Web Audio API with look-ahead scheduling.

**Important notes**:
- This is pure TypeScript (NO React dependencies)
- Use Web Audio API's AudioContext.currentTime for precise scheduling
- Implement look-ahead scheduling (schedule beats 100ms in advance)
- Use setTimeout to check for beats to schedule every 25ms

**What to implement**:
```typescript
import type { MetronomeConfig, BeatInfo, BeatPattern, BeatIntensity } from '../../types/metronome';
import { bpmToMilliseconds, calculateBeatDuration } from '../../utils/metronome/timingCalculations';

type BeatCallback = (info: BeatInfo) => void;

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private schedulerTimer: number | null = null;
  private nextBeatTime: number = 0;
  private currentBeatInPattern: number = 0;
  private config: MetronomeConfig | null = null;
  private beatListeners: BeatCallback[] = [];
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pausedTime: number = 0;

  private readonly SCHEDULE_AHEAD_TIME = 0.1; // Schedule 100ms ahead
  private readonly SCHEDULER_INTERVAL = 25; // Check every 25ms

  constructor() {
    // Initialize AudioContext
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass();
    }
  }

  /**
   * Start the metronome
   */
  start(config: MetronomeConfig): void {
    if (!this.audioContext) {
      throw new Error('Web Audio API not supported');
    }

    this.config = config;
    this.isRunning = true;
    this.isPaused = false;
    this.currentBeatInPattern = 0;
    this.startTime = this.audioContext.currentTime;
    this.nextBeatTime = this.audioContext.currentTime;

    this.scheduleBeats();
  }

  /**
   * Stop the metronome completely
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.currentBeatInPattern = 0;
  }

  /**
   * Pause without resetting state
   */
  pause(): void {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.pausedTime = this.audioContext!.currentTime;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (!this.isPaused || !this.audioContext) return;

    this.isPaused = false;
    const pauseDuration = this.audioContext.currentTime - this.pausedTime;
    this.nextBeatTime += pauseDuration;

    this.scheduleBeats();
  }

  /**
   * Update BPM in real-time
   */
  updateBPM(bpm: number): void {
    if (this.config) {
      this.config.bpm = bpm;
    }
  }

  /**
   * Update pattern
   */
  updatePattern(pattern: BeatPattern): void {
    if (this.config) {
      this.config.pattern = pattern;
    }
  }

  /**
   * Seek to specific beat in pattern
   */
  seekToBeat(beatNumber: number): void {
    if (this.config) {
      this.currentBeatInPattern = beatNumber % this.config.pattern.length;
    }
  }

  /**
   * Subscribe to beat events
   */
  on(event: 'beat', callback: BeatCallback): void {
    if (event === 'beat') {
      this.beatListeners.push(callback);
    }
  }

  /**
   * Unsubscribe from beat events
   */
  off(event: 'beat', callback: BeatCallback): void {
    if (event === 'beat') {
      this.beatListeners = this.beatListeners.filter(cb => cb !== callback);
    }
  }

  /**
   * Get current beat number
   */
  getCurrentBeat(): number {
    return this.currentBeatInPattern;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.stop();
    this.beatListeners = [];
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Core scheduling logic
   */
  private scheduleBeats(): void {
    if (!this.isRunning || this.isPaused || !this.audioContext || !this.config) {
      return;
    }

    const currentTime = this.audioContext.currentTime;

    // Schedule all beats in the next window
    while (this.nextBeatTime < currentTime + this.SCHEDULE_AHEAD_TIME) {
      const beatInfo = this.getNextBeatInfo();

      // Emit beat event (schedule callback to fire at beat time)
      const timeUntilBeat = (beatInfo.timestamp - currentTime) * 1000;
      setTimeout(() => {
        this.emitBeat(beatInfo);
      }, Math.max(0, timeUntilBeat));

      // Calculate next beat time
      const beatDuration = this.config.randomizationEnabled
        ? calculateBeatDuration(this.config.bpm, this.config.randomization)
        : bpmToMilliseconds(this.config.bpm);

      this.nextBeatTime += beatDuration / 1000;
      this.currentBeatInPattern = (this.currentBeatInPattern + 1) % this.config.pattern.length;
    }

    // Schedule next check
    this.schedulerTimer = window.setTimeout(
      () => this.scheduleBeats(),
      this.SCHEDULER_INTERVAL
    );
  }

  /**
   * Get next beat information
   */
  private getNextBeatInfo(): BeatInfo {
    if (!this.config) {
      throw new Error('Config not set');
    }

    const pattern = this.config.pattern;
    const intensity = this.config.patternEnabled
      ? pattern.beats[this.currentBeatInPattern]
      : 'strong';

    // Apply accent if this is the accent beat
    const isAccent = pattern.accentBeat === this.currentBeatInPattern + 1;
    const finalIntensity = isAccent ? this.boostIntensity(intensity) : intensity;

    // Calculate volume from intensity
    const volume = this.intensityToVolume(finalIntensity);

    return {
      beatNumber: this.currentBeatInPattern,
      intensity: finalIntensity,
      volume,
      timestamp: this.nextBeatTime,
    };
  }

  /**
   * Boost intensity for accent
   */
  private boostIntensity(intensity: BeatIntensity): BeatIntensity {
    switch (intensity) {
      case 'light': return 'medium';
      case 'medium': return 'strong';
      case 'strong': return 'strong';
      case 'silent': return 'silent';
    }
  }

  /**
   * Convert intensity to volume
   */
  private intensityToVolume(intensity: BeatIntensity): number {
    if (!this.config?.audio.volumeVariation) return 1;

    const volumeMap = this.config.audio.volumeMap;
    switch (intensity) {
      case 'silent': return 0;
      case 'light': return volumeMap.light;
      case 'medium': return volumeMap.medium;
      case 'strong': return volumeMap.strong;
    }
  }

  /**
   * Emit beat event to all listeners
   */
  private emitBeat(beatInfo: BeatInfo): void {
    this.beatListeners.forEach(callback => callback(beatInfo));
  }
}
```

**Success criteria**:
- Engine maintains <±5ms timing accuracy (test with console timestamps)
- Beat events fire at correct intervals
- Patterns loop correctly
- BPM changes apply smoothly during playback
- Proper cleanup on dispose (no memory leaks)

**Status**: [ ]

---

### Task 2.3: PatternManager Service
**File**: `frontend/src/services/metronome/PatternManager.ts`

**Objective**: Validate and process beat patterns.

**What to implement**:
```typescript
import type { BeatPattern, BeatIntensity, AudioConfig } from '../../types/metronome';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class PatternManager {
  /**
   * Validate pattern structure
   */
  validatePattern(pattern: BeatPattern): ValidationResult {
    const errors: string[] = [];

    if (pattern.length < 2 || pattern.length > 32) {
      errors.push('Pattern length must be between 2 and 32');
    }

    if (pattern.beats.length !== pattern.length) {
      errors.push('Beats array length must match pattern length');
    }

    const validIntensities: BeatIntensity[] = ['light', 'medium', 'strong', 'silent'];
    pattern.beats.forEach((beat, index) => {
      if (!validIntensities.includes(beat)) {
        errors.push(`Invalid intensity at position ${index}: ${beat}`);
      }
    });

    if (pattern.accentBeat !== null) {
      if (pattern.accentBeat < 1 || pattern.accentBeat > pattern.length) {
        errors.push('Accent beat must be between 1 and pattern length');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get volume for intensity
   */
  getIntensityVolume(intensity: BeatIntensity, volumeMap: AudioConfig['volumeMap']): number {
    switch (intensity) {
      case 'silent': return 0;
      case 'light': return volumeMap.light;
      case 'medium': return volumeMap.medium;
      case 'strong': return volumeMap.strong;
    }
  }

  /**
   * Apply accent boost to intensity
   */
  applyAccent(intensity: BeatIntensity, isAccent: boolean): BeatIntensity {
    if (!isAccent || intensity === 'silent') return intensity;

    switch (intensity) {
      case 'light': return 'medium';
      case 'medium': return 'strong';
      case 'strong': return 'strong';
      default: return intensity;
    }
  }
}
```

**Success criteria**:
- Validation catches all invalid patterns
- Intensity to volume mapping works correctly
- Accent boost logic accurate

**Status**: [ ]

---

## Phase 3: Audio System

### Task 3.1: Audio File Loader Utility
**File**: `frontend/src/utils/metronome/audioLoader.ts`

**Objective**: Load and validate audio files.

**Note**: You'll need to create simple audio files in `public/sounds/`. For now, you can create silent placeholders or use free sound libraries.

**What to implement**:
```typescript
import type { SoundType } from '../../types/metronome';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Load audio buffer from URL
 */
export async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Load custom audio file
 */
export async function loadCustomAudioFile(
  audioContext: AudioContext,
  file: File
): Promise<{ buffer: AudioBuffer; dataUrl: string }> {
  // Validate first
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Read file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create data URL for storage
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return { buffer, dataUrl };
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): ValidationResult {
  const errors: string[] = [];

  const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
  if (!validTypes.includes(file.type)) {
    errors.push('File must be WAV, MP3, or OGG format');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('File size must be under 5MB');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get built-in sound URL
 */
export function getBuiltInSoundUrl(soundType: SoundType): string {
  const baseUrl = '/sounds/';
  switch (soundType) {
    case 'click': return `${baseUrl}click.wav`;
    case 'beep': return `${baseUrl}beep.wav`;
    case 'drum': return `${baseUrl}drum.wav`;
    case 'snap': return `${baseUrl}snap.wav`;
    case 'woodblock': return `${baseUrl}woodblock.wav`;
    case 'custom': return ''; // Custom handled separately
  }
}
```

**Success criteria**:
- Audio files load correctly
- Validation catches invalid files
- Data URLs generated for persistence
- Error handling is clear

**Status**: [ ]

---

### Task 3.2: AudioScheduler Class
**File**: `frontend/src/services/metronome/AudioScheduler.ts`

**Objective**: Play metronome sounds with precise timing.

**What to implement**:
```typescript
import type { SoundType } from '../../types/metronome';
import { loadAudioBuffer, loadCustomAudioFile, getBuiltInSoundUrl } from '../../utils/metronome/audioLoader';

export class AudioScheduler {
  private audioContext: AudioContext;
  private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
  private masterGain: GainNode;
  private currentSoundType: SoundType = 'click';

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create master gain node
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);
    this.masterGain.gain.value = 0.7;
  }

  /**
   * Load built-in sound
   */
  async loadSound(soundType: SoundType): Promise<void> {
    if (soundType === 'custom') return; // Custom handled separately

    const url = getBuiltInSoundUrl(soundType);
    const buffer = await loadAudioBuffer(this.audioContext, url);
    this.audioBuffers.set(soundType, buffer);
    this.currentSoundType = soundType;
  }

  /**
   * Load custom sound file
   */
  async loadCustomSound(file: File): Promise<string> {
    const { buffer, dataUrl } = await loadCustomAudioFile(this.audioContext, file);
    this.audioBuffers.set('custom', buffer);
    this.currentSoundType = 'custom';
    return dataUrl;
  }

  /**
   * Play a beat
   */
  playBeat(intensity: number, volume: number, time: number): void {
    const buffer = this.audioBuffers.get(this.currentSoundType);
    if (!buffer) {
      console.warn('Audio buffer not loaded for', this.currentSoundType);
      return;
    }

    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Create gain node for this beat
    const gainNode = this.audioContext.createGain();
    const finalVolume = intensity * volume;
    gainNode.gain.value = finalVolume;

    // Connect: source -> gain -> masterGain -> destination
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Schedule playback
    source.start(time);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  /**
   * Set sound type
   */
  setSoundType(soundType: SoundType): void {
    this.currentSoundType = soundType;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.audioBuffers.clear();
    this.masterGain.disconnect();
  }
}
```

**Success criteria**:
- Sounds play with precise timing
- Volume control works correctly
- Custom sounds load successfully
- No audio artifacts or clicks

**Status**: [ ]

---

## Phase 4: Visual Effects System

### Task 4.1: FlashEffect Component
**File**: `frontend/src/components/visualEffects/FlashEffect.tsx`

**Objective**: Full-screen flash effect.

**What to implement**:
```typescript
import React, { useEffect, useState } from 'react';
import './FlashEffect.css';

interface FlashEffectProps {
  intensity: number;
  duration: number;
  config: {
    color: string;
    opacity: number;
  };
  onComplete?: () => void;
}

export function FlashEffect({ intensity, duration, config, onComplete }: FlashEffectProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    setActive(true);

    const timer = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const finalOpacity = config.opacity * intensity;

  return (
    <div
      className={`flash-effect ${active ? 'flash-effect--active' : ''}`}
      style={{
        ['--flash-color' as any]: config.color,
        ['--flash-opacity' as any]: finalOpacity,
        ['--flash-duration' as any]: `${duration}ms`,
      }}
    />
  );
}
```

**CSS File**: `frontend/src/components/visualEffects/FlashEffect.css`
```css
.flash-effect {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--flash-color);
  opacity: 0;
  pointer-events: none;
  z-index: 9999;
  transition: opacity var(--flash-duration) ease-out;
}

.flash-effect--active {
  opacity: var(--flash-opacity);
  transition: none;
}
```

**Success criteria**:
- Flash appears instantly at full opacity
- Fades out smoothly over duration
- Doesn't block interactions (pointer-events: none)
- Intensity affects brightness correctly

**Status**: [ ]

---

### Task 4.2: PulseEffect Component
**File**: `frontend/src/components/visualEffects/PulseEffect.tsx`

**Objective**: Expanding/contracting shape effect.

**What to implement**:
```typescript
import React, { useEffect, useState } from 'react';
import './PulseEffect.css';

interface PulseEffectProps {
  intensity: number;
  duration: number;
  config: {
    color: string;
    opacity: number;
    size: number;
    position: { x: number; y: number };
    shape: 'circle' | 'square' | 'diamond' | 'star';
  };
  onComplete?: () => void;
}

export function PulseEffect({ intensity, duration, config, onComplete }: PulseEffectProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    setActive(true);

    const timer = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const finalSize = config.size * (1 + intensity * 0.5);

  return (
    <div
      className={`pulse-effect pulse-effect--${config.shape} ${active ? 'pulse-effect--active' : ''}`}
      style={{
        ['--pulse-color' as any]: config.color,
        ['--pulse-opacity' as any]: config.opacity * intensity,
        ['--pulse-size' as any]: `${finalSize}vh`,
        ['--pulse-duration' as any]: `${duration}ms`,
        left: `${config.position.x}%`,
        top: `${config.position.y}%`,
      }}
    />
  );
}
```

**CSS File**: `frontend/src/components/visualEffects/PulseEffect.css`
```css
.pulse-effect {
  position: fixed;
  width: 10vh;
  height: 10vh;
  background-color: var(--pulse-color);
  opacity: var(--pulse-opacity);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%) scale(0.1);
  transition: transform var(--pulse-duration) ease-out,
              opacity var(--pulse-duration) ease-out;
}

.pulse-effect--active {
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
}

.pulse-effect--circle {
  border-radius: 50%;
}

.pulse-effect--square {
  border-radius: 0;
}

.pulse-effect--diamond {
  transform: translate(-50%, -50%) rotate(45deg) scale(0.1);
}

.pulse-effect--diamond.pulse-effect--active {
  transform: translate(-50%, -50%) rotate(45deg) scale(1);
}

.pulse-effect--star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
```

**Success criteria**:
- Pulse expands smoothly from center
- Fades out correctly
- Shape renders properly
- Position is accurate

**Status**: [ ]

---

### Task 4.3: BorderEffect Component
**File**: `frontend/src/components/visualEffects/BorderEffect.tsx`

**Objective**: Border highlight around video.

**What to implement**:
```typescript
import React, { useEffect, useState } from 'react';
import './BorderEffect.css';

interface BorderEffectProps {
  intensity: number;
  duration: number;
  config: {
    color: string;
    opacity: number;
    thickness: number;
  };
  onComplete?: () => void;
}

export function BorderEffect({ intensity, duration, config, onComplete }: BorderEffectProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    setActive(true);

    const timer = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const finalThickness = config.thickness * (1 + intensity);

  return (
    <div
      className={`border-effect ${active ? 'border-effect--active' : ''}`}
      style={{
        ['--border-color' as any]: config.color,
        ['--border-opacity' as any]: config.opacity * intensity,
        ['--border-thickness' as any]: `${finalThickness}px`,
        ['--border-duration' as any]: `${duration}ms`,
      }}
    />
  );
}
```

**CSS File**: `frontend/src/components/visualEffects/BorderEffect.css`
```css
.border-effect {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border: var(--border-thickness) solid var(--border-color);
  opacity: var(--border-opacity);
  pointer-events: none;
  z-index: 9999;
  box-sizing: border-box;
  transition: opacity var(--border-duration) ease-out,
              border-width var(--border-duration) ease-out;
}

.border-effect--active {
  opacity: 0;
  border-width: 0;
}
```

**Success criteria**:
- Border appears at full thickness
- Shrinks and fades smoothly
- Doesn't affect layout
- Intensity affects thickness

**Status**: [ ]

---

### Task 4.4: VisualEffectRenderer Component
**File**: `frontend/src/components/MetronomeVisualEffects.tsx`

**Objective**: Factory component to render correct visual effect.

**What to implement**:
```typescript
import React from 'react';
import { FlashEffect } from './visualEffects/FlashEffect';
import { PulseEffect } from './visualEffects/PulseEffect';
import { BorderEffect } from './visualEffects/BorderEffect';
import type { BeatEffect, VisualConfig } from '../types/metronome';

interface VisualEffectRendererProps {
  effect: BeatEffect | null;
  config: VisualConfig;
}

export function VisualEffectRenderer({ effect, config }: VisualEffectRendererProps) {
  if (!effect || config.visualStyle === 'none') {
    return null;
  }

  switch (config.visualStyle) {
    case 'flash':
      return (
        <FlashEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{ color: config.color, opacity: config.opacity }}
        />
      );

    case 'pulse':
      return (
        <PulseEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{
            color: config.color,
            opacity: config.opacity,
            size: config.size,
            position: config.position,
            shape: config.shape,
          }}
        />
      );

    case 'border':
      return (
        <BorderEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{
            color: config.color,
            opacity: config.opacity,
            thickness: config.thickness,
          }}
        />
      );

    default:
      return null;
  }
}
```

**Success criteria**:
- Correct effect renders for each style
- TypeScript prevents missing cases
- Null handling works properly

**Status**: [ ]

---

## Continue to Next Document

**This file is getting long. Continue to:**
- Tasks for Phase 5-9 are detailed in the original `.spec-workflow/specs/metronome-overlay/tasks.md`
- Or create individual phase task files

**For Claude Web**: You can now start implementing these tasks in order. Each task has:
- Clear file path
- Complete code examples
- Success criteria
- All necessary imports and dependencies

**Next Steps**:
1. Read `IMPLEMENTATION_GUIDE.md` for workflow
2. Read `CODE_STANDARDS.md` for code style
3. Start with Task 1.1 (TypeScript interfaces)
4. Test each task before moving to next
5. Mark status as you complete: `[x]`

---

## Quick Task Reference

**Phase 1**: Types (1 task)
**Phase 2**: Engine (3 tasks)
**Phase 3**: Audio (2 tasks)
**Phase 4**: Visuals (4 tasks)
**Phase 5**: Hooks (4 tasks) - See tasks.md
**Phase 6**: UI (3 tasks) - See tasks.md
**Phase 7**: Integration (1 task) - See tasks.md
**Phase 8**: Testing (5 tasks) - See tasks.md
**Phase 9**: Documentation (1 task) - See tasks.md

Total: 24 tasks across 9 phases
