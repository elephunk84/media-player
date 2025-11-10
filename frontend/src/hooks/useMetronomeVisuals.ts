/**
 * useMetronomeVisuals Hook
 *
 * Manages visual effect state and triggers renders on beats.
 */

import { useState, useEffect } from 'react';
import type { MetronomeEngine } from '../services/metronome/MetronomeEngine';
import type { VisualConfig, BeatEffect, BeatInfo } from '../types/metronome';

/**
 * useMetronomeVisuals hook return type
 */
export interface UseMetronomeVisualsReturn {
  /** Currently active visual effect, or null */
  activeEffect: BeatEffect | null;
}

/**
 * useMetronomeVisuals Hook
 *
 * Manages visual effects for metronome beats. Subscribes to beat events
 * and creates BeatEffect objects to trigger visual renders.
 *
 * @param engineRef - Reference to MetronomeEngine instance
 * @param visualConfig - Visual configuration
 * @param bpm - Current BPM (for calculating effect duration)
 * @returns Active beat effect
 */
export function useMetronomeVisuals(
  engineRef: React.MutableRefObject<MetronomeEngine | null>,
  visualConfig: VisualConfig,
  bpm: number
): UseMetronomeVisualsReturn {
  const [activeEffect, setActiveEffect] = useState<BeatEffect | null>(null);

  // Subscribe to beat events
  useEffect(() => {
    if (!engineRef.current) return;
    if (visualConfig.visualStyle === 'none') return;
    if ('enabled' in visualConfig && !visualConfig.enabled) return;

    const handleBeat = (beatInfo: BeatInfo) => {
      // Calculate effect duration (80% of beat duration)
      const beatDurationMs = (60 / bpm) * 1000;
      const effectDuration = beatDurationMs * 0.8;

      // Create beat effect
      const effect: BeatEffect = {
        intensity: beatInfo.volume,
        timestamp: beatInfo.timestamp,
        duration: effectDuration,
      };

      setActiveEffect(effect);

      // Clear effect after duration
      setTimeout(() => {
        setActiveEffect(null);
      }, effectDuration);
    };

    engineRef.current.on('beat', handleBeat);

    return () => {
      engineRef.current?.off('beat', handleBeat);
    };
  }, [engineRef, visualConfig, bpm]);

  return {
    activeEffect,
  };
}
