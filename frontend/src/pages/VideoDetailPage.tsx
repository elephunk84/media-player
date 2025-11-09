/**
 * Video Detail Page
 *
 * Displays video with metadata and clip creation tools.
 * Full implementation will be added in task 7.3.
 */

import { useParams } from 'react-router-dom';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="page">
      <h1>Video Detail</h1>
      <p>Viewing video: {id}</p>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
        This page will be fully implemented in task 7.3 with video player, metadata display, and
        clip creation tools.
      </p>
    </div>
  );
}
