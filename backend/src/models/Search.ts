/**
 * Search and Filter Types
 *
 * Types for advanced search and filtering functionality.
 */

/**
 * Filter operators for search criteria
 */
export enum FilterOperator {
  /**
   * Exact equality (=)
   */
  EQUALS = 'equals',

  /**
   * Not equal (!=)
   */
  NOT_EQUALS = 'not_equals',

  /**
   * Contains substring (LIKE %value%)
   */
  CONTAINS = 'contains',

  /**
   * Does not contain substring (NOT LIKE %value%)
   */
  NOT_CONTAINS = 'not_contains',

  /**
   * Starts with prefix (LIKE value%)
   */
  STARTS_WITH = 'starts_with',

  /**
   * Ends with suffix (LIKE %value)
   */
  ENDS_WITH = 'ends_with',

  /**
   * Greater than (>)
   */
  GREATER_THAN = 'gt',

  /**
   * Greater than or equal (>=)
   */
  GREATER_THAN_OR_EQUAL = 'gte',

  /**
   * Less than (<)
   */
  LESS_THAN = 'lt',

  /**
   * Less than or equal (<=)
   */
  LESS_THAN_OR_EQUAL = 'lte',

  /**
   * Value is between two values (BETWEEN x AND y)
   */
  BETWEEN = 'between',

  /**
   * Value is in array (IN (...))
   */
  IN = 'in',

  /**
   * Value is not in array (NOT IN (...))
   */
  NOT_IN = 'not_in',

  /**
   * Value is NULL (IS NULL)
   */
  IS_NULL = 'is_null',

  /**
   * Value is not NULL (IS NOT NULL)
   */
  IS_NOT_NULL = 'is_not_null',
}

/**
 * Metadata field definition
 */
export interface MetadataField {
  /**
   * Field name/key in the metadata object
   */
  name: string;

  /**
   * Field data type for type checking and validation
   */
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

  /**
   * Human-readable label for the field
   */
  label?: string;

  /**
   * Description of what this field represents
   */
  description?: string;

  /**
   * Whether this field can be used for searching
   */
  searchable?: boolean;

  /**
   * Whether this field can be used for filtering
   */
  filterable?: boolean;

  /**
   * Whether this field can be used for sorting
   */
  sortable?: boolean;
}

/**
 * Single filter condition
 */
export interface FilterCondition {
  /**
   * Field name to filter on
   */
  field: string;

  /**
   * Filter operator
   */
  operator: FilterOperator;

  /**
   * Value(s) to filter by
   * - Single value for most operators
   * - Array of two values for BETWEEN operator
   * - Array of values for IN/NOT_IN operators
   * - undefined for IS_NULL/IS_NOT_NULL operators
   */
  value?: unknown;
}

/**
 * Metadata filter for custom metadata fields
 */
export interface MetadataFilter {
  /**
   * Metadata field path (supports nested paths with dot notation)
   * e.g., "tags", "author.name", "statistics.views"
   */
  path: string;

  /**
   * Filter operator
   */
  operator: FilterOperator;

  /**
   * Value to filter by
   */
  value?: unknown;
}

/**
 * Sort direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sort configuration
 */
export interface SortCriteria {
  /**
   * Field name to sort by
   */
  field: string;

  /**
   * Sort direction
   */
  direction: SortDirection;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /**
   * Number of results per page
   */
  limit: number;

  /**
   * Number of results to skip (offset)
   */
  offset: number;
}

/**
 * Date range filter
 */
export interface DateRange {
  /**
   * Start date (inclusive)
   */
  from?: Date;

  /**
   * End date (inclusive)
   */
  to?: Date;
}

/**
 * Search criteria for videos
 */
export interface VideoSearchCriteria {
  /**
   * Full-text search query (searches title, description)
   */
  query?: string;

  /**
   * Filter by tags (match any of these tags)
   */
  tags?: string[];

  /**
   * Filter by availability status
   */
  isAvailable?: boolean;

  /**
   * Filter by creation date range
   */
  createdAt?: DateRange;

  /**
   * Filter by duration range (in seconds)
   */
  duration?: {
    min?: number;
    max?: number;
  };

  /**
   * Filter by file size range (in bytes)
   */
  fileSize?: {
    min?: number;
    max?: number;
  };

  /**
   * Filter by resolution
   */
  resolution?: string | string[];

  /**
   * Filter by codec
   */
  codec?: string | string[];

  /**
   * Custom metadata filters
   */
  metadata?: MetadataFilter[];

  /**
   * Generic filter conditions for any field
   */
  filters?: FilterCondition[];

  /**
   * Sort criteria
   */
  sort?: SortCriteria[];

  /**
   * Pagination parameters
   */
  pagination?: PaginationParams;
}

/**
 * Search criteria for clips
 */
export interface ClipSearchCriteria {
  /**
   * Full-text search query (searches name, description)
   */
  query?: string;

  /**
   * Filter by source video ID
   */
  videoId?: number;

  /**
   * Filter by creation date range
   */
  createdAt?: DateRange;

  /**
   * Filter by duration range (in seconds)
   */
  duration?: {
    min?: number;
    max?: number;
  };

  /**
   * Custom metadata filters
   */
  metadata?: MetadataFilter[];

  /**
   * Generic filter conditions for any field
   */
  filters?: FilterCondition[];

  /**
   * Sort criteria
   */
  sort?: SortCriteria[];

  /**
   * Pagination parameters
   */
  pagination?: PaginationParams;
}

/**
 * Search criteria for playlists
 */
export interface PlaylistSearchCriteria {
  /**
   * Full-text search query (searches name, description)
   */
  query?: string;

  /**
   * Filter by creation date range
   */
  createdAt?: DateRange;

  /**
   * Generic filter conditions for any field
   */
  filters?: FilterCondition[];

  /**
   * Sort criteria
   */
  sort?: SortCriteria[];

  /**
   * Pagination parameters
   */
  pagination?: PaginationParams;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for current page
   */
  items: T[];

  /**
   * Total number of items matching the search criteria
   */
  total: number;

  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a next page
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page
   */
  hasPrev: boolean;
}
