# Code Patterns Reference Guide

This document provides quick reference patterns from the existing codebase to ensure consistency when implementing remaining features.

---

## React Component Patterns

### Standard Functional Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import styles from './ComponentName.module.css';

interface ComponentProps {
  // Props definition
}

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks first
  const navigate = useNavigate();
  const { id } = useParams();

  // 2. State declarations
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Effects
  useEffect(() => {
    fetchData();
  }, [id]);

  // 4. Handler functions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/endpoint/${id}`);
      setData(response.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      await apiClient.post('/api/endpoint', { data });
      // Success handling
    } catch (err) {
      alert('Action failed');
    }
  };

  // 5. Conditional renders
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.error}>Not found</div>;

  // 6. Main render
  return (
    <div className={styles.componentName}>
      {/* Component content */}
    </div>
  );
};
```

### Example: ClipCard Component Pattern

```typescript
// frontend/src/components/ClipCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaScissors, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { Clip } from '../types/clip';
import { formatDuration } from '../utils/format';
import styles from './ClipCard.module.css';

interface ClipCardProps {
  clip: Clip;
}

export const ClipCard: React.FC<ClipCardProps> = ({ clip }) => {
  const isOrphaned = clip.video?.isAvailable === false;

  return (
    <Link to={`/clip/${clip.id}`} className={styles.clipCard}>
      <div className={styles.thumbnail}>
        <FaScissors className={styles.icon} />
        <span className={styles.duration}>{formatDuration(clip.duration)}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{clip.name}</h3>

        <div className={styles.sourceVideo}>
          {isOrphaned ? (
            <>
              <FaExclamationTriangle className={styles.warningIcon} />
              <span className={styles.unavailable}>Source unavailable</span>
            </>
          ) : (
            <span>{clip.video?.title || 'Unknown video'}</span>
          )}
        </div>

        <div className={styles.timeRange}>
          <FaClock />
          <span>
            {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
          </span>
        </div>
      </div>
    </Link>
  );
};
```

---

## Page Component Patterns

### List/Grid Page Pattern (VideosPage, ClipsPage)

```typescript
export const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filters from URL
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/items', {
        params: { query, page, limit: 20 },
      });
      setItems(response.data);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [query, page]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchItems} />;

  return (
    <div className={styles.itemsPage}>
      <div className={styles.header}>
        <h1>Items</h1>
        <button onClick={handleCreate}>Create New</button>
      </div>

      <SearchFilterPanel onSearch={handleSearch} />

      <div className={styles.results}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </div>

      {items.length === 0 ? (
        <EmptyState message="No items found" />
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <Pagination currentPage={page} onChange={handlePageChange} />
    </div>
  );
};
```

### Detail Page Pattern (VideoDetailPage, ClipDetailPage)

```typescript
export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/items/${id}`);
        setItem(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!item) return <ErrorMessage message="Item not found" />;

  return (
    <div className={styles.itemDetail}>
      <div className={styles.header}>
        <h1>{item.name}</h1>
        <div className={styles.actions}>
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Item content */}
      </div>
    </div>
  );
};
```

---

## API Client Patterns

### GET Request
```typescript
const response = await apiClient.get('/api/endpoint', {
  params: { query, filter },
});
```

### POST Request
```typescript
const response = await apiClient.post('/api/endpoint', {
  field1: value1,
  field2: value2,
});
```

### PATCH Request
```typescript
const response = await apiClient.patch(`/api/endpoint/${id}`, {
  field: newValue,
});
```

### DELETE Request
```typescript
await apiClient.delete(`/api/endpoint/${id}`);
```

### With Error Handling
```typescript
try {
  const response = await apiClient.get('/api/endpoint');
  setData(response.data);
} catch (err: any) {
  const message = err.response?.data?.message || 'Operation failed';
  setError(message);
  console.error(err);
}
```

---

## Form Patterns

### React Hook Form Pattern (from LoginForm)

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  description?: string;
}

export const FormComponent: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await apiClient.post('/api/endpoint', data);
      reset();
      // Success handling
    } catch (err) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          {...register('name', { required: 'Name is required' })}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" className={styles.error}>
            {errors.name.message}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => reset()}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
```

---

## Modal Pattern

### Modal Component (for CreatePlaylistModal)

```typescript
interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
```

### CSS for Modal

```css
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## CSS Module Patterns

### Standard Component Styles

```css
/* ComponentName.module.css */

.componentName {
  /* Container styles */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
}

.actions {
  display: flex;
  gap: 1rem;
}

.content {
  /* Main content area */
}

/* Loading and error states */
.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  color: #dc2626;
}

/* Grid layouts */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

/* Card styles */
.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Button styles */
button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #2563eb;
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

button.secondary {
  background: #6b7280;
}

button.danger {
  background: #dc2626;
}
```

---

## TypeScript Type Patterns

### API Response Types

```typescript
// From existing types/video.ts pattern
export interface Video {
  id: number;
  filePath: string;
  title: string;
  description: string | null;
  tags: string[];
  duration: number;
  resolution: string | null;
  codec: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
  customMetadata: Record<string, any>;
}

export interface CreateVideoInput {
  filePath: string;
  title: string;
  description?: string;
  tags?: string[];
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  tags?: string[];
  customMetadata?: Record<string, any>;
}
```

### Component Prop Types

```typescript
interface ComponentProps {
  // Required props (no ?)
  id: number;
  name: string;

  // Optional props
  description?: string;

  // Callback functions
  onClick: (id: number) => void;
  onChange?: (value: string) => void;

  // Async callbacks
  onSave: (data: SaveData) => Promise<void>;

  // Children
  children?: React.ReactNode;

  // Style overrides
  className?: string;
}
```

---

## Utility Function Patterns

### Format Duration (from existing utils)

```typescript
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
```

### Format File Size

```typescript
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
```

### Format Date

```typescript
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

---

## Testing Patterns

### Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ComponentName } from './ComponentName';

// Mock dependencies
jest.mock('../services/apiClient');

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <ComponentName {...props} />
    </BrowserRouter>
  );
};

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const onAction = jest.fn();
    renderComponent({ onAction });

    const button = screen.getByRole('button', { name: /action/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAction).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    renderComponent();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles errors', async () => {
    // Mock API error
    const error = new Error('Test error');
    mockedApiClient.get.mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
```

---

## Icon Usage Patterns

### React Icons Import

```typescript
// Common icons used across the app
import {
  FaPlay,
  FaPause,
  FaStop,
  FaForward,
  FaBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaPlus,
  FaMinus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaFilm,
  FaScissors,
  FaListUl,
  FaClock,
  FaGripVertical,
} from 'react-icons/fa';
```

### Icon Usage in Components

```tsx
<button>
  <FaPlay /> Play
</button>

<div className={styles.icon}>
  <FaFilm />
</div>

{loading && <FaSpinner className={styles.spinner} />}
```

---

## Accessibility Patterns

### ARIA Labels

```tsx
<button
  onClick={handleAction}
  aria-label="Delete item"
  title="Delete item"
>
  <FaTrash />
</button>

<input
  id="search"
  type="text"
  aria-label="Search items"
  placeholder="Search..."
/>
```

### Form Accessibility

```tsx
<div className={styles.formGroup}>
  <label htmlFor="fieldName">Field Name</label>
  <input
    id="fieldName"
    type="text"
    {...register('fieldName', { required: 'Required' })}
    aria-invalid={errors.fieldName ? 'true' : 'false'}
    aria-describedby={errors.fieldName ? 'fieldName-error' : undefined}
  />
  {errors.fieldName && (
    <span id="fieldName-error" className={styles.error} role="alert">
      {errors.fieldName.message}
    </span>
  )}
</div>
```

---

## File Naming Conventions

### Components
- `PascalCase.tsx` - Component files
- `PascalCase.module.css` - Component styles
- `PascalCase.test.tsx` - Component tests

### Pages
- `PascalCase.tsx` - Page components (VideosPage, ClipDetailPage)
- Same pattern as components

### Utils
- `camelCase.ts` - Utility functions
- Group related functions in same file

### Types
- `camelCase.ts` - Type definition files
- Export interfaces with PascalCase names

---

## Import Order Convention

```typescript
// 1. React and third-party libraries
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaPause } from 'react-icons/fa';

// 2. Services and API
import apiClient from '../services/apiClient';

// 3. Hooks
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

// 4. Components
import { VideoPlayer } from '../components/VideoPlayer';
import { LoadingSpinner } from '../components/LoadingSpinner';

// 5. Types
import { Video } from '../types/video';

// 6. Utils
import { formatDuration } from '../utils/format';

// 7. Styles (last)
import styles from './ComponentName.module.css';
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

```typescript
// Don't use 'any' unnecessarily
const [data, setData] = useState<any>(null);

// Don't forget error handling
const fetchData = async () => {
  const response = await apiClient.get('/api/endpoint'); // No try/catch!
  setData(response.data);
};

// Don't forget loading states
if (!data) return null; // What if it's loading?

// Don't mutate state directly
items.push(newItem); // Wrong!
setItems(items);

// Don't forget cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  // Missing cleanup!
}, []);
```

### ✅ Do This Instead

```typescript
// Use proper types
const [data, setData] = useState<DataType | null>(null);

// Always handle errors
const fetchData = async () => {
  try {
    const response = await apiClient.get('/api/endpoint');
    setData(response.data);
  } catch (err) {
    setError('Failed to load data');
    console.error(err);
  }
};

// Always show loading states
if (loading) return <LoadingSpinner />;
if (!data) return <ErrorMessage />;

// Use immutable updates
setItems([...items, newItem]);

// Always cleanup effects
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);
```

---

## Quick Reference: Existing Components to Copy From

When building new components, reference these similar existing components:

| New Component | Reference This | Reason |
|---------------|----------------|--------|
| PlaylistCard | ClipCard, VideoCard | Card layout pattern |
| PlaylistsPage | VideosPage, ClipsPage | List/grid page pattern |
| PlaylistDetailPage | VideoDetailPage, ClipDetailPage | Detail page pattern |
| CreatePlaylistModal | LoginForm structure | Form handling pattern |
| PlaylistClipList | ClipMarkerTimeline | List with items pattern |
| ClipSelector | SearchFilterPanel | Search/filter pattern |

---

This reference guide ensures your new code matches the existing codebase style and patterns perfectly!
