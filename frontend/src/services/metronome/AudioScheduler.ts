/**
 * AudioScheduler - Precise audio playback for metronome
 *
 * Manages audio playback with sample-accurate timing using Web Audio API.
 * Handles loading of built-in and custom sounds, and plays beats with
 * configurable volume.
 */

import type { SoundType } from '../../types/metronome';
import {
  loadAudioBuffer,
  loadCustomAudioFile,
  getBuiltInSoundUrl,
} from '../../utils/metronome/audioLoader';

/**
 * AudioScheduler class
 *
 * Provides precise audio playback for metronome beats
 */
export class AudioScheduler {
  private audioContext: AudioContext;
  private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
  private masterGain: GainNode;
  private currentSoundType: SoundType = 'click';

  /**
   * Create a new AudioScheduler
   *
   * @param audioContext - Web Audio API AudioContext to use
   *
   * @example
   * ```typescript
   * const context = new AudioContext();
   * const scheduler = new AudioScheduler(context);
   * await scheduler.loadSound('click');
   * scheduler.playBeat(1, 0.7, context.currentTime);
   * ```
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create master gain node for volume control
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);
    this.masterGain.gain.value = 0.7; // Default volume
  }

  /**
   * Load a built-in sound
   *
   * @param soundType - Type of sound to load
   * @returns Promise that resolves when sound is loaded
   * @throws {Error} If sound loading fails
   *
   * @example
   * ```typescript
   * await scheduler.loadSound('drum');
   * ```
   */
  async loadSound(soundType: SoundType): Promise<void> {
    if (soundType === 'custom') {
      // Custom sounds are loaded via loadCustomSound
      return;
    }

    try {
      const url = getBuiltInSoundUrl(soundType);
      const buffer = await loadAudioBuffer(this.audioContext, url);

      this.audioBuffers.set(soundType, buffer);
      this.currentSoundType = soundType;
    } catch (error) {
      console.error(`Failed to load sound "${soundType}":`, error);
      throw error;
    }
  }

  /**
   * Load a custom sound file
   *
   * @param file - File object from user upload
   * @returns Promise resolving to data URL for persistence
   * @throws {Error} If file loading fails
   *
   * @example
   * ```typescript
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const dataUrl = await scheduler.loadCustomSound(file);
   * // Save dataUrl to config for persistence
   * ```
   */
  async loadCustomSound(file: File): Promise<string> {
    try {
      const { buffer, dataUrl } = await loadCustomAudioFile(this.audioContext, file);

      this.audioBuffers.set('custom', buffer);
      this.currentSoundType = 'custom';

      return dataUrl;
    } catch (error) {
      console.error('Failed to load custom sound:', error);
      throw error;
    }
  }

  /**
   * Load custom sound from data URL
   *
   * Used to restore custom sounds from saved configuration
   *
   * @param dataUrl - Data URL of audio file
   * @returns Promise that resolves when sound is loaded
   */
  async loadCustomSoundFromDataUrl(dataUrl: string): Promise<void> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.audioBuffers.set('custom', buffer);
      this.currentSoundType = 'custom';
    } catch (error) {
      console.error('Failed to load custom sound from data URL:', error);
      throw error;
    }
  }

  /**
   * Play a beat
   *
   * Schedules audio playback at specified time with given parameters
   *
   * @param intensity - Beat intensity (0-1), affects volume
   * @param volume - Base volume (0-1)
   * @param time - AudioContext time to play at
   *
   * @example
   * ```typescript
   * // Play a beat right now at 70% volume
   * scheduler.playBeat(1, 0.7, audioContext.currentTime);
   *
   * // Schedule a beat 500ms in the future
   * scheduler.playBeat(0.5, 0.7, audioContext.currentTime + 0.5);
   * ```
   */
  playBeat(intensity: number, volume: number, time: number): void {
    // Get buffer for current sound type
    const buffer = this.audioBuffers.get(this.currentSoundType);

    if (!buffer) {
      console.warn(`Audio buffer not loaded for sound type: ${this.currentSoundType}`);
      return;
    }

    // Validate parameters
    const safeIntensity = Math.max(0, Math.min(1, intensity));
    const safeVolume = Math.max(0, Math.min(1, volume));

    // Don't play if volume would be zero
    if (safeIntensity === 0 || safeVolume === 0) {
      return;
    }

    try {
      // Create source node (must create new one for each playback)
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // Create gain node for this specific beat
      const gainNode = this.audioContext.createGain();
      const finalVolume = safeIntensity * safeVolume;
      gainNode.gain.value = finalVolume;

      // Connect audio graph: source -> gain -> masterGain -> destination
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Schedule playback at precise time
      source.start(time);

      // Clean up after playback finishes
      source.onended = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Already disconnected, ignore
        }
      };
    } catch (error) {
      console.error('Error playing beat:', error);
    }
  }

  /**
   * Set master volume
   *
   * Affects all beat playback
   *
   * @param volume - Master volume (0-1)
   *
   * @example
   * ```typescript
   * scheduler.setMasterVolume(0.5); // 50% volume
   * ```
   */
  setMasterVolume(volume: number): void {
    // Clamp to valid range
    const safeVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = safeVolume;
  }

  /**
   * Get current master volume
   *
   * @returns Master volume (0-1)
   */
  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  /**
   * Set current sound type
   *
   * Changes which sound will be played for subsequent beats
   *
   * @param soundType - Sound type to use
   *
   * @example
   * ```typescript
   * scheduler.setSoundType('drum');
   * ```
   */
  setSoundType(soundType: SoundType): void {
    this.currentSoundType = soundType;

    // Load sound if not already loaded
    if (!this.audioBuffers.has(soundType) && soundType !== 'custom') {
      this.loadSound(soundType).catch(error => {
        console.error(`Failed to load sound "${soundType}":`, error);
      });
    }
  }

  /**
   * Get current sound type
   *
   * @returns Current sound type
   */
  getCurrentSoundType(): SoundType {
    return this.currentSoundType;
  }

  /**
   * Check if sound is loaded
   *
   * @param soundType - Sound type to check
   * @returns True if sound is loaded
   */
  isSoundLoaded(soundType: SoundType): boolean {
    return this.audioBuffers.has(soundType);
  }

  /**
   * Preload multiple sounds
   *
   * Loads all specified sounds in parallel
   *
   * @param soundTypes - Array of sound types to preload
   * @returns Promise that resolves when all sounds are loaded
   */
  async preloadSounds(soundTypes: SoundType[]): Promise<void> {
    const loadPromises = soundTypes
      .filter(type => type !== 'custom')
      .map(type => this.loadSound(type).catch(error => {
        console.warn(`Failed to preload sound "${type}":`, error);
      }));

    await Promise.all(loadPromises);
  }

  /**
   * Dispose and clean up resources
   *
   * Must be called before destroying instance
   */
  dispose(): void {
    // Clear all buffers
    this.audioBuffers.clear();

    // Disconnect gain node
    try {
      this.masterGain.disconnect();
    } catch (error) {
      // Already disconnected, ignore
    }
  }
}
