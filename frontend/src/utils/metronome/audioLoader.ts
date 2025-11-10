/**
 * Audio file loader utilities
 *
 * Handles loading and validation of audio files for the metronome system.
 * Supports both built-in sounds and custom user uploads.
 */

import type { SoundType } from '../../types/metronome';

/**
 * Validation result for audio files
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of error messages if validation failed */
  errors: string[];
}

/**
 * Load audio buffer from URL
 *
 * Fetches an audio file and decodes it into an AudioBuffer
 *
 * @param audioContext - Web Audio API AudioContext
 * @param url - URL of the audio file to load
 * @returns Promise resolving to AudioBuffer
 * @throws {Error} If loading or decoding fails
 *
 * @example
 * ```typescript
 * const context = new AudioContext();
 * const buffer = await loadAudioBuffer(context, '/sounds/click.wav');
 * ```
 */
export async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return audioBuffer;
  } catch (error: any) {
    console.error('Error loading audio buffer:', error);
    throw new Error(`Audio loading failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Load custom audio file from File object
 *
 * Validates, loads, and decodes a user-uploaded audio file.
 * Also generates a data URL for storage/persistence.
 *
 * @param audioContext - Web Audio API AudioContext
 * @param file - File object from user upload
 * @returns Promise resolving to object with AudioBuffer and data URL
 * @throws {Error} If validation or loading fails
 *
 * @example
 * ```typescript
 * const context = new AudioContext();
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const { buffer, dataUrl } = await loadCustomAudioFile(context, file);
 * // Save dataUrl to localStorage for persistence
 * ```
 */
export async function loadCustomAudioFile(
  audioContext: AudioContext,
  file: File
): Promise<{ buffer: AudioBuffer; dataUrl: string }> {
  // Validate file first
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode to AudioBuffer
    const buffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create data URL for storage
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as data URL'));
      reader.readAsDataURL(file);
    });

    return { buffer, dataUrl };
  } catch (error: any) {
    console.error('Error loading custom audio file:', error);
    throw new Error(`Failed to load custom audio file: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Validate audio file
 *
 * Checks file type and size constraints
 *
 * @param file - File object to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * const result = validateAudioFile(file);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateAudioFile(file: File): ValidationResult {
  const errors: string[] = [];

  // Check file type
  const validTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/webm',
  ];

  if (!validTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Must be WAV, MP3, OGG, or WebM format`);
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${sizeMB}MB) exceeds maximum allowed size of 5MB`);
  }

  // Check file has content
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get URL for built-in sound
 *
 * Maps sound type to asset URL
 *
 * @param soundType - Type of built-in sound
 * @returns URL path to sound file
 *
 * @example
 * ```typescript
 * const url = getBuiltInSoundUrl('click');
 * // Returns '/sounds/click.wav'
 * ```
 */
export function getBuiltInSoundUrl(soundType: SoundType): string {
  const baseUrl = '/sounds/';

  switch (soundType) {
    case 'click':
      return `${baseUrl}click.wav`;
    case 'beep':
      return `${baseUrl}beep.wav`;
    case 'drum':
      return `${baseUrl}drum.wav`;
    case 'snap':
      return `${baseUrl}snap.wav`;
    case 'woodblock':
      return `${baseUrl}woodblock.wav`;
    case 'custom':
      // Custom sounds are handled separately
      return '';
    default:
      return `${baseUrl}click.wav`; // Fallback
  }
}

/**
 * Check if Web Audio API is supported
 *
 * @returns True if Web Audio API is available
 */
export function isWebAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Get supported audio formats
 *
 * @returns Array of supported MIME types
 */
export function getSupportedAudioFormats(): string[] {
  const audio = document.createElement('audio');
  const formats: string[] = [];

  if (audio.canPlayType('audio/wav')) {
    formats.push('audio/wav');
  }
  if (audio.canPlayType('audio/mpeg')) {
    formats.push('audio/mpeg');
  }
  if (audio.canPlayType('audio/ogg')) {
    formats.push('audio/ogg');
  }
  if (audio.canPlayType('audio/webm')) {
    formats.push('audio/webm');
  }

  return formats;
}
