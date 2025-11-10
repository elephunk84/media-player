/**
 * TypeScript interfaces for the Metronome Overlay feature
 *
 * This file defines all types for metronome configuration, patterns,
 * audio, visual effects, and presets.
 */

/**
 * Beat intensity levels
 */
export type BeatIntensity = 'light' | 'medium' | 'strong' | 'silent';

/**
 * Available sound types for metronome audio
 */
export type SoundType = 'click' | 'beep' | 'drum' | 'snap' | 'woodblock' | 'custom';

/**
 * Visual effect shapes
 */
export type Shape = 'circle' | 'square' | 'diamond' | 'star';

/**
 * Beat pattern definition
 */
export interface BeatPattern {
  /** Array of beat intensities in the pattern */
  beats: BeatIntensity[];
  /** Length of the pattern (2-32) */
  length: number;
  /** Beat number to accent (1-based), or null for no accent */
  accentBeat: number | null;
}

/**
 * Information about a beat event
 */
export interface BeatInfo {
  /** Beat number in the pattern (0-based) */
  beatNumber: number;
  /** Intensity of this beat */
  intensity: BeatIntensity;
  /** Volume for this beat (0-1) */
  volume: number;
  /** Timestamp in AudioContext time */
  timestamp: number;
}

/**
 * Tempo change configuration
 */
export interface TempoChangeConfig {
  /** Type of tempo change */
  mode: 'accelerate' | 'decelerate' | 'cycle';
  /** BPM change per minute */
  changePerMinute: number;
  /** Minimum BPM limit */
  minBPM: number;
  /** Maximum BPM limit */
  maxBPM: number;
  /** Whether to reset BPM when stopped */
  resetOnStop: boolean;
}

/**
 * Audio configuration
 */
export interface AudioConfig {
  /** Type of sound to play */
  soundType: SoundType;
  /** URL for custom sound (when soundType is 'custom') */
  customSoundUrl: string | null;
  /** Master volume (0-1) */
  masterVolume: number;
  /** Whether audio is muted */
  muted: boolean;
  /** Whether to vary volume based on intensity */
  volumeVariation: boolean;
  /** Volume mapping for each intensity level */
  volumeMap: {
    silent: 0;
    light: number;
    medium: number;
    strong: number;
  };
}

/**
 * Position configuration for visual effects
 */
export interface Position {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Position preset */
  preset: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
}

/**
 * Base properties for visual configurations
 */
export interface VisualConfigBase {
  /** Whether visual effects are enabled */
  enabled: boolean;
  /** Color (hex) */
  color: string;
  /** Opacity (0-1) */
  opacity: number;
}

/**
 * Visual configuration - discriminated union by visualStyle
 */
export type VisualConfig =
  | (VisualConfigBase & {
      visualStyle: 'flash';
    })
  | (VisualConfigBase & {
      visualStyle: 'pulse';
      /** Size as percentage of screen */
      size: number;
      /** Position configuration */
      position: Position;
      /** Shape of the pulse */
      shape: Shape;
    })
  | (VisualConfigBase & {
      visualStyle: 'border';
      /** Border thickness in pixels */
      thickness: number;
    })
  | {
      visualStyle: 'none';
    };

/**
 * Main metronome configuration
 */
export interface MetronomeConfig {
  /** Beats per minute (30-300) */
  bpm: number;
  /** Whether metronome is enabled */
  enabled: boolean;
  /** Beat pattern configuration */
  pattern: BeatPattern;
  /** Whether pattern is enabled */
  patternEnabled: boolean;
  /** Randomization percentage (0-50) */
  randomization: number;
  /** Whether randomization is enabled */
  randomizationEnabled: boolean;
  /** Tempo change configuration */
  tempoChange: TempoChangeConfig;
  /** Whether tempo change is enabled */
  tempoChangeEnabled: boolean;
  /** Audio configuration */
  audio: AudioConfig;
  /** Visual configuration */
  visual: VisualConfig;
  /** Whether to sync with video playback */
  syncToVideo: boolean;
  /** Whether to continue playing when video is paused */
  continuousMode: boolean;
}

/**
 * Saved metronome preset
 */
export interface MetronomePreset {
  /** Unique preset ID */
  id: string;
  /** User-defined name */
  name: string;
  /** Optional description */
  description: string | null;
  /** Full metronome configuration */
  config: MetronomeConfig;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Runtime metronome state
 */
export interface MetronomeState {
  /** Whether engine is initialized */
  initialized: boolean;
  /** Whether metronome is running */
  running: boolean;
  /** Current beat number in pattern */
  currentBeat: number;
  /** Timestamp of last beat (ms) */
  lastBeatTimestamp: number | null;
  /** Error message, if any */
  error: string | null;
  /** Whether video is playing */
  videoPlaying: boolean;
  /** Current video time (seconds) */
  videoCurrentTime: number;
}

/**
 * Visual beat effect data
 */
export interface BeatEffect {
  /** Intensity of the effect (0-1) */
  intensity: number;
  /** Timestamp when effect should trigger */
  timestamp: number;
  /** Duration of the effect (ms) */
  duration: number;
}
