# Media Player

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

**A self-hosted video management and streaming platform built with TypeScript, Node.js, and React**

[Features](#features) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Demo](#demo) •
[Contributing](#contributing)

</div>

---

## 📖 Overview

Media Player is a comprehensive, self-hosted solution for managing and streaming your personal video library. Built with modern web technologies, it provides a Netflix-like experience for your own content with powerful features like clip creation, playlist management, and advanced search capabilities.

### Why Media Player?

- **Complete Control**: Host your own video content without relying on third-party services
- **Privacy First**: Your videos stay on your servers, no data collection
- **Feature Rich**: Clips, playlists, metadata management, and more
- **Production Ready**: Docker deployment, security hardened, fully tested
- **Developer Friendly**: Clean architecture, comprehensive tests, well-documented API

## ✨ Features

### 🎥 Video Management

- **Library Organization**: Automatically scan and index video files from your filesystem
- **Metadata Support**: Store and manage custom metadata (resolution, codec, tags, etc.)
- **Advanced Search**: Search videos by title, tags, and custom metadata fields
- **Filtering**: Filter videos by duration, resolution, file size, and custom criteria

### ✂️ Clip Creation

- **Precision Editing**: Create clips from videos with exact start and end times
- **UI-Based Tools**: Visual controls for setting clip boundaries while watching
- **Metadata Tags**: Add custom metadata to clips for better organization
- **Clip Library**: Browse, search, and manage all created clips

### 📑 Playlist Management

- **Build Playlists**: Organize clips into playlists for sequential playback
- **Drag-and-Drop**: Reorder playlist items with intuitive drag-and-drop interface
- **Playlist Metadata**: Add descriptions and custom data to playlists
- **Sequential Playback**: Play through playlists automatically

### 📺 Video Streaming

- **HLS Streaming**: HTTP Live Streaming for adaptive bitrate delivery
- **Multiple Formats**: Support for MP4, MKV, AVI, MOV, and more
- **FFmpeg Integration**: Automatic transcoding and format conversion
- **Video.js Player**: Professional video player with full controls

### 🎵 Metronome Overlay

- **Beat Synchronization**: Visual and audio metronome synced to video playback
- **BPM Range**: 30-300 beats per minute with real-time adjustment
- **Visual Effects**: Flash, pulse, and border effects with customizable colors
- **Beat Patterns**: Create complex rhythmic patterns (2-32 beats)
- **Audio Library**: Built-in sounds (click, beep, drum, snap, woodblock) + custom upload
- **Advanced Features**: Tempo changes, randomization, accent beats, and presets
- **Use Cases**: Music practice, dance training, interval workouts, video editing timing

### 📂 Media Metadata Loader

- **UUID-Based Import**: Automatically discover and import video files with UUID filenames
- **Metadata Matching**: Links videos with JSON metadata files
- **Batch Processing**: Process thousands of files efficiently with transaction safety
- **Idempotent**: Safe to re-run without duplicating data
- **CLI Tool**: Command-line interface with dry-run mode and progress tracking
- **Flexible Paths**: Configurable video and metadata directory paths
- **Statistics**: Detailed import statistics and error reporting

### 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Protected Routes**: Authentication required for all sensitive operations
- **Docker Secrets**: Secure secret management in production
- **Non-Root Containers**: Security-hardened Docker images

### 🏗️ Architecture

- **Database Flexibility**: Choose between MySQL or PostgreSQL
- **Adapter Pattern**: Clean database abstraction for easy switching
- **RESTful API**: Well-designed REST API with comprehensive documentation
- **Type Safety**: Full TypeScript implementation (frontend + backend)
- **Multi-Stage Builds**: Optimized Docker images (<200MB total)

## 🚀 Quick Start

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Video Files** (optional, for testing)
- **2GB RAM** and **2 CPU cores** minimum

### Development Setup (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/media-player.git
cd media-player

# 2. Copy environment template
cp .env.example .env

# 3. Start development environment
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3000
```

### Production Setup (10 Minutes)

```bash
# 1. Generate secure secrets
./scripts/generate-secrets.sh

# 2. Configure environment
cp .env.production .env.prod
nano .env.prod  # Edit VIDEO_PATH and other settings

# 3. Deploy to production
./scripts/deploy-production.sh

# 4. Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

**📚 [Full Deployment Guide →](DEPLOYMENT.md)**

## 📋 Technology Stack

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime environment | 20 LTS |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Express.js** | Web framework | 4.x |
| **MySQL / PostgreSQL** | Database | 8+ / 14+ |
| **FFmpeg** | Video processing | Latest |
| **JWT** | Authentication | - |
| **bcrypt** | Password hashing | - |

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.x |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Vite** | Build tool | Latest |
| **React Router** | Routing | 6.x |
| **Axios** | HTTP client | Latest |
| **Video.js** | Video player | Latest |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Orchestration |
| **nginx** | Reverse proxy |
| **GitHub Actions** | CI/CD (optional) |

## 📁 Project Structure

```
media-player/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── adapters/          # Database adapter implementations
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── server.ts          # Entry point
│   ├── Dockerfile             # Development Dockerfile
│   ├── Dockerfile.prod        # Production Dockerfile
│   └── package.json
│
├── frontend/                   # Frontend React app
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API clients
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React contexts
│   │   └── App.tsx            # Main component
│   ├── Dockerfile             # Development Dockerfile
│   ├── Dockerfile.prod        # Production Dockerfile
│   └── package.json
│
├── e2e/                        # E2E tests (Playwright)
├── docs/                       # Additional documentation
├── scripts/                    # Utility scripts
├── secrets/                    # Docker secrets (gitignored)
│
├── docker-compose.yml          # Development compose
├── docker-compose.prod.yml     # Production compose (MySQL)
├── docker-compose.prod.postgres.yml  # Production (PostgreSQL)
│
├── DEPLOYMENT.md               # Deployment guide
├── USER_GUIDE.md               # User documentation
├── API.md                      # API reference
├── PRODUCTION.md               # Production guide
└── README.md                   # This file
```

## 🎯 Use Cases

- **Personal Media Server**: Host your personal video collection
- **Content Creators**: Organize and manage video footage
- **Educational Content**: Create and share educational video playlists
- **Film Archive**: Digital archive for video collections
- **Home Entertainment**: Family video library and sharing

## 📸 Screenshots

> 📝 **Note**: Add screenshots here showing:
> - Video library browser
> - Video player with clip creation
> - Playlist management
> - Search and filtering

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Backend unit tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test

# E2E tests (Playwright)
npm run test:e2e
```

**Test Coverage**:
- ✅ 100+ unit tests (backend services)
- ✅ 35+ integration tests (API endpoints)
- ✅ 79 component tests (React components)
- ✅ 40+ E2E tests (user workflows)

## 📚 Documentation

### For Users

- **[User Guide](USER_GUIDE.md)** - Complete feature documentation
- **[Metronome Guide](docs/METRONOME.md)** - Metronome overlay feature guide
- **[Media Loader Guide](docs/MEDIA_LOADER.md)** - Media metadata loader documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step deployment
- **[Production Guide](PRODUCTION.md)** - Production best practices

### For Developers

- **[API Documentation](API.md)** - REST API reference
- **[Docker Guide](docs/DOCKER-PRODUCTION.md)** - Docker configuration
- **[E2E Testing Guide](e2e/README.md)** - E2E test documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - Contribution guide

### Architecture Documentation

- **Design Document** - `.spec-workflow/specs/media-player/design.md`
- **Requirements** - `.spec-workflow/specs/media-player/requirements.md`
- **Task Breakdown** - `.spec-workflow/specs/media-player/tasks.md`

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Run tests
npm test

# Run integration tests
npm run test:integration

# Lint code
npm run lint

# Build for production
npm run build
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server (hot reload)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### E2E Testing

```bash
# Setup test videos
npm run e2e:setup

# Start test environment
npm run e2e:start

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Stop test environment
npm run e2e:stop
```

## 🌐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_TYPE` | Database type | `mysql` or `postgresql` |
| `DB_HOST` | Database host | `mysql` or `localhost` |
| `DB_PORT` | Database port | `3306` (MySQL) or `5432` (PostgreSQL) |
| `DB_NAME` | Database name | `media_player` |
| `DB_USER` | Database user | `mediauser` |
| `DB_PASSWORD` | Database password | (use Docker secrets in production) |
| `JWT_SECRET` | JWT signing secret | (use Docker secrets in production) |
| `VIDEO_PATH` | Path to video files | `/path/to/videos` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_PORT` | Frontend port | `80` |
| `API_URL` | Backend API URL | `http://localhost:3000` |

**📚 [Complete Environment Reference →](DEPLOYMENT.md#environment-variables)**

## 🔒 Security

### Production Security Features

- ✅ **Docker Secrets**: Sensitive data encrypted
- ✅ **Non-Root Containers**: Minimal attack surface
- ✅ **Read-Only Mounts**: Video files mounted read-only
- ✅ **Security Headers**: HTTPS headers, CSP, X-Frame-Options
- ✅ **Rate Limiting**: API request throttling
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Tokens**: Secure authentication
- ✅ **Input Validation**: Joi schema validation
- ✅ **SQL Injection Protection**: Parameterized queries

**📚 [Security Best Practices →](PRODUCTION.md#security)**

## 🚢 Deployment Options

### Docker Compose (Recommended)

```bash
# Production deployment with MySQL
docker-compose -f docker-compose.prod.yml up -d

# Production deployment with PostgreSQL
docker-compose -f docker-compose.prod.postgres.yml up -d
```

### Manual Deployment

```bash
# Backend
cd backend
npm install --production
npm run build
NODE_ENV=production node dist/server.js

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ with nginx
```

### Cloud Deployment

Compatible with:
- AWS EC2 / ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean Droplets
- Self-hosted VPS

**📚 [Deployment Guide →](DEPLOYMENT.md)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Commits**: Conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Video.js](https://videojs.com/) - HTML5 video player
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [Express.js](https://expressjs.com/) - Web framework
- [React](https://reactjs.org/) - UI library
- [Docker](https://www.docker.com/) - Containerization

## 📞 Support

- **Documentation**: Check our comprehensive docs
- **Issues**: [GitHub Issues](https://github.com/your-org/media-player/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/media-player/discussions)

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Video library management
- ✅ Clip creation and management
- ✅ Playlist management
- ✅ HLS streaming
- ✅ User authentication
- ✅ Production deployment

### Planned Features (v2.0)
- 🔄 Multi-user support with permissions
- 🔄 Video upload functionality
- 🔄 Subtitle support
- 🔄 Thumbnail generation
- 🔄 Mobile app (React Native)
- 🔄 HTTPS/TLS support
- 🔄 Social sharing features

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **Test Coverage**: 80%+
- **Docker Image Size**: <200MB
- **Languages**: TypeScript, JavaScript
- **Commits**: 50+
- **Contributors**: Welcome!

---

<div align="center">

**Made with ❤️ by the Media Player team**

[⬆ Back to Top](#media-player)

</div>
