/**
 * PlaylistClipList Component
 *
 * Displays clips in a playlist with drag-and-drop reordering.
 * Includes remove clip functionality and orphaned clip indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlaylistClip } from '../types/playlist';
import './PlaylistClipList.css';

interface PlaylistClipListProps {
  playlistId: number;
  clips: PlaylistClip[];
  onReorder: (clipOrders: Array<{ clipId: number; order: number }>) => Promise<void>;
  onRemove: (clipId: number) => Promise<void>;
}

interface SortableClipItemProps {
  clip: PlaylistClip;
  onRemove: (clipId: number) => void;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * SortableClipItem Component
 *
 * Individual sortable clip item with drag handle and remove button.
 */
function SortableClipItem({ clip, onRemove }: SortableClipItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOrphaned = !clip.video || !clip.video.isAvailable;

  return (
    <div ref={setNodeRef} style={style} className="playlist-clip-item">
      {/* Drag Handle */}
      <div className="playlist-clip-item__drag-handle" {...attributes} {...listeners}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="5" x2="9" y2="19" />
          <line x1="15" y1="5" x2="15" y2="19" />
        </svg>
      </div>

      {/* Clip Info */}
      <div className="playlist-clip-item__info">
        <div className="playlist-clip-item__name">{clip.name}</div>
        <div className="playlist-clip-item__meta">
          {isOrphaned ? (
            <span className="playlist-clip-item__orphan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Source unavailable
            </span>
          ) : (
            <span className="playlist-clip-item__video">{clip.video?.title}</span>
          )}
          <span className="playlist-clip-item__duration">{formatDuration(clip.duration)}</span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        className="playlist-clip-item__remove"
        onClick={() => onRemove(clip.id)}
        title="Remove from playlist"
        aria-label={`Remove ${clip.name} from playlist`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * PlaylistClipList Component
 *
 * Displays a list of clips with drag-and-drop reordering.
 * Uses @dnd-kit for accessibility and smooth animations.
 * Optimistically updates UI during reorder, with rollback on error.
 *
 * @param props - Component props
 * @param props.playlistId - ID of the playlist
 * @param props.clips - Array of clips in the playlist
 * @param props.onReorder - Callback when clips are reordered
 * @param props.onRemove - Callback when a clip is removed
 */
export default function PlaylistClipList({
  clips,
  onReorder,
  onRemove,
}: PlaylistClipListProps) {
  const [localClips, setLocalClips] = useState(clips);

  // Update local clips when props change
  useEffect(() => {
    setLocalClips(clips);
  }, [clips]);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end event
   * Optimistically updates UI, then persists to backend
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localClips.findIndex((c) => c.id === active.id);
    const newIndex = localClips.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const newClips = arrayMove(localClips, oldIndex, newIndex);
    setLocalClips(newClips);

    // Prepare reorder data
    const clipOrders = newClips.map((clip, index) => ({
      clipId: clip.id,
      order: index,
    }));

    try {
      await onReorder(clipOrders);
    } catch (err) {
      // Revert on error
      console.error('Failed to reorder clips:', err);
      setLocalClips(clips);
      alert('Failed to reorder clips. Please try again.');
    }
  };

  /**
   * Handle remove clip
   */
  const handleRemove = async (clipId: number) => {
    await onRemove(clipId);
  };

  if (localClips.length === 0) {
    return (
      <div className="playlist-clip-list__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
        <p>No clips in this playlist</p>
        <p className="playlist-clip-list__empty-hint">Add clips using the selector on the right</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <SortableContext items={localClips.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="playlist-clip-list">
          {localClips.map((clip) => (
            <SortableClipItem key={clip.id} clip={clip} onRemove={(clipId) => void handleRemove(clipId)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
