/**
 * Playlist Detail/Editor Page
 *
 * Displays playlist with editing and playback controls.
 * Full implementation will be added in task 8.4.
 */

import { useParams } from 'react-router-dom';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="page">
      <h1>Playlist Editor</h1>
      <p>Editing playlist: {id}</p>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
        This page will be fully implemented in task 8.4 with drag-and-drop clip reordering,
        add/remove clips, and sequential playback.
      </p>
    </div>
  );
}
