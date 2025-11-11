/**
 * Timing calculation utilities for the metronome system
 *
 * Pure functions for BPM/timing conversions and calculations.
 * All functions are side-effect free and fully testable.
 */

import type { TempoChangeConfig } from '../../types/metronome';

/**
 * Convert BPM to milliseconds per beat
 *
 * @param bpm - Beats per minute (30-300)
 * @returns Milliseconds per beat
 * @throws {Error} If BPM is out of valid range
 *
 * @example
 * ```typescript
 * bpmToMilliseconds(60);   // Returns 1000
 * bpmToMilliseconds(120);  // Returns 500
 * ```
 */
export function bpmToMilliseconds(bpm: number): number {
  if (!validateBPM(bpm)) {
    throw new Error(`BPM must be between 30 and 300, got ${bpm}`);
  }
  return (60 / bpm) * 1000;
}

/**
 * Convert milliseconds to BPM
 *
 * @param ms - Milliseconds per beat
 * @returns Beats per minute
 *
 * @example
 * ```typescript
 * millisecondsToBPM(1000);  // Returns 60
 * millisecondsToBPM(500);   // Returns 120
 * ```
 */
export function millisecondsToBPM(ms: number): number {
  if (ms <= 0) {
    throw new Error(`Milliseconds must be positive, got ${ms}`);
  }
  return (60 / ms) * 1000;
}

/**
 * Calculate beat duration with optional randomization
 *
 * @param bpm - Beats per minute (30-300)
 * @param randomization - Percentage of randomization (0-50)
 * @returns Beat duration in milliseconds
 *
 * @example
 * ```typescript
 * calculateBeatDuration(60, 0);    // Returns 1000 (exact)
 * calculateBeatDuration(60, 20);   // Returns 800-1200 (±20%)
 * ```
 */
export function calculateBeatDuration(bpm: number, randomization: number): number {
  const baseDuration = bpmToMilliseconds(bpm);

  if (randomization === 0) {
    return baseDuration;
  }

  // Clamp randomization to valid range
  const clampedRandomization = Math.max(0, Math.min(50, randomization));

  // Calculate variation range
  const variation = baseDuration * (clampedRandomization / 100);

  // Generate random offset: -variation to +variation
  const randomOffset = (Math.random() * 2 - 1) * variation;

  return baseDuration + randomOffset;
}

/**
 * Apply tempo change based on configuration
 *
 * @param currentBPM - Current BPM
 * @param config - Tempo change configuration
 * @param elapsedMinutes - Time elapsed since start (in minutes)
 * @returns New BPM after applying tempo change
 *
 * @example
 * ```typescript
 * const config = {
 *   mode: 'accelerate',
 *   changePerMinute: 10,
 *   minBPM: 30,
 *   maxBPM: 300,
 *   resetOnStop: true
 * };
 * applyTempoChange(60, config, 1);  // Returns 70
 * ```
 */
export function applyTempoChange(
  currentBPM: number,
  config: TempoChangeConfig,
  elapsedMinutes: number
): number {
  let newBPM = currentBPM;

  switch (config.mode) {
    case 'accelerate': {
      newBPM = currentBPM + config.changePerMinute * elapsedMinutes;
      break;
    }

    case 'decelerate': {
      newBPM = currentBPM - config.changePerMinute * elapsedMinutes;
      break;
    }

    case 'cycle': {
      // Oscillate between min and max BPM
      // Complete cycle every 2 minutes
      const range = config.maxBPM - config.minBPM;
      const cycles = elapsedMinutes / 2;
      const phase = (cycles % 1) * Math.PI * 2;
      newBPM = config.minBPM + (range / 2) * (1 + Math.sin(phase));
      break;
    }
  }

  // Clamp to configured bounds
  return Math.max(config.minBPM, Math.min(config.maxBPM, newBPM));
}

/**
 * Calculate which beat should be playing at a given time
 *
 * Used for synchronizing with video seek operations.
 *
 * @param timeSeconds - Time in seconds
 * @param bpm - Beats per minute
 * @returns Beat number (0-based)
 *
 * @example
 * ```typescript
 * calculateBeatFromTime(0, 60);     // Returns 0
 * calculateBeatFromTime(1, 60);     // Returns 1
 * calculateBeatFromTime(2.5, 120);  // Returns 5
 * ```
 */
export function calculateBeatFromTime(timeSeconds: number, bpm: number): number {
  if (timeSeconds < 0) {
    return 0;
  }

  const beatsPerSecond = bpm / 60;
  return Math.floor(timeSeconds * beatsPerSecond);
}

/**
 * Validate BPM is in valid range
 *
 * @param bpm - Beats per minute to validate
 * @returns True if BPM is valid (30-300)
 *
 * @example
 * ```typescript
 * validateBPM(60);   // Returns true
 * validateBPM(29);   // Returns false
 * validateBPM(301);  // Returns false
 * ```
 */
export function validateBPM(bpm: number): boolean {
  return typeof bpm === 'number' && bpm >= 30 && bpm <= 300;
}

/**
 * Calculate the tempo in BPM from a duration
 *
 * Useful for determining BPM from tap tempo or measured intervals.
 *
 * @param durationSeconds - Duration in seconds
 * @returns BPM
 *
 * @example
 * ```typescript
 * calculateBPMFromDuration(1);     // Returns 60
 * calculateBPMFromDuration(0.5);   // Returns 120
 * ```
 */
export function calculateBPMFromDuration(durationSeconds: number): number {
  if (durationSeconds <= 0) {
    throw new Error('Duration must be positive');
  }
  return 60 / durationSeconds;
}
