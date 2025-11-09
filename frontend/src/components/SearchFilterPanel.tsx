/**
 * Search Filter Panel Component
 *
 * Advanced search and filter interface for videos with multiple criteria.
 * Supports text search, tag filtering, date ranges, and custom metadata.
 */

import { useState, useEffect } from 'react';
import { VideoFilters } from '../types/video';
import './SearchFilterPanel.css';

interface SearchFilterPanelProps {
  onFilterChange: (filters: VideoFilters) => void;
  initialFilters?: VideoFilters;
}

/**
 * SearchFilterPanel Component
 *
 * Provides UI controls for filtering video library with:
 * - Text search (title/description)
 * - Tag filters
 * - Date range filters
 * - Clear all filters
 *
 * Uses controlled inputs and calls onFilterChange when filters update.
 *
 * @param props - Component props
 * @param props.onFilterChange - Callback when filters change
 * @param props.initialFilters - Initial filter values from URL params
 *
 * @example
 * ```tsx
 * <SearchFilterPanel
 *   onFilterChange={(filters) => setFilters(filters)}
 *   initialFilters={{ query: 'example' }}
 * />
 * ```
 */
export default function SearchFilterPanel({
  onFilterChange,
  initialFilters = {},
}: SearchFilterPanelProps) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [tagsInput, setTagsInput] = useState(initialFilters.tags?.join(', ') || '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const filters: VideoFilters = {
        ...(query && { query }),
        ...(tags.length > 0 && { tags }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      onFilterChange(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, tagsInput, dateFrom, dateTo, onFilterChange]);

  const handleClearFilters = () => {
    setQuery('');
    setTagsInput('');
    setDateFrom('');
    setDateTo('');
    onFilterChange({});
  };

  const hasActiveFilters = query || tagsInput || dateFrom || dateTo;

  return (
    <div className="search-filter-panel">
      {/* Primary Search */}
      <div className="search-filter-panel__primary">
        <div className="search-filter-panel__search">
          <svg
            className="search-filter-panel__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search videos by title or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-filter-panel__search-input"
            aria-label="Search videos"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="search-filter-panel__clear-input"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="search-filter-panel__toggle"
          aria-expanded={isExpanded}
        >
          <svg
            className="search-filter-panel__filter-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="search-filter-panel__filter-badge">
              {[query, tagsInput, dateFrom, dateTo].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="search-filter-panel__advanced">
          {/* Tags Filter */}
          <div className="search-filter-panel__field">
            <label htmlFor="tags-filter" className="search-filter-panel__label">
              Tags (comma-separated)
            </label>
            <input
              id="tags-filter"
              type="text"
              placeholder="e.g., action, tutorial, demo"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="search-filter-panel__input"
            />
          </div>

          {/* Date Range Filters */}
          <div className="search-filter-panel__row">
            <div className="search-filter-panel__field">
              <label htmlFor="date-from" className="search-filter-panel__label">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="search-filter-panel__input"
              />
            </div>

            <div className="search-filter-panel__field">
              <label htmlFor="date-to" className="search-filter-panel__label">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="search-filter-panel__input"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="search-filter-panel__actions">
              <button
                type="button"
                onClick={handleClearFilters}
                className="search-filter-panel__clear"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
