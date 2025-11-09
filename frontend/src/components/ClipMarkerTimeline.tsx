/**
 * ClipMarkerTimeline Component
 *
 * Displays clip markers on a timeline that can be clicked to seek to clip positions.
 */

import type { Clip } from '../types/video';
import './ClipMarkerTimeline.css';

interface ClipMarkerTimelineProps {
  clips: Clip[];
  videoDuration: number;
  onSeekToClip: (startTime: number) => void;
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

export default function ClipMarkerTimeline({
  clips,
  videoDuration,
  onSeekToClip,
}: ClipMarkerTimelineProps) {
  if (clips.length === 0) {
    return null;
  }

  return (
    <div className="clip-marker-timeline">
      <h4>Clips ({clips.length})</h4>
      <div className="clip-marker-container">
        <div className="clip-marker-track">
          {clips.map((clip) => {
            const startPercent = (clip.startTime / videoDuration) * 100;
            const widthPercent = ((clip.endTime - clip.startTime) / videoDuration) * 100;

            return (
              <button
                key={clip.id}
                className="clip-marker"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                }}
                onClick={() => onSeekToClip(clip.startTime)}
                title={`${clip.name}\n${formatTime(clip.startTime)} - ${formatTime(clip.endTime)}`}
                aria-label={`Seek to clip ${clip.name}`}
              >
                <span className="clip-marker-label">{clip.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="clip-list">
        {clips.map((clip) => (
          <div key={clip.id} className="clip-list-item">
            <button className="clip-list-item-button" onClick={() => onSeekToClip(clip.startTime)}>
              <div className="clip-list-item-name">{clip.name}</div>
              <div className="clip-list-item-time">
                {formatTime(clip.startTime)} - {formatTime(clip.endTime)} (
                {formatTime(clip.duration)})
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
