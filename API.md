# Media Player API Documentation

Complete REST API reference for the Media Player application.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Videos](#videos-endpoints)
  - [Clips](#clips-endpoints)
  - [Playlists](#playlists-endpoints)
  - [Streaming](#streaming-endpoints)

## Overview

### Base URL

```
http://localhost:3000/api
```

Replace `localhost:3000` with your server address in production.

### Content Type

All requests and responses use JSON unless otherwise specified (streaming endpoints return video data).

```http
Content-Type: application/json
```

### API Version

Current version: **1.0**

The API follows semantic versioning. Breaking changes will increment the major version.

## Authentication

Media Player uses **JWT (JSON Web Token)** for authentication.

### Authentication Flow

1. **Login** via `POST /api/auth/login` to receive a JWT token
2. **Include the token** in all subsequent requests via the `Authorization` header
3. **Token expiration**: Tokens are valid until logout (stateless)

### Including Authentication

```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Example**:
```http
GET /api/videos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Handling Authentication Errors

```http
401 Unauthorized
```

```json
{
  "error": "No token provided"
}
```

or

```json
{
  "error": "Invalid token"
}
```

**Solution**: Login again to obtain a new token.

## Common Patterns

### Pagination

Many list endpoints support pagination via query parameters.

**Parameters**:
- `limit` (number, 1-1000): Number of items to return (default: 100)
- `offset` (number, ≥0): Number of items to skip (default: 0)

**Example**:
```http
GET /api/videos?limit=20&offset=40
```

**Response**:
```json
{
  "videos": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

### Filtering

Filter results using query parameters specific to each endpoint.

**Example**:
```http
GET /api/clips?videoId=5
```

### Sorting

Some endpoints support sorting via query parameters.

**Parameters**:
- `sortBy` (string): Field to sort by (e.g., `createdAt`, `title`, `duration`)
- `sortOrder` (string): `asc` or `desc` (default: `desc`)

### Timestamps

All timestamps are in **ISO 8601 format** (UTC).

**Example**:
```json
{
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:22:10.500Z"
}
```

## Error Responses

### Error Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created successfully |
| `204` | No Content | Resource deleted successfully |
| `400` | Bad Request | Invalid input, validation error |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource conflict (e.g., duplicate) |
| `500` | Internal Server Error | Server error, check logs |

### Validation Errors

```json
{
  "error": "\"title\" is required"
}
```

or

```json
{
  "error": "Start time must be less than end time"
}
```

## Rate Limiting

Currently, rate limiting is not enforced. Future versions may implement rate limiting for API stability.

**Recommended client-side best practices**:
- Implement exponential backoff for retries
- Cache responses when appropriate
- Batch operations when possible

---

## API Endpoints

## Authentication Endpoints

### POST /api/auth/login

Authenticate a user and receive a JWT token.

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | User's username |
| `password` | string | Yes | User's password |

**Success Response** (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

**Error Responses**:

`400 Bad Request` - Missing or invalid fields:
```json
{
  "error": "\"username\" is required"
}
```

`401 Unauthorized` - Invalid credentials:
```json
{
  "error": "Invalid credentials"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"SecurePass123"}'
```

---

### POST /api/auth/logout

Logout the current user.

**Note**: This is a client-side operation. The server doesn't maintain session state. The client should remove the JWT token from storage.

**Request**:
```http
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "message": "Logged out successfully"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/auth/validate

Validate the current JWT token and return user information.

**Request**:
```http
GET /api/auth/validate
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

**Error Response** (`401 Unauthorized`):
```json
{
  "error": "Invalid token"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Videos Endpoints

### GET /api/videos

List all videos with pagination support.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Number of videos to return (1-1000) |
| `offset` | number | 0 | Number of videos to skip |
| `includeUnavailable` | boolean | false | Include videos marked as unavailable |

**Request**:
```http
GET /api/videos?limit=20&offset=0
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "videos": [
    {
      "id": 1,
      "title": "Introduction to TypeScript",
      "filePath": "/media/typescript-intro.mp4",
      "duration": 1845.5,
      "resolution": "1920x1080",
      "codec": "H.264",
      "fileSize": 524288000,
      "isAvailable": true,
      "description": "A comprehensive introduction to TypeScript",
      "tags": ["programming", "typescript", "tutorial"],
      "customMetadata": {
        "author": "John Doe",
        "series": "Web Development"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:3000/api/videos?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/videos/search

Search for videos by query, tags, resolution, and other criteria.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Search in title and description (max 500 chars) |
| `tags` | string[] | - | Filter by tags (comma-separated or array) |
| `minDuration` | number | - | Minimum duration in seconds |
| `maxDuration` | number | - | Maximum duration in seconds |
| `resolution` | string | - | Filter by resolution (e.g., "1920x1080") |
| `includeUnavailable` | boolean | false | Include unavailable videos |
| `limit` | number | 100 | Results per page (1-1000) |
| `offset` | number | 0 | Results to skip |

**Request**:
```http
GET /api/videos/search?query=typescript&tags=tutorial,programming&limit=10
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "videos": [
    {
      "id": 1,
      "title": "Introduction to TypeScript",
      "filePath": "/media/typescript-intro.mp4",
      "duration": 1845.5,
      "resolution": "1920x1080",
      "codec": "H.264",
      "fileSize": 524288000,
      "isAvailable": true,
      "description": "A comprehensive introduction to TypeScript",
      "tags": ["programming", "typescript", "tutorial"],
      "customMetadata": {},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:3000/api/videos/search?query=typescript&tags=tutorial" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/videos/:id

Get a single video by ID.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |

**Request**:
```http
GET /api/videos/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "title": "Introduction to TypeScript",
  "filePath": "/media/typescript-intro.mp4",
  "duration": 1845.5,
  "resolution": "1920x1080",
  "codec": "H.264",
  "fileSize": 524288000,
  "isAvailable": true,
  "description": "A comprehensive introduction to TypeScript",
  "tags": ["programming", "typescript", "tutorial"],
  "customMetadata": {
    "author": "John Doe",
    "difficulty": "beginner"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/videos/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### PATCH /api/videos/:id/metadata

Update video metadata.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |

**Request Body** (at least one field required):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | string | 1-255 chars | Video title |
| `description` | string\|null | ≤10000 chars | Video description |
| `tags` | string[] | Unique, lowercase, ≤50 chars each | Tags for categorization |
| `duration` | number | ≥0 | Duration in seconds |
| `resolution` | string | ≤20 chars | Video resolution (e.g., "1920x1080") |
| `codec` | string | ≤50 chars | Video codec (e.g., "H.264") |
| `customMetadata` | object | ≤100 properties | Custom key-value pairs |

**Request**:
```http
PATCH /api/videos/1/metadata
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Advanced TypeScript Guide",
  "description": "Deep dive into advanced TypeScript concepts",
  "tags": ["programming", "typescript", "advanced"],
  "customMetadata": {
    "author": "Jane Smith",
    "difficulty": "advanced",
    "series": "Web Development"
  }
}
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "title": "Advanced TypeScript Guide",
  "filePath": "/media/typescript-intro.mp4",
  "duration": 1845.5,
  "resolution": "1920x1080",
  "codec": "H.264",
  "fileSize": 524288000,
  "isAvailable": true,
  "description": "Deep dive into advanced TypeScript concepts",
  "tags": ["programming", "typescript", "advanced"],
  "customMetadata": {
    "author": "Jane Smith",
    "difficulty": "advanced",
    "series": "Web Development"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T08:15:30.000Z"
}
```

**Error Responses**:

`400 Bad Request` - Validation error:
```json
{
  "error": "\"title\" must be at least 1 characters long"
}
```

`404 Not Found`:
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X PATCH http://localhost:3000/api/videos/1/metadata \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Advanced TypeScript Guide","tags":["programming","typescript","advanced"]}'
```

---

### DELETE /api/videos/:id

Delete a video (soft delete - marks as unavailable).

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |

**Request**:
```http
DELETE /api/videos/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`204 No Content`):
```
(empty body)
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X DELETE http://localhost:3000/api/videos/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/videos/scan

Scan a directory for new video files and add them to the library.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mountPath` | string | Yes | Directory path to scan for videos |

**Request**:
```http
POST /api/videos/scan
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "mountPath": "/media/videos"
}
```

**Success Response** (`200 OK`):
```json
{
  "message": "Scan completed",
  "added": 15,
  "skipped": 3,
  "errors": 0
}
```

**Error Response** (`400 Bad Request`):
```json
{
  "error": "\"mountPath\" is required"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/videos/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mountPath":"/media/videos"}'
```

---

## Clips Endpoints

### GET /api/clips

List all clips, optionally filtered by video ID.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `videoId` | number | Filter clips by source video ID |

**Request**:
```http
GET /api/clips?videoId=1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "clips": [
    {
      "id": 1,
      "videoId": 1,
      "title": "Key Concepts Overview",
      "startTime": 120.5,
      "endTime": 245.0,
      "description": "Overview of key TypeScript concepts",
      "tags": ["concepts", "overview"],
      "customMetadata": {
        "importance": "high"
      },
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": 2,
      "videoId": 1,
      "title": "Advanced Types",
      "startTime": 580.0,
      "endTime": 720.5,
      "description": "Exploring advanced type features",
      "tags": ["types", "advanced"],
      "customMetadata": {},
      "createdAt": "2024-01-15T11:15:00.000Z",
      "updatedAt": "2024-01-15T11:15:00.000Z"
    }
  ],
  "count": 2
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:3000/api/clips?videoId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/clips/:id

Get a single clip by ID.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Clip ID |

**Request**:
```http
GET /api/clips/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "videoId": 1,
  "title": "Key Concepts Overview",
  "startTime": 120.5,
  "endTime": 245.0,
  "description": "Overview of key TypeScript concepts",
  "tags": ["concepts", "overview"],
  "customMetadata": {
    "importance": "high",
    "speaker": "John Doe"
  },
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Clip not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/clips/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/clips

Create a new clip from a video.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `videoId` | number | Yes | Positive integer | Source video ID |
| `title` | string | Yes | 1-255 chars | Clip title |
| `startTime` | number | Yes | ≥0, < endTime | Start time in seconds |
| `endTime` | number | Yes | > startTime | End time in seconds |
| `description` | string\|null | No | ≤10000 chars | Clip description |
| `tags` | string[] | No | Unique, lowercase, ≤50 chars each | Tags |
| `customMetadata` | object | No | ≤100 properties | Custom metadata |

**Request**:
```http
POST /api/clips
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "videoId": 1,
  "title": "Introduction Section",
  "startTime": 0,
  "endTime": 120.5,
  "description": "Opening introduction and overview",
  "tags": ["intro", "overview"],
  "customMetadata": {
    "section": "introduction",
    "importance": "high"
  }
}
```

**Success Response** (`201 Created`):
```json
{
  "id": 3,
  "videoId": 1,
  "title": "Introduction Section",
  "startTime": 0,
  "endTime": 120.5,
  "description": "Opening introduction and overview",
  "tags": ["intro", "overview"],
  "customMetadata": {
    "section": "introduction",
    "importance": "high"
  },
  "createdAt": "2024-01-16T09:00:00.000Z",
  "updatedAt": "2024-01-16T09:00:00.000Z"
}
```

**Error Responses**:

`400 Bad Request` - Validation error:
```json
{
  "error": "Start time must be less than end time"
}
```

`404 Not Found` - Video doesn't exist:
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/clips \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoId":1,"title":"Introduction Section","startTime":0,"endTime":120.5,"tags":["intro"]}'
```

---

### PATCH /api/clips/:id/metadata

Update clip metadata.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Clip ID |

**Request Body** (at least one field required):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | string | 1-255 chars | Clip title |
| `description` | string\|null | ≤10000 chars | Clip description |
| `tags` | string[] | Unique, lowercase, ≤50 chars each | Tags |
| `customMetadata` | object | ≤100 properties | Custom metadata |

**Request**:
```http
PATCH /api/clips/1/metadata
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Key Concepts - Updated",
  "description": "Comprehensive overview of TypeScript key concepts",
  "tags": ["concepts", "overview", "fundamentals"],
  "customMetadata": {
    "importance": "critical",
    "reviewed": true
  }
}
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "videoId": 1,
  "title": "Key Concepts - Updated",
  "startTime": 120.5,
  "endTime": 245.0,
  "description": "Comprehensive overview of TypeScript key concepts",
  "tags": ["concepts", "overview", "fundamentals"],
  "customMetadata": {
    "importance": "critical",
    "reviewed": true
  },
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-16T09:30:00.000Z"
}
```

**Error Responses**:

`400 Bad Request`:
```json
{
  "error": "At least one field must be provided for update"
}
```

`404 Not Found`:
```json
{
  "error": "Clip not found"
}
```

**Usage Example**:
```bash
curl -X PATCH http://localhost:3000/api/clips/1/metadata \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Key Concepts - Updated","tags":["concepts","overview","fundamentals"]}'
```

---

### DELETE /api/clips/:id

Delete a clip.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Clip ID |

**Request**:
```http
DELETE /api/clips/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`204 No Content`):
```
(empty body)
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Clip not found"
}
```

**Usage Example**:
```bash
curl -X DELETE http://localhost:3000/api/clips/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Playlists Endpoints

### GET /api/playlists

List all playlists.

**Authentication**: Required

**Request**:
```http
GET /api/playlists
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "playlists": [
    {
      "id": 1,
      "name": "TypeScript Tutorial Series",
      "description": "Complete TypeScript learning path",
      "tags": ["typescript", "tutorial", "series"],
      "clipCount": 12,
      "totalDuration": 3600.5,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Best Moments Compilation",
      "description": "Highlights from various videos",
      "tags": ["highlights", "compilation"],
      "clipCount": 8,
      "totalDuration": 1200.0,
      "createdAt": "2024-01-16T08:00:00.000Z",
      "updatedAt": "2024-01-16T08:30:00.000Z"
    }
  ],
  "count": 2
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/playlists \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/playlists/:id

Get a single playlist with ordered clips.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeOrphaned` | boolean | false | Include clips from deleted videos |

**Request**:
```http
GET /api/playlists/1?includeOrphaned=false
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "name": "TypeScript Tutorial Series",
  "description": "Complete TypeScript learning path",
  "tags": ["typescript", "tutorial", "series"],
  "clips": [
    {
      "id": 1,
      "videoId": 1,
      "title": "Introduction Section",
      "startTime": 0,
      "endTime": 120.5,
      "description": "Opening introduction",
      "tags": ["intro"],
      "customMetadata": {},
      "order": 0,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": 2,
      "videoId": 1,
      "title": "Key Concepts",
      "startTime": 120.5,
      "endTime": 245.0,
      "description": "Core concepts overview",
      "tags": ["concepts"],
      "customMetadata": {},
      "order": 1,
      "createdAt": "2024-01-15T11:15:00.000Z",
      "updatedAt": "2024-01-15T11:15:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-16T10:00:00.000Z"
}
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Playlist not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/playlists/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/playlists

Create a new playlist.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | 1-255 chars | Playlist name |
| `description` | string\|null | No | ≤10000 chars | Playlist description |
| `tags` | string[] | No | Unique, lowercase, ≤50 chars each | Tags |

**Request**:
```http
POST /api/playlists
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "React Fundamentals",
  "description": "Essential React concepts and patterns",
  "tags": ["react", "fundamentals", "frontend"]
}
```

**Success Response** (`201 Created`):
```json
{
  "id": 3,
  "name": "React Fundamentals",
  "description": "Essential React concepts and patterns",
  "tags": ["react", "fundamentals", "frontend"],
  "clips": [],
  "createdAt": "2024-01-16T10:00:00.000Z",
  "updatedAt": "2024-01-16T10:00:00.000Z"
}
```

**Error Response** (`400 Bad Request`):
```json
{
  "error": "\"name\" is required"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/playlists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"React Fundamentals","description":"Essential React concepts","tags":["react","fundamentals"]}'
```

---

### PUT /api/playlists/:id

Update a playlist.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |

**Request Body** (at least one field required):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `name` | string | 1-255 chars | Playlist name |
| `description` | string\|null | ≤10000 chars | Playlist description |
| `tags` | string[] | Unique, lowercase, ≤50 chars each | Tags |

**Request**:
```http
PUT /api/playlists/1
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "TypeScript Complete Guide",
  "description": "Comprehensive TypeScript tutorial series - updated",
  "tags": ["typescript", "tutorial", "complete"]
}
```

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "name": "TypeScript Complete Guide",
  "description": "Comprehensive TypeScript tutorial series - updated",
  "tags": ["typescript", "tutorial", "complete"],
  "clips": [...],
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-16T11:00:00.000Z"
}
```

**Error Responses**:

`400 Bad Request`:
```json
{
  "error": "At least one field must be provided for update"
}
```

`404 Not Found`:
```json
{
  "error": "Playlist not found"
}
```

**Usage Example**:
```bash
curl -X PUT http://localhost:3000/api/playlists/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"TypeScript Complete Guide","tags":["typescript","tutorial","complete"]}'
```

---

### DELETE /api/playlists/:id

Delete a playlist (does not delete the clips themselves).

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |

**Request**:
```http
DELETE /api/playlists/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`204 No Content`):
```
(empty body)
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Playlist not found"
}
```

**Usage Example**:
```bash
curl -X DELETE http://localhost:3000/api/playlists/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/playlists/:id/clips

Add a clip to a playlist.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clipId` | number | Yes | ID of clip to add |
| `order` | number | No | Position in playlist (0-based, defaults to end) |

**Request**:
```http
POST /api/playlists/1/clips
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "clipId": 5,
  "order": 2
}
```

**Success Response** (`200 OK`):
```json
{
  "message": "Clip added to playlist",
  "playlistId": 1,
  "clipId": 5,
  "order": 2
}
```

**Error Responses**:

`400 Bad Request` - Clip already in playlist:
```json
{
  "error": "Clip already in this playlist"
}
```

`404 Not Found` - Playlist or clip doesn't exist:
```json
{
  "error": "Playlist not found"
}
```

**Usage Example**:
```bash
curl -X POST http://localhost:3000/api/playlists/1/clips \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clipId":5,"order":2}'
```

---

### DELETE /api/playlists/:id/clips/:clipId

Remove a clip from a playlist.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |
| `clipId` | number | Clip ID to remove |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `reorder` | boolean | true | Automatically reorder remaining clips |

**Request**:
```http
DELETE /api/playlists/1/clips/5?reorder=true
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`204 No Content`):
```
(empty body)
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Clip not found in playlist"
}
```

**Usage Example**:
```bash
curl -X DELETE "http://localhost:3000/api/playlists/1/clips/5?reorder=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### PATCH /api/playlists/:id/reorder

Reorder clips in a playlist (atomic operation).

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Playlist ID |

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clipOrders` | array | Yes | Array of {clipId, order} objects |

**Request**:
```http
PATCH /api/playlists/1/reorder
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "clipOrders": [
    { "clipId": 3, "order": 0 },
    { "clipId": 1, "order": 1 },
    { "clipId": 2, "order": 2 },
    { "clipId": 5, "order": 3 }
  ]
}
```

**Success Response** (`200 OK`):
```json
{
  "message": "Playlist reordered successfully",
  "playlistId": 1,
  "updatedClips": 4
}
```

**Error Responses**:

`400 Bad Request` - Invalid clip IDs:
```json
{
  "error": "Some clip IDs are not in this playlist"
}
```

`400 Bad Request` - Duplicate orders:
```json
{
  "error": "Duplicate order values are not allowed"
}
```

**Usage Example**:
```bash
curl -X PATCH http://localhost:3000/api/playlists/1/reorder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clipOrders":[{"clipId":3,"order":0},{"clipId":1,"order":1}]}'
```

---

## Streaming Endpoints

### GET /api/stream/video/:id

Stream a complete video with HTTP Range support for seeking.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |

**Request Headers** (optional):
| Header | Description |
|--------|-------------|
| `Range` | Byte range for partial content (e.g., "bytes=0-1023") |

**Request**:
```http
GET /api/stream/video/1
Authorization: Bearer YOUR_TOKEN
Range: bytes=0-1048575
```

**Success Response** (`206 Partial Content`):
```http
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 1048576
Content-Range: bytes 0-1048575/524288000
Accept-Ranges: bytes

[binary video data]
```

**Or** (`200 OK` without Range header):
```http
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 524288000
Accept-Ranges: bytes

[binary video data]
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/stream/video/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Range: bytes=0-1048575" \
  --output video_chunk.mp4
```

---

### GET /api/stream/clip/:id

Stream a clip (time-based segment) extracted from a video using FFmpeg.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Clip ID |

**Note**: Range requests are not supported for clips as they are generated on-the-fly.

**Request**:
```http
GET /api/stream/clip/1
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```http
HTTP/1.1 200 OK
Content-Type: video/mp4
Transfer-Encoding: chunked
Accept-Ranges: none

[binary clip data - generated on-the-fly]
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Clip not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/stream/clip/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output clip.mp4
```

---

### GET /api/stream/hls/:id/manifest.m3u8

Get HLS manifest for adaptive bitrate streaming.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |

**Request**:
```http
GET /api/stream/hls/1/manifest.m3u8
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.apple.mpegurl
Access-Control-Allow-Origin: *

#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment000.ts
#EXTINF:10.0,
segment001.ts
#EXTINF:10.0,
segment002.ts
#EXT-X-ENDLIST
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Video not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/stream/hls/1/manifest.m3u8 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/stream/hls/:id/:segment

Get HLS segment file (.ts).

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Video ID |
| `segment` | string | Segment filename (e.g., "segment000.ts") |

**Request**:
```http
GET /api/stream/hls/1/segment000.ts
Authorization: Bearer YOUR_TOKEN
```

**Success Response** (`200 OK`):
```http
HTTP/1.1 200 OK
Content-Type: video/mp2t
Access-Control-Allow-Origin: *

[binary segment data]
```

**Error Response** (`404 Not Found`):
```json
{
  "error": "Segment not found"
}
```

**Usage Example**:
```bash
curl -X GET http://localhost:3000/api/stream/hls/1/segment000.ts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output segment000.ts
```

---

## Advanced Topics

### CORS Configuration

The API includes CORS headers for HLS streaming endpoints to support cross-origin playback.

**Affected Endpoints**:
- `/api/stream/hls/:id/manifest.m3u8`
- `/api/stream/hls/:id/:segment`

**Headers**:
```http
Access-Control-Allow-Origin: *
```

### HLS Caching

HLS segments are cached on disk for performance:
- **Cache Directory**: Configurable via `HLS_CACHE_DIR` environment variable
- **Cache Lifetime**: Segments persist until manually cleared
- **Cache Clearing**: Delete cache directory contents or restart service

### Video Format Support

Supported video formats depend on FFmpeg capabilities:
- **Primary**: MP4 (H.264/AAC)
- **Also supported**: WebM, MKV, AVI, MOV, FLV (most common codecs)

**Recommendation**: Use MP4 with H.264 video and AAC audio for best compatibility.

### Best Practices

**Client Implementation**:
1. **Cache tokens**: Store JWT securely and reuse for multiple requests
2. **Handle 401**: Implement automatic re-login on token expiration
3. **Use pagination**: Don't fetch all items at once
4. **Implement retries**: Use exponential backoff for failed requests
5. **Stream efficiently**: Use HLS for large videos, direct streaming for short clips

**Performance**:
- Use HLS streaming (`/api/stream/hls/:id/manifest.m3u8`) for videos > 100MB
- Use direct video streaming (`/api/stream/video/:id`) for shorter videos
- Implement client-side caching for metadata
- Batch operations when possible

---

## Changelog

### Version 1.0 (Current)

- Initial API release
- Authentication with JWT
- Full video CRUD operations
- Clip creation and management
- Playlist creation and reordering
- Multiple streaming methods (direct, clip, HLS)
- Search and filtering
- Metadata management

---

## Support

For additional help:
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project Overview**: [README.md](README.md)
