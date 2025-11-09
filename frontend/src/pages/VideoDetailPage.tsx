/**
 * Video Detail Page
 *
 * Displays video player and metadata.
 * Full implementation with clip creation will be added in task 7.3.
 */

import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const videoId = id ? parseInt(id, 10) : undefined;

  if (!videoId || isNaN(videoId)) {
    return (
      <div className="page">
        <h1>Video Not Found</h1>
        <p>Invalid video ID</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Video Player</h1>

      {/* Video Player */}
      <div style={{ marginBottom: '2rem' }}>
        <VideoPlayer videoId={videoId} autoplay={false} />
      </div>

      {/* Placeholder for metadata and controls */}
      <div style={{ color: '#666', fontSize: '0.9rem' }}>
        <p>
          Video player is now functional! Full implementation with video metadata, clip creation
          tools, and additional features will be added in task 7.3.
        </p>
        <div
          style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '6px' }}
        >
          <strong>Keyboard Shortcuts:</strong>
          <ul style={{ marginTop: '0.5rem' }}>
            <li>
              <kbd>Space</kbd> or <kbd>K</kbd> - Play/Pause
            </li>
            <li>
              <kbd>←</kbd> / <kbd>→</kbd> - Seek backward/forward 5 seconds
            </li>
            <li>
              <kbd>↑</kbd> / <kbd>↓</kbd> - Increase/decrease volume
            </li>
            <li>
              <kbd>M</kbd> - Toggle mute
            </li>
            <li>
              <kbd>F</kbd> - Toggle fullscreen
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
