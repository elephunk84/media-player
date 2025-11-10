# Tasks Document

## Phase 1: Type Definitions and Data Models

- [x] 1. Create metronome TypeScript interfaces
  - File: `frontend/src/types/metronome.ts`
  - Define all TypeScript interfaces for metronome configuration, patterns, audio, visual, and presets
  - Create discriminated unions for visual config types
  - Purpose: Establish type safety for entire metronome system
  - _Leverage: `frontend/src/types/video.ts` for naming conventions and patterns
  - _Requirements: REQ-1 (Basic Metronome), REQ-3 (Patterns), REQ-5 (Visual), REQ-6 (Audio), REQ-8 (Presets)
  - _Prompt:
    ```
    Role: TypeScript Developer specializing in type systems and interfaces

    Task: Create comprehensive TypeScript interfaces in frontend/src/types/metronome.ts for the metronome overlay system. You need to implement interfaces for:

    1. MetronomeConfig - Main configuration interface with:
       - bpm (number, 30-300 range)
       - enabled (boolean)
       - pattern settings (BeatPattern interface)
       - randomization settings (number 0-50)
       - tempo change settings (TempoChangeConfig interface)
       - audio settings (AudioConfig interface)
       - visual settings (VisualConfig interface)
       - sync options (syncToVideo, continuousMode booleans)

    2. BeatPattern - Pattern definition with:
       - beats array of BeatIntensity type ('light' | 'medium' | 'strong' | 'silent')
       - length (number 2-32)
       - accentBeat (number | null)

    3. BeatInfo - Internal beat information with:
       - beatNumber, intensity, volume, timestamp

    4. TempoChangeConfig - Tempo change configuration with:
       - mode ('accelerate' | 'decelerate' | 'cycle')
       - changePerMinute, minBPM, maxBPM, resetOnStop

    5. AudioConfig - Audio settings with:
       - soundType ('click' | 'beep' | 'drum' | 'snap' | 'woodblock' | 'custom')
       - customSoundUrl, masterVolume, muted
       - volumeVariation and volumeMap for intensity-based volumes

    6. VisualConfig - Visual settings using discriminated unions:
       - Common: enabled, color, opacity
       - Style-specific: visualStyle as discriminator
       - Different properties for 'flash', 'pulse', 'border', 'none'

    7. Position - Position configuration with preset or custom x/y

    8. MetronomePreset - Saved preset with id, name, description, config, timestamps

    9. MetronomeState - Runtime state tracking

    Restrictions:
    - Must use exact type names specified above
    - Follow existing patterns from frontend/src/types/video.ts
    - Use discriminated unions for VisualConfig to enable type narrowing
    - Add JSDoc comments for all interfaces and properties
    - Export all interfaces

    Success: All interfaces compile without errors, discriminated unions enable proper type narrowing, comprehensive JSDoc documentation, follows project type conventions
    ```

## Phase 2: Core Timing Engine

- [x] 2.1. Create timing calculation utilities
  - File: `frontend/src/utils/metronome/timingCalculations.ts`
  - Implement pure functions for BPM↔milliseconds conversion, beat duration with randomization, tempo changes
  - Purpose: Provide math utilities for timing engine
  - _Leverage: None (foundational utility)
  - _Requirements: REQ-1 (Basic Metronome), REQ-4 (Timing Controls)
  - _Prompt:
    ```
    Role: Software Engineer specializing in timing algorithms and mathematics

    Task: Create timing calculation utilities in frontend/src/utils/metronome/timingCalculations.ts. Implement these pure functions:

    1. bpmToMilliseconds(bpm: number): number
       - Convert BPM to milliseconds per beat
       - Formula: (60 / bpm) * 1000
       - Validate BPM range 30-300

    2. millisecondsToBPM(ms: number): number
       - Convert milliseconds to BPM
       - Inverse of above formula

    3. calculateBeatDuration(bpm: number, randomization: number): number
       - Calculate beat duration with optional randomization
       - randomization is percentage (0-50)
       - Apply random variation within ±randomization%

    4. applyTempoChange(currentBPM: number, config: TempoChangeConfig, elapsedMinutes: number): number
       - Calculate new BPM based on tempo change config
       - Handle accelerate/decelerate/cycle modes
       - Respect minBPM and maxBPM bounds
       - For cycle mode: oscillate between min and max

    5. calculateBeatFromTime(timeSeconds: number, bpm: number): number
       - Calculate which beat number should be playing at given time
       - Used for video seek synchronization

    6. validateBPM(bpm: number): boolean
       - Validate BPM is in range 30-300

    Restrictions:
    - All functions must be pure (no side effects)
    - Add input validation for all parameters
    - Include unit test examples in JSDoc comments
    - Handle edge cases (division by zero, negative values)
    - Use precise floating-point math

    Leverage: Import types from frontend/src/types/metronome.ts

    Success: All functions are pure and testable, comprehensive input validation, JSDoc with examples, handles edge cases gracefully
    ```

- [x] 2.2. Create MetronomeEngine core class
  - File: `frontend/src/services/metronome/MetronomeEngine.ts`
  - Implement core timing engine using Web Audio API with look-ahead scheduling
  - Add event emitter for beat notifications
  - Purpose: Provide high-precision beat timing independent of React
  - _Leverage: `frontend/src/utils/metronome/timingCalculations.ts`
  - _Requirements: REQ-1 (Basic Metronome), REQ-3 (Patterns), REQ-10 (Performance)
  - _Prompt:
    ```
    Role: Senior JavaScript Developer with expertise in Web Audio API and timing systems

    Task: Create MetronomeEngine class in frontend/src/services/metronome/MetronomeEngine.ts using Web Audio API for precise timing. This is pure TypeScript with NO React dependencies.

    Architecture:
    - Use look-ahead scheduling pattern: schedule beats ~100ms in advance
    - Use AudioContext.currentTime for sample-accurate scheduling
    - Use setTimeout to wake scheduler every 25ms to check for beats to schedule
    - Emit 'beat' events when beats occur

    Class structure:

    ```typescript
    export class MetronomeEngine {
      private audioContext: AudioContext | null = null;
      private schedulerTimer: number | null = null;
      private nextBeatTime: number = 0;
      private currentBeatInPattern: number = 0;
      private config: MetronomeConfig | null = null;
      private beatListeners: Array<(info: BeatInfo) => void> = [];
      private isRunning: boolean = false;

      constructor() {
        // Initialize AudioContext (handle prefixes for Safari)
      }

      start(config: MetronomeConfig): void {
        // Start the metronome with given config
        // Initialize audioContext if needed
        // Set up first beat time
        // Start scheduler loop
      }

      stop(): void {
        // Stop metronome completely
        // Clear scheduler timer
        // Reset state
      }

      pause(): void {
        // Pause without resetting state
      }

      resume(): void {
        // Resume from pause
      }

      updateBPM(bpm: number): void {
        // Update BPM in real-time
        // Recalculate next beat timing
      }

      updatePattern(pattern: BeatPattern): void {
        // Update pattern configuration
      }

      seekToBeat(beatNumber: number): void {
        // Jump to specific beat in pattern
        // Used for video seek synchronization
      }

      on(event: 'beat', callback: (info: BeatInfo) => void): void {
        // Subscribe to beat events
      }

      off(event: 'beat', callback: (info: BeatInfo) => void): void {
        // Unsubscribe from beat events
      }

      getCurrentBeat(): number {
        // Get current beat number in pattern
      }

      dispose(): void {
        // Clean up resources
        // Close AudioContext
        // Clear all listeners
      }

      private scheduleBeats(): void {
        // Core scheduling logic
        // Schedule all beats in next 100ms window
        // Calculate which beat in pattern
        // Get intensity from pattern
        // Emit beat event at correct time
        // Schedule next check
      }

      private getNextBeatInfo(): BeatInfo {
        // Calculate next beat information
        // Get intensity from pattern array
        // Apply randomization if enabled
        // Apply tempo changes if enabled
      }
    }
    ```

    Key implementation details:
    1. Use `const AudioContextClass = window.AudioContext || window.webkitAudioContext` for Safari
    2. In scheduleBeats(), schedule all beats where `nextBeatTime < audioContext.currentTime + 0.1`
    3. Emit beat events using setTimeout aligned to Web Audio clock
    4. Track beat position in pattern, wrap around when reaching pattern.length
    5. Apply randomization from timingCalculations.calculateBeatDuration
    6. Handle tempo changes by recalculating intervals

    Restrictions:
    - NO React dependencies (must be pure TypeScript)
    - Must maintain <±5ms timing accuracy
    - Must gracefully handle AudioContext suspension (page backgrounded)
    - Validate all config inputs
    - Dispose properly to prevent memory leaks

    Leverage:
    - Import timing utilities from frontend/src/utils/metronome/timingCalculations.ts
    - Import types from frontend/src/types/metronome.ts

    Success: Engine maintains sub-5ms timing accuracy, beat events fire precisely, patterns loop correctly, BPM changes apply smoothly, proper resource cleanup on dispose
    ```

- [x] 2.3. Create PatternManager service
  - File: `frontend/src/services/metronome/PatternManager.ts`
  - Implement pattern validation, beat sequence calculation, intensity mapping
  - Purpose: Process and validate beat patterns
  - _Leverage: `frontend/src/utils/metronome/timingCalculations.ts`
  - _Requirements: REQ-3 (Pattern Customization)
  - _Prompt:
    ```
    Role: Software Engineer with expertise in sequence processing and validation

    Task: Create PatternManager class in frontend/src/services/metronome/PatternManager.ts for pattern validation and processing.

    Implement these methods:

    ```typescript
    export class PatternManager {
      validatePattern(pattern: BeatPattern): ValidationResult {
        // Validate pattern structure
        // Check length is 2-32
        // Check all beats are valid intensities
        // Check accentBeat is within bounds
        // Return { valid: boolean, errors: string[] }
      }

      calculateNextBeat(currentBeat: number, pattern: BeatPattern): BeatInfo {
        // Calculate next beat information in sequence
        // Wrap around at pattern.length
        // Apply accent if currentBeat === pattern.accentBeat
        // Return beat info with intensity from pattern
      }

      getIntensityVolume(intensity: BeatIntensity, volumeMap: AudioConfig['volumeMap']): number {
        // Map intensity to volume using volumeMap
        // 'silent' -> 0
        // 'light' -> volumeMap.light (default 0.25)
        // 'medium' -> volumeMap.medium (default 0.5)
        // 'strong' -> volumeMap.strong (default 1.0)
      }

      applyAccent(intensity: BeatIntensity, isAccent: boolean): BeatIntensity {
        // Boost intensity if isAccent is true
        // 'light' -> 'medium', 'medium' -> 'strong', 'strong' -> 'strong'
        // 'silent' remains 'silent'
      }
    }

    interface ValidationResult {
      valid: boolean;
      errors: string[];
    }
    ```

    Restrictions:
    - All methods must be synchronous
    - Provide clear error messages in validation
    - Handle edge cases (empty pattern, null values)
    - No side effects (pure logic)

    Leverage:
    - Import types from frontend/src/types/metronome.ts
    - Use timing utilities if needed

    Success: Pattern validation catches all invalid cases, beat calculation handles wrapping correctly, intensity mapping is accurate, accent boost works properly
    ```

## Phase 3: Audio System

- [x] 3.1. Create audio file loader utility
  - File: `frontend/src/utils/metronome/audioLoader.ts`
  - Implement functions to load built-in and custom audio files into AudioBuffer
  - Purpose: Handle audio file loading and validation
  - _Leverage: Web Audio API
  - _Requirements: REQ-6 (Audio Customization)
  - _Prompt:
    ```
    Role: Frontend Developer with expertise in Web Audio API and file handling

    Task: Create audio loading utilities in frontend/src/utils/metronome/audioLoader.ts.

    Implement these functions:

    ```typescript
    export async function loadAudioBuffer(
      audioContext: AudioContext,
      url: string
    ): Promise<AudioBuffer> {
      // Fetch audio file from URL
      // Convert to ArrayBuffer
      // Decode using audioContext.decodeAudioData()
      // Return AudioBuffer
      // Throw error if loading fails
    }

    export async function loadCustomAudioFile(
      audioContext: AudioContext,
      file: File
    ): Promise<{ buffer: AudioBuffer; dataUrl: string }> {
      // Validate file type (audio/wav, audio/mp3, audio/ogg)
      // Validate file size (<5MB)
      // Read file as ArrayBuffer
      // Decode to AudioBuffer
      // Create data URL for storage
      // Return both buffer and data URL
    }

    export function validateAudioFile(file: File): ValidationResult {
      // Check file type is audio/wav, audio/mp3, or audio/ogg
      // Check file size is under 5MB
      // Return validation result with errors
    }

    export function getBuiltInSoundUrl(soundType: SoundType): string {
      // Map sound type to asset URL
      // Return path to built-in sound file
      // Sound files should be in public/sounds/ directory
    }

    interface ValidationResult {
      valid: boolean;
      errors: string[];
    }
    ```

    Built-in sound files (create these as simple sine/square wave samples):
    - public/sounds/click.wav
    - public/sounds/beep.wav
    - public/sounds/drum.wav
    - public/sounds/snap.wav
    - public/sounds/woodblock.wav

    Restrictions:
    - Handle all error cases gracefully
    - Provide user-friendly error messages
    - Validate before processing
    - Clean up resources on errors

    Leverage: Web Audio API decodeAudioData, FileReader API

    Success: Audio files load correctly, custom files validated properly, errors handled gracefully, data URLs generated for persistence
    ```

- [x] 3.2. Create AudioScheduler class
  - File: `frontend/src/services/metronome/AudioScheduler.ts`
  - Implement audio playback using Web Audio API with volume control per beat
  - Purpose: Play metronome sounds with precise timing
  - _Leverage: `frontend/src/utils/metronome/audioLoader.ts`
  - _Requirements: REQ-6 (Audio Customization)
  - _Prompt:
    ```
    Role: Audio Engineer with expertise in Web Audio API and real-time audio playback

    Task: Create AudioScheduler class in frontend/src/services/metronome/AudioScheduler.ts for precise audio playback.

    Class structure:

    ```typescript
    export class AudioScheduler {
      private audioContext: AudioContext;
      private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
      private masterGain: GainNode;
      private currentSoundType: SoundType = 'click';

      constructor(audioContext: AudioContext) {
        // Store audio context
        // Create master gain node
        // Connect gain to destination
      }

      async loadSound(soundType: SoundType): Promise<void> {
        // Load built-in sound using audioLoader
        // Store in audioBuffers map
        // Set as currentSoundType
      }

      async loadCustomSound(file: File): Promise<string> {
        // Validate file using audioLoader
        // Load file to buffer using audioLoader
        // Store in audioBuffers with 'custom' key
        // Return data URL for persistence
      }

      playBeat(intensity: number, volume: number, time: number): void {
        // Create AudioBufferSourceNode
        // Load buffer for currentSoundType
        // Create gain node for this beat
        // Set gain to (intensity * volume * masterGain)
        // Connect: source -> gain -> masterGain -> destination
        // Schedule start(time) on source node
        // Auto-disconnect when finished
      }

      setMasterVolume(volume: number): void {
        // Update masterGain.gain.value
        // Clamp to 0-1 range
      }

      getMasterVolume(): number {
        // Return masterGain.gain.value
      }

      setSoundType(soundType: SoundType): void {
        // Update currentSoundType
        // Load sound if not already loaded
      }

      dispose(): void {
        // Clear all buffers
        // Disconnect gain node
      }
    }
    ```

    Key implementation details:
    1. Use AudioBufferSourceNode for each beat (create new node each time)
    2. Schedule playback using source.start(time) with AudioContext.currentTime
    3. Apply volume as: beatVolume = intensity * volume * masterVolume
    4. Use gain nodes for volume control (smoother than buffer manipulation)
    5. Pre-load all built-in sounds on initialization for zero-latency playback

    Restrictions:
    - Must not block on audio loading (use async/await)
    - Handle missing audio buffers gracefully
    - Dispose of source nodes after playback
    - Validate all volume inputs (0-1 range)

    Leverage:
    - Import audioLoader functions from frontend/src/utils/metronome/audioLoader.ts
    - Import types from frontend/src/types/metronome.ts

    Success: Sounds play with precise timing, volume control works correctly, custom sounds load successfully, no audio artifacts or clicks, proper resource cleanup
    ```

## Phase 4: Visual Effects System

- [x] 4.1. Create FlashEffect component
  - File: `frontend/src/components/visualEffects/FlashEffect.tsx`
  - Implement full-screen flash effect with configurable color and opacity
  - Purpose: Render flash visual beat indicator
  - _Leverage: CSS animations, React
  - _Requirements: REQ-2 (Visual Beat Overlay), REQ-5 (Visual Customization)
  - _Prompt:
    ```
    Role: Frontend Developer specializing in React and CSS animations

    Task: Create FlashEffect component in frontend/src/components/visualEffects/FlashEffect.tsx.

    Component implementation:

    ```typescript
    import React, { useEffect, useState } from 'react';
    import './FlashEffect.css';

    interface FlashEffectProps {
      intensity: number; // 0-1
      duration: number; // milliseconds
      config: {
        color: string; // hex color
        opacity: number; // 0-1 (base opacity)
      };
      onComplete?: () => void;
    }

    export function FlashEffect({ intensity, duration, config, onComplete }: FlashEffectProps) {
      // State: active (boolean) - controls animation
      // Effect: Set active=true immediately, then false after duration
      // Effect: Call onComplete after animation finishes

      // Calculate final opacity: config.opacity * intensity
      // Apply color and opacity as inline styles or CSS variables

      // Render full-screen overlay div
      // Use CSS transition for fade out
      // Apply pointer-events: none (don't block video controls)

      return (
        <div
          className={`flash-effect ${active ? 'flash-effect--active' : ''}`}
          style={{
            '--flash-color': config.color,
            '--flash-opacity': finalOpacity,
            '--flash-duration': `${duration}ms`,
          } as React.CSSProperties}
        />
      );
    }
    ```

    CSS (FlashEffect.css):
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
      transition: none; /* Instant on, fade out */
    }
    ```

    Restrictions:
    - Must not block video controls (pointer-events: none)
    - Use GPU-accelerated properties (opacity, transform)
    - Clean animation (no flicker)
    - Handle rapid beats without overlap (component remounts)

    Leverage: React hooks (useState, useEffect), CSS custom properties

    Success: Flash appears instantly at full opacity, fades out smoothly over duration, doesn't block interactions, intensity affects brightness correctly
    ```

- [x] 4.2. Create PulseEffect component
  - File: `frontend/src/components/visualEffects/PulseEffect.tsx`
  - Implement expanding/contracting shape effect with configurable position and shape
  - Purpose: Render pulse visual beat indicator
  - _Leverage: CSS animations, React
  - _Requirements: REQ-2 (Visual Beat Overlay), REQ-5 (Visual Customization)
  - _Prompt:
    ```
    Role: Frontend Developer specializing in React and CSS animations

    Task: Create PulseEffect component in frontend/src/components/visualEffects/PulseEffect.tsx.

    Component implementation:

    ```typescript
    import React, { useEffect, useState } from 'react';
    import './PulseEffect.css';

    interface PulseEffectProps {
      intensity: number; // 0-1
      duration: number; // milliseconds
      config: {
        color: string;
        opacity: number;
        size: number; // percentage of screen (10-100)
        position: { x: number; y: number }; // percentage (0-100)
        shape: 'circle' | 'square' | 'diamond' | 'star';
      };
      onComplete?: () => void;
    }

    export function PulseEffect({ intensity, duration, config, onComplete }: PulseEffectProps) {
      // State: active (boolean)
      // Effect: Trigger animation, call onComplete after duration

      // Calculate final size: config.size * (1 + intensity * 0.5)
      // Start at small size, expand to finalSize, fade opacity to 0

      // Position using absolute positioning with config.position

      // Render shape based on config.shape
      // - circle: border-radius: 50%
      // - square: border-radius: 0
      // - diamond: transform: rotate(45deg)
      // - star: use SVG or clip-path

      return (
        <div
          className={`pulse-effect pulse-effect--${config.shape} ${active ? 'pulse-effect--active' : ''}`}
          style={{
            '--pulse-color': config.color,
            '--pulse-opacity': config.opacity * intensity,
            '--pulse-size': `${finalSize}vh`,
            '--pulse-duration': `${duration}ms`,
            left: `${config.position.x}%`,
            top: `${config.position.y}%`,
          } as React.CSSProperties}
        />
      );
    }
    ```

    CSS (PulseEffect.css):
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
    ```

    Restrictions:
    - Must not block video controls
    - Use transform for animations (GPU accelerated)
    - Handle shape rendering efficiently
    - Position accurately using percentages

    Success: Pulse expands smoothly from center, fades out correctly, shape renders properly, position is accurate, intensity affects size
    ```

- [x] 4.3. Create BorderEffect component
  - File: `frontend/src/components/visualEffects/BorderEffect.tsx`
  - Implement border highlight around video with configurable thickness and color
  - Purpose: Render border visual beat indicator
  - _Leverage: CSS animations, React
  - _Requirements: REQ-2 (Visual Beat Overlay), REQ-5 (Visual Customization)
  - _Prompt:
    ```
    Role: Frontend Developer specializing in React and CSS animations

    Task: Create BorderEffect component in frontend/src/components/visualEffects/BorderEffect.tsx.

    Component implementation:

    ```typescript
    import React, { useEffect, useState } from 'react';
    import './BorderEffect.css';

    interface BorderEffectProps {
      intensity: number; // 0-1
      duration: number; // milliseconds
      config: {
        color: string;
        opacity: number;
        thickness: number; // pixels (5-50)
      };
      onComplete?: () => void;
    }

    export function BorderEffect({ intensity, duration, config, onComplete }: BorderEffectProps) {
      // State: active (boolean)
      // Effect: Trigger animation, call onComplete

      // Calculate final thickness: config.thickness * (1 + intensity)
      // Animate opacity from full to 0
      // Animate thickness from finalThickness to 0

      return (
        <div
          className={`border-effect ${active ? 'border-effect--active' : ''}`}
          style={{
            '--border-color': config.color,
            '--border-opacity': config.opacity * intensity,
            '--border-thickness': `${finalThickness}px`,
            '--border-duration': `${duration}ms`,
          } as React.CSSProperties}
        />
      );
    }
    ```

    CSS (BorderEffect.css):
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

    Restrictions:
    - Must not block video controls
    - Border must not cause layout shifts
    - Use box-sizing: border-box
    - Smooth animation

    Success: Border appears at full thickness, shrinks and fades smoothly, doesn't affect layout, intensity affects thickness correctly
    ```

- [x] 4.4. Create VisualEffectRenderer component
  - File: `frontend/src/components/MetronomeVisualEffects.tsx`
  - Implement factory component that renders appropriate visual effect based on config
  - Purpose: Render the correct visual effect component
  - _Leverage: FlashEffect, PulseEffect, BorderEffect components
  - _Requirements: REQ-2 (Visual Beat Overlay)
  - _Prompt:
    ```
    Role: React Developer with expertise in component composition

    Task: Create VisualEffectRenderer component in frontend/src/components/MetronomeVisualEffects.tsx that selects and renders the appropriate visual effect.

    Component implementation:

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
      // Return null if effect is null or visual not enabled
      if (!effect || !config.enabled) {
        return null;
      }

      // Use discriminated union to select component
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

        case 'none':
          return null;

        default:
          // TypeScript exhaustiveness check
          const _exhaustive: never = config;
          return null;
      }
    }
    ```

    Restrictions:
    - Must use discriminated union for type safety
    - Handle all visual style cases
    - Return null for disabled or none styles
    - Use exhaustiveness checking

    Success: Correct effect renders for each style, TypeScript prevents missing cases, null handling works properly
    ```

## Phase 5: React Hooks

- [x] 5.1. Create useMetronome hook
  - File: `frontend/src/hooks/useMetronome.ts`
  - Implement main hook orchestrating metronome state and video player synchronization
  - Purpose: Connect metronome engine to React lifecycle and video player
  - _Leverage: MetronomeEngine, useVideoPlayer hook
  - _Requirements: REQ-1 (Basic Metronome), REQ-7 (Playlist Integration), REQ-9 (Controls)
  - _Prompt:
    ```
    Role: Senior React Developer with expertise in custom hooks and complex state management

    Task: Create useMetronome hook in frontend/src/hooks/useMetronome.ts. This is the main orchestration hook that connects everything.

    Hook implementation:

    ```typescript
    import { useState, useEffect, useRef, useCallback } from 'react';
    import { MetronomeEngine } from '../services/metronome/MetronomeEngine';
    import type { UseVideoPlayerReturn } from './useVideoPlayer';
    import type { MetronomeConfig } from '../types/metronome';

    export interface UseMetronomeReturn {
      // State
      enabled: boolean;
      config: MetronomeConfig;
      currentBeat: number;
      isRunning: boolean;

      // Controls
      toggle: () => void;
      start: () => void;
      stop: () => void;
      updateConfig: (partial: Partial<MetronomeConfig>) => void;

      // Engine reference for other hooks
      engineRef: React.MutableRefObject<MetronomeEngine | null>;
    }

    const DEFAULT_CONFIG: MetronomeConfig = {
      bpm: 60,
      enabled: false,
      pattern: { beats: ['strong', 'medium', 'medium', 'light'], length: 4, accentBeat: null },
      patternEnabled: false,
      randomization: 0,
      randomizationEnabled: false,
      tempoChange: { mode: 'accelerate', changePerMinute: 0, minBPM: 30, maxBPM: 300, resetOnStop: true },
      tempoChangeEnabled: false,
      audio: {
        soundType: 'click',
        customSoundUrl: null,
        masterVolume: 0.7,
        muted: false,
        volumeVariation: true,
        volumeMap: { silent: 0, light: 0.25, medium: 0.5, strong: 1.0 },
      },
      visual: {
        enabled: true,
        visualStyle: 'flash',
        color: '#ffffff',
        opacity: 0.3,
        size: 50,
        position: { x: 50, y: 50, preset: 'center' },
        shape: 'circle',
        multiOverlay: false,
      },
      syncToVideo: true,
      continuousMode: false,
    };

    export function useMetronome(playerState: UseVideoPlayerReturn): UseMetronomeReturn {
      const [config, setConfig] = useState<MetronomeConfig>(DEFAULT_CONFIG);
      const [enabled, setEnabled] = useState(false);
      const [currentBeat, setCurrentBeat] = useState(0);
      const [isRunning, setIsRunning] = useState(false);

      const engineRef = useRef<MetronomeEngine | null>(null);

      // Initialize engine on mount
      useEffect(() => {
        engineRef.current = new MetronomeEngine();

        return () => {
          engineRef.current?.dispose();
          engineRef.current = null;
        };
      }, []);

      // Sync with video player play/pause
      useEffect(() => {
        if (!config.syncToVideo || !engineRef.current) return;

        const engine = engineRef.current;

        if (playerState.playing && enabled && !isRunning) {
          engine.resume();
          setIsRunning(true);
        } else if (!playerState.playing && isRunning) {
          engine.pause();
          setIsRunning(false);
        }
      }, [playerState.playing, config.syncToVideo, enabled, isRunning]);

      // Sync with video seek
      useEffect(() => {
        if (!config.syncToVideo || !engineRef.current) return;

        // Calculate which beat should be playing at current video time
        const beatNumber = Math.floor((playerState.currentTime * config.bpm) / 60);
        engineRef.current.seekToBeat(beatNumber % config.pattern.length);
      }, [playerState.currentTime, config.syncToVideo, config.bpm, config.pattern.length]);

      // Subscribe to beat events
      useEffect(() => {
        if (!engineRef.current) return;

        const handleBeat = (beatInfo: BeatInfo) => {
          setCurrentBeat(beatInfo.beatNumber);
        };

        engineRef.current.on('beat', handleBeat);

        return () => {
          engineRef.current?.off('beat', handleBeat);
        };
      }, []);

      const toggle = useCallback(() => {
        setEnabled((prev) => !prev);
      }, []);

      const start = useCallback(() => {
        if (!engineRef.current) return;
        engineRef.current.start(config);
        setEnabled(true);
        setIsRunning(true);
      }, [config]);

      const stop = useCallback(() => {
        if (!engineRef.current) return;
        engineRef.current.stop();
        setEnabled(false);
        setIsRunning(false);
      }, []);

      const updateConfig = useCallback((partial: Partial<MetronomeConfig>) => {
        setConfig((prev) => ({ ...prev, ...partial }));

        // Apply real-time updates to engine
        if (engineRef.current && isRunning) {
          if (partial.bpm !== undefined) {
            engineRef.current.updateBPM(partial.bpm);
          }
          if (partial.pattern !== undefined) {
            engineRef.current.updatePattern(partial.pattern);
          }
        }
      }, [isRunning]);

      return {
        enabled,
        config,
        currentBeat,
        isRunning,
        toggle,
        start,
        stop,
        updateConfig,
        engineRef,
      };
    }
    ```

    Restrictions:
    - Must properly clean up engine on unmount
    - Handle video player state changes correctly
    - Apply config updates in real-time when running
    - Maintain stable references with useCallback

    Leverage:
    - Import MetronomeEngine from frontend/src/services/metronome/MetronomeEngine.ts
    - Import types from frontend/src/types/metronome.ts
    - Receive useVideoPlayer state as parameter

    Success: Metronome syncs with video play/pause/seek, config updates apply in real-time, proper cleanup prevents memory leaks, stable hook API
    ```

- [x] 5.2. Create useMetronomeAudio hook
  - File: `frontend/src/hooks/useMetronomeAudio.ts`
  - Implement hook managing audio playback and connecting AudioScheduler to beat events
  - Purpose: Handle audio layer of metronome
  - _Leverage: AudioScheduler, MetronomeEngine
  - _Requirements: REQ-6 (Audio Customization)
  - _Prompt:
    ```
    Role: React Developer with expertise in Web Audio API and React hooks

    Task: Create useMetronomeAudio hook in frontend/src/hooks/useMetronomeAudio.ts to manage audio playback.

    Hook implementation:

    ```typescript
    import { useEffect, useRef, useState } from 'react';
    import { AudioScheduler } from '../services/metronome/AudioScheduler';
    import { PatternManager } from '../services/metronome/PatternManager';
    import type { MetronomeEngine } from '../services/metronome/MetronomeEngine';
    import type { AudioConfig } from '../types/metronome';

    export interface UseMetronomeAudioReturn {
      audioScheduler: React.MutableRefObject<AudioScheduler | null>;
      loadingSound: boolean;
      audioError: string | null;
      setVolume: (volume: number) => void;
      setSoundType: (type: SoundType) => void;
      loadCustomSound: (file: File) => Promise<void>;
    }

    export function useMetronomeAudio(
      engineRef: React.MutableRefObject<MetronomeEngine | null>,
      audioConfig: AudioConfig
    ): UseMetronomeAudioReturn {
      const audioSchedulerRef = useRef<AudioScheduler | null>(null);
      const audioContextRef = useRef<AudioContext | null>(null);
      const patternManagerRef = useRef<PatternManager>(new PatternManager());

      const [loadingSound, setLoadingSound] = useState(false);
      const [audioError, setAudioError] = useState<string | null>(null);

      // Initialize AudioContext and AudioScheduler
      useEffect(() => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          audioSchedulerRef.current = new AudioScheduler(audioContextRef.current);

          // Load default sound
          audioSchedulerRef.current.loadSound(audioConfig.soundType).catch((err) => {
            setAudioError(`Failed to load sound: ${err.message}`);
          });
        } catch (err) {
          setAudioError('Web Audio API not supported');
        }

        return () => {
          audioSchedulerRef.current?.dispose();
          audioContextRef.current?.close();
        };
      }, []);

      // Subscribe to beat events and play sounds
      useEffect(() => {
        if (!engineRef.current || !audioSchedulerRef.current) return;

        const handleBeat = (beatInfo: BeatInfo) => {
          if (audioConfig.muted) return;

          // Get volume for this intensity
          const volume = patternManagerRef.current.getIntensityVolume(
            beatInfo.intensity,
            audioConfig.volumeMap
          );

          // Play sound at correct time
          audioSchedulerRef.current!.playBeat(
            beatInfo.intensity === 'silent' ? 0 : 1,
            volume * audioConfig.masterVolume,
            beatInfo.timestamp
          );
        };

        engineRef.current.on('beat', handleBeat);

        return () => {
          engineRef.current?.off('beat', handleBeat);
        };
      }, [engineRef, audioConfig.muted, audioConfig.volumeMap, audioConfig.masterVolume]);

      // Update master volume when config changes
      useEffect(() => {
        if (audioSchedulerRef.current) {
          audioSchedulerRef.current.setMasterVolume(audioConfig.masterVolume);
        }
      }, [audioConfig.masterVolume]);

      // Change sound type when config changes
      useEffect(() => {
        if (audioSchedulerRef.current) {
          setLoadingSound(true);
          audioSchedulerRef.current
            .loadSound(audioConfig.soundType)
            .then(() => {
              setLoadingSound(false);
              setAudioError(null);
            })
            .catch((err) => {
              setLoadingSound(false);
              setAudioError(`Failed to load sound: ${err.message}`);
            });
        }
      }, [audioConfig.soundType]);

      const setVolume = (volume: number) => {
        if (audioSchedulerRef.current) {
          audioSchedulerRef.current.setMasterVolume(volume);
        }
      };

      const setSoundType = (type: SoundType) => {
        if (audioSchedulerRef.current) {
          audioSchedulerRef.current.setSoundType(type);
        }
      };

      const loadCustomSound = async (file: File): Promise<void> => {
        if (!audioSchedulerRef.current) {
          throw new Error('Audio scheduler not initialized');
        }

        setLoadingSound(true);
        try {
          await audioSchedulerRef.current.loadCustomSound(file);
          setLoadingSound(false);
          setAudioError(null);
        } catch (err: any) {
          setLoadingSound(false);
          setAudioError(err.message);
          throw err;
        }
      };

      return {
        audioScheduler: audioSchedulerRef,
        loadingSound,
        audioError,
        setVolume,
        setSoundType,
        loadCustomSound,
      };
    }
    ```

    Restrictions:
    - Must handle Web Audio API unavailability gracefully
    - Properly clean up AudioContext on unmount
    - Handle audio loading errors with user-friendly messages
    - Respect muted state

    Success: Sounds play in sync with beats, volume control works, sound loading is handled properly, errors are user-friendly, proper cleanup
    ```

- [x] 5.3. Create useMetronomeVisuals hook
  - File: `frontend/src/hooks/useMetronomeVisuals.ts`
  - Implement hook managing visual effect state and triggering renders on beats
  - Purpose: Handle visual layer of metronome
  - _Leverage: MetronomeEngine
  - _Requirements: REQ-2 (Visual Beat Overlay), REQ-5 (Visual Customization)
  - _Prompt:
    ```
    Role: React Developer with expertise in animation and visual effects

    Task: Create useMetronomeVisuals hook in frontend/src/hooks/useMetronomeVisuals.ts to manage visual effects.

    Hook implementation:

    ```typescript
    import { useState, useEffect, useCallback } from 'react';
    import type { MetronomeEngine } from '../services/metronome/MetronomeEngine';
    import type { VisualConfig, BeatEffect } from '../types/metronome';

    export interface UseMetronomeVisualsReturn {
      activeEffect: BeatEffect | null;
      updateVisualConfig: (config: Partial<VisualConfig>) => void;
    }

    export function useMetronomeVisuals(
      engineRef: React.MutableRefObject<MetronomeEngine | null>,
      visualConfig: VisualConfig
    ): UseMetronomeVisualsReturn {
      const [activeEffect, setActiveEffect] = useState<BeatEffect | null>(null);

      // Subscribe to beat events
      useEffect(() => {
        if (!engineRef.current || !visualConfig.enabled) return;

        const handleBeat = (beatInfo: BeatInfo) => {
          // Calculate effect duration (default to 80% of beat duration)
          const bpm = 60; // This should come from config in real implementation
          const beatDurationMs = (60 / bpm) * 1000;
          const effectDuration = beatDurationMs * 0.8;

          // Set active effect (triggers render)
          setActiveEffect({
            intensity: beatInfo.volume, // Use volume as intensity proxy
            timestamp: beatInfo.timestamp,
            duration: effectDuration,
          });

          // Clear effect after duration to prevent overlap
          setTimeout(() => {
            setActiveEffect(null);
          }, effectDuration);
        };

        engineRef.current.on('beat', handleBeat);

        return () => {
          engineRef.current?.off('beat', handleBeat);
        };
      }, [engineRef, visualConfig.enabled]);

      const updateVisualConfig = useCallback((config: Partial<VisualConfig>) => {
        // This would update parent component config
        // Implementation depends on how config is managed
      }, []);

      return {
        activeEffect,
        updateVisualConfig,
      };
    }
    ```

    Restrictions:
    - Must clear effects to prevent overlap
    - Calculate appropriate effect duration
    - Handle disabled state
    - Efficient state updates

    Success: Visual effects trigger on beats, effects clear properly, no overlap issues, respects enabled state
    ```

- [x] 5.4. Create useMetronomePresets hook
  - File: `frontend/src/hooks/useMetronomePresets.ts`
  - Implement hook managing preset CRUD with localStorage persistence
  - Purpose: Handle preset management
  - _Leverage: localStorage API
  - _Requirements: REQ-8 (Preset Management)
  - _Prompt:
    ```
    Role: React Developer with expertise in data persistence and state management

    Task: Create useMetronomePresets hook in frontend/src/hooks/useMetronomePresets.ts for preset management.

    Hook implementation:

    ```typescript
    import { useState, useEffect, useCallback } from 'react';
    import type { MetronomeConfig, MetronomePreset } from '../types/metronome';

    const STORAGE_KEY = 'metronome_presets';
    const MAX_PRESETS = 50;

    export interface UseMetronomePresetsReturn {
      presets: MetronomePreset[];
      savePreset: (name: string, config: MetronomeConfig, description?: string) => void;
      loadPreset: (id: string) => MetronomeConfig | null;
      deletePreset: (id: string) => void;
      exportPresets: () => string;
      importPresets: (json: string) => { success: boolean; error?: string };
      error: string | null;
    }

    function generateId(): string {
      return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    export function useMetronomePresets(): UseMetronomePresetsReturn {
      const [presets, setPresets] = useState<MetronomePreset[]>([]);
      const [error, setError] = useState<string | null>(null);

      // Load presets from localStorage on mount
      useEffect(() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setPresets(Array.isArray(parsed) ? parsed : []);
          }
        } catch (err) {
          setError('Failed to load presets from storage');
        }
      }, []);

      // Save presets to localStorage whenever they change
      useEffect(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (err: any) {
          if (err.name === 'QuotaExceededError') {
            setError('Storage quota exceeded. Delete unused presets.');
          } else {
            setError('Failed to save presets');
          }
        }
      }, [presets]);

      const savePreset = useCallback((name: string, config: MetronomeConfig, description?: string) => {
        if (presets.length >= MAX_PRESETS) {
          setError(`Maximum ${MAX_PRESETS} presets allowed`);
          return;
        }

        const now = new Date().toISOString();
        const newPreset: MetronomePreset = {
          id: generateId(),
          name,
          description: description || null,
          config,
          createdAt: now,
          updatedAt: now,
        };

        setPresets((prev) => [...prev, newPreset]);
        setError(null);
      }, [presets.length]);

      const loadPreset = useCallback((id: string): MetronomeConfig | null => {
        const preset = presets.find((p) => p.id === id);
        return preset ? preset.config : null;
      }, [presets]);

      const deletePreset = useCallback((id: string) => {
        setPresets((prev) => prev.filter((p) => p.id !== id));
        setError(null);
      }, []);

      const exportPresets = useCallback((): string => {
        return JSON.stringify(presets, null, 2);
      }, [presets]);

      const importPresets = useCallback((json: string): { success: boolean; error?: string } => {
        try {
          const parsed = JSON.parse(json);

          if (!Array.isArray(parsed)) {
            return { success: false, error: 'Invalid format: expected array' };
          }

          // Validate structure
          const valid = parsed.every((p) =>
            p.id && p.name && p.config && p.createdAt && p.updatedAt
          );

          if (!valid) {
            return { success: false, error: 'Invalid preset structure' };
          }

          setPresets(parsed);
          setError(null);
          return { success: true };
        } catch (err) {
          return { success: false, error: 'Failed to parse JSON' };
        }
      }, []);

      return {
        presets,
        savePreset,
        loadPreset,
        deletePreset,
        exportPresets,
        importPresets,
        error,
      };
    }
    ```

    Restrictions:
    - Must handle localStorage quota errors
    - Validate imported JSON structure
    - Limit number of presets (50 max)
    - Generate unique IDs

    Success: Presets persist across sessions, CRUD operations work correctly, quota errors handled gracefully, import validation works
    ```

## Phase 6: UI Components

- [x] 6.1. Create MetronomeControls component
  - File: `frontend/src/components/MetronomeControls.tsx`
  - Implement basic controls (BPM slider, play/pause toggle, settings button)
  - Purpose: Provide user controls for metronome
  - _Leverage: React, existing UI patterns
  - _Requirements: REQ-9 (Controls and UI Integration)
  - _Prompt:
    ```
    Role: UI/UX Developer specializing in React and accessible interfaces

    Task: Create MetronomeControls component in frontend/src/components/MetronomeControls.tsx with basic metronome controls.

    Component implementation:

    ```typescript
    import React from 'react';
    import './MetronomeControls.css';

    interface MetronomeControlsProps {
      enabled: boolean;
      bpm: number;
      isRunning: boolean;
      onToggle: () => void;
      onBPMChange: (bpm: number) => void;
      onOpenSettings: () => void;
    }

    export function MetronomeControls({
      enabled,
      bpm,
      isRunning,
      onToggle,
      onBPMChange,
      onOpenSettings,
    }: MetronomeControlsProps) {
      return (
        <div className="metronome-controls">
          {/* Toggle Button */}
          <button
            className={`metronome-controls__toggle ${enabled ? 'active' : ''}`}
            onClick={onToggle}
            aria-label={enabled ? 'Disable metronome' : 'Enable metronome'}
            data-testid="metronome-toggle"
          >
            <svg className="metronome-icon" viewBox="0 0 24 24">
              {/* Metronome icon SVG */}
              <path d="M12 2 L12 22 M8 10 L12 2 L16 10" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            {isRunning && <span className="pulse-indicator" />}
          </button>

          {/* BPM Slider (shown when enabled) */}
          {enabled && (
            <div className="metronome-controls__bpm">
              <label htmlFor="bpm-slider" className="metronome-controls__bpm-label">
                BPM
              </label>
              <input
                id="bpm-slider"
                type="range"
                min="30"
                max="300"
                step="1"
                value={bpm}
                onChange={(e) => onBPMChange(Number(e.target.value))}
                className="metronome-controls__bpm-slider"
                aria-label="Beats per minute"
                aria-valuemin="30"
                aria-valuemax="300"
                aria-valuenow={bpm}
              />
              <span className="metronome-controls__bpm-value">{bpm}</span>
            </div>
          )}

          {/* Settings Button */}
          {enabled && (
            <button
              className="metronome-controls__settings"
              onClick={onOpenSettings}
              aria-label="Open metronome settings"
              data-testid="metronome-settings-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
              </svg>
            </button>
          )}
        </div>
      );
    }
    ```

    CSS (MetronomeControls.css):
    ```css
    .metronome-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 8px;
    }

    .metronome-controls__toggle {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      position: relative;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .metronome-controls__toggle:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .metronome-controls__toggle.active {
      color: #4CAF50;
    }

    .pulse-indicator {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 8px;
      height: 8px;
      background: #4CAF50;
      border-radius: 50%;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .metronome-controls__bpm {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metronome-controls__bpm-slider {
      width: 150px;
    }

    .metronome-controls__bpm-value {
      min-width: 40px;
      text-align: center;
      color: #fff;
      font-weight: bold;
    }

    .metronome-controls__settings {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      border-radius: 50%;
    }

    .metronome-controls__settings:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    ```

    Restrictions:
    - Must be keyboard accessible
    - Include ARIA labels
    - Visual feedback on all interactions
    - Responsive to container width

    Success: Controls are intuitive and accessible, BPM slider works smoothly, toggle state is clear, settings button opens panel
    ```

- [ ] 6.2. Create MetronomeSettingsPanel component
  - File: `frontend/src/components/MetronomeSettingsPanel.tsx`
  - Implement comprehensive settings panel with sections for all configuration options
  - Purpose: Provide detailed metronome configuration UI
  - _Leverage: React, useMetronome hook
  - _Requirements: REQ-3 to REQ-8 (All customization requirements)
  - _Prompt:
    ```
    Role: Frontend Developer specializing in complex forms and UI components

    Task: Create MetronomeSettingsPanel component in frontend/src/components/MetronomeSettingsPanel.tsx. This is a comprehensive settings panel with multiple sections.

    Due to length, implement this in phases:

    Phase 1 - Component Structure:
    ```typescript
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
            <button onClick={props.onClose} aria-label="Close settings">×</button>
          </div>

          <div className="metronome-settings-panel__tabs">
            {/* Tab buttons */}
            <button
              className={activeTab === 'basic' ? 'active' : ''}
              onClick={() => setActiveTab('basic')}
            >
              Basic
            </button>
            {/* ... other tabs ... */}
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

    // Sub-components for each section
    function BasicSettings(props: MetronomeSettingsPanelProps) {
      // BPM slider
      // Randomization controls
      // Tempo change controls
      // Sync options
    }

    function PatternSettings(props: MetronomeSettingsPanelProps) {
      // Pattern enable toggle
      // Pattern length selector
      // Beat intensity grid (click to cycle through light/medium/strong/silent)
      // Accent beat selector
    }

    function VisualSettings(props: MetronomeSettingsPanelProps) {
      // Visual enable toggle
      // Style selector (flash/pulse/border/none)
      // Color picker
      // Opacity slider
      // Size/position/shape controls (conditional on style)
    }

    function AudioSettings(props: MetronomeSettingsPanelProps) {
      // Sound type selector
      // Master volume slider
      // Mute toggle
      // Volume variation toggle
      // Custom sound upload
    }

    function PresetSettings(props: MetronomeSettingsPanelProps) {
      // Preset list
      // Load/Delete buttons per preset
      // Save new preset form
      // Export/Import buttons
    }
    ```

    Implementation notes:
    - Use controlled components (all inputs controlled by config prop)
    - Apply changes immediately via onConfigChange (no "Apply" button)
    - Validate inputs before applying (BPM range, pattern length, etc.)
    - Provide visual feedback (sliders show values, color pickers show current color)
    - Make panel closable with Escape key
    - Responsive design (sidebar on desktop, fullscreen on mobile)

    Restrictions:
    - All changes must apply in real-time
    - Must validate inputs
    - Keyboard accessible
    - Clear visual hierarchy
    - Don't overwhelm user with too many controls at once (use tabs)

    Success: Settings panel is intuitive and complete, all options accessible, changes apply immediately, validation prevents invalid states, responsive design works
    ```

- [x] 6.3. Create MetronomeOverlay component
  - File: `frontend/src/components/MetronomeOverlay.tsx`
  - Implement top-level container orchestrating all metronome UI and visual effects
  - Purpose: Main metronome component integrated into VideoPlayer
  - _Leverage: All metronome hooks and components
  - _Requirements: All requirements
  - _Prompt:
    ```
    Role: Senior React Developer with expertise in component orchestration

    Task: Create MetronomeOverlay component in frontend/src/components/MetronomeOverlay.tsx. This is the top-level orchestrator that brings everything together.

    Component implementation:

    ```typescript
    import React, { useState } from 'react';
    import { useMetronome } from '../hooks/useMetronome';
    import { useMetronomeAudio } from '../hooks/useMetronomeAudio';
    import { useMetronomeVisuals } from '../hooks/useMetronomeVisuals';
    import { useMetronomePresets } from '../hooks/useMetronomePresets';
    import { MetronomeControls } from './MetronomeControls';
    import { MetronomeSettingsPanel } from './MetronomeSettingsPanel';
    import { VisualEffectRenderer } from './MetronomeVisualEffects';
    import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer';
    import type { MetronomeConfig } from '../types/metronome';
    import './MetronomeOverlay.css';

    interface MetronomeOverlayProps {
      playerState: UseVideoPlayerReturn;
      initialConfig?: Partial<MetronomeConfig>;
    }

    export function MetronomeOverlay({ playerState, initialConfig }: MetronomeOverlayProps) {
      const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

      // Initialize all hooks
      const metronome = useMetronome(playerState);
      const audio = useMetronomeAudio(metronome.engineRef, metronome.config.audio);
      const visuals = useMetronomeVisuals(metronome.engineRef, metronome.config.visual);
      const presets = useMetronomePresets();

      // Apply initial config if provided
      React.useEffect(() => {
        if (initialConfig) {
          metronome.updateConfig(initialConfig);
        }
      }, []);

      // Handle preset loading
      const handleLoadPreset = (id: string) => {
        const presetConfig = presets.loadPreset(id);
        if (presetConfig) {
          metronome.updateConfig(presetConfig);
        }
      };

      // Handle preset saving
      const handleSavePreset = (name: string) => {
        presets.savePreset(name, metronome.config);
      };

      // Handle keyboard shortcuts
      React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          // Only handle if not in input field
          if (document.activeElement?.tagName === 'INPUT') return;

          if (e.key === 'm' && e.ctrlKey) {
            e.preventDefault();
            metronome.toggle();
          } else if (e.key === 'Escape' && settingsPanelOpen) {
            setSettingsPanelOpen(false);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [metronome.toggle, settingsPanelOpen]);

      return (
        <div className="metronome-overlay">
          {/* Controls always visible */}
          <div className="metronome-overlay__controls">
            <MetronomeControls
              enabled={metronome.enabled}
              bpm={metronome.config.bpm}
              isRunning={metronome.isRunning}
              onToggle={metronome.toggle}
              onBPMChange={(bpm) => metronome.updateConfig({ bpm })}
              onOpenSettings={() => setSettingsPanelOpen(true)}
            />
          </div>

          {/* Settings panel (conditional) */}
          {settingsPanelOpen && (
            <MetronomeSettingsPanel
              config={metronome.config}
              presets={presets.presets}
              onConfigChange={metronome.updateConfig}
              onLoadPreset={handleLoadPreset}
              onSavePreset={handleSavePreset}
              onDeletePreset={presets.deletePreset}
              onClose={() => setSettingsPanelOpen(false)}
            />
          )}

          {/* Visual effects */}
          {metronome.enabled && (
            <VisualEffectRenderer
              effect={visuals.activeEffect}
              config={metronome.config.visual}
            />
          )}

          {/* Error messages */}
          {audio.audioError && (
            <div className="metronome-overlay__error">
              {audio.audioError}
            </div>
          )}
          {presets.error && (
            <div className="metronome-overlay__error">
              {presets.error}
            </div>
          )}
        </div>
      );
    }
    ```

    CSS (MetronomeOverlay.css):
    ```css
    .metronome-overlay {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .metronome-overlay__controls {
      position: absolute;
      bottom: 60px; /* Above video controls */
      right: 20px;
      z-index: 10;
    }

    .metronome-overlay__error {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      border-radius: 8px;
      z-index: 10000;
      max-width: 400px;
      text-align: center;
    }
    ```

    Restrictions:
    - Must not block video player controls
    - Handle all error states gracefully
    - Keyboard shortcuts must not conflict with video player
    - Proper z-index layering

    Success: All components work together seamlessly, keyboard shortcuts work, error handling is clear, visual effects render correctly
    ```

## Phase 7: VideoPlayer Integration

- [x] 7. Integrate MetronomeOverlay into VideoPlayer
  - File: `frontend/src/components/VideoPlayer.tsx` (modify existing)
  - Add MetronomeOverlay as sibling to video element, pass playerInstance
  - Purpose: Make metronome available in video player
  - _Leverage: Existing VideoPlayer component, useVideoPlayer hook
  - _Requirements: All requirements
  - _Prompt:
    ```
    Role: React Developer with expertise in component integration

    Task: Integrate MetronomeOverlay into existing VideoPlayer component in frontend/src/components/VideoPlayer.tsx.

    Modifications needed:

    1. Import MetronomeOverlay:
    ```typescript
    import { MetronomeOverlay } from './MetronomeOverlay';
    ```

    2. Add prop to enable metronome (optional):
    ```typescript
    interface VideoPlayerProps {
      // ... existing props ...
      metronomeEnabled?: boolean; // Optional: enable metronome for this player
    }
    ```

    3. Render MetronomeOverlay as sibling to video element:
    ```typescript
    export default function VideoPlayer({
      videoId,
      clipId,
      autoplay = false,
      controls = true,
      className = '',
      playerInstance,
      metronomeEnabled = true, // Enable by default
    }: VideoPlayerProps) {
      const videoElementRef = useRef<HTMLVideoElement>(null);
      const internalPlayer = useVideoPlayer();
      const player = playerInstance || internalPlayer;

      // ... existing player initialization ...

      return (
        <div className={`video-player ${className}`} data-vjs-player>
          {/* Existing video element */}
          <video
            ref={videoElementRef}
            className="video-js vjs-big-play-centered vjs-theme-fantasy"
            playsInline
            data-testid="video-player"
          />

          {/* Existing loading/error overlays ... */}

          {/* NEW: Metronome overlay */}
          {metronomeEnabled && (
            <MetronomeOverlay playerState={player} />
          )}
        </div>
      );
    }
    ```

    4. Update CSS to handle metronome overlay positioning:
    - Ensure metronome controls don't overlap with video controls
    - Z-index: video controls at 100, metronome at 10, visual effects at 9999

    Restrictions:
    - Must not break existing VideoPlayer functionality
    - Metronome should be optional (can be disabled via prop)
    - Proper z-index layering to avoid conflicts
    - No visual glitches or overlaps

    Leverage:
    - Existing VideoPlayer.tsx structure
    - useVideoPlayer hook (player instance)

    Success: Metronome appears in video player, syncs with playback, doesn't break existing functionality, can be toggled on/off
    ```

## Phase 8: Testing

- [ ] 8.1. Create unit tests for timing utilities
  - File: `frontend/src/utils/metronome/__tests__/timingCalculations.test.ts`
  - Test all timing calculation functions
  - Purpose: Ensure timing math is accurate
  - _Leverage: Jest
  - _Requirements: REQ-10 (Performance)
  - _Prompt:
    ```
    Role: QA Engineer specializing in unit testing and JavaScript

    Task: Create comprehensive unit tests for timing utilities in frontend/src/utils/metronome/__tests__/timingCalculations.test.ts.

    Test structure:

    ```typescript
    import {
      bpmToMilliseconds,
      millisecondsToBPM,
      calculateBeatDuration,
      applyTempoChange,
      calculateBeatFromTime,
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

        it('handles minimum BPM (30)', () => {
          expect(bpmToMilliseconds(30)).toBe(2000);
        });

        it('handles maximum BPM (300)', () => {
          expect(bpmToMilliseconds(300)).toBeCloseTo(200, 0);
        });

        it('throws error for invalid BPM', () => {
          expect(() => bpmToMilliseconds(0)).toThrow();
          expect(() => bpmToMilliseconds(-10)).toThrow();
        });
      });

      describe('millisecondsToBPM', () => {
        it('converts 1000ms to 60 BPM', () => {
          expect(millisecondsToBPM(1000)).toBe(60);
        });

        it('is inverse of bpmToMilliseconds', () => {
          const bpm = 120;
          const ms = bpmToMilliseconds(bpm);
          expect(millisecondsToBPM(ms)).toBeCloseTo(bpm, 2);
        });
      });

      describe('calculateBeatDuration', () => {
        it('returns exact duration with 0% randomization', () => {
          const duration = calculateBeatDuration(60, 0);
          expect(duration).toBe(1000);
        });

        it('returns duration within range with randomization', () => {
          const duration = calculateBeatDuration(60, 20); // ±20%
          expect(duration).toBeGreaterThanOrEqual(800);
          expect(duration).toBeLessThanOrEqual(1200);
        });
      });

      describe('applyTempoChange', () => {
        it('accelerates BPM correctly', () => {
          const config = {
            mode: 'accelerate' as const,
            changePerMinute: 10,
            minBPM: 30,
            maxBPM: 300,
            resetOnStop: true,
          };
          const newBPM = applyTempoChange(60, config, 1); // 1 minute elapsed
          expect(newBPM).toBe(70); // 60 + 10
        });

        it('respects max BPM bound', () => {
          const config = {
            mode: 'accelerate' as const,
            changePerMinute: 50,
            minBPM: 30,
            maxBPM: 120,
            resetOnStop: true,
          };
          const newBPM = applyTempoChange(110, config, 1);
          expect(newBPM).toBe(120); // Capped at maxBPM
        });

        // Add tests for decelerate and cycle modes
      });

      describe('calculateBeatFromTime', () => {
        it('calculates beat number at time 0', () => {
          expect(calculateBeatFromTime(0, 60)).toBe(0);
        });

        it('calculates beat number after 1 second at 60 BPM', () => {
          expect(calculateBeatFromTime(1, 60)).toBe(1);
        });

        it('calculates beat number after 2.5 seconds at 120 BPM', () => {
          expect(calculateBeatFromTime(2.5, 120)).toBe(5); // 2.5s * 2 beats/s
        });
      });

      describe('validateBPM', () => {
        it('returns true for valid BPM', () => {
          expect(validateBPM(60)).toBe(true);
          expect(validateBPM(120)).toBe(true);
          expect(validateBPM(30)).toBe(true);
          expect(validateBPM(300)).toBe(true);
        });

        it('returns false for invalid BPM', () => {
          expect(validateBPM(0)).toBe(false);
          expect(validateBPM(29)).toBe(false);
          expect(validateBPM(301)).toBe(false);
          expect(validateBPM(-10)).toBe(false);
        });
      });
    });
    ```

    Success: All utility functions covered, edge cases tested, timing calculations verified accurate
    ```

- [ ] 8.2. Create unit tests for MetronomeEngine
  - File: `frontend/src/services/metronome/__tests__/MetronomeEngine.test.ts`
  - Test engine initialization, beat scheduling, pattern handling
  - Purpose: Ensure core engine reliability
  - _Leverage: Jest, mock Web Audio API
  - _Requirements: REQ-1, REQ-3, REQ-10
  - _Prompt:
    ```
    Role: QA Engineer specializing in integration testing and mocking

    Task: Create unit tests for MetronomeEngine in frontend/src/services/metronome/__tests__/MetronomeEngine.test.ts.

    Key tests to implement:
    1. Engine initialization
    2. Beat event emission
    3. Pattern looping
    4. BPM changes during playback
    5. Pause/resume functionality
    6. Dispose cleanup
    7. Beat timing accuracy (use mock timers)

    Mock Web Audio API:
    ```typescript
    const mockAudioContext = {
      currentTime: 0,
      state: 'running',
    };

    beforeAll(() => {
      (global as any).AudioContext = jest.fn(() => mockAudioContext);
    });
    ```

    Use Jest fake timers:
    ```typescript
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
    ```

    Success: Engine behavior verified, edge cases covered, timing accuracy tested, cleanup verified
    ```

- [ ] 8.3. Create component tests for visual effects
  - File: `frontend/src/components/visualEffects/__tests__/`
  - Test FlashEffect, PulseEffect, BorderEffect rendering and animations
  - Purpose: Ensure visual effects render correctly
  - _Leverage: @testing-library/react, Jest
  - _Requirements: REQ-2, REQ-5
  - _Prompt:
    ```
    Role: Frontend QA Engineer specializing in React component testing

    Task: Create component tests for visual effects in frontend/src/components/visualEffects/__tests__/.

    Create separate test files:
    - FlashEffect.test.tsx
    - PulseEffect.test.tsx
    - BorderEffect.test.tsx

    Test structure for FlashEffect:
    ```typescript
    import { render } from '@testing-library/react';
    import { FlashEffect } from '../FlashEffect';

    describe('FlashEffect', () => {
      it('renders with correct opacity', () => {
        const { container } = render(
          <FlashEffect
            intensity={0.5}
            duration={300}
            config={{ color: '#ffffff', opacity: 0.5 }}
          />
        );

        const effect = container.querySelector('.flash-effect');
        expect(effect).toBeInTheDocument();
        // Check computed styles
      });

      it('applies color correctly', () => {
        const { container } = render(
          <FlashEffect
            intensity={1}
            duration={300}
            config={{ color: '#ff0000', opacity: 1 }}
          />
        );

        const effect = container.querySelector('.flash-effect');
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

        jest.advanceTimersByTime(300);
        expect(onComplete).toHaveBeenCalled();

        jest.useRealTimers();
      });
    });
    ```

    Similar tests for PulseEffect and BorderEffect with their specific props.

    Success: All visual effects tested, props handled correctly, animations trigger, onComplete callbacks work
    ```

- [ ] 8.4. Create integration tests for metronome hooks
  - File: `frontend/src/hooks/__tests__/useMetronome.test.ts`
  - Test hook interactions and state management
  - Purpose: Ensure hooks work together correctly
  - _Leverage: @testing-library/react-hooks, Jest
  - _Requirements: All requirements
  - _Prompt:
    ```
    Role: React Testing Specialist

    Task: Create integration tests for useMetronome hook in frontend/src/hooks/__tests__/useMetronome.test.ts.

    Test structure:
    ```typescript
    import { renderHook, act } from '@testing-library/react-hooks';
    import { useMetronome } from '../useMetronome';
    import { useVideoPlayer } from '../useVideoPlayer';

    describe('useMetronome', () => {
      let mockPlayerState: any;

      beforeEach(() => {
        mockPlayerState = {
          playing: false,
          currentTime: 0,
          duration: 100,
          playerRef: { current: null },
          // ... other video player state
        };
      });

      it('initializes with default config', () => {
        const { result } = renderHook(() => useMetronome(mockPlayerState));

        expect(result.current.enabled).toBe(false);
        expect(result.current.config.bpm).toBe(60);
        expect(result.current.isRunning).toBe(false);
      });

      it('starts metronome when toggle is called', () => {
        const { result } = renderHook(() => useMetronome(mockPlayerState));

        act(() => {
          result.current.toggle();
        });

        expect(result.current.enabled).toBe(true);
      });

      it('syncs with video player play state', () => {
        const { result } = renderHook(() => useMetronome(mockPlayerState));

        act(() => {
          result.current.start();
          mockPlayerState.playing = true;
        });

        // Trigger re-render with new player state
        // Verify metronome is running
      });

      it('updates BPM in real-time', () => {
        const { result } = renderHook(() => useMetronome(mockPlayerState));

        act(() => {
          result.current.updateConfig({ bpm: 120 });
        });

        expect(result.current.config.bpm).toBe(120);
      });

      it('cleans up engine on unmount', () => {
        const { result, unmount } = renderHook(() => useMetronome(mockPlayerState));
        const disposeSpy = jest.spyOn(result.current.engineRef.current!, 'dispose');

        unmount();

        expect(disposeSpy).toHaveBeenCalled();
      });
    });
    ```

    Success: Hook lifecycle tested, state updates verified, cleanup confirmed, video sync working
    ```

- [ ] 8.5. Create E2E tests for metronome workflows
  - File: `e2e/metronome.spec.ts`
  - Test complete user workflows with Playwright
  - Purpose: Verify end-to-end functionality
  - _Leverage: Playwright
  - _Requirements: All requirements
  - _Prompt:
    ```
    Role: E2E Test Engineer with Playwright expertise

    Task: Create end-to-end tests for metronome workflows in e2e/metronome.spec.ts.

    Test scenarios:

    ```typescript
    import { test, expect } from '@playwright/test';

    test.describe('Metronome Feature', () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to video player
        await page.goto('/videos/1');
        await page.waitForSelector('[data-testid="video-player"]');
      });

      test('User can enable and disable metronome', async ({ page }) => {
        // Find metronome toggle button
        const toggleBtn = page.locator('[data-testid="metronome-toggle"]');

        // Click to enable
        await toggleBtn.click();

        // Verify metronome is active (button has active class)
        await expect(toggleBtn).toHaveClass(/active/);

        // Verify BPM slider is visible
        await expect(page.locator('.metronome-controls__bpm-slider')).toBeVisible();

        // Click to disable
        await toggleBtn.click();

        // Verify metronome is inactive
        await expect(toggleBtn).not.toHaveClass(/active/);
      });

      test('User can adjust BPM with slider', async ({ page }) => {
        // Enable metronome
        await page.click('[data-testid="metronome-toggle"]');

        // Find BPM slider
        const bpmSlider = page.locator('[data-testid="bpm-slider"]');

        // Set to 120 BPM
        await bpmSlider.fill('120');

        // Verify BPM value display shows 120
        await expect(page.locator('.metronome-controls__bpm-value')).toHaveText('120');
      });

      test('User can open settings panel', async ({ page }) => {
        // Enable metronome
        await page.click('[data-testid="metronome-toggle"]');

        // Click settings button
        await page.click('[data-testid="metronome-settings-btn"]');

        // Verify settings panel is visible
        await expect(page.locator('.metronome-settings-panel')).toBeVisible();

        // Verify all tabs are present
        await expect(page.locator('text=Basic')).toBeVisible();
        await expect(page.locator('text=Pattern')).toBeVisible();
        await expect(page.locator('text=Visual')).toBeVisible();
        await expect(page.locator('text=Audio')).toBeVisible();
        await expect(page.locator('text=Presets')).toBeVisible();
      });

      test('User can create and load preset', async ({ page }) => {
        // Enable metronome and open settings
        await page.click('[data-testid="metronome-toggle"]');
        await page.click('[data-testid="metronome-settings-btn"]');

        // Set custom BPM
        await page.fill('[data-testid="bpm-input"]', '150');

        // Go to presets tab
        await page.click('text=Presets');

        // Save preset
        await page.fill('[data-testid="preset-name-input"]', 'Test Preset');
        await page.click('[data-testid="save-preset-btn"]');

        // Verify preset appears in list
        await expect(page.locator('text=Test Preset')).toBeVisible();

        // Change BPM
        await page.click('text=Basic');
        await page.fill('[data-testid="bpm-input"]', '60');

        // Load preset
        await page.click('text=Presets');
        await page.click('[data-testid="load-preset-Test Preset"]');

        // Verify BPM restored to 150
        await page.click('text=Basic');
        await expect(page.locator('[data-testid="bpm-input"]')).toHaveValue('150');
      });

      test('Metronome syncs with video playback', async ({ page }) => {
        // Enable metronome
        await page.click('[data-testid="metronome-toggle"]');

        // Play video
        await page.click('[data-testid="video-player"]'); // Click to play

        // Wait a moment
        await page.waitForTimeout(500);

        // Verify metronome is running (pulse indicator visible)
        await expect(page.locator('.pulse-indicator')).toBeVisible();

        // Pause video
        await page.click('[data-testid="video-player"]'); // Click to pause

        // Verify metronome stops (pulse indicator may still be visible but not animating)
        // This is hard to test visually, might need to check engine state via exposed data attribute
      });

      test('Visual effects render on beats', async ({ page }) => {
        // Enable metronome
        await page.click('[data-testid="metronome-toggle"]');

        // Open settings and ensure flash effect is enabled
        await page.click('[data-testid="metronome-settings-btn"]');
        await page.click('text=Visual');
        await page.selectOption('[data-testid="visual-style-select"]', 'flash');
        await page.click('[data-testid="close-settings"]');

        // Play video
        await page.click('[data-testid="video-player"]');

        // Wait for a beat
        await page.waitForTimeout(1000); // 60 BPM = 1 beat per second

        // Check if flash effect appeared (this is timing-sensitive, might be flaky)
        // Better approach: mock time or use test mode with manual beat triggers
        const flashEffect = page.locator('.flash-effect');
        // Verify it exists (even if animation completed)
      });
    });
    ```

    Notes:
    - Some tests may be timing-sensitive and potentially flaky
    - Consider adding test modes or manual beat triggers for more reliable testing
    - Visual effect tests are particularly challenging without video recording

    Success: All major workflows tested, user can enable/disable metronome, settings work, presets function, video sync confirmed
    ```

## Phase 9: Documentation

- [ ] 9. Create user documentation
  - File: `docs/METRONOME.md`
  - Write comprehensive user guide for metronome feature
  - Purpose: Help users understand and use the metronome
  - _Leverage: None
  - _Requirements: All requirements
  - _Prompt:
    ```
    Role: Technical Writer with expertise in user documentation

    Task: Create comprehensive user documentation in docs/METRONOME.md for the metronome overlay feature.

    Documentation structure:

    # Metronome Overlay Feature

    ## Overview
    Brief description of what the metronome overlay does and why it's useful.

    ## Getting Started
    ### Enabling the Metronome
    Step-by-step instructions with screenshots (if available):
    1. Open a video in the player
    2. Click the metronome button in the controls
    3. Adjust BPM as desired

    ## Basic Controls
    ### BPM Control
    - Description of BPM (beats per minute)
    - How to adjust (slider, input field)
    - Valid range (30-300)

    ### Play/Pause
    - Automatic sync with video playback
    - Manual start/stop

    ## Settings Panel

    ### Basic Tab
    - BPM fine-tuning
    - Randomization settings
    - Tempo change options
    - Sync preferences

    ### Pattern Tab
    - Creating custom beat patterns
    - Setting beat intensities (light, medium, strong, silent)
    - Accent beats

    ### Visual Tab
    - Visual effect types (flash, pulse, border)
    - Customizing colors and opacity
    - Position and size controls

    ### Audio Tab
    - Selecting sound types
    - Volume control
    - Custom sound upload
    - Volume variation

    ### Presets Tab
    - Saving presets
    - Loading presets
    - Deleting presets
    - Import/Export

    ## Use Cases
    Examples of when to use the metronome:
    - Rhythm training
    - Exercise timing
    - Music practice
    - Pacing during instructional videos

    ## Keyboard Shortcuts
    - Ctrl+M: Toggle metronome
    - Arrow keys: Adjust BPM (when focused)
    - Escape: Close settings panel

    ## Troubleshooting

    ### Audio Not Playing
    - Check volume settings
    - Verify browser audio permissions
    - Try different sound types

    ### Visual Effects Not Showing
    - Check visual enabled setting
    - Verify opacity is not set to 0
    - Try different effect styles

    ### Timing Issues
    - Close other tabs/applications
    - Check browser performance
    - Reduce visual complexity

    ### Storage Quota Errors
    - Delete unused presets
    - Export presets to file
    - Clear browser cache

    ## Technical Details
    - Timing accuracy: ±5ms
    - Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
    - Storage: Uses browser localStorage (up to 5MB)

    ## FAQ
    Common questions and answers

    Success: Documentation is clear, comprehensive, well-organized, includes troubleshooting, easy for users to follow
    ```

---

## Task Completion Guidelines

### For Each Task:

1. **Before Starting**:
   - Read requirements.md and design.md in `.spec-workflow/specs/metronome-overlay/`
   - Understand the task's purpose and dependencies
   - Check `_Leverage` field for code to reuse

2. **During Implementation**:
   - Follow the _Prompt instructions exactly
   - Write clean, well-documented code
   - Add TypeScript types for everything
   - Include JSDoc comments
   - Handle errors gracefully

3. **After Completion**:
   - Test the implementation manually
   - Run relevant unit tests
   - Mark task as complete: Change `- [ ]` to `- [x]` in this file
   - Log implementation details (see instructions in spec-workflow-guide)

4. **Task Status Markers**:
   - `- [ ]` = Pending (not started)
   - `- [-]` = In Progress (currently working on)
   - `- [x]` = Completed (finished and tested)

### Dependencies:

- Phase 1 must complete before Phase 2
- Phase 2 must complete before Phases 3 and 4 (can run in parallel)
- Phase 5 depends on Phases 2, 3, and 4
- Phase 6 depends on Phase 5
- Phase 7 depends on Phase 6
- Phase 8 can start after Phase 6 (test while developing Phase 7)
- Phase 9 can be done anytime after Phase 6

### Notes for Claude Web (Without Agents):

Since Claude Web doesn't have access to MCP servers and agents, follow these additional guidelines:

1. **Read files explicitly**: Use commands like "read the file at [path]" to examine code
2. **Search manually**: Use "search for [pattern] in [directory]" to find references
3. **Test incrementally**: Test each component immediately after implementation
4. **Ask for clarification**: If prompts are unclear, ask the user for guidance
5. **Break down further**: If a task is too large, break it into sub-tasks
6. **Validate assumptions**: Before implementing, confirm understanding with user
7. **Handle missing context**: If you need information from other files, explicitly request it

### Implementation Log Instructions:

After completing each task, you should log the implementation using the log-implementation tool (if available) or create a manual log entry with:
- Task ID (e.g., "1", "2.1", "5.2")
- Summary of what was implemented
- Files created/modified
- Code statistics (lines added/removed)
- **Artifacts** (REQUIRED): Document any APIs, components, functions, classes created with full details

Example log entry format:
```
Task 2.2: Created MetronomeEngine core class

Files Created:
- frontend/src/services/metronome/MetronomeEngine.ts

Files Modified:
- None

Statistics:
- Lines Added: 350
- Lines Removed: 0

Artifacts:
- Class: MetronomeEngine
  - Purpose: Core timing engine using Web Audio API
  - Methods: start, stop, pause, resume, updateBPM, updatePattern, seekToBeat, on, off, getCurrentBeat, dispose
  - Location: frontend/src/services/metronome/MetronomeEngine.ts

Description:
Implemented the core MetronomeEngine class using Web Audio API with look-ahead scheduling. The engine maintains sub-5ms timing accuracy and emits beat events that other components can subscribe to. Includes pattern support, BPM changes, and proper cleanup.
```
