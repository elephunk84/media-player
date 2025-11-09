/**
 * useVideoPlayer Hook
 *
 * Custom hook for managing video player state including playback,
 * current time, duration, volume, and fullscreen.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';

// Player options type - using any as Video.js types are complex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerOptions = any;

/**
 * Video player state interface
 */
export interface VideoPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  buffering: boolean;
  error: string | null;
}

/**
 * useVideoPlayer hook return type
 */
export interface UseVideoPlayerReturn extends VideoPlayerState {
  playerRef: React.MutableRefObject<Player | null>;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  initialize: (videoElement: HTMLVideoElement, options: PlayerOptions) => void;
  dispose: () => void;
}

/**
 * useVideoPlayer Hook
 *
 * Manages Video.js player instance and provides state and control methods.
 * Handles player initialization, state updates, and cleanup.
 *
 * @returns Object with player state and control methods
 *
 * @example
 * ```tsx
 * const player = useVideoPlayer();
 *
 * useEffect(() => {
 *   if (videoRef.current) {
 *     player.initialize(videoRef.current, {
 *       controls: true,
 *       sources: [{ src: videoUrl, type: 'video/mp4' }]
 *     });
 *   }
 *   return () => player.dispose();
 * }, []);
 * ```
 */
export function useVideoPlayer(): UseVideoPlayerReturn {
  const playerRef = useRef<Player | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [state, setState] = useState<VideoPlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    fullscreen: false,
    buffering: false,
    error: null,
  });

  /**
   * Initialize Video.js player
   */
  const initialize = useCallback((videoElement: HTMLVideoElement, options: PlayerOptions) => {
    if (!videoElement) {
      return;
    }

    videoRef.current = videoElement;
    playerRef.current = videojs(videoElement, options);

    const player = playerRef.current;

    // Set up event listeners
    player.on('play', () => {
      setState((prev) => ({ ...prev, playing: true }));
    });

    player.on('pause', () => {
      setState((prev) => ({ ...prev, playing: false }));
    });

    player.on('timeupdate', () => {
      setState((prev) => ({
        ...prev,
        currentTime: player.currentTime() || 0,
      }));
    });

    player.on('durationchange', () => {
      setState((prev) => ({
        ...prev,
        duration: player.duration() || 0,
      }));
    });

    player.on('volumechange', () => {
      setState((prev) => ({
        ...prev,
        volume: player.volume() || 0,
        muted: player.muted() || false,
      }));
    });

    player.on('fullscreenchange', () => {
      setState((prev) => ({
        ...prev,
        fullscreen: player.isFullscreen() || false,
      }));
    });

    player.on('waiting', () => {
      setState((prev) => ({ ...prev, buffering: true }));
    });

    player.on('canplay', () => {
      setState((prev) => ({ ...prev, buffering: false }));
    });

    player.on('error', () => {
      const error = player.error();
      setState((prev) => ({
        ...prev,
        error: error ? error.message : 'Unknown error occurred',
      }));
    });
  }, []);

  /**
   * Dispose of the player instance
   */
  const dispose = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  }, []);

  /**
   * Play the video
   */
  const play = useCallback(() => {
    if (playerRef.current) {
      void playerRef.current.play();
    }
  }, []);

  /**
   * Pause the video
   */
  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (playerRef.current.paused()) {
        void playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, []);

  /**
   * Seek to a specific time
   */
  const seek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  }, []);

  /**
   * Set volume (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    if (playerRef.current) {
      playerRef.current.volume(Math.max(0, Math.min(1, volume)));
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.muted(!playerRef.current.muted());
    }
  }, []);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (playerRef.current) {
      if (playerRef.current.isFullscreen()) {
        void playerRef.current.exitFullscreen();
      } else {
        void playerRef.current.requestFullscreen();
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    ...state,
    playerRef,
    videoRef,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    initialize,
    dispose,
  };
}
