/**
 * useMetronome Hook
 *
 * Main orchestration hook for metronome functionality.
 * Manages metronome engine, configuration, and video player synchronization.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MetronomeEngine } from '../services/metronome/MetronomeEngine';
import type { UseVideoPlayerReturn } from './useVideoPlayer';
import type { MetronomeConfig, BeatInfo } from '../types/metronome';

/**
 * Default metronome configuration
 */
const DEFAULT_CONFIG: MetronomeConfig = {
  bpm: 60,
  enabled: false,
  pattern: {
    beats: ['strong', 'medium', 'medium', 'light'],
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
    masterVolume: 0.7,
    muted: false,
    volumeVariation: true,
    volumeMap: {
      silent: 0,
      light: 0.25,
      medium: 0.5,
      strong: 1.0,
    },
  },
  visual: {
    enabled: true,
    visualStyle: 'flash',
    color: '#ffffff',
    opacity: 0.3,
  },
  syncToVideo: true,
  continuousMode: false,
};

/**
 * useMetronome hook return type
 */
export interface UseMetronomeReturn {
  // State
  /** Whether metronome is enabled */
  enabled: boolean;
  /** Current metronome configuration */
  config: MetronomeConfig;
  /** Current beat number in pattern (0-based) */
  currentBeat: number;
  /** Whether metronome is currently running */
  isRunning: boolean;

  // Controls
  /** Toggle metronome on/off */
  toggle: () => void;
  /** Start metronome */
  start: () => void;
  /** Stop metronome */
  stop: () => void;
  /** Update configuration (partial update) */
  updateConfig: (partial: Partial<MetronomeConfig>) => void;

  // Engine reference for other hooks
  /** Reference to MetronomeEngine instance */
  engineRef: React.MutableRefObject<MetronomeEngine | null>;
}

/**
 * useMetronome Hook
 *
 * Orchestrates metronome functionality including engine management,
 * video player synchronization, and configuration updates.
 *
 * @param playerState - Video player state from useVideoPlayer hook
 * @returns Metronome state and control methods
 *
 * @example
 * ```typescript
 * const player = useVideoPlayer();
 * const metronome = useMetronome(player);
 *
 * // Toggle metronome
 * metronome.toggle();
 *
 * // Update BPM
 * metronome.updateConfig({ bpm: 120 });
 * ```
 */
export function useMetronome(playerState: UseVideoPlayerReturn): UseMetronomeReturn {
  const [config, setConfig] = useState<MetronomeConfig>(DEFAULT_CONFIG);
  const [enabled, setEnabled] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const engineRef = useRef<MetronomeEngine | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    try {
      engineRef.current = new MetronomeEngine();
    } catch (error) {
      console.error('Failed to initialize MetronomeEngine:', error);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Subscribe to beat events
  useEffect(() => {
    if (!engineRef.current) {
      return;
    }

    const handleBeat = (beatInfo: BeatInfo) => {
      setCurrentBeat(beatInfo.beatNumber);
    };

    engineRef.current.on('beat', handleBeat);

    return () => {
      engineRef.current?.off('beat', handleBeat);
    };
  }, []);

  // Sync with video player play/pause
  useEffect(() => {
    if (!config.syncToVideo || !engineRef.current || !enabled) {
      return;
    }

    const engine = engineRef.current;

    if (playerState.playing && !isRunning) {
      // Video started playing - resume metronome
      if (engine.getCurrentBeat() > 0) {
        // Resume from where we left off
        engine.resume();
      } else {
        // Start fresh
        engine.start(config);
      }
      setIsRunning(true);
    } else if (!playerState.playing && isRunning) {
      // Video paused - pause metronome unless in continuous mode
      if (!config.continuousMode) {
        engine.pause();
        setIsRunning(false);
      }
    }
  }, [playerState.playing, config.syncToVideo, config.continuousMode, enabled, isRunning, config]);

  // Sync with video seek
  useEffect(() => {
    if (!config.syncToVideo || !engineRef.current || !enabled) {
      return;
    }

    // Calculate which beat should be playing at current video time
    // This provides synchronization on video seek
    const beatsPerSecond = config.bpm / 60;
    const totalBeats = Math.floor(playerState.currentTime * beatsPerSecond);
    const beatInPattern = totalBeats % config.pattern.length;

    engineRef.current.seekToBeat(beatInPattern);
  }, [playerState.currentTime, config.syncToVideo, config.bpm, config.pattern.length, enabled]);

  // Toggle metronome enabled state
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newEnabled = !prev;

      if (!newEnabled && engineRef.current) {
        // Disabling - stop metronome
        engineRef.current.stop();
        setIsRunning(false);
      } else if (newEnabled && engineRef.current) {
        // Enabling - start if video is playing or continuous mode
        if (playerState.playing || config.continuousMode) {
          engineRef.current.start(config);
          setIsRunning(true);
        }
      }

      return newEnabled;
    });
  }, [playerState.playing, config]);

  // Start metronome
  const start = useCallback(() => {
    if (!engineRef.current) {
      return;
    }

    try {
      engineRef.current.start(config);
      setEnabled(true);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start metronome:', error);
    }
  }, [config]);

  // Stop metronome
  const stop = useCallback(() => {
    if (!engineRef.current) {
      return;
    }

    engineRef.current.stop();
    setEnabled(false);
    setIsRunning(false);
    setCurrentBeat(0);
  }, []);

  // Update configuration
  const updateConfig = useCallback((partial: Partial<MetronomeConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...partial };

      // Apply real-time updates to running engine
      if (engineRef.current && isRunning) {
        if (partial.bpm !== undefined) {
          engineRef.current.updateBPM(partial.bpm);
        }
        if (partial.pattern !== undefined) {
          engineRef.current.updatePattern(partial.pattern);
        }
      }

      return newConfig;
    });
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
