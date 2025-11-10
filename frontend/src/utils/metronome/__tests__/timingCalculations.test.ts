/**
 * Unit tests for timing calculation utilities
 *
 * Tests all pure timing functions used by the metronome system.
 */

import {
  bpmToMilliseconds,
  millisecondsToBPM,
  calculateBeatDuration,
  applyTempoChange,
  calculateBeatFromTime,
  validateBPM,
  calculateBPMFromDuration,
} from '../timingCalculations';
import type { TempoChangeConfig } from '../../../types/metronome';

describe('bpmToMilliseconds', () => {
  test('converts 60 BPM to 1000ms', () => {
    expect(bpmToMilliseconds(60)).toBe(1000);
  });

  test('converts 120 BPM to 500ms', () => {
    expect(bpmToMilliseconds(120)).toBe(500);
  });

  test('converts 30 BPM to 2000ms', () => {
    expect(bpmToMilliseconds(30)).toBe(2000);
  });

  test('converts 300 BPM to 200ms', () => {
    expect(bpmToMilliseconds(300)).toBe(200);
  });

  test('handles decimal BPM values', () => {
    const result = bpmToMilliseconds(90);
    expect(result).toBeCloseTo(666.67, 1);
  });

  test('throws error for BPM below 30', () => {
    expect(() => bpmToMilliseconds(29)).toThrow('BPM must be between 30 and 300');
  });

  test('throws error for BPM above 300', () => {
    expect(() => bpmToMilliseconds(301)).toThrow('BPM must be between 30 and 300');
  });

  test('throws error for negative BPM', () => {
    expect(() => bpmToMilliseconds(-60)).toThrow();
  });

  test('throws error for zero BPM', () => {
    expect(() => bpmToMilliseconds(0)).toThrow();
  });
});

describe('millisecondsToBPM', () => {
  test('converts 1000ms to 60 BPM', () => {
    expect(millisecondsToBPM(1000)).toBe(60);
  });

  test('converts 500ms to 120 BPM', () => {
    expect(millisecondsToBPM(500)).toBe(120);
  });

  test('converts 2000ms to 30 BPM', () => {
    expect(millisecondsToBPM(2000)).toBe(30);
  });

  test('converts 200ms to 300 BPM', () => {
    expect(millisecondsToBPM(200)).toBe(300);
  });

  test('handles decimal milliseconds', () => {
    const result = millisecondsToBPM(666.67);
    expect(result).toBeCloseTo(90, 0);
  });

  test('throws error for zero milliseconds', () => {
    expect(() => millisecondsToBPM(0)).toThrow('Milliseconds must be positive');
  });

  test('throws error for negative milliseconds', () => {
    expect(() => millisecondsToBPM(-500)).toThrow('Milliseconds must be positive');
  });
});

describe('calculateBeatDuration', () => {
  test('returns exact duration when randomization is 0', () => {
    expect(calculateBeatDuration(60, 0)).toBe(1000);
  });

  test('returns duration within randomization range for 20%', () => {
    // Run multiple times to test randomization
    for (let i = 0; i < 100; i++) {
      const duration = calculateBeatDuration(60, 20);
      expect(duration).toBeGreaterThanOrEqual(800); // 1000 - 20%
      expect(duration).toBeLessThanOrEqual(1200);   // 1000 + 20%
    }
  });

  test('returns duration within randomization range for 50%', () => {
    for (let i = 0; i < 100; i++) {
      const duration = calculateBeatDuration(120, 50);
      expect(duration).toBeGreaterThanOrEqual(250); // 500 - 50%
      expect(duration).toBeLessThanOrEqual(750);    // 500 + 50%
    }
  });

  test('clamps randomization above 50% to 50%', () => {
    // Even with 100% randomization, should clamp to 50%
    for (let i = 0; i < 100; i++) {
      const duration = calculateBeatDuration(60, 100);
      expect(duration).toBeGreaterThanOrEqual(500);  // 1000 - 50%
      expect(duration).toBeLessThanOrEqual(1500);    // 1000 + 50%
    }
  });

  test('clamps negative randomization to 0', () => {
    const duration = calculateBeatDuration(60, -20);
    expect(duration).toBe(1000); // Should be exact (no randomization)
  });

  test('handles edge case BPM values with randomization', () => {
    // Test with minimum BPM
    for (let i = 0; i < 50; i++) {
      const duration = calculateBeatDuration(30, 20);
      expect(duration).toBeGreaterThanOrEqual(1600); // 2000 - 20%
      expect(duration).toBeLessThanOrEqual(2400);    // 2000 + 20%
    }

    // Test with maximum BPM
    for (let i = 0; i < 50; i++) {
      const duration = calculateBeatDuration(300, 20);
      expect(duration).toBeGreaterThanOrEqual(160);  // 200 - 20%
      expect(duration).toBeLessThanOrEqual(240);     // 200 + 20%
    }
  });
});

describe('applyTempoChange', () => {
  const baseConfig: TempoChangeConfig = {
    mode: 'accelerate',
    changePerMinute: 10,
    minBPM: 30,
    maxBPM: 300,
    resetOnStop: true,
  };

  describe('accelerate mode', () => {
    test('increases BPM over time', () => {
      const config = { ...baseConfig, mode: 'accelerate' as const };
      expect(applyTempoChange(60, config, 0)).toBe(60);
      expect(applyTempoChange(60, config, 1)).toBe(70);
      expect(applyTempoChange(60, config, 2)).toBe(80);
      expect(applyTempoChange(60, config, 5)).toBe(110);
    });

    test('does not exceed maxBPM', () => {
      const config = { ...baseConfig, mode: 'accelerate' as const, maxBPM: 100 };
      const result = applyTempoChange(95, config, 10);
      expect(result).toBe(100);
    });

    test('handles fractional elapsed minutes', () => {
      const config = { ...baseConfig, mode: 'accelerate' as const };
      expect(applyTempoChange(60, config, 0.5)).toBe(65);
      expect(applyTempoChange(60, config, 1.5)).toBe(75);
    });
  });

  describe('decelerate mode', () => {
    test('decreases BPM over time', () => {
      const config = { ...baseConfig, mode: 'decelerate' as const };
      expect(applyTempoChange(100, config, 0)).toBe(100);
      expect(applyTempoChange(100, config, 1)).toBe(90);
      expect(applyTempoChange(100, config, 2)).toBe(80);
      expect(applyTempoChange(100, config, 5)).toBe(50);
    });

    test('does not go below minBPM', () => {
      const config = { ...baseConfig, mode: 'decelerate' as const, minBPM: 40 };
      const result = applyTempoChange(50, config, 10);
      expect(result).toBe(40);
    });

    test('handles fractional elapsed minutes', () => {
      const config = { ...baseConfig, mode: 'decelerate' as const };
      expect(applyTempoChange(100, config, 0.5)).toBe(95);
      expect(applyTempoChange(100, config, 1.5)).toBe(85);
    });
  });

  describe('cycle mode', () => {
    test('oscillates between minBPM and maxBPM', () => {
      const config: TempoChangeConfig = {
        mode: 'cycle',
        changePerMinute: 0, // Not used in cycle mode
        minBPM: 60,
        maxBPM: 120,
        resetOnStop: true,
      };

      // At 0 minutes, should be near minBPM
      const result0 = applyTempoChange(90, config, 0);
      expect(result0).toBeCloseTo(60, 0);

      // At 0.5 minutes (quarter cycle), should be at midpoint
      const result05 = applyTempoChange(90, config, 0.5);
      expect(result05).toBeCloseTo(90, 0);

      // At 1 minute (half cycle), should be near maxBPM
      const result1 = applyTempoChange(90, config, 1);
      expect(result1).toBeCloseTo(120, 0);

      // At 1.5 minutes (three-quarter cycle), should be at midpoint again
      const result15 = applyTempoChange(90, config, 1.5);
      expect(result15).toBeCloseTo(90, 0);

      // At 2 minutes (full cycle), should be back near minBPM
      const result2 = applyTempoChange(90, config, 2);
      expect(result2).toBeCloseTo(60, 0);
    });

    test('respects min and max BPM bounds', () => {
      const config: TempoChangeConfig = {
        mode: 'cycle',
        changePerMinute: 0,
        minBPM: 50,
        maxBPM: 150,
        resetOnStop: true,
      };

      for (let time = 0; time <= 4; time += 0.1) {
        const result = applyTempoChange(100, config, time);
        expect(result).toBeGreaterThanOrEqual(50);
        expect(result).toBeLessThanOrEqual(150);
      }
    });
  });

  test('respects bounds for all modes', () => {
    const configs = [
      { ...baseConfig, mode: 'accelerate' as const },
      { ...baseConfig, mode: 'decelerate' as const },
      { ...baseConfig, mode: 'cycle' as const },
    ];

    configs.forEach((config) => {
      const result = applyTempoChange(200, config, 100);
      expect(result).toBeGreaterThanOrEqual(config.minBPM);
      expect(result).toBeLessThanOrEqual(config.maxBPM);
    });
  });
});

describe('calculateBeatFromTime', () => {
  test('calculates beat 0 at time 0', () => {
    expect(calculateBeatFromTime(0, 60)).toBe(0);
  });

  test('calculates beat 1 at time 1 second for 60 BPM', () => {
    expect(calculateBeatFromTime(1, 60)).toBe(1);
  });

  test('calculates beat 2 at time 2 seconds for 60 BPM', () => {
    expect(calculateBeatFromTime(2, 60)).toBe(2);
  });

  test('calculates beat 2 at time 1 second for 120 BPM', () => {
    expect(calculateBeatFromTime(1, 120)).toBe(2);
  });

  test('calculates beat 5 at time 2.5 seconds for 120 BPM', () => {
    expect(calculateBeatFromTime(2.5, 120)).toBe(5);
  });

  test('calculates beat 1 at time 2 seconds for 30 BPM', () => {
    expect(calculateBeatFromTime(2, 30)).toBe(1);
  });

  test('calculates beat 10 at time 2 seconds for 300 BPM', () => {
    expect(calculateBeatFromTime(2, 300)).toBe(10);
  });

  test('floors fractional beats', () => {
    // 1.5 seconds at 60 BPM = 1.5 beats, should floor to 1
    expect(calculateBeatFromTime(1.5, 60)).toBe(1);

    // 2.9 seconds at 60 BPM = 2.9 beats, should floor to 2
    expect(calculateBeatFromTime(2.9, 60)).toBe(2);
  });

  test('returns 0 for negative time', () => {
    expect(calculateBeatFromTime(-5, 60)).toBe(0);
  });

  test('handles large time values', () => {
    // 60 seconds at 120 BPM = 120 beats
    expect(calculateBeatFromTime(60, 120)).toBe(120);

    // 600 seconds (10 minutes) at 90 BPM = 900 beats
    expect(calculateBeatFromTime(600, 90)).toBe(900);
  });
});

describe('validateBPM', () => {
  test('returns true for valid BPM values', () => {
    expect(validateBPM(30)).toBe(true);
    expect(validateBPM(60)).toBe(true);
    expect(validateBPM(120)).toBe(true);
    expect(validateBPM(300)).toBe(true);
  });

  test('returns true for decimal BPM values within range', () => {
    expect(validateBPM(90.5)).toBe(true);
    expect(validateBPM(120.25)).toBe(true);
  });

  test('returns false for BPM below 30', () => {
    expect(validateBPM(29)).toBe(false);
    expect(validateBPM(0)).toBe(false);
    expect(validateBPM(29.9)).toBe(false);
  });

  test('returns false for BPM above 300', () => {
    expect(validateBPM(301)).toBe(false);
    expect(validateBPM(300.1)).toBe(false);
    expect(validateBPM(500)).toBe(false);
  });

  test('returns false for negative BPM', () => {
    expect(validateBPM(-60)).toBe(false);
  });

  test('returns false for non-number values', () => {
    expect(validateBPM(NaN)).toBe(false);
    expect(validateBPM(Infinity)).toBe(false);
    expect(validateBPM(-Infinity)).toBe(false);
  });

  test('returns false for invalid types (type coercion test)', () => {
    // @ts-expect-error - Testing runtime behavior
    expect(validateBPM('60')).toBe(false);
    // @ts-expect-error - Testing runtime behavior
    expect(validateBPM(null)).toBe(false);
    // @ts-expect-error - Testing runtime behavior
    expect(validateBPM(undefined)).toBe(false);
  });
});

describe('calculateBPMFromDuration', () => {
  test('calculates 60 BPM from 1 second duration', () => {
    expect(calculateBPMFromDuration(1)).toBe(60);
  });

  test('calculates 120 BPM from 0.5 second duration', () => {
    expect(calculateBPMFromDuration(0.5)).toBe(120);
  });

  test('calculates 30 BPM from 2 second duration', () => {
    expect(calculateBPMFromDuration(2)).toBe(30);
  });

  test('calculates 300 BPM from 0.2 second duration', () => {
    expect(calculateBPMFromDuration(0.2)).toBe(300);
  });

  test('handles decimal durations', () => {
    const result = calculateBPMFromDuration(0.666667);
    expect(result).toBeCloseTo(90, 0);
  });

  test('throws error for zero duration', () => {
    expect(() => calculateBPMFromDuration(0)).toThrow('Duration must be positive');
  });

  test('throws error for negative duration', () => {
    expect(() => calculateBPMFromDuration(-1)).toThrow('Duration must be positive');
  });

  test('calculates very fast tempos from small durations', () => {
    const result = calculateBPMFromDuration(0.1);
    expect(result).toBe(600);
  });

  test('calculates very slow tempos from large durations', () => {
    const result = calculateBPMFromDuration(10);
    expect(result).toBe(6);
  });
});

describe('Integration tests', () => {
  test('bpmToMilliseconds and millisecondsToBPM are inverses', () => {
    const testBPMs = [30, 60, 90, 120, 180, 240, 300];

    testBPMs.forEach((bpm) => {
      const ms = bpmToMilliseconds(bpm);
      const convertedBPM = millisecondsToBPM(ms);
      expect(convertedBPM).toBeCloseTo(bpm, 5);
    });
  });

  test('calculateBPMFromDuration is inverse of beat duration at 60 seconds', () => {
    const testBPMs = [30, 60, 90, 120, 180, 240, 300];

    testBPMs.forEach((bpm) => {
      const durationSeconds = 60 / bpm;
      const calculatedBPM = calculateBPMFromDuration(durationSeconds);
      expect(calculatedBPM).toBeCloseTo(bpm, 5);
    });
  });

  test('calculateBeatFromTime produces sequential beat numbers', () => {
    const bpm = 60;
    const duration = 10; // 10 seconds

    let previousBeat = -1;
    for (let time = 0; time <= duration; time += 0.1) {
      const beat = calculateBeatFromTime(time, bpm);
      expect(beat).toBeGreaterThanOrEqual(previousBeat);
      previousBeat = beat;
    }
  });

  test('tempo change modes produce valid BPM values', () => {
    const config: TempoChangeConfig = {
      mode: 'accelerate',
      changePerMinute: 20,
      minBPM: 40,
      maxBPM: 200,
      resetOnStop: true,
    };

    const modes: Array<'accelerate' | 'decelerate' | 'cycle'> = [
      'accelerate',
      'decelerate',
      'cycle',
    ];

    modes.forEach((mode) => {
      const modeConfig = { ...config, mode };

      for (let time = 0; time <= 10; time += 0.5) {
        const newBPM = applyTempoChange(100, modeConfig, time);
        expect(validateBPM(newBPM) || (newBPM >= 40 && newBPM <= 200)).toBe(true);
      }
    });
  });
});
