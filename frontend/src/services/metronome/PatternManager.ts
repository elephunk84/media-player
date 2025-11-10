/**
 * PatternManager - Beat pattern validation and processing
 *
 * Handles validation, intensity mapping, and pattern manipulation
 * for the metronome system.
 */

import type { BeatPattern, BeatIntensity, AudioConfig } from '../../types/metronome';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
}

/**
 * PatternManager class
 *
 * Provides utilities for validating and processing beat patterns
 */
export class PatternManager {
  /**
   * Validate a beat pattern
   *
   * Checks pattern structure, length, and beat intensities
   *
   * @param pattern - Pattern to validate
   * @returns Validation result with errors if any
   *
   * @example
   * ```typescript
   * const manager = new PatternManager();
   * const result = manager.validatePattern({
   *   beats: ['strong', 'medium', 'medium', 'light'],
   *   length: 4,
   *   accentBeat: 1
   * });
   * // result.valid === true
   * ```
   */
  validatePattern(pattern: BeatPattern): ValidationResult {
    const errors: string[] = [];

    // Check pattern length
    if (pattern.length < 2 || pattern.length > 32) {
      errors.push('Pattern length must be between 2 and 32');
    }

    // Check beats array length matches pattern length
    if (pattern.beats.length !== pattern.length) {
      errors.push(`Beats array length (${pattern.beats.length}) must match pattern length (${pattern.length})`);
    }

    // Validate each beat intensity
    const validIntensities: BeatIntensity[] = ['light', 'medium', 'strong', 'silent'];
    pattern.beats.forEach((beat, index) => {
      if (!validIntensities.includes(beat)) {
        errors.push(`Invalid intensity at position ${index}: "${beat}". Must be one of: ${validIntensities.join(', ')}`);
      }
    });

    // Validate accent beat if present
    if (pattern.accentBeat !== null) {
      if (pattern.accentBeat < 1 || pattern.accentBeat > pattern.length) {
        errors.push(`Accent beat (${pattern.accentBeat}) must be between 1 and pattern length (${pattern.length})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get volume for a given intensity using volume map
   *
   * @param intensity - Beat intensity
   * @param volumeMap - Volume mapping configuration
   * @returns Volume value (0-1)
   *
   * @example
   * ```typescript
   * const manager = new PatternManager();
   * const volume = manager.getIntensityVolume('medium', {
   *   silent: 0,
   *   light: 0.25,
   *   medium: 0.5,
   *   strong: 1.0
   * });
   * // volume === 0.5
   * ```
   */
  getIntensityVolume(intensity: BeatIntensity, volumeMap: AudioConfig['volumeMap']): number {
    switch (intensity) {
      case 'silent':
        return 0;
      case 'light':
        return volumeMap.light;
      case 'medium':
        return volumeMap.medium;
      case 'strong':
        return volumeMap.strong;
      default:
        // This should never happen with proper TypeScript usage
        return 0;
    }
  }

  /**
   * Apply accent boost to intensity
   *
   * Increases intensity level by one step for accented beats
   * (silent and strong are special cases)
   *
   * @param intensity - Base intensity
   * @param isAccent - Whether this is an accented beat
   * @returns Boosted intensity if accent, otherwise original
   *
   * @example
   * ```typescript
   * const manager = new PatternManager();
   * manager.applyAccent('light', true);    // Returns 'medium'
   * manager.applyAccent('medium', true);   // Returns 'strong'
   * manager.applyAccent('strong', true);   // Returns 'strong'
   * manager.applyAccent('silent', true);   // Returns 'silent'
   * manager.applyAccent('light', false);   // Returns 'light'
   * ```
   */
  applyAccent(intensity: BeatIntensity, isAccent: boolean): BeatIntensity {
    if (!isAccent) {
      return intensity;
    }

    switch (intensity) {
      case 'silent':
        // Silent beats stay silent even with accent
        return 'silent';
      case 'light':
        return 'medium';
      case 'medium':
        return 'strong';
      case 'strong':
        // Already at maximum intensity
        return 'strong';
      default:
        return intensity;
    }
  }

  /**
   * Create a default beat pattern
   *
   * @param length - Pattern length (2-32)
   * @returns Default pattern with all strong beats
   */
  createDefaultPattern(length: number): BeatPattern {
    // Clamp length to valid range
    const validLength = Math.max(2, Math.min(32, length));

    return {
      beats: Array(validLength).fill('strong') as BeatIntensity[],
      length: validLength,
      accentBeat: 1, // Accent first beat by default
    };
  }

  /**
   * Create a common 4/4 time signature pattern
   *
   * Strong beat on 1, medium on 2 and 4, light on 3
   *
   * @returns 4/4 time pattern
   */
  create4_4Pattern(): BeatPattern {
    return {
      beats: ['strong', 'medium', 'light', 'medium'],
      length: 4,
      accentBeat: 1,
    };
  }

  /**
   * Create a common 3/4 time signature pattern (waltz)
   *
   * Strong beat on 1, medium on 2 and 3
   *
   * @returns 3/4 time pattern
   */
  create3_4Pattern(): BeatPattern {
    return {
      beats: ['strong', 'medium', 'medium'],
      length: 3,
      accentBeat: 1,
    };
  }

  /**
   * Create a common 6/8 time signature pattern
   *
   * Strong beat on 1, medium on 4, light on others
   *
   * @returns 6/8 time pattern
   */
  create6_8Pattern(): BeatPattern {
    return {
      beats: ['strong', 'light', 'light', 'medium', 'light', 'light'],
      length: 6,
      accentBeat: 1,
    };
  }
}
