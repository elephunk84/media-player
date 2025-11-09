# Implementation Tasks - Remaining Work

This document provides detailed, step-by-step instructions for completing the remaining 10% of the Media Player project to achieve 100% spec compliance.

---

## Overview

**Total Remaining Work:** 2 main tasks
**Estimated Effort:** 12-18 hours total
**Priority Order:**
1. Task 8.3-8.4: Playlist Features (HIGH PRIORITY) - 8-12 hours
2. Task 9.3: Component Tests (MEDIUM PRIORITY) - 4-6 hours

---

# TASK 1: Implement Playlist Features (Tasks 8.3-8.4)

**Priority:** HIGH
**Estimated Effort:** 8-12 hours
**Files to Create:** 4 new components
**Files to Modify:** 2 existing pages
**Dependencies:** @dnd-kit library

## Background

The backend has **all playlist functionality working perfectly**. The following API endpoints are ready:
- ✅ GET /api/playlists - List all playlists
- ✅ GET /api/playlists/:id - Get playlist with clips
- ✅ POST /api/playlists - Create playlist
- ✅ PUT /api/playlists/:id - Update playlist
- ✅ DELETE /api/playlists/:id - Delete playlist
- ✅ POST /api/playlists/:id/clips - Add clip to playlist
- ✅ DELETE /api/playlists/:id/clips/:clipId - Remove clip
- ✅ PATCH /api/playlists/:id/reorder - Reorder clips

You only need to build the **frontend UI** to consume these endpoints.

---

## Step 1: Install Drag-and-Drop Library

```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Why @dnd-kit?**
- Modern, lightweight, accessible
- Better TypeScript support than react-beautiful-dnd
- Active maintenance
- No external dependencies

---

## Step 2: Create PlaylistCard Component

**File:** `frontend/src/components/PlaylistCard.tsx`

This component displays a single playlist in the grid view.

### Requirements

**Visual Design:**
- Card layout similar to VideoCard and ClipCard
- Display: playlist name, description (truncated), clip count, total duration
- Hover effect with shadow
- Click navigates to `/playlist/:id`
- Delete button with trash icon (requires confirmation)

**Props Interface:**
```typescript
interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: number) => void;
}
```

**Data from Backend:**
```typescript
interface Playlist {
  id: number;
  name: string;
  description: string | null;
  clipCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}
```

### Implementation Guide

1. **Structure:**
   - Wrapper div with `playlist-card` class
   - Link to playlist detail (entire card clickable except delete button)
   - Header section: playlist icon + name
   - Stats section: clip count + total duration
   - Description section (truncate to 2 lines with ellipsis)
   - Delete button (absolute positioned in top-right)

2. **Delete Handling:**
   - Show confirmation dialog before deletion
   - Use `window.confirm()` or create custom modal
   - Prevent click propagation to card link
   - Call `onDelete(playlist.id)` after confirmation

3. **Formatting:**
   - Duration: Use existing `formatDuration()` helper from VideoCard
   - Date: Use `new Date(createdAt).toLocaleDateString()`
   - Truncate description: CSS `line-clamp` or substring

4. **Styling (CSS Module):**
   - Card: padding, border-radius, box-shadow
   - Hover state: transform scale slightly, shadow increase
   - Grid layout: similar to VideoCard/ClipCard
   - Delete button: danger color (red), opacity transition on hover

### Example Structure

```typescript
export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm(`Delete playlist "${playlist.name}"?`)) {
      onDelete(playlist.id);
    }
  };

  return (
    <Link to={`/playlist/${playlist.id}`} className={styles.playlistCard}>
      <div className={styles.header}>
        <FaListUl className={styles.icon} />
        <h3 className={styles.name}>{playlist.name}</h3>
      </div>

      <div className={styles.stats}>
        <span><FaFilm /> {playlist.clipCount} clips</span>
        <span><FaClock /> {formatDuration(playlist.totalDuration)}</span>
      </div>

      {playlist.description && (
        <p className={styles.description}>{playlist.description}</p>
      )}

      <button
        className={styles.deleteButton}
        onClick={handleDelete}
        title="Delete playlist"
      >
        <FaTrash />
      </button>
    </Link>
  );
};
```

---

## Step 3: Update PlaylistsPage Component

**File:** `frontend/src/pages/PlaylistsPage.tsx` (currently a placeholder)

### Requirements

**Features:**
- Fetch all playlists on mount
- Display playlists in grid layout
- "Create Playlist" button opens modal/form
- Delete playlist functionality
- Loading, error, and empty states
- Grid matches VideosPage and ClipsPage styling

### Implementation Guide

1. **State Management:**
   ```typescript
   const [playlists, setPlaylists] = useState<Playlist[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showCreateModal, setShowCreateModal] = useState(false);
   ```

2. **API Integration:**
   ```typescript
   const fetchPlaylists = async () => {
     try {
       setLoading(true);
       setError(null);
       const response = await apiClient.get('/api/playlists');
       setPlaylists(response.data);
     } catch (err) {
       setError('Failed to load playlists');
       console.error(err);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
     fetchPlaylists();
   }, []);
   ```

3. **Create Playlist:**
   ```typescript
   const handleCreatePlaylist = async (data: CreatePlaylistData) => {
     try {
       await apiClient.post('/api/playlists', data);
       setShowCreateModal(false);
       fetchPlaylists(); // Refresh list
     } catch (err) {
       // Handle error
     }
   };
   ```

4. **Delete Playlist:**
   ```typescript
   const handleDeletePlaylist = async (id: number) => {
     try {
       await apiClient.delete(`/api/playlists/${id}`);
       fetchPlaylists(); // Refresh list
     } catch (err) {
       alert('Failed to delete playlist');
     }
   };
   ```

5. **Create Modal (Simple Approach):**
   - Use a modal overlay with form
   - Two fields: name (required), description (optional)
   - Submit button, Cancel button
   - Close on submit success or cancel

6. **Layout:**
   - Header: Title + "Create Playlist" button
   - Results count: "X playlists"
   - Grid: 3-4 columns on desktop, responsive
   - Loading: Spinner component
   - Error: Error message with retry button
   - Empty: "No playlists yet. Create one to get started!"

### Example Structure

```typescript
export const PlaylistsPage: React.FC = () => {
  // State and hooks...

  if (loading) return <div className={styles.loading}>Loading playlists...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.playlistsPage}>
      <div className={styles.header}>
        <h1>Playlists</h1>
        <button onClick={() => setShowCreateModal(true)}>
          <FaPlus /> Create Playlist
        </button>
      </div>

      <div className={styles.results}>
        {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
      </div>

      {playlists.length === 0 ? (
        <div className={styles.empty}>
          No playlists yet. Create one to get started!
        </div>
      ) : (
        <div className={styles.playlistGrid}>
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onDelete={handleDeletePlaylist}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePlaylist}
        />
      )}
    </div>
  );
};
```

---

## Step 4: Create CreatePlaylistModal Component

**File:** `frontend/src/components/CreatePlaylistModal.tsx`

### Requirements

**Features:**
- Modal overlay (dark background)
- Form with name (required) and description (optional)
- Validation: name must not be empty
- Submit and Cancel buttons
- Close on ESC key
- Focus management (trap focus in modal)

### Implementation Guide

```typescript
interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description?: string }) => Promise<void>;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      onClose();
    } catch (err) {
      setError('Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  // ESC key handling
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create Playlist</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name"
              autoFocus
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## Step 5: Create PlaylistClipList Component (with Drag-and-Drop)

**File:** `frontend/src/components/PlaylistClipList.tsx`

This is the most complex component. It displays clips in a playlist with drag-and-drop reordering.

### Requirements

**Features:**
- Display clips in order with drag handles
- Drag-and-drop reordering (optimistic UI)
- Remove clip button for each item
- Show clip thumbnail, name, duration
- Indicate orphaned clips (source video unavailable)
- Persist order to backend after reorder

### Implementation Guide

1. **Install and Setup @dnd-kit:**

```typescript
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
```

2. **Create SortableClipItem Sub-Component:**

```typescript
interface SortableClipItemProps {
  clip: PlaylistClip;
  onRemove: (clipId: number) => void;
}

const SortableClipItem: React.FC<SortableClipItemProps> = ({ clip, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.clipItem}>
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <FaGripVertical />
      </div>

      <div className={styles.clipInfo}>
        <span className={styles.clipName}>{clip.name}</span>
        <span className={styles.clipDuration}>{formatDuration(clip.duration)}</span>
        {clip.video?.isAvailable === false && (
          <span className={styles.orphanBadge}>Source unavailable</span>
        )}
      </div>

      <button
        className={styles.removeButton}
        onClick={() => onRemove(clip.id)}
        title="Remove from playlist"
      >
        <FaTimes />
      </button>
    </div>
  );
};
```

3. **Main PlaylistClipList Component:**

```typescript
interface PlaylistClipListProps {
  playlistId: number;
  clips: PlaylistClip[];
  onReorder: (clipOrders: Array<{ clipId: number; order: number }>) => Promise<void>;
  onRemove: (clipId: number) => Promise<void>;
}

export const PlaylistClipList: React.FC<PlaylistClipListProps> = ({
  playlistId,
  clips,
  onReorder,
  onRemove,
}) => {
  const [localClips, setLocalClips] = useState(clips);

  useEffect(() => {
    setLocalClips(clips);
  }, [clips]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localClips.findIndex((c) => c.id === active.id);
      const newIndex = localClips.findIndex((c) => c.id === over.id);

      const newClips = arrayMove(localClips, oldIndex, newIndex);

      // Optimistic update
      setLocalClips(newClips);

      // Persist to backend
      const clipOrders = newClips.map((clip, index) => ({
        clipId: clip.id,
        order: index,
      }));

      try {
        await onReorder(clipOrders);
      } catch (err) {
        // Revert on error
        setLocalClips(clips);
        alert('Failed to reorder clips');
      }
    }
  };

  if (localClips.length === 0) {
    return (
      <div className={styles.emptyState}>
        No clips in this playlist. Add clips to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localClips.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.clipList}>
          {localClips.map((clip) => (
            <SortableClipItem
              key={clip.id}
              clip={clip}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

---

## Step 6: Create ClipSelector Component

**File:** `frontend/src/components/ClipSelector.tsx`

### Requirements

**Features:**
- Search/filter clips to add to playlist
- Show clip name, source video, duration
- "Add to Playlist" button for each clip
- Prevent adding duplicates
- Loading state while adding

### Implementation Guide

```typescript
interface ClipSelectorProps {
  playlistId: number;
  existingClipIds: number[]; // To prevent duplicates
  onAdd: (clipId: number) => Promise<void>;
}

export const ClipSelector: React.FC<ClipSelectorProps> = ({
  playlistId,
  existingClipIds,
  onAdd,
}) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingClipId, setAddingClipId] = useState<number | null>(null);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/clips');
        setClips(response.data);
      } catch (err) {
        console.error('Failed to fetch clips', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, []);

  const filteredClips = clips.filter((clip) => {
    const matchesSearch = clip.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notInPlaylist = !existingClipIds.includes(clip.id);
    return matchesSearch && notInPlaylist;
  });

  const handleAddClip = async (clipId: number) => {
    try {
      setAddingClipId(clipId);
      await onAdd(clipId);
    } catch (err) {
      alert('Failed to add clip');
    } finally {
      setAddingClipId(null);
    }
  };

  return (
    <div className={styles.clipSelector}>
      <div className={styles.header}>
        <h3>Add Clips</h3>
        <input
          type="text"
          placeholder="Search clips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading clips...</div>
      ) : filteredClips.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery ? 'No clips match your search' : 'No clips available to add'}
        </div>
      ) : (
        <div className={styles.clipList}>
          {filteredClips.map((clip) => (
            <div key={clip.id} className={styles.clipItem}>
              <div className={styles.clipInfo}>
                <span className={styles.clipName}>{clip.name}</span>
                <span className={styles.clipMeta}>
                  {clip.video?.title} • {formatDuration(clip.duration)}
                </span>
              </div>
              <button
                onClick={() => handleAddClip(clip.id)}
                disabled={addingClipId === clip.id}
                className={styles.addButton}
              >
                {addingClipId === clip.id ? 'Adding...' : <FaPlus />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Step 7: Update PlaylistDetailPage Component

**File:** `frontend/src/pages/PlaylistDetailPage.tsx` (currently a placeholder)

### Requirements

**Features:**
- Fetch playlist with clips
- Display playlist metadata (name, description)
- Show PlaylistClipList for reordering and removing
- Show ClipSelector for adding clips
- "Play Playlist" button for sequential playback
- Edit playlist name/description
- Delete playlist button

### Implementation Guide

```typescript
export const PlaylistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState<PlaylistWithClips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/playlists/${id}`);
      setPlaylist(response.data);
    } catch (err) {
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const handleReorder = async (clipOrders: Array<{ clipId: number; order: number }>) => {
    await apiClient.patch(`/api/playlists/${id}/reorder`, { clipOrders });
    // Optimistic update handled by PlaylistClipList
  };

  const handleRemoveClip = async (clipId: number) => {
    if (!window.confirm('Remove this clip from the playlist?')) return;

    try {
      await apiClient.delete(`/api/playlists/${id}/clips/${clipId}`);
      await fetchPlaylist(); // Refresh
    } catch (err) {
      alert('Failed to remove clip');
    }
  };

  const handleAddClip = async (clipId: number) => {
    const order = playlist?.clips.length || 0;
    await apiClient.post(`/api/playlists/${id}/clips`, { clipId, order });
    await fetchPlaylist(); // Refresh
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm(`Delete playlist "${playlist?.name}"?`)) return;

    try {
      await apiClient.delete(`/api/playlists/${id}`);
      navigate('/playlists');
    } catch (err) {
      alert('Failed to delete playlist');
    }
  };

  const handleUpdatePlaylist = async (data: { name: string; description?: string }) => {
    try {
      await apiClient.put(`/api/playlists/${id}`, data);
      setIsEditing(false);
      await fetchPlaylist();
    } catch (err) {
      alert('Failed to update playlist');
    }
  };

  if (loading) return <div className={styles.loading}>Loading playlist...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!playlist) return <div className={styles.error}>Playlist not found</div>;

  return (
    <div className={styles.playlistDetailPage}>
      <div className={styles.header}>
        {isEditing ? (
          <EditPlaylistForm
            playlist={playlist}
            onSave={handleUpdatePlaylist}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className={styles.info}>
              <h1>{playlist.name}</h1>
              {playlist.description && <p>{playlist.description}</p>}
              <div className={styles.meta}>
                {playlist.clips.length} clips • {formatDuration(playlist.totalDuration || 0)}
              </div>
            </div>
            <div className={styles.actions}>
              <button onClick={() => setIsEditing(true)}>
                <FaEdit /> Edit
              </button>
              <button onClick={handleDeletePlaylist} className={styles.deleteButton}>
                <FaTrash /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <h2>Clips in Playlist</h2>
          <PlaylistClipList
            playlistId={playlist.id}
            clips={playlist.clips}
            onReorder={handleReorder}
            onRemove={handleRemoveClip}
          />
        </div>

        <div className={styles.rightColumn}>
          <ClipSelector
            playlistId={playlist.id}
            existingClipIds={playlist.clips.map((c) => c.id)}
            onAdd={handleAddClip}
          />
        </div>
      </div>

      {playlist.clips.length > 0 && (
        <div className={styles.footer}>
          <button className={styles.playButton} onClick={handlePlayPlaylist}>
            <FaPlay /> Play Playlist
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Step 8: Sequential Playlist Playback

### Option A: Simple Approach (Navigate Between Clips)

```typescript
const handlePlayPlaylist = () => {
  if (playlist.clips.length === 0) return;

  // Navigate to first clip with playlist context
  navigate(`/clip/${playlist.clips[0].id}`, {
    state: {
      playlistId: playlist.id,
      clipIndex: 0,
      clips: playlist.clips,
    },
  });
};

// Then in ClipDetailPage, handle auto-advance:
useEffect(() => {
  if (!location.state?.playlistId) return;

  const handleVideoEnd = () => {
    const { clipIndex, clips } = location.state;
    const nextIndex = clipIndex + 1;

    if (nextIndex < clips.length) {
      navigate(`/clip/${clips[nextIndex].id}`, {
        state: {
          playlistId: location.state.playlistId,
          clipIndex: nextIndex,
          clips,
        },
      });
    } else {
      // Playlist finished
      alert('Playlist finished!');
    }
  };

  // Listen to video end event from VideoPlayer
  // (requires adding onEnded callback to VideoPlayer props)
}, [location.state]);
```

### Option B: Advanced Approach (Dedicated Playlist Player)

Create a new `PlaylistPlayerPage.tsx` that:
1. Loads all clips sequentially
2. Uses a single VideoPlayer instance
3. Switches clip source on end
4. Shows progress (clip 3/10)
5. Allows skipping clips

This is more complex but provides better UX.

---

## Step 9: TypeScript Types

Add to `frontend/src/types/playlist.ts`:

```typescript
export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  clipCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistClip {
  id: number;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  video?: {
    id: number;
    title: string;
    isAvailable: boolean;
  };
}

export interface PlaylistWithClips extends Playlist {
  clips: PlaylistClip[];
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
}
```

---

## Step 10: Testing

### Manual Testing Checklist

- [ ] Can create a new playlist
- [ ] Playlist appears in grid on PlaylistsPage
- [ ] Can delete a playlist (with confirmation)
- [ ] Can navigate to playlist detail page
- [ ] Can add clips to playlist
- [ ] Clips appear in order
- [ ] Can drag-and-drop to reorder clips
- [ ] Reorder persists after page refresh
- [ ] Can remove clip from playlist
- [ ] Sequential playback works
- [ ] Can edit playlist name/description
- [ ] Orphaned clips show warning
- [ ] Loading states appear during operations
- [ ] Error states display on failures

### Automated Testing (Optional)

Create `frontend/src/components/PlaylistCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PlaylistCard } from './PlaylistCard';

const mockPlaylist = {
  id: 1,
  name: 'Test Playlist',
  description: 'Test description',
  clipCount: 5,
  totalDuration: 300,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('PlaylistCard', () => {
  it('renders playlist information', () => {
    render(
      <BrowserRouter>
        <PlaylistCard playlist={mockPlaylist} onDelete={jest.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Playlist')).toBeInTheDocument();
    expect(screen.getByText(/5 clips/)).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    window.confirm = jest.fn(() => true);
    const onDelete = jest.fn();

    render(
      <BrowserRouter>
        <PlaylistCard playlist={mockPlaylist} onDelete={onDelete} />
      </BrowserRouter>
    );

    const deleteButton = screen.getByTitle('Delete playlist');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
```

---

## Completion Criteria for Task 1

✅ PlaylistCard component created and styled
✅ PlaylistsPage displays playlists in grid
✅ Create playlist modal works
✅ Delete playlist works with confirmation
✅ PlaylistDetailPage displays playlist with clips
✅ PlaylistClipList supports drag-and-drop reordering
✅ ClipSelector allows adding clips
✅ Remove clip functionality works
✅ Sequential playback implemented (either approach)
✅ All CRUD operations tested manually
✅ Code follows existing patterns (TypeScript, error handling, loading states)

---

# TASK 2: Expand Component Test Coverage

**Priority:** MEDIUM
**Estimated Effort:** 4-6 hours
**Files to Create:** 10-12 test files

## Background

The frontend has Jest + React Testing Library configured and working. Only 3 component tests exist currently. The goal is to add tests for the most critical components to improve quality assurance.

---

## Testing Strategy

Focus on:
1. **Authentication flow** - Most critical for security
2. **User interactions** - Buttons, forms, navigation
3. **API integration** - Mock API calls, test loading/error states
4. **Custom hooks** - Business logic in hooks

Don't test:
- Third-party libraries (Video.js, @dnd-kit)
- Simple presentational components
- CSS/styling

---

## Test File 1: AuthContext.test.tsx

**Priority:** HIGH
**Complexity:** Medium

### What to Test

- ✅ Context provides initial state (loading, no user)
- ✅ Token validation on mount (calls /api/auth/me)
- ✅ Login updates user and token
- ✅ Logout clears user and token
- ✅ Invalid token triggers logout

### Implementation

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('validates token on mount', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiClient.get.mockResolvedValue({
      data: { id: 1, username: 'testuser' },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.username).toBe('testuser');
    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/auth/me');
  });

  it('logs in successfully', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        user: { id: 1, username: 'testuser' },
        token: 'new-token',
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login('testuser', 'password');
    });

    expect(localStorage.getItem('token')).toBe('new-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.username).toBe('testuser');
  });

  it('logs out successfully', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

## Test File 2: useApi.test.tsx

**Priority:** HIGH
**Complexity:** Low

```typescript
import { renderHook, act } from '@testing-library/react';
import { useApi } from '../hooks/useApi';

describe('useApi', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state during execution', async () => {
    const { result } = renderHook(() => useApi());
    const asyncFn = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

    act(() => {
      result.current.execute(asyncFn);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });

  it('sets data on success', async () => {
    const { result } = renderHook(() => useApi<string>());
    const asyncFn = jest.fn(() => Promise.resolve('success'));

    await act(async () => {
      await result.current.execute(asyncFn);
    });

    expect(result.current.data).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { result } = renderHook(() => useApi());
    const asyncFn = jest.fn(() => Promise.reject(new Error('failed')));

    await act(async () => {
      await result.current.execute(asyncFn);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('failed');
  });

  it('resets state', () => {
    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

---

## Test File 3: LoginForm.test.tsx

**Priority:** HIGH
**Complexity:** Medium

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { AuthProvider } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username and password fields', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        user: { id: 1, username: 'testuser' },
        token: 'test-token',
      },
    });

    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password',
      });
    });
  });

  it('displays error message on login failure', async () => {
    mockedApiClient.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    mockedApiClient.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
```

---

## Additional Test Files (Brief Outlines)

### Test File 4: ProtectedRoute.test.tsx
- Redirects unauthenticated users to /login
- Renders children for authenticated users
- Shows loading spinner while validating token

### Test File 5: VideosPage.test.tsx
- Fetches and displays videos on mount
- Shows loading state while fetching
- Shows error state on fetch failure
- Filters videos based on search query
- Pagination buttons work correctly

### Test File 6: VideoCard.test.tsx
- Renders video information
- Navigates to video detail on click
- Displays tags and metadata

### Test File 7: ClipCreator.test.tsx
Already exists! ✅ Review and ensure coverage is complete.

### Test File 8: ClipMetadataEditor.test.tsx
Already exists! ✅ Review and ensure coverage is complete.

### Test File 9: VideoPlayer.test.tsx
Already exists! ✅ Review and ensure coverage is complete.

### Test File 10: SearchFilterPanel.test.tsx
- Updates search query on input
- Applies filters on form submit
- Clears filters when reset clicked
- Shows active filter count badge

---

## Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- LoginForm.test.tsx

# Run in watch mode
npm test -- --watch
```

### Coverage Goals

- Overall: 70%+
- Critical paths (auth, API): 90%+
- Components: 60%+
- Hooks: 80%+

---

## Completion Criteria for Task 2

✅ AuthContext tested (5+ test cases)
✅ useApi hook tested (5+ test cases)
✅ LoginForm tested (5+ test cases)
✅ ProtectedRoute tested (3+ test cases)
✅ At least 2 page components tested
✅ Existing test files reviewed and enhanced
✅ Test coverage report shows 70%+ overall
✅ All tests pass in CI

---

# Summary

## Task Checklist

### Task 1: Playlist Features (8-12 hours)
- [ ] Install @dnd-kit library
- [ ] Create PlaylistCard component
- [ ] Update PlaylistsPage (grid, create, delete)
- [ ] Create CreatePlaylistModal component
- [ ] Create PlaylistClipList with drag-and-drop
- [ ] Create ClipSelector component
- [ ] Update PlaylistDetailPage (full editor)
- [ ] Implement sequential playback
- [ ] Add TypeScript types
- [ ] Test all CRUD operations manually
- [ ] Create CSS modules for styling

### Task 2: Component Tests (4-6 hours)
- [ ] Test AuthContext (5+ cases)
- [ ] Test useApi hook (5+ cases)
- [ ] Test LoginForm (5+ cases)
- [ ] Test ProtectedRoute (3+ cases)
- [ ] Test 2+ page components
- [ ] Review existing 3 test files
- [ ] Verify 70%+ coverage
- [ ] Ensure all tests pass

## Success Metrics

When complete, the project will achieve:
- ✅ 100% spec compliance (requirements.md)
- ✅ 100% design compliance (design.md)
- ✅ 100% task completion (tasks.md)
- ✅ 70%+ test coverage
- ✅ Production-ready codebase

## Getting Help

If you get stuck:
1. Reference existing components (VideoCard, ClipCard pattern)
2. Check backend API.md for endpoint documentation
3. Review React Testing Library docs for testing patterns
4. Check @dnd-kit documentation for drag-and-drop examples

The backend is 100% ready and working. All API endpoints are tested and documented. You're just building the UI!
