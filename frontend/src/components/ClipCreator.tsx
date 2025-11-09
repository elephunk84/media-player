/**
 * ClipCreator Component
 *
 * Provides UI for creating clips from a video by capturing playback times.
 */

import { useState } from 'react';
import type { CreateClipInput } from '../types/video';
import './ClipCreator.css';

interface ClipCreatorProps {
  videoId: number;
  videoDuration: number;
  currentTime: number;
  onClipCreated: () => void;
  onCreateClip: (clipData: CreateClipInput) => Promise<void>;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function ClipCreator({
  videoId,
  videoDuration,
  currentTime,
  onClipCreated,
  onCreateClip,
}: ClipCreatorProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [clipName, setClipName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetStart = () => {
    setStartTime(currentTime);
    setError(null);
  };

  const handleSetEnd = () => {
    setEndTime(currentTime);
    setError(null);
  };

  const handleClear = () => {
    setStartTime(null);
    setEndTime(null);
    setClipName('');
    setError(null);
  };

  const validateClip = (): string | null => {
    if (startTime === null || endTime === null) {
      return 'Both start and end times must be set';
    }

    if (startTime >= endTime) {
      return 'Start time must be before end time';
    }

    if (startTime < 0 || startTime > videoDuration) {
      return 'Start time is outside video duration';
    }

    if (endTime < 0 || endTime > videoDuration) {
      return 'End time is outside video duration';
    }

    if (!clipName.trim()) {
      return 'Clip name is required';
    }

    return null;
  };

  const handleCreateClip = async () => {
    const validationError = validateClip();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (startTime === null || endTime === null) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const clipData: CreateClipInput = {
        videoId,
        name: clipName.trim(),
        startTime,
        endTime,
      };

      await onCreateClip(clipData);
      onClipCreated();

      // Reset form
      setStartTime(null);
      setEndTime(null);
      setClipName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clip');
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = validateClip() === null;

  return (
    <div className="clip-creator">
      <h3>Create Clip</h3>

      <div className="clip-creator-controls">
        <div className="clip-creator-time-controls">
          <div className="clip-creator-time-group">
            <button onClick={handleSetStart} className="btn btn-secondary" disabled={isCreating}>
              Set Start
            </button>
            <div className="clip-creator-time-display">
              {startTime !== null ? formatTime(startTime) : '--:--'}
            </div>
          </div>

          <div className="clip-creator-time-group">
            <button onClick={handleSetEnd} className="btn btn-secondary" disabled={isCreating}>
              Set End
            </button>
            <div className="clip-creator-time-display">
              {endTime !== null ? formatTime(endTime) : '--:--'}
            </div>
          </div>
        </div>

        <div className="clip-creator-name">
          <label htmlFor="clip-name">Clip Name</label>
          <input
            id="clip-name"
            type="text"
            value={clipName}
            onChange={(e) => setClipName(e.target.value)}
            placeholder="Enter clip name"
            disabled={isCreating}
          />
        </div>

        {error && <div className="clip-creator-error">{error}</div>}

        <div className="clip-creator-actions">
          <button
            onClick={() => {
              void handleCreateClip();
            }}
            className="btn btn-primary"
            disabled={!isValid || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Clip'}
          </button>
          <button onClick={handleClear} className="btn btn-secondary" disabled={isCreating}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
