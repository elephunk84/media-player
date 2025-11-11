/**
 * Unit tests for MetronomeEngine
 *
 * Tests the core metronome timing engine with mocked Web Audio API.
 */

import { MetronomeEngine } from '../MetronomeEngine';
import type { MetronomeConfig, BeatInfo, BeatIntensity } from '../../../types/metronome';

// Type for accessing private properties in tests
type MetronomeEngineTestable = MetronomeEngine & {
  audioContext: AudioContext | null;
  currentBeatInPattern: number;
  paused: boolean;
  nextBeatTime: number;
  config: MetronomeConfig | null;
  beatListeners: Array<(beatInfo: BeatInfo) => void>;
};

// Mock Web Audio API
const mockAudioContext = {
  currentTime: 0,
  state: 'running' as AudioContextState,
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
};

// Store original setTimeout/clearTimeout
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

// Track scheduled timeouts for testing
let scheduledTimeouts: Array<{ callback: () => void; delay: number; id: number }> = [];
let nextTimeoutId = 1;

describe('MetronomeEngine', () => {
  beforeAll(() => {
    // Mock AudioContext
    (global as typeof globalThis & { AudioContext: typeof AudioContext }).AudioContext = jest.fn(() => mockAudioContext);
    (global as typeof globalThis & { webkitAudioContext: typeof AudioContext }).webkitAudioContext = jest.fn(() => mockAudioContext);
  });

  beforeEach(() => {
    // Reset mock state
    mockAudioContext.currentTime = 0;
    mockAudioContext.state = 'running';
    jest.clearAllMocks();

    // Reset timeout tracking
    scheduledTimeouts = [];
    nextTimeoutId = 1;

    // Mock setTimeout to track scheduled beats
    global.setTimeout = jest.fn((callback: () => void, delay: number) => {
      const id = nextTimeoutId++;
      scheduledTimeouts.push({ callback, delay, id });
      return id as unknown as NodeJS.Timeout;
    }) as typeof setTimeout;

    global.clearTimeout = jest.fn((id: number) => {
      scheduledTimeouts = scheduledTimeouts.filter(t => t.id !== id);
    });
  });

  afterEach(() => {
    // Restore original setTimeout/clearTimeout
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Constructor', () => {
    test('initializes without errors', () => {
      const engine = new MetronomeEngine();
      expect(engine).toBeDefined();
      expect(global.AudioContext).toHaveBeenCalled();
    });

    test('throws error if Web Audio API is not supported', () => {
      const globalWithAudio = global as typeof globalThis & { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext };
      const originalAudioContext = globalWithAudio.AudioContext;
      globalWithAudio.AudioContext = undefined as unknown as typeof AudioContext;
      globalWithAudio.webkitAudioContext = undefined as unknown as typeof AudioContext;

      expect(() => new MetronomeEngine()).toThrow('Web Audio API not supported');

      globalWithAudio.AudioContext = originalAudioContext;
    });

    test('handles AudioContext initialization failure', () => {
      const globalWithAudio = global as typeof globalThis & { AudioContext: typeof AudioContext };
      const originalAudioContext = globalWithAudio.AudioContext;
      globalWithAudio.AudioContext = jest.fn(() => {
        throw new Error('Context creation failed');
      }) as typeof AudioContext;

      expect(() => new MetronomeEngine()).toThrow('Failed to initialize AudioContext');

      globalWithAudio.AudioContext = originalAudioContext;
    });
  });

  describe('start()', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('starts metronome and schedules beats', () => {
      engine.start(config);

      expect(engine.isRunning()).toBe(true);
      expect(scheduledTimeouts.length).toBeGreaterThan(0);
    });

    test('resumes suspended AudioContext', () => {
      mockAudioContext.state = 'suspended';
      engine.start(config);

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    test('resets beat position to 0', () => {
      engine.start(config);
      expect(engine.getCurrentBeat()).toBe(0);
    });

    test('throws error if AudioContext is not initialized', () => {
      const brokenEngine = new MetronomeEngine();
      (brokenEngine as MetronomeEngineTestable).audioContext = null;

      expect(() => brokenEngine.start(config)).toThrow('AudioContext not initialized');
    });
  });

  describe('stop()', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('stops metronome', () => {
      engine.start(config);
      expect(engine.isRunning()).toBe(true);

      engine.stop();
      expect(engine.isRunning()).toBe(false);
    });

    test('clears scheduled timeouts', () => {
      engine.start(config);
      const beforeStop = scheduledTimeouts.length;

      engine.stop();

      expect(global.clearTimeout).toHaveBeenCalled();
      expect(beforeStop).toBeGreaterThan(0);
    });

    test('resets beat position', () => {
      engine.start(config);
      // Manually advance beat position
      (engine as MetronomeEngineTestable).currentBeatInPattern = 5;

      engine.stop();
      expect(engine.getCurrentBeat()).toBe(0);
    });
  });

  describe('pause() and resume()', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('pause() stops scheduling beats', () => {
      engine.start(config);
      expect(engine.isRunning()).toBe(true);

      engine.pause();
      expect(engine.isRunning()).toBe(false);
      expect((engine as MetronomeEngineTestable).paused).toBe(true);
    });

    test('pause() maintains beat position', () => {
      engine.start(config);
      (engine as MetronomeEngineTestable).currentBeatInPattern = 3;

      engine.pause();
      expect(engine.getCurrentBeat()).toBe(3);
    });

    test('resume() restarts scheduling from paused position', () => {
      engine.start(config);
      (engine as MetronomeEngineTestable).currentBeatInPattern = 3;
      engine.pause();

      scheduledTimeouts = []; // Clear old timeouts

      engine.resume();
      expect(engine.isRunning()).toBe(true);
      expect(scheduledTimeouts.length).toBeGreaterThan(0);
    });

    test('resume() does nothing if not paused', () => {
      engine.start(config);
      const timeoutsBefore = scheduledTimeouts.length;

      engine.resume(); // Call resume without pause

      // Should not affect anything
      expect(scheduledTimeouts.length).toBeGreaterThanOrEqual(timeoutsBefore);
    });

    test('pause() accounts for pause duration on resume', () => {
      engine.start(config);
      const pauseTime = mockAudioContext.currentTime;

      engine.pause();

      // Simulate time passing
      mockAudioContext.currentTime += 5;

      engine.resume();

      // Next beat time should be adjusted
      const testableEngine = engine as MetronomeEngineTestable;
      const nextBeatTime = testableEngine.nextBeatTime as number;
      expect(nextBeatTime).toBeGreaterThan(pauseTime);
    });
  });

  describe('Beat events', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('emits beat events to listeners', (done) => {
      const beatCallback = jest.fn((beatInfo: BeatInfo) => {
        expect(beatInfo).toHaveProperty('beatNumber');
        expect(beatInfo).toHaveProperty('intensity');
        expect(beatInfo).toHaveProperty('volume');
        expect(beatInfo).toHaveProperty('timestamp');
        done();
      });

      engine.on('beat', beatCallback);
      engine.start(config);

      // Execute first scheduled timeout to trigger beat
      if (scheduledTimeouts.length > 0) {
        scheduledTimeouts[0].callback();
      }
    });

    test('supports multiple beat listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      engine.on('beat', listener1);
      engine.on('beat', listener2);
      engine.on('beat', listener3);

      engine.start(config);

      // Trigger beat
      if (scheduledTimeouts.length > 0) {
        scheduledTimeouts[0].callback();
      }

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    test('off() removes beat listener', () => {
      const listener = jest.fn();

      engine.on('beat', listener);
      engine.off('beat', listener);

      engine.start(config);

      // Trigger beat
      if (scheduledTimeouts.length > 0) {
        scheduledTimeouts[0].callback();
      }

      expect(listener).not.toHaveBeenCalled();
    });

    test('handles errors in beat callbacks gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const safeCallback = jest.fn();

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      engine.on('beat', errorCallback);
      engine.on('beat', safeCallback);

      engine.start(config);

      // Trigger beat
      if (scheduledTimeouts.length > 0) {
        scheduledTimeouts[0].callback();
      }

      expect(errorCallback).toHaveBeenCalled();
      expect(safeCallback).toHaveBeenCalled(); // Should still be called
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('BPM updates', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('updateBPM() changes BPM in real-time', () => {
      engine.start(config);
      const testableEngine = engine as MetronomeEngineTestable;
      const engineConfig = testableEngine.config as MetronomeConfig;
      expect(engineConfig.bpm).toBe(60);

      engine.updateBPM(120);
      const updatedConfig = testableEngine.config as MetronomeConfig;
      expect(updatedConfig.bpm).toBe(120);
    });

    test('updateBPM() does nothing if not started', () => {
      engine.updateBPM(120);
      expect((engine as MetronomeEngineTestable).config).toBeNull();
    });
  });

  describe('Pattern updates', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('updatePattern() changes beat pattern', () => {
      engine.start(config);

      const newPattern = {
        beats: ['strong', 'light', 'medium', 'light'] as BeatIntensity[],
        length: 4,
        accentBeat: 1,
      };

      engine.updatePattern(newPattern);
      const testableEngine = engine as MetronomeEngineTestable;
      const engineConfig = testableEngine.config as MetronomeConfig;
      expect(engineConfig.pattern).toEqual(newPattern);
    });

    test('updatePattern() wraps beat position if pattern is shorter', () => {
      engine.start(config);
      (engine as MetronomeEngineTestable).currentBeatInPattern = 5;

      const shortPattern = {
        beats: ['strong', 'light'] as BeatIntensity[],
        length: 2,
        accentBeat: null,
      };

      engine.updatePattern(shortPattern);
      expect(engine.getCurrentBeat()).toBe(0); // Should wrap to 0
    });
  });

  describe('seekToBeat()', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
    });

    afterEach(() => {
      engine.dispose();
    });

    test('seeks to specific beat in pattern', () => {
      engine.start(config);

      engine.seekToBeat(3);
      expect(engine.getCurrentBeat()).toBe(3);
    });

    test('wraps beat number around pattern length', () => {
      engine.start(config);

      engine.seekToBeat(10); // Pattern length is 4
      expect(engine.getCurrentBeat()).toBe(2); // 10 % 4 = 2
    });
  });

  describe('dispose()', () => {
    test('cleans up all resources', () => {
      const engine = new MetronomeEngine();
      const config = createTestConfig();

      engine.start(config);
      const listener = jest.fn();
      engine.on('beat', listener);

      engine.dispose();

      expect(engine.isRunning()).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect((engine as MetronomeEngineTestable).audioContext).toBeNull();
      expect((engine as MetronomeEngineTestable).beatListeners).toEqual([]);
    });
  });

  describe('Beat intensity and volume', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
      config.patternEnabled = true;
      config.pattern = {
        beats: ['strong', 'light', 'medium', 'silent'],
        length: 4,
        accentBeat: 1, // Accent first beat
      };
    });

    afterEach(() => {
      engine.dispose();
    });

    test('calculates correct intensity from pattern', (done) => {
      const beatInfos: BeatInfo[] = [];

      engine.on('beat', (info) => {
        beatInfos.push(info);

        if (beatInfos.length === 4) {
          expect(beatInfos[0].intensity).toBe('strong');
          expect(beatInfos[1].intensity).toBe('light');
          expect(beatInfos[2].intensity).toBe('medium');
          expect(beatInfos[3].intensity).toBe('silent');
          done();
        }
      });

      engine.start(config);

      // Execute first 4 beat callbacks
      scheduledTimeouts.slice(0, 4).forEach(t => t.callback());
    });

    test('applies volume variation based on intensity', () => {
      config.audio.volumeVariation = true;
      config.audio.volumeMap = {
        silent: 0,
        light: 0.3,
        medium: 0.6,
        strong: 1.0,
      };

      const beatInfos: BeatInfo[] = [];

      engine.on('beat', (info) => {
        beatInfos.push(info);
      });

      engine.start(config);

      // Execute beats
      scheduledTimeouts.slice(0, 4).forEach(t => t.callback());

      expect(beatInfos[0].volume).toBe(1.0);  // strong
      expect(beatInfos[1].volume).toBe(0.3);  // light
      expect(beatInfos[2].volume).toBe(0.6);  // medium
      expect(beatInfos[3].volume).toBe(0);    // silent
    });

    test('returns volume 1 when volume variation is disabled', () => {
      config.audio.volumeVariation = false;

      const beatInfos: BeatInfo[] = [];

      engine.on('beat', (info) => {
        beatInfos.push(info);
      });

      engine.start(config);
      scheduledTimeouts.slice(0, 3).forEach(t => t.callback());

      // All non-silent beats should have volume 1
      expect(beatInfos[0].volume).toBe(1);  // strong
      expect(beatInfos[1].volume).toBe(1);  // light
      expect(beatInfos[2].volume).toBe(1);  // medium
    });
  });

  describe('Beat position advancement', () => {
    let engine: MetronomeEngine;
    let config: MetronomeConfig;

    beforeEach(() => {
      engine = new MetronomeEngine();
      config = createTestConfig();
      config.pattern = {
        beats: ['strong', 'light', 'medium', 'light'],
        length: 4,
        accentBeat: null,
      };
    });

    afterEach(() => {
      engine.dispose();
    });

    test('advances beat position through pattern', (done) => {
      const positions: number[] = [];

      engine.on('beat', (info) => {
        positions.push(info.beatNumber);

        if (positions.length === 8) {
          // Should cycle through pattern twice
          expect(positions).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
          done();
        }
      });

      engine.start(config);
      scheduledTimeouts.slice(0, 8).forEach(t => t.callback());
    });
  });
});

/**
 * Create a test configuration
 */
function createTestConfig(): MetronomeConfig {
  return {
    bpm: 60,
    enabled: true,
    pattern: {
      beats: ['strong', 'light', 'medium', 'light'],
      length: 4,
      accentBeat: 1,
    },
    patternEnabled: false,
    randomization: 0,
    randomizationEnabled: false,
    tempoChange: {
      mode: 'accelerate',
      changePerMinute: 0,
      minBPM: 30,
      maxBPM: 300,
      resetOnStop: true,
    },
    tempoChangeEnabled: false,
    audio: {
      soundType: 'click',
      customSoundUrl: null,
      masterVolume: 1,
      muted: false,
      volumeVariation: false,
      volumeMap: {
        silent: 0,
        light: 0.5,
        medium: 0.75,
        strong: 1.0,
      },
    },
    visual: {
      visualStyle: 'none',
    },
    syncToVideo: true,
    continuousMode: false,
  };
}
