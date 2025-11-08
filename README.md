# Media Player

A self-hosted web media player application built with TypeScript, Node.js, and React. This application allows you to manage, organize, and stream your video library with features like clip creation, playlist management, and metadata tagging.

## Features

- **Video Library Management**: Scan and organize your video files with metadata
- **Advanced Search & Filtering**: Search videos by title, tags, and custom metadata
- **Clip Creation**: Create clips from videos with specific time ranges
- **Playlist Management**: Build and manage playlists with drag-and-drop ordering
- **Video Streaming**: HLS adaptive bitrate streaming support
- **User Authentication**: Secure JWT-based authentication
- **Database Flexibility**: Support for both MySQL and PostgreSQL via adapter pattern

## Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Databases**: MySQL 8+ / PostgreSQL 14+
- **Authentication**: JWT with bcrypt password hashing
- **Video Processing**: FFmpeg

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Video Player**: Video.js

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Video files to stream (optional for initial setup)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd media-player
```

2. Copy the example environment file and configure:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Create a videos directory (or specify your own in .env):
```bash
mkdir videos
# Copy your video files to this directory
```

4. Start the application with Docker Compose:
```bash
docker-compose up -d
```

5. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3000

### Database Selection

By default, the application uses MySQL. To use PostgreSQL instead:

1. Update `.env`:
```env
DB_TYPE=postgresql
DB_HOST=postgres
DB_PORT=5432
```

2. Restart the services:
```bash
docker-compose restart backend
```

## Development Setup

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
media-player/
├── backend/
│   ├── src/
│   │   ├── adapters/          # Database adapter implementations
│   │   ├── models/             # Data models and TypeScript interfaces
│   │   ├── services/           # Business logic layer
│   │   ├── controllers/        # API route handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── migrations/         # Database migration files
│   │   ├── utils/              # Utility functions
│   │   └── server.ts           # Application entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page-level components
│   │   ├── services/           # API client services
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # React context providers
│   │   ├── types/              # TypeScript type definitions
│   │   └── App.tsx             # Main application component
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DB_TYPE`: Database type (mysql or postgresql)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection details
- `JWT_SECRET`: Secret key for JWT token generation (change in production!)
- `VIDEO_PATH`: Path to your video files on the host machine
- `PORT`: Backend API port (default: 3000)

## Documentation

For more detailed documentation, see the `.spec-workflow/specs/media-player/` directory:
- `design.md`: Technical design document
- `requirements.md`: Functional requirements
- `tasks.md`: Development tasks and phases

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.
