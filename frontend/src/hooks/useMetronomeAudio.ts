/**
 * useMetronomeAudio Hook
 *
 * Manages audio playback for metronome beats.
 * Connects AudioScheduler to MetronomeEngine beat events.
 */

import { useEffect, useRef, useState } from 'react';
import { AudioScheduler } from '../services/metronome/AudioScheduler';
import { PatternManager } from '../services/metronome/PatternManager';
import type { MetronomeEngine } from '../services/metronome/MetronomeEngine';
import type { AudioConfig, SoundType, BeatInfo } from '../types/metronome';

/**
 * useMetronomeAudio hook return type
 */
export interface UseMetronomeAudioReturn {
  /** Reference to AudioScheduler instance */
  audioScheduler: React.MutableRefObject<AudioScheduler | null>;
  /** Whether a sound is currently loading */
  loadingSound: boolean;
  /** Audio error message, if any */
  audioError: string | null;
  /** Set master volume */
  setVolume: (volume: number) => void;
  /** Set sound type */
  setSoundType: (type: SoundType) => void;
  /** Load custom sound file */
  loadCustomSound: (file: File) => Promise<void>;
}

/**
 * useMetronomeAudio Hook
 *
 * Manages audio playback for metronome beats. Connects AudioScheduler to
 * MetronomeEngine beat events and handles audio configuration.
 *
 * @param engineRef - Reference to MetronomeEngine instance
 * @param audioConfig - Audio configuration
 * @returns Audio scheduler reference and controls
 */
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
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      audioContextRef.current = new AudioContextClass();
      audioSchedulerRef.current = new AudioScheduler(audioContextRef.current);

      // Load default sound
      setLoadingSound(true);
      audioSchedulerRef.current
        .loadSound(audioConfig.soundType)
        .then(() => {
          setLoadingSound(false);
          setAudioError(null);
        })
        .catch(err => {
          setLoadingSound(false);
          setAudioError(`Failed to load sound: ${err.message}`);
        });
    } catch (err: any) {
      setAudioError(err.message || 'Failed to initialize audio');
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

      // Play sound
      const intensity = beatInfo.intensity === 'silent' ? 0 : 1;
      audioSchedulerRef.current!.playBeat(
        intensity,
        volume * audioConfig.masterVolume,
        beatInfo.timestamp
      );
    };

    engineRef.current.on('beat', handleBeat);

    return () => {
      engineRef.current?.off('beat', handleBeat);
    };
  }, [engineRef, audioConfig]);

  // Update master volume when config changes
  useEffect(() => {
    if (audioSchedulerRef.current) {
      audioSchedulerRef.current.setMasterVolume(audioConfig.masterVolume);
    }
  }, [audioConfig.masterVolume]);

  // Change sound type when config changes
  useEffect(() => {
    if (audioSchedulerRef.current && audioConfig.soundType !== 'custom') {
      setLoadingSound(true);
      audioSchedulerRef.current
        .loadSound(audioConfig.soundType)
        .then(() => {
          setLoadingSound(false);
          setAudioError(null);
        })
        .catch(err => {
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
