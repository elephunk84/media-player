/**
 * CreatePlaylistModal Component
 *
 * Modal dialog for creating a new playlist.
 * Includes form validation and error handling.
 */

import { useState, useEffect } from 'react';
import { CreatePlaylistData } from '../types/playlist';
import './CreatePlaylistModal.css';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (data: CreatePlaylistData) => Promise<void>;
}

/**
 * CreatePlaylistModal Component
 *
 * Displays a modal dialog with a form to create a new playlist.
 * Validates that the name field is not empty.
 * Handles ESC key to close and prevents body scroll.
 *
 * @param props - Component props
 * @param props.onClose - Callback when modal is closed
 * @param props.onCreate - Async callback when playlist is created
 */
export default function CreatePlaylistModal({ onClose, onCreate }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Success - modal will be closed by parent component
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create playlist';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Playlist</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="modal-form">
          <div className="form-group">
            <label htmlFor="playlist-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name"
              autoFocus
              disabled={loading}
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="playlist-description">Description</label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="button-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
