# Tasks Document

## Phase 1: Project Setup and Infrastructure

- [ ] 1.1. Initialize project structure and dependencies
  - Files: package.json (backend), package.json (frontend), docker-compose.yml, Dockerfile (backend), Dockerfile (frontend)
  - Create monorepo structure with backend and frontend directories
  - Install core dependencies (Express, React, TypeScript, etc.)
  - Configure TypeScript compiler options
  - Set up Docker configuration for development
  - _Requirements: Req 10_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: DevOps Engineer specializing in Node.js/TypeScript project setup and Docker containerization | Task: Initialize the project structure following the design document's project structure. Create backend and frontend directories with package.json files, install dependencies (Express.js 4.x, React 18+, TypeScript 5.x, mysql2, pg, bcrypt, jsonwebtoken, axios, react-router-dom). Configure TypeScript with strict mode. Create multi-stage Dockerfiles for both backend and frontend. Create docker-compose.yml with services for backend, frontend, MySQL, and PostgreSQL (for testing both adapters). Reference design.md sections: Project Structure, Technology Stack, Deployment Architecture | Restrictions: Use exact versions specified in design.md, do not install unnecessary dependencies, ensure Docker images are optimized with multi-stage builds | _Leverage: N/A (greenfield project) | Success: Project structure matches design.md, all dependencies installed, TypeScript compiles without errors, Docker containers build successfully, docker-compose.yml starts all services

- [ ] 1.2. Configure ESLint, Prettier, and Git hooks
  - Files: .eslintrc.js, .prettierrc, .gitignore, .husky/pre-commit (or similar)
  - Set up code quality tools with TypeScript support
  - Configure pre-commit hooks for linting and formatting
  - _Requirements: Non-functional (Code Architecture)_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: DevOps Engineer with expertise in code quality tools and automation | Task: Configure ESLint with TypeScript support using @typescript-eslint/parser and recommended rules. Configure Prettier for consistent code formatting. Set up Git hooks using husky to run linting and formatting before commits. Create .gitignore with appropriate entries for node_modules, build artifacts, .env files, etc. | Restrictions: Use recommended ESLint configurations, ensure Prettier doesn't conflict with ESLint, hooks should fail commits with errors | _Leverage: N/A | Success: ESLint catches TypeScript errors, Prettier formats code consistently, pre-commit hooks prevent bad code from being committed, no conflicts between tools

## Phase 2: Database Layer

- [ ] 2.1. Create database adapter interface and types
  - Files: backend/src/adapters/DatabaseAdapter.ts, backend/src/types/database.ts
  - Define DatabaseAdapter interface with methods for connection, queries, transactions, and migrations
  - Define TypeScript types for database configuration and results
  - _Requirements: Req 2_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: TypeScript Developer specializing in interface design and database abstraction patterns | Task: Create the DatabaseAdapter interface exactly as specified in design.md "Components and Interfaces" section. Include methods: connect, disconnect, runMigrations, getMigrationHistory, query, execute, beginTransaction, commit, rollback. Create DatabaseConfig type with fields for host, port, database, user, password. Create types for query results and migration records. Ensure interface is database-agnostic and doesn't expose database-specific details. Reference design.md section: DatabaseAdapter (Interface) | Restrictions: Interface must be truly database-agnostic, no database-specific types in interface, all methods must support both MySQL and PostgreSQL | _Leverage: N/A | Success: Interface compiles without errors, methods have clear type signatures, supports transaction management, migration tracking, and both raw queries and parameterized statements

- [ ] 2.2. Implement MySQL adapter
  - Files: backend/src/adapters/MySQLAdapter.ts
  - Implement DatabaseAdapter interface using mysql2 driver
  - Handle MySQL-specific syntax (AUTO_INCREMENT, ? placeholders, insertId)
  - Implement connection pooling
  - _Requirements: Req 2_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in MySQL and Node.js database drivers | Task: Implement MySQLAdapter class that implements the DatabaseAdapter interface using mysql2/promise driver. Use connection pooling for performance. Translate generic queries to MySQL syntax (? for parameters, handle AUTO_INCREMENT for insertId). Implement proper error handling and connection cleanup. Reference design.md sections: MySQLAdapter & PostgreSQLAdapter (Implementations), SQL Dialect Translation | Restrictions: Must implement all interface methods exactly, use parameterized queries to prevent SQL injection, handle connection errors gracefully, use connection pooling not single connections | _Leverage: DatabaseAdapter interface from task 2.1 | Success: All interface methods implemented correctly, connects to MySQL successfully, executes queries with proper parameter binding, transactions work atomically, connection pooling is configured, errors are properly caught and thrown

- [ ] 2.3. Implement PostgreSQL adapter
  - Files: backend/src/adapters/PostgreSQLAdapter.ts
  - Implement DatabaseAdapter interface using pg driver
  - Handle PostgreSQL-specific syntax (SERIAL, $1 $2 placeholders, RETURNING id)
  - Implement connection pooling
  - _Requirements: Req 2_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in PostgreSQL and Node.js database drivers | Task: Implement PostgreSQLAdapter class that implements the DatabaseAdapter interface using pg (node-postgres) driver. Use connection pooling for performance. Translate generic queries to PostgreSQL syntax ($1, $2 for parameters, handle SERIAL for auto-increment, use RETURNING id for insertId). Use JSONB type for JSON fields. Implement proper error handling and connection cleanup. Reference design.md sections: MySQLAdapter & PostgreSQLAdapter (Implementations), SQL Dialect Translation | Restrictions: Must implement all interface methods exactly, use parameterized queries ($1, $2), handle connection errors gracefully, prefer JSONB over JSON for better performance | _Leverage: DatabaseAdapter interface from task 2.1 | Success: All interface methods implemented correctly, connects to PostgreSQL successfully, executes queries with numbered placeholders, transactions work atomically, connection pooling is configured, JSONB fields work correctly

- [ ] 2.4. Create adapter factory and configuration loader
  - Files: backend/src/adapters/index.ts, backend/src/config/database.ts
  - Implement factory function to create appropriate adapter based on environment config
  - Load database configuration from environment variables
  - _Requirements: Req 2, Req 10_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in factory patterns and configuration management | Task: Create createDatabaseAdapter factory function that takes DB_TYPE ('mysql' or 'postgresql') and DatabaseConfig, and returns the appropriate adapter instance. Create loadDatabaseConfig function that reads environment variables (DB_TYPE, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) and returns DatabaseConfig object with validation. Throw clear errors if required config is missing. Use dotenv for environment variable loading. Reference design.md sections: Database Adapter Pattern Implementation (Adapter Factory), Environment Configuration | Restrictions: Must validate all required environment variables, throw descriptive errors for missing config, support both database types, do not hardcode credentials | _Leverage: MySQLAdapter from task 2.2, PostgreSQLAdapter from task 2.3, DatabaseAdapter interface from task 2.1 | Success: Factory creates correct adapter based on DB_TYPE, configuration is validated before use, clear error messages for misconfiguration, environment variables are properly loaded, both MySQL and PostgreSQL can be instantiated

- [ ] 2.5. Create migration system and initial schema
  - Files: backend/src/migrations/MigrationRunner.ts, backend/src/migrations/001_initial_schema.ts
  - Implement migration runner that tracks and executes migrations
  - Create initial migration with videos, clips, playlists, users tables
  - _Requirements: Req 3_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Database Engineer with expertise in schema migrations and version control | Task: Create MigrationRunner class with methods: runPendingMigrations, getMigrationStatus. Each migration file exports up() and down() functions. MigrationRunner creates a migrations table to track executed migrations. Create 001_initial_schema.ts migration that creates all tables from design.md Data Models section (videos, clips, playlists, playlist_clips, users, migrations). Handle both MySQL and PostgreSQL syntax differences (AUTO_INCREMENT vs SERIAL, JSON vs JSONB). Reference design.md sections: MigrationRunner, Data Models (all tables) | Restrictions: Migrations must be idempotent (safe to run multiple times), must support both MySQL and PostgreSQL, use transactions for migration execution, validate migration files before running | _Leverage: DatabaseAdapter from task 2.1 | Success: Migration runner executes pending migrations in order, tracks migration history in database, initial schema creates all required tables with correct columns and constraints, works with both MySQL and PostgreSQL adapters, rollback functionality works

## Phase 3: Backend Data Models and Services

- [ ] 3.1. Create TypeScript interfaces for data models
  - Files: backend/src/types/models.ts
  - Define interfaces for Video, Clip, Playlist, User matching database schema
  - Include metadata types and search criteria types
  - _Requirements: Req 4, Req 5, Req 6, Req 7, Req 8, Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: TypeScript Developer specializing in type definitions and data modeling | Task: Create TypeScript interfaces that exactly match the data models from design.md: Video, VideoMetadata, Clip, ClipMetadata, Playlist, PlaylistClip, User, Migration. Also create SearchCriteria type with fields for full-text search, metadata filters, operators (equals, contains, gt, lt, between). Create FilterOperator enum and MetadataField type. Ensure all database fields are represented with correct types (Date for timestamps, number for IDs, Record<string, any> for JSON fields). Reference design.md section: Data Models | Restrictions: Must match database schema exactly, use proper TypeScript types (no 'any' except for JSON metadata), include optional fields where appropriate, use readonly for immutable fields like id | _Leverage: N/A | Success: All model interfaces defined, types match database schema, SearchCriteria supports advanced filtering, TypeScript strict mode passes, interfaces are well-documented with JSDoc comments

- [ ] 3.2. Implement VideoService
  - Files: backend/src/services/VideoService.ts, backend/src/utils/fileScanner.ts
  - Create service for video management (scan, CRUD, search)
  - Implement file system scanning with metadata extraction placeholder
  - _Requirements: Req 1, Req 4, Req 5_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in service layer architecture and file I/O | Task: Implement VideoService class with methods exactly as specified in design.md VideoService section: scanVideos, getVideoById, updateVideoMetadata, searchVideos, deleteVideo. Create FileScanner utility for scanning video files in mounted directory (recursively find .mp4, .mkv, .avi, .mov files). For now, use placeholder metadata (duration=0, resolution="unknown") - FFmpeg integration comes later. Implement searchVideos with full-text search on title/description and metadata filtering. Use parameterized queries. Reference design.md sections: VideoService, Requirement 1, 4, 5 | Restrictions: Must use DatabaseAdapter interface (not direct database calls), validate inputs, use parameterized queries for SQL injection prevention, handle file system errors gracefully, return null for not found (not throw) | _Leverage: DatabaseAdapter from task 2.1, Video interface from task 3.1 | Success: All service methods work correctly, file scanning finds video files, database operations use adapter, search supports multiple criteria, errors are handled and logged, input validation prevents invalid data

- [ ] 3.3. Implement ClipService
  - Files: backend/src/services/ClipService.ts
  - Create service for clip management with metadata inheritance
  - Validate clip time ranges against source video duration
  - _Requirements: Req 6, Req 7_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in business logic and data validation | Task: Implement ClipService class with methods from design.md ClipService section: createClip, getClipById, getClipsByVideo, updateClipMetadata, deleteClip. On createClip, inherit specified metadata fields from source video (copy to inheritedMetadata field), validate startTime < endTime and both within video duration. On updateClipMetadata, only update customMetadata field, never modify source video. Include getOrphanedClips method to find clips whose source video is unavailable. Reference design.md sections: ClipService, Requirement 6, 7 | Restrictions: Must validate time ranges before insert, must copy metadata on creation (configure which fields to inherit), updateMetadata must NEVER affect source video, use transactions for atomicity | _Leverage: DatabaseAdapter from task 2.1, Clip and Video interfaces from task 3.1, VideoService from task 3.2 for source video validation | Success: Clip creation validates time ranges, metadata inheritance works correctly, clip updates don't affect source video, orphaned clips are identifiable, database constraints enforce data integrity

- [ ] 3.4. Implement PlaylistService
  - Files: backend/src/services/PlaylistService.ts
  - Create service for playlist management with clip ordering
  - Handle clip deletion cascades and playlist cleanup
  - _Requirements: Req 8_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in relational data and ordering logic | Task: Implement PlaylistService class with methods from design.md PlaylistService section: createPlaylist, addClipToPlaylist, removeClipFromPlaylist, reorderPlaylist, getPlaylistById, deletePlaylist. When adding clips, assign order_index. getPlaylistById should join with clips and return ordered list. reorderPlaylist updates order_index for multiple clips atomically. Handle orphaned clips in playlists (skip during playback). Reference design.md sections: PlaylistService, Requirement 8 | Restrictions: Use transactions for multi-row updates, validate clip exists before adding to playlist, maintain order integrity (no gaps or duplicates), use database JOIN for efficient clip retrieval | _Leverage: DatabaseAdapter from task 2.1, Playlist and PlaylistClip interfaces from task 3.1, ClipService from task 3.3 for clip validation | Success: Playlists maintain correct clip order, reordering is atomic and consistent, clips are properly joined when fetching playlist, orphaned clips are handled gracefully, cascade deletes work correctly

- [ ] 3.5. Implement AuthService
  - Files: backend/src/services/AuthService.ts
  - Create authentication service with bcrypt password hashing and JWT tokens
  - Implement secure password validation
  - _Requirements: Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Security Engineer with expertise in authentication and cryptography | Task: Implement AuthService class with methods from design.md AuthService section: login, validateToken, createUser, changePassword. Use bcrypt with 12 rounds for password hashing. Use jsonwebtoken for JWT generation with configurable secret from env (JWT_SECRET). Tokens expire in 24 hours. login validates username and password, returns JWT and user object (exclude password hash). validateToken verifies JWT and returns user or null. createUser hashes password before insert. Reference design.md sections: AuthService, Requirement 9, Security (Authentication) | Restrictions: NEVER store plain-text passwords, use bcrypt compare (not manual comparison), validate JWT signature, don't include password hash in returned user objects, implement constant-time comparison where possible | _Leverage: DatabaseAdapter from task 2.1, User interface from task 3.1, bcrypt library, jsonwebtoken library | Success: Passwords are securely hashed with bcrypt, JWT tokens are generated and validated correctly, login fails with generic message for security, tokens expire properly, user creation validates username uniqueness

## Phase 4: Backend API Layer

- [ ] 4.1. Create authentication middleware
  - Files: backend/src/middleware/auth.ts
  - Implement JWT validation middleware for protected routes
  - Add user context to request object
  - _Requirements: Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in Express.js middleware and authentication | Task: Create authentication middleware that extracts JWT from Authorization header (Bearer token format), validates token using AuthService.validateToken, and attaches user to request object (extend Express.Request type). If token is missing or invalid, return 401 Unauthorized. Export both authenticate middleware and optional authenticateOptional (allows unauthenticated access but attaches user if token present). Reference design.md sections: AuthService, API Design (Authentication), Security | Restrictions: Must validate token on every request, return 401 for invalid/missing tokens, don't expose whether token is invalid vs expired, extend TypeScript Request type properly | _Leverage: AuthService from task 3.5 | Success: Middleware validates JWT correctly, user is attached to request, returns 401 for invalid tokens, TypeScript types work correctly, supports optional authentication mode

- [ ] 4.2. Create error handling and validation middleware
  - Files: backend/src/middleware/errorHandler.ts, backend/src/middleware/validation.ts
  - Implement global error handler for consistent error responses
  - Create request validation middleware using Joi
  - _Requirements: Non-functional (Error Handling)_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in error handling and input validation | Task: Create error handling middleware that catches all errors, logs them, and returns consistent JSON responses with appropriate status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors). Create validation middleware factory function that takes a Joi schema and validates request body/query/params, returning 400 with validation errors if invalid. Create common Joi schemas for video metadata, clip creation, playlist operations. Reference design.md sections: Error Handling, Security (Input Validation) | Restrictions: Don't expose internal error details in production, sanitize error messages, validate all user inputs, use Joi for schema validation, return appropriate HTTP status codes | _Leverage: N/A | Success: Error handler catches all errors, validation middleware rejects invalid requests with clear messages, common schemas are reusable, error responses are consistent, sensitive data is not leaked

- [ ] 4.3. Implement video API endpoints
  - Files: backend/src/controllers/videoController.ts, backend/src/routes/videos.ts
  - Create REST endpoints for video operations
  - Add request validation and authentication
  - _Requirements: Req 1, Req 4, Req 5_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend API Developer with expertise in RESTful design and Express.js | Task: Create videoController with handler functions and videos router as specified in design.md API Design section: GET /api/videos (list with pagination), GET /api/videos/:id, PATCH /api/videos/:id/metadata, DELETE /api/videos/:id, POST /api/videos/scan, GET /api/videos/search. Use VideoService for business logic. Add authentication middleware to all routes. Validate request bodies with Joi schemas. Support pagination query params (page, limit). Reference design.md sections: API Design (Videos), VideoService | Restrictions: All routes must require authentication, validate inputs with Joi, use service layer (don't access database directly), return proper HTTP status codes, support pagination for list endpoints | _Leverage: VideoService from task 3.2, authentication middleware from task 4.1, validation middleware from task 4.2 | Success: All endpoints return correct responses, authentication is enforced, validation rejects invalid requests, pagination works correctly, error handling returns appropriate status codes

- [ ] 4.4. Implement clip API endpoints
  - Files: backend/src/controllers/clipController.ts, backend/src/routes/clips.ts
  - Create REST endpoints for clip operations
  - Validate clip creation with time range checks
  - _Requirements: Req 6, Req 7_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend API Developer with expertise in RESTful design and data validation | Task: Create clipController with handler functions and clips router as specified in design.md API Design section: GET /api/clips, GET /api/clips/:id, POST /api/clips, PATCH /api/clips/:id/metadata, DELETE /api/clips/:id. Use ClipService for business logic. Validate clip creation body (videoId, startTime, endTime, name, metadata). Support filtering clips by videoId query param. Add authentication to all routes. Reference design.md sections: API Design (Clips), ClipService | Restrictions: Validate time ranges in request, ensure metadata updates don't affect source video, all routes require authentication, use service layer for logic, return 404 if video doesn't exist | _Leverage: ClipService from task 3.3, authentication middleware from task 4.1, validation middleware from task 4.2 | Success: All endpoints work correctly, clip creation validates time ranges, metadata updates isolated to clips, authentication enforced, proper error responses for invalid data

- [ ] 4.5. Implement playlist API endpoints
  - Files: backend/src/controllers/playlistController.ts, backend/src/routes/playlists.ts
  - Create REST endpoints for playlist operations
  - Handle clip ordering and reordering
  - _Requirements: Req 8_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend API Developer with expertise in RESTful design and complex data operations | Task: Create playlistController with handler functions and playlists router as specified in design.md API Design section: GET /api/playlists, GET /api/playlists/:id, POST /api/playlists, PUT /api/playlists/:id, DELETE /api/playlists/:id, POST /api/playlists/:id/clips, DELETE /api/playlists/:id/clips/:clipId, PATCH /api/playlists/:id/reorder. Use PlaylistService. Reorder endpoint accepts array of {clipId, order} objects. Reference design.md sections: API Design (Playlists), PlaylistService | Restrictions: All routes require authentication, validate clipId exists before adding, reorder must be atomic, return playlist with ordered clips on GET, handle orphaned clips gracefully | _Leverage: PlaylistService from task 3.4, authentication middleware from task 4.1, validation middleware from task 4.2 | Success: All endpoints work correctly, playlists maintain order, reordering is atomic, clips are properly validated, authentication enforced, returns complete playlist data with clips

- [ ] 4.6. Implement authentication API endpoints
  - Files: backend/src/controllers/authController.ts, backend/src/routes/auth.ts
  - Create login and validation endpoints
  - Return JWT tokens on successful login
  - _Requirements: Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Security Developer with expertise in authentication flows | Task: Create authController with handler functions and auth router as specified in design.md API Design section: POST /api/auth/login (username, password), POST /api/auth/logout (client-side only, return 200), GET /api/auth/validate (requires auth middleware). Login endpoint validates credentials, returns JWT and user object. Validate endpoint uses auth middleware to verify token. Don't expose whether username or password was wrong on login failure. Reference design.md sections: API Design (Authentication), AuthService | Restrictions: Login must not reveal which field is incorrect, logout is client-side token removal, validate endpoint must use auth middleware, return 401 for invalid credentials with generic message, don't expose user's password hash | _Leverage: AuthService from task 3.5, authentication middleware from task 4.1, validation middleware from task 4.2 | Success: Login returns JWT on success, generic error on failure, validate endpoint requires and verifies token, logout endpoint exists for client, no sensitive information exposed

- [ ] 4.7. Set up Express server and mount routes
  - Files: backend/src/server.ts, backend/src/app.ts
  - Create Express application with middleware chain
  - Mount all routers and start server
  - _Requirements: All backend requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Engineer with expertise in Express.js application architecture | Task: Create Express app with middleware chain: cors (allow frontend origin), express.json(), custom logging middleware, mount routers (/api/auth, /api/videos, /api/clips, /api/playlists, /api/stream), error handler middleware (last). Create server.ts that imports app, connects database adapter, runs migrations, and starts server on PORT from env. Gracefully handle shutdown (close database connections). Reference design.md sections: Architecture, Deployment Architecture | Restrictions: Middleware order matters (error handler must be last), CORS must only allow configured origins, run migrations before starting server, handle startup errors gracefully, close database on shutdown | _Leverage: All routes from tasks 4.3-4.6, error handler from task 4.2, database adapter from task 2.1, migration runner from task 2.5 | Success: Server starts successfully, all routes are mounted, migrations run automatically, CORS configured correctly, graceful shutdown works, database connection established

## Phase 5: Video Streaming and Processing

- [ ] 5.1. Implement FFmpeg metadata extraction service
  - Files: backend/src/services/FFmpegService.ts
  - Extract video metadata using FFmpeg (duration, resolution, codec)
  - Integrate with VideoService scanning
  - _Requirements: Req 1, Req 4_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Video Processing Engineer with expertise in FFmpeg and media metadata | Task: Create FFmpegService class with extractMetadata(filePath) method that uses ffprobe (from FFmpeg) to extract video metadata: duration (seconds), resolution (WxH string), codec (video codec name), fileSize (bytes). Use child_process to spawn ffprobe with JSON output format. Parse JSON response and return VideoMetadata object. Handle errors for corrupted/unsupported files. Update VideoService.scanVideos to use FFmpegService instead of placeholder metadata. Reference design.md sections: FFmpegService, VideoService, Technology Stack | Restrictions: Must handle FFmpeg not installed (graceful error), validate file exists before processing, parse FFmpeg output safely (handle unexpected formats), return null/default for unsupported files, don't block on slow processing | _Leverage: VideoService from task 3.2, Video interface from task 3.1 | Success: FFmpeg extracts accurate metadata, handles corrupt files gracefully, VideoService uses real metadata, errors are logged but don't crash service, extraction performance is reasonable

- [ ] 5.2. Implement video streaming endpoints
  - Files: backend/src/controllers/streamController.ts, backend/src/routes/stream.ts, backend/src/services/VideoStreamingService.ts
  - Create streaming service with Range header support
  - Implement video and clip streaming endpoints
  - _Requirements: Req 1, Req 6_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Backend Developer with expertise in video streaming and HTTP range requests | Task: Create VideoStreamingService with streamVideo and streamClip methods. streamVideo opens file stream and supports HTTP Range headers for seeking. streamClip uses FFmpeg to extract specific time range on-the-fly (use -ss startTime -to endTime). Create streamController with GET /api/stream/video/:id and GET /api/stream/clip/:id endpoints that use VideoStreamingService. Set appropriate headers (Content-Type: video/mp4, Accept-Ranges: bytes, Content-Length). Handle Range requests with 206 Partial Content response. Reference design.md sections: VideoStreamingService, API Design (Streaming), Video Streaming Approach | Restrictions: Must support Range headers for seeking, validate video/clip exists and is available, restrict file access to video mount path only, handle file read errors, set correct MIME types, stream efficiently (don't load entire file in memory) | _Leverage: VideoService from task 3.2, ClipService from task 3.3, authentication middleware from task 4.1 | Success: Video streaming supports seeking via Range headers, clip streaming plays correct time range, large files stream efficiently, appropriate headers are set, file access is restricted to allowed paths

- [x] 5.3. Implement HLS streaming support (optional enhancement)
  - Files: backend/src/services/HLSService.ts, backend/src/routes/hls.ts (update stream.ts)
  - Generate HLS manifests and segments on-demand
  - Cache segments for performance
  - _Requirements: Req 1 (enhancement)_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Video Streaming Engineer with expertise in HLS and adaptive bitrate streaming | Task: Create HLSService with methods: generateHLSManifest (creates .m3u8 manifest), getHLSSegment (serves .ts segment files). Use FFmpeg to generate HLS segments on-demand (store in cache directory). Add endpoints: GET /api/stream/hls/:id/manifest.m3u8, GET /api/stream/hls/:id/:segment.ts. Cache generated segments on disk. Set appropriate MIME types (application/vnd.apple.mpegurl for manifest, video/mp2t for segments). Reference design.md sections: Video Streaming Approach (HLS Adaptive Bitrate Streaming), API Design (Streaming) | Restrictions: Cache segments to avoid regenerating, clean up old cache periodically, validate segment requests, set correct MIME types and CORS headers, handle FFmpeg errors gracefully | _Leverage: VideoStreamingService from task 5.2, authentication middleware from task 4.1 | Success: HLS manifests are correctly generated, segments stream properly, caching improves performance, cleanup prevents disk overflow, works with HLS-compatible players, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 5.3 as [x] completed

## Phase 6: Frontend Foundation

- [ ] 6.1. Set up React project with TypeScript and routing
  - Files: frontend/src/main.tsx, frontend/src/App.tsx, frontend/src/routes/index.tsx, frontend/vite.config.ts (or webpack config)
  - Initialize React app with Vite or Create React App
  - Configure React Router for navigation
  - Set up base layout component
  - _Requirements: All frontend requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in React application setup and build tools | Task: Initialize React 18+ application using Vite with TypeScript template. Install react-router-dom v6. Create App.tsx as root component with Router provider. Create route configuration with paths: /login (public), /videos (protected), /video/:id (protected), /clips (protected), /playlists (protected), /playlist/:id (protected). Create BaseLayout component with navigation header. Configure Vite for proxy to backend API during development. Reference design.md sections: Technology Stack (Frontend), Project Structure | Restrictions: Use functional components only (no class components), use React Router v6 API, configure dev proxy to avoid CORS issues, protect routes requiring authentication, use TypeScript strict mode | _Leverage: N/A | Success: React app starts and renders, routing works correctly, protected routes redirect to login, dev proxy forwards API requests to backend, TypeScript compiles without errors, base layout renders on all pages

- [ ] 6.2. Create API client service and hooks
  - Files: frontend/src/services/apiClient.ts, frontend/src/hooks/useApi.ts, frontend/src/contexts/AuthContext.tsx
  - Create Axios-based API client with authentication
  - Create custom hook for API calls with loading states
  - Implement authentication context for user state
  - _Requirements: Req 9, all data requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in React hooks and API integration | Task: Create apiClient using Axios with base URL from env (VITE_API_URL). Add request interceptor to attach JWT token from localStorage. Add response interceptor to handle 401 (redirect to login). Create useApi custom hook that wraps API calls with loading, error, and data states. Create AuthContext with login, logout, and currentUser state. Provide AuthContext at app root. Store JWT in localStorage on login, clear on logout. Reference design.md sections: Frontend Components, Technology Stack | Restrictions: Store JWT in localStorage (not cookies for SPA), handle 401 globally, useApi must handle loading and error states, validate token on app load, logout must clear all auth state | _Leverage: N/A | Success: API client attaches auth tokens, 401 redirects to login, useApi hook manages loading/error/data states, AuthContext provides user state globally, login persists across refreshes, logout clears state

- [ ] 6.3. Create authentication pages
  - Files: frontend/src/pages/LoginPage.tsx, frontend/src/components/LoginForm.tsx
  - Create login form with username and password inputs
  - Implement form validation and error display
  - Redirect to videos page on successful login
  - _Requirements: Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in forms and user authentication flows | Task: Create LoginPage that renders LoginForm component. LoginForm has username and password inputs with validation (required fields). On submit, call POST /api/auth/login via apiClient. On success, store token in localStorage, update AuthContext, redirect to /videos. Display error message for invalid credentials. Use React Hook Form for form management and validation. Reference design.md sections: LoginForm component, API Design (Authentication) | Restrictions: Validate inputs before submit, display generic error message (don't reveal which field is wrong), disable submit while loading, redirect after successful login, don't store password in state unnecessarily | _Leverage: apiClient from task 6.2, AuthContext from task 6.2 | Success: Login form validates inputs, calls login API correctly, stores token on success, updates auth context, redirects to videos page, displays errors appropriately, loading state disables submit button

- [ ] 6.4. Create protected route wrapper
  - Files: frontend/src/components/ProtectedRoute.tsx
  - Create component that checks authentication before rendering
  - Redirect to login if not authenticated
  - _Requirements: Req 9_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in React Router and authentication patterns | Task: Create ProtectedRoute component that wraps routes requiring authentication. Check if user is logged in from AuthContext. If not authenticated, redirect to /login using Navigate from react-router-dom. If authenticated, render children. Wrap all protected routes (/videos, /clips, /playlists, etc.) with ProtectedRoute. Reference design.md sections: Authentication, Frontend Components | Restrictions: Check authentication state from context (not localStorage directly), redirect preserving intended destination (return URL), render children only if authenticated, use React Router v6 Navigate component | _Leverage: AuthContext from task 6.2 | Success: Protected routes require authentication, unauthenticated users redirect to login, return URL is preserved, authenticated users access protected pages, re-renders when auth state changes

## Phase 7: Frontend Video Features

- [ ] 7.1. Create video library page with search and filters
  - Files: frontend/src/pages/VideosPage.tsx, frontend/src/components/VideoCard.tsx, frontend/src/components/SearchFilterPanel.tsx
  - Display grid of video cards with thumbnails
  - Implement search and filter panel with advanced criteria
  - Add pagination controls
  - _Requirements: Req 4, Req 5_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in React components and complex filtering UI | Task: Create VideosPage that fetches videos from GET /api/videos using useApi hook. Display videos in grid using VideoCard component (show title, duration, thumbnail placeholder). Create SearchFilterPanel with inputs for: text search, tag filter, date range, custom metadata filters. On filter change, update query params and refetch videos. Add pagination controls (Previous/Next). Reference design.md sections: SearchFilterPanel component, API Design (Videos), Requirement 5 | Restrictions: Use query parameters for filters (allows bookmarking), debounce search input to avoid excessive API calls, display loading state while fetching, handle empty results gracefully, pagination must not reset filters | _Leverage: apiClient from task 6.2, useApi hook from task 6.2 | Success: Videos display in grid, search filters videos correctly, multiple filters combine properly, pagination works with filters, loading states are shown, empty state is displayed when no results

- [ ] 7.2. Create video player component
  - Files: frontend/src/components/VideoPlayer.tsx, frontend/src/hooks/useVideoPlayer.ts
  - Integrate Video.js or ReactPlayer library
  - Add playback controls (play, pause, seek, volume, fullscreen)
  - Support clip-specific time ranges
  - _Requirements: Req 1, Req 6_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in video players and media APIs | Task: Create VideoPlayer component that accepts videoId or clipId prop. Use Video.js library (or ReactPlayer) to render video player. For videoId, stream from GET /api/stream/video/:id. For clipId, stream from GET /api/stream/clip/:id. Add custom controls: play/pause button, seek bar, volume control, fullscreen button. Create useVideoPlayer hook to manage player state (currentTime, duration, playing). Reference design.md sections: VideoPlayer component, Technology Stack, API Design (Streaming) | Restrictions: Use Video.js or ReactPlayer (don't build from scratch), support both video and clip streaming, handle loading and error states, ensure responsive player sizing, keyboard controls (space for play/pause, arrows for seek) | _Leverage: apiClient from task 6.2, clip/video APIs from task 5.2 | Success: Video plays from streaming endpoint, controls work correctly, supports both videos and clips, fullscreen works, keyboard shortcuts functional, responsive design adapts to screen size

- [ ] 7.3. Create video detail page with clip creation
  - Files: frontend/src/pages/VideoDetailPage.tsx, frontend/src/components/ClipCreator.tsx
  - Display video with metadata
  - Add controls to set clip start/end times
  - Show existing clips as markers on timeline
  - _Requirements: Req 4, Req 6_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in video manipulation UIs and state management | Task: Create VideoDetailPage that fetches video by ID from GET /api/videos/:id and its clips from GET /api/clips?videoId=:id. Render VideoPlayer component with the video. Display metadata below player. Create ClipCreator component with "Set Start" and "Set End" buttons that capture current playback time. Show start/end times, clip name input, and "Create Clip" button. On create, POST to /api/clips and refresh clips list. Display existing clips as markers on the player timeline. Reference design.md sections: VideoPlayer, ClipMarkerTimeline, API Design (Clips) | Restrictions: Validate start < end before creating clip, validate both times are within video duration, disable "Create Clip" until valid start/end set, refresh clips after creation, markers should be clickable to jump to clip start | _Leverage: VideoPlayer from task 7.2, apiClient from task 6.2, useApi hook from task 6.2 | Success: Video displays with metadata, clip creation captures playback time, validation prevents invalid clips, clips are created successfully, existing clips show as markers, clicking markers seeks to clip position

## Phase 8: Frontend Clip and Playlist Features

- [ ] 8.1. Create clips library page
  - Files: frontend/src/pages/ClipsPage.tsx, frontend/src/components/ClipCard.tsx
  - Display all clips with source video information
  - Filter clips by source video
  - Play clips on click
  - _Requirements: Req 6, Req 7_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in list views and filtering | Task: Create ClipsPage that fetches all clips from GET /api/clips. Display clips in grid using ClipCard component (show clip name, duration, source video title, thumbnail). Add dropdown filter to select source video (fetches GET /api/clips?videoId=:id when selected). Clicking a clip card navigates to /clip/:id which plays the clip. Reference design.md sections: API Design (Clips), ClipCard component | Restrictions: Display source video information for each clip, handle orphaned clips (indicate source unavailable), filter must update results, loading state while fetching, handle empty results | _Leverage: VideoPlayer from task 7.2 (for playback page), apiClient from task 6.2, useApi hook from task 6.2 | Success: Clips display with source video info, filtering by source video works, clicking clip plays it, orphaned clips are indicated, loading and empty states render correctly

- [ ] 8.2. Create clip detail/edit page
  - Files: frontend/src/pages/ClipDetailPage.tsx, frontend/src/components/ClipMetadataEditor.tsx
  - Display clip with player
  - Allow editing clip metadata without affecting source video
  - Show inherited vs custom metadata clearly
  - _Requirements: Req 7_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in forms and data editing | Task: Create ClipDetailPage that fetches clip from GET /api/clips/:id. Render VideoPlayer with clipId to play the clip. Display clip metadata with clear distinction between inherited (read-only, grayed out) and custom metadata (editable). Create ClipMetadataEditor component with form inputs for custom metadata fields. On save, PATCH to /api/clips/:id/metadata with only customMetadata. Reference design.md sections: ClipService, API Design (Clips), Requirement 7 | Restrictions: Clearly distinguish inherited vs custom metadata visually, only allow editing custom metadata, validate metadata types before saving, don't modify source video metadata, reload clip after successful update | _Leverage: VideoPlayer from task 7.2, apiClient from task 6.2, useApi hook from task 6.2 | Success: Clip plays correctly, inherited metadata is read-only and labeled, custom metadata is editable, updates save to API, source video metadata is never affected, validation prevents invalid data

- [ ] 8.3. Create playlists page
  - Files: frontend/src/pages/PlaylistsPage.tsx, frontend/src/components/PlaylistCard.tsx
  - Display all playlists
  - Create new playlists
  - Delete playlists
  - _Requirements: Req 8_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in CRUD operations and list views | Task: Create PlaylistsPage that fetches playlists from GET /api/playlists. Display in grid using PlaylistCard component (show name, description, clip count). Add "Create Playlist" button that opens modal/form with name and description inputs. On submit, POST to /api/playlists. Add delete button on each card (with confirmation) that calls DELETE /api/playlists/:id. Clicking playlist card navigates to /playlist/:id. Reference design.md sections: API Design (Playlists), Playlist model | Restrictions: Confirm before deleting, refresh list after create/delete, validate playlist name is not empty, handle errors gracefully, loading state during operations | _Leverage: apiClient from task 6.2, useApi hook from task 6.2 | Success: Playlists display correctly, create playlist works, delete requires confirmation, navigation to detail works, loading states shown, errors displayed appropriately

- [ ] 8.4. Create playlist editor page with drag-and-drop
  - Files: frontend/src/pages/PlaylistEditorPage.tsx, frontend/src/components/PlaylistClipList.tsx, frontend/src/components/ClipSelector.tsx
  - Display playlist clips in order
  - Allow reordering clips with drag-and-drop
  - Add/remove clips from playlist
  - Play playlist sequentially
  - _Requirements: Req 8_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend Developer with expertise in drag-and-drop interfaces and complex interactions | Task: Create PlaylistEditorPage that fetches playlist from GET /api/playlists/:id. Display PlaylistClipList component showing clips in order with drag handles (use react-beautiful-dnd or @dnd-kit). On reorder, PATCH to /api/playlists/:id/reorder with new order. Create ClipSelector component to add clips (search/select from all clips, POST to /api/playlists/:id/clips). Each clip has remove button (DELETE /api/playlists/:id/clips/:clipId). Add "Play Playlist" button that plays clips sequentially. Reference design.md sections: PlaylistEditor component, API Design (Playlists), Requirement 8 | Restrictions: Drag-and-drop must update order immediately (optimistic UI), persist order to API, validate clips exist before adding, sequential playback must transition automatically between clips, handle orphaned clips (skip and warn) | _Leverage: VideoPlayer from task 7.2, apiClient from task 6.2, useApi hook from task 6.2, drag-and-drop library | Success: Clips display in order, drag-and-drop reordering works, order persists to backend, adding clips works, removing clips works, sequential playback transitions automatically, orphaned clips handled gracefully

## Phase 9: Testing and Quality Assurance

- [x] 9.1. Write backend unit tests for services
  - Files: backend/tests/services/VideoService.test.ts, backend/tests/services/ClipService.test.ts, backend/tests/services/PlaylistService.test.ts, backend/tests/services/AuthService.test.ts
  - Test all service methods with mocked database adapter
  - Cover edge cases and error scenarios
  - _Requirements: All backend requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: QA Engineer with expertise in unit testing and Jest framework | Task: Create unit tests for all service classes using Jest. Mock DatabaseAdapter to isolate service logic. Test VideoService (scan, CRUD, search), ClipService (create with validation, metadata isolation), PlaylistService (ordering, reordering), AuthService (password hashing, token generation). Cover success cases, validation failures, and error handling. Aim for 80%+ code coverage. Reference design.md sections: Testing Strategy (Unit Testing), all Service sections | Restrictions: Mock all dependencies (database, file system, FFmpeg), test behavior not implementation, use descriptive test names, test edge cases (empty results, invalid inputs), assert error messages | _Leverage: All service classes from Phase 3 | Success: All service methods have tests, mocking isolates unit logic, tests cover success and failure paths, code coverage >80%, tests run quickly and reliably, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 9.1 as [x] completed

- [ ] 9.2. Write backend integration tests for API endpoints
  - Files: backend/tests/integration/api.test.ts
  - Test complete API flows with real database
  - Use Supertest for HTTP request testing
  - Set up test database with Docker
  - _Requirements: All backend requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: QA Engineer with expertise in integration testing and API testing | Task: Create integration tests using Jest and Supertest. Start a test database container (MySQL or PostgreSQL) before tests. Test complete API flows: login -> create video -> create clip -> add to playlist. Test authentication (401 without token), validation (400 for invalid data), not found (404), success scenarios (200, 201). Clean up database between tests. Reference design.md sections: Testing Strategy (Integration Testing), API Design | Restrictions: Use real database (not mocked), test HTTP layer (not service layer directly), clean up data between tests, test authentication on protected routes, verify response structure and status codes | _Leverage: All API endpoints from Phase 4, Supertest library | Success: Integration tests cover main user flows, database is properly set up and cleaned, authentication is tested, all status codes are verified, tests can run in CI/CD, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 9.2 as [x] completed

- [ ] 9.3. Write frontend component tests
  - Files: frontend/tests/components/VideoPlayer.test.tsx, frontend/tests/components/ClipCreator.test.tsx, frontend/tests/components/PlaylistEditor.test.tsx
  - Test component rendering and user interactions
  - Mock API calls
  - Use React Testing Library
  - _Requirements: All frontend requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Frontend QA Engineer with expertise in React Testing Library and component testing | Task: Create component tests using React Testing Library and Jest. Test VideoPlayer (renders, responds to controls), ClipCreator (sets start/end, creates clip), PlaylistEditor (reorders, adds/removes clips). Mock API calls with jest.mock. Test user interactions (clicks, typing, drag-and-drop). Verify components render correct data and handle loading/error states. Reference design.md sections: Testing Strategy (Unit Testing), Frontend Components | Restrictions: Mock all API calls (don't call real backend), test user behavior not implementation details, use accessible queries (getByRole, getByLabelText), test error and loading states, cleanup after each test | _Leverage: All frontend components from Phases 6-8, React Testing Library | Success: Key components have tests, user interactions are tested, API mocking works correctly, loading and error states verified, tests follow best practices (accessible queries), NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 9.3 as [x] completed

- [ ] 9.4. Write end-to-end tests for critical user flows
  - Files: e2e/tests/videoWorkflow.spec.ts, e2e/tests/playlistWorkflow.spec.ts
  - Test complete user journeys from login to playback
  - Use Playwright or Cypress
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: QA Automation Engineer with expertise in E2E testing and Playwright/Cypress | Task: Create E2E tests using Playwright (or Cypress). Set up test environment with docker-compose (backend, frontend, database). Test user journeys: 1) Login -> Browse videos -> Play video, 2) Login -> Create clip -> Add to playlist -> Play playlist. Test authentication (redirect if not logged in), video playback, clip creation with UI, playlist reordering with drag-and-drop. Reference design.md sections: Testing Strategy (End-to-End Testing), all user requirements | Restrictions: Test real user workflows (not API directly), use test database with seed data, clean up between tests, test in real browser, verify UI elements visible and interactive | _Leverage: Playwright or Cypress, docker-compose for test environment | Success: E2E tests cover critical user journeys, tests run reliably, seed data is consistent, tests verify UI and functionality, can run in CI/CD pipeline, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 9.4 as [x] completed

## Phase 10: Deployment and Documentation

- [ ] 10.1. Create production Docker images and compose file
  - Files: docker-compose.prod.yml, backend/Dockerfile.prod, frontend/Dockerfile.prod
  - Optimize Docker images for production (multi-stage builds)
  - Configure production environment variables
  - Set up volume mounts for videos and database
  - _Requirements: Req 10_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: DevOps Engineer with expertise in Docker production deployments | Task: Create production Dockerfiles with multi-stage builds (build stage and runtime stage). Backend: Node.js Alpine image, install only production dependencies, copy built files. Frontend: Build React app, serve with nginx. Create docker-compose.prod.yml with services: backend, frontend (nginx), database (MySQL or PostgreSQL), with volume mounts for videos (read-only) and database data. Use environment variables for configuration (no hardcoded secrets). Reference design.md sections: Deployment Architecture, Docker Deployment | Restrictions: Use Alpine images for smaller size, only production dependencies, enable health checks, set resource limits, use secrets for passwords, read-only mounts for videos, persistent volumes for database | _Leverage: Development docker-compose.yml from task 1.1 | Success: Production images are optimized (<500MB), multi-stage builds reduce size, docker-compose starts all services, environment variables configured, volumes mounted correctly, services are healthy, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 10.1 as [x] completed

- [ ] 10.2. Write deployment and user documentation
  - Files: README.md, docs/DEPLOYMENT.md, docs/USER_GUIDE.md, docs/API.md
  - Create comprehensive README with setup instructions
  - Document deployment process
  - Write user guide with screenshots
  - Document API endpoints
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Technical Writer with expertise in developer and user documentation | Task: Create README.md with project overview, features list, quick start instructions, and links to detailed docs. Create DEPLOYMENT.md with step-by-step deployment instructions (environment variables, Docker commands, database initialization, volume configuration). Create USER_GUIDE.md with feature descriptions and usage instructions (login, browsing videos, creating clips, building playlists). Create API.md documenting all REST endpoints with request/response examples. Reference design.md sections: All, especially API Design | Restrictions: Use clear, concise language, include code examples, add screenshots where helpful, document all environment variables, provide troubleshooting section, keep documentation up-to-date with implementation | _Leverage: All completed features | Success: README is comprehensive and clear, deployment docs enable successful deployment, user guide covers all features, API docs are complete with examples, documentation is well-organized, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 10.2 as [x] completed

- [ ] 10.3. Final testing, bug fixes, and polish
  - Files: Various (bug fixes across codebase)
  - Run all tests and fix failures
  - Test complete system end-to-end manually
  - Fix UI/UX issues
  - Optimize performance bottlenecks
  - _Requirements: All requirements_
  - _Prompt: Implement the task for spec media-player, first run spec-workflow-guide to get the workflow guide then implement the task: | Role: Senior Full-Stack Developer with expertise in system integration and quality assurance | Task: Run complete test suite (unit, integration, E2E) and fix all failures. Manually test the entire system: login, video browsing/search, video playback, clip creation, playlist management, logout. Fix any bugs found. Polish UI (consistent styling, responsive design, loading states, error messages). Optimize performance (database queries, video streaming, frontend rendering). Ensure code quality (lint passes, no TypeScript errors, consistent formatting). Reference design.md sections: All, especially Performance Considerations, Security Considerations | Restrictions: All tests must pass, no console errors, responsive on desktop browsers, loading states for all async operations, user-friendly error messages, code follows style guide, no security vulnerabilities | _Leverage: All prior tasks, test suites from Phase 9 | Success: All tests pass, manual testing reveals no major bugs, UI is polished and responsive, performance is acceptable (search <500ms, streaming smooth), code quality high, security best practices followed, system is ready for deployment, NOTE: After completing this task and logging it using log-implementation, edit tasks.md to mark task 10.3 as [x] completed
