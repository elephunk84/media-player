# Deployment Guide

Complete step-by-step guide for deploying Media Player in development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Volume Configuration](#volume-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Docker** | 20.10+ | Containerization |
| **Docker Compose** | 2.0+ | Service orchestration |
| **Git** | Latest | Version control |

### System Requirements

| Environment | CPU | RAM | Disk Space |
|-------------|-----|-----|------------|
| Development | 2 cores | 2GB | 10GB |
| Production | 2+ cores | 4GB+ | 20GB+ |

### Optional

- **FFmpeg** (if running without Docker)
- **Node.js 20+** (for local development)
- **MySQL 8+ or PostgreSQL 14+** (for local development)

## Development Deployment

### Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/your-org/media-player.git
cd media-player

# 2. Create environment file
cp .env.example .env

# 3. Create videos directory
mkdir -p videos
# Optional: Copy some video files to test

# 4. Start services
docker-compose up -d

# 5. Verify deployment
docker-compose ps
```

### Access Points

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Backend Health**: http://localhost:3000/health

### Development Environment Details

The development compose file (`docker-compose.yml`) includes:

```yaml
Services:
  - MySQL (port 3306)
  - PostgreSQL (port 5432)  # Alternative database
  - Backend API (port 3000)
  - Frontend (port 80)

Features:
  - Hot reload for backend (source code mounted)
  - Live development server
  - Both MySQL and PostgreSQL running (use one)
  - Development-friendly logging
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Stop, remove volumes, and remove images
docker-compose down -v --rmi all
```

## Production Deployment

### Prerequisites Checklist

Before deploying to production:

- [ ] Server with Docker and Docker Compose installed
- [ ] Domain name (optional, but recommended for HTTPS)
- [ ] Video files ready
- [ ] SSL certificate (for HTTPS)
- [ ] Backup strategy planned

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/media-player.git
cd media-player

# Create production environment file
cp .env.production .env.prod
```

### Step 3: Configure Environment Variables

Edit `.env.prod`:

```bash
nano .env.prod
```

**Required configuration**:

```env
# Database Configuration
DB_TYPE=mysql
DB_NAME=media_player
DB_USER=mediauser

# Video Storage Path
VIDEO_PATH=/path/to/your/videos

# Frontend Configuration
FRONTEND_PORT=80
API_URL=http://your-domain.com:3000

# Optional: Use PostgreSQL instead
# DB_TYPE=postgresql
# DB_PORT=5432
```

### Step 4: Generate Secrets

```bash
# Automated generation
./scripts/generate-secrets.sh

# Or manual generation
mkdir -p secrets

# Database root password
openssl rand -base64 32 | tr -d '\n' > secrets/db_root_password.txt

# Database user password
openssl rand -base64 32 | tr -d '\n' > secrets/db_password.txt

# JWT secret
openssl rand -base64 64 | tr -d '\n' > secrets/jwt_secret.txt

# Set permissions
chmod 600 secrets/*.txt
```

**⚠️ Important**: Back up your secrets securely!

### Step 5: Prepare Video Directory

```bash
# Create or link video directory
sudo mkdir -p /data/videos

# Copy your video files
sudo cp -r /source/videos/* /data/videos/

# Update .env.prod with path
echo "VIDEO_PATH=/data/videos" >> .env.prod

# Set permissions (read-only recommended)
sudo chmod 755 /data/videos
```

### Step 6: Build Images

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

# Verify image sizes
docker images | grep media-player
```

Expected output:
```
media-player-backend   prod   ...   ~150MB
media-player-frontend  prod   ...   ~25MB
```

### Step 7: Start Services

```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 8: Verify Deployment

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# Test backend
curl http://localhost:3000/health

# Test frontend
curl http://localhost/health
```

Expected response: `healthy`

### Step 9: Create First User

Access the frontend at `http://your-server` and register the first user.

## Environment Variables

### Complete Reference

#### Database Configuration

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `DB_TYPE` | Yes | Database type | `mysql` | `mysql` or `postgresql` |
| `DB_HOST` | Yes | Database hostname | `mysql` | `mysql`, `localhost` |
| `DB_PORT` | Yes | Database port | `3306` | `3306` (MySQL), `5432` (PostgreSQL) |
| `DB_NAME` | Yes | Database name | `media_player` | `media_player` |
| `DB_USER` | Yes | Database user | `mediauser` | `mediauser` |
| `DB_PASSWORD` | Yes* | Database password | - | (use secrets in production) |
| `DB_PASSWORD_FILE` | Yes* | Path to password file | - | `/run/secrets/db_password` |

*Either `DB_PASSWORD` or `DB_PASSWORD_FILE` required

#### Application Configuration

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `NODE_ENV` | No | Node environment | `development` | `production` |
| `PORT` | No | Backend port | `3000` | `3000` |
| `JWT_SECRET` | Yes* | JWT signing secret | - | (use secrets in production) |
| `JWT_SECRET_FILE` | Yes* | Path to JWT secret file | - | `/run/secrets/jwt_secret` |
| `VIDEO_MOUNT_PATH` | Yes | Internal video path | `/media` | `/media` |

#### Video Storage

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `VIDEO_PATH` | Yes | Host video directory | - | `/data/videos` |

#### Frontend Configuration

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `FRONTEND_PORT` | No | Frontend port | `80` | `80`, `8080` |
| `VITE_API_URL` | Yes | Backend API URL | - | `http://localhost:3000` |
| `API_URL` | No | Backend API URL | `http://localhost:3000` | `http://your-domain.com:3000` |

### Environment File Examples

#### Development (.env)

```env
# Database
DB_TYPE=mysql
DB_HOST=mysql
DB_PORT=3306
DB_NAME=media_player
DB_USER=mediauser
DB_PASSWORD=devpassword

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-jwt-secret-change-in-production

# Video Storage
VIDEO_PATH=./videos

# Frontend
VITE_API_URL=http://localhost:3000
```

#### Production (.env.prod)

```env
# Database
DB_TYPE=mysql
DB_NAME=media_player
DB_USER=mediauser
# Passwords in Docker secrets, not here!

# Video Storage
VIDEO_PATH=/data/videos

# Frontend
FRONTEND_PORT=80
API_URL=http://your-domain.com:3000
```

## Database Setup

### MySQL Setup

#### Automatic (Recommended)

Database is automatically initialized when using Docker Compose:

```yaml
mysql:
  environment:
    MYSQL_DATABASE: media_player
    MYSQL_USER: mediauser
```

Migrations run automatically on backend startup.

#### Manual Setup

```bash
# Connect to MySQL container
docker exec -it media-player-mysql-prod mysql -u root -p

# Create database
CREATE DATABASE media_player;
CREATE USER 'mediauser'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON media_player.* TO 'mediauser'@'%';
FLUSH PRIVILEGES;
```

### PostgreSQL Setup

#### Automatic (Recommended)

Use `docker-compose.prod.postgres.yml`:

```bash
docker-compose -f docker-compose.prod.postgres.yml up -d
```

#### Manual Setup

```bash
# Connect to PostgreSQL container
docker exec -it media-player-postgres-prod psql -U postgres

# Create database
CREATE DATABASE media_player;
CREATE USER mediauser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE media_player TO mediauser;
```

### Database Migrations

Migrations run automatically on backend startup. Manual migration:

```bash
# Check migration status
docker exec media-player-backend-prod npm run migrate:status

# Run migrations
docker exec media-player-backend-prod npm run migrate

# Rollback last migration
docker exec media-player-backend-prod npm run migrate:down
```

### Database Backup

#### MySQL Backup

```bash
# Create backup
docker exec media-player-mysql-prod mysqldump \
  -u root -p$(cat secrets/db_root_password.txt) \
  media_player > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i media-player-mysql-prod mysql \
  -u root -p$(cat secrets/db_root_password.txt) \
  media_player < backup_20240101_120000.sql
```

#### PostgreSQL Backup

```bash
# Create backup
docker exec media-player-postgres-prod pg_dump \
  -U mediauser media_player > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i media-player-postgres-prod psql \
  -U mediauser media_player < backup_20240101_120000.sql
```

## Volume Configuration

### Docker Volumes

Production deployment uses the following volumes:

```yaml
volumes:
  mysql-data:          # Database persistence
    driver: local
  hls-cache:           # HLS transcoding cache
    driver: local
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect media-player_mysql-data

# Backup volume
docker run --rm -v media-player_mysql-data:/data \
  -v $(pwd):/backup alpine tar czf /backup/mysql-data.tar.gz /data

# Restore volume
docker run --rm -v media-player_mysql-data:/data \
  -v $(pwd):/backup alpine tar xzf /backup/mysql-data.tar.gz -C /
```

### Video Files

Videos are mounted as a bind mount (read-only in production):

```yaml
volumes:
  - ${VIDEO_PATH}:/media:ro
```

**Best Practices**:
- Use absolute paths
- Mount read-only (`:ro`) in production
- Ensure sufficient disk space
- Use fast storage (SSD recommended)

### HLS Cache

HLS cache volume stores transcoded segments:

```bash
# Check cache size
docker exec media-player-backend-prod du -sh /app/cache

# Clear cache (will re-transcode on demand)
docker exec media-player-backend-prod rm -rf /app/cache/*
```

## Troubleshooting

### Common Issues

#### Services Won't Start

**Problem**: Containers fail to start

**Solution**:

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs backend

# Check Docker daemon
sudo systemctl status docker
```

#### Database Connection Failed

**Problem**: Backend can't connect to database

**Solutions**:

1. Check database is running:
```bash
docker-compose -f docker-compose.prod.yml ps mysql
```

2. Verify credentials:
```bash
# Check secret files exist
ls -l secrets/

# Verify no trailing newlines
od -An -tx1 secrets/db_password.txt | tail -1
```

3. Test connection:
```bash
docker exec media-player-backend-prod \
  curl -f http://mysql:3306 || echo "Cannot connect"
```

#### Port Already in Use

**Problem**: `Error: bind: address already in use`

**Solution**:

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :3000

# Stop conflicting service
sudo systemctl stop apache2  # or nginx

# Or change port in .env.prod
FRONTEND_PORT=8080
```

#### Video Files Not Found

**Problem**: Videos not appearing in library

**Solutions**:

1. Check volume mount:
```bash
docker exec media-player-backend-prod ls -la /media
```

2. Verify VIDEO_PATH:
```bash
grep VIDEO_PATH .env.prod
ls -la /data/videos
```

3. Check permissions:
```bash
sudo chmod 755 /data/videos
sudo chmod 644 /data/videos/*.mp4
```

#### Out of Memory

**Problem**: Container killed (OOM)

**Solution**:

1. Check memory usage:
```bash
docker stats
```

2. Increase Docker memory limit (Docker Desktop)
3. Adjust resource limits in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase as needed
```

### Health Check Failures

**Problem**: Health checks failing

**Solutions**:

```bash
# Check service health
docker inspect media-player-backend-prod | jq '.[0].State.Health'

# Test health endpoint
curl http://localhost:3000/health
curl http://localhost/health

# Increase health check times
healthcheck:
  interval: 60s
  timeout: 20s
  start_period: 120s
```

### Logs Not Appearing

**Problem**: Can't see container logs

**Solution**:

```bash
# View logs
docker logs media-player-backend-prod

# Follow logs
docker logs -f media-player-backend-prod

# Last 100 lines
docker logs --tail 100 media-player-backend-prod
```

### Permission Denied

**Problem**: Permission errors in containers

**Solution**:

```bash
# Check file ownership
ls -la secrets/

# Fix ownership (nodejs user is UID 1001)
sudo chown -R 1001:1001 secrets/

# Fix permissions
sudo chmod 600 secrets/*.txt
```

## Security Considerations

### Production Checklist

- [ ] Changed all default passwords
- [ ] Generated strong random secrets
- [ ] Enabled HTTPS (reverse proxy)
- [ ] Configured firewall
- [ ] Secured Docker socket
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] Monitoring configured
- [ ] Logs centralized

### Firewall Configuration

```bash
# UFW example
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Deny direct access to backend
# (use nginx reverse proxy)
```

### HTTPS Setup

Use a reverse proxy (nginx, Caddy, Traefik):

```nginx
# nginx example
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Health Monitoring

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check health status
docker inspect --format='{{.State.Health.Status}}' media-player-backend-prod
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Prometheus metrics (if configured)
curl http://localhost:3000/metrics
```

### Log Monitoring

```bash
# View aggregated logs
docker-compose -f docker-compose.prod.yml logs -f

# Save logs to file
docker-compose -f docker-compose.prod.yml logs > app-logs.txt
```

## Updating

### Update Application

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Zero-Downtime Update

```bash
# Update backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend

# Update frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend (requires load balancer)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Vertical Scaling

Edit resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

## Support

For additional help:

- **Documentation**: [Complete Docs](README.md#documentation)
- **Issues**: [GitHub Issues](https://github.com/your-org/media-player/issues)
- **Production Guide**: [PRODUCTION.md](PRODUCTION.md)
- **API Documentation**: [API.md](API.md)

---

**Next Steps**: [User Guide →](USER_GUIDE.md)
