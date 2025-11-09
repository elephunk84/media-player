# Production Deployment Guide

This guide covers deploying the Media Player application to production using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Security](#security)
- [Monitoring](#monitoring)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Linux server (Ubuntu 20.04+ or similar)
- Domain name (optional, for HTTPS)
- Video files to stream
- At least 2GB RAM and 2 CPU cores

## Quick Start

### 1. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd media-player

# Copy environment template
cp .env.production .env.prod

# Edit environment variables
nano .env.prod
```

### 2. Generate Secrets

```bash
# Generate random secrets
./scripts/generate-secrets.sh

# Or manually:
mkdir -p secrets
openssl rand -base64 32 | tr -d '\n' > secrets/db_root_password.txt
openssl rand -base64 32 | tr -d '\n' > secrets/db_password.txt
openssl rand -base64 64 | tr -d '\n' > secrets/jwt_secret.txt
chmod 600 secrets/*.txt
```

### 3. Set Video Path

```bash
# Create or link your video directory
mkdir -p /path/to/your/videos

# Update .env.prod
echo "VIDEO_PATH=/path/to/your/videos" >> .env.prod
```

### 4. Build and Start

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 5. Initialize Database

```bash
# The database will be automatically initialized on first run
# Check backend logs to verify migration completion
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 6. Access Application

- Frontend: http://your-server-ip
- Backend API: http://your-server-ip:3000

## Detailed Setup

### Environment Variables

Edit `.env.prod` with your configuration:

```bash
# Database
DB_TYPE=mysql
DB_NAME=media_player
DB_USER=mediauser

# Video Storage
VIDEO_PATH=/path/to/your/videos

# Frontend
FRONTEND_PORT=80
API_URL=http://your-domain.com:3000
```

### Docker Secrets

Production uses Docker secrets for sensitive data:

| Secret File | Purpose | Generation |
|-------------|---------|------------|
| `secrets/db_root_password.txt` | MySQL root password | `openssl rand -base64 32` |
| `secrets/db_password.txt` | MySQL user password | `openssl rand -base64 32` |
| `secrets/jwt_secret.txt` | JWT signing secret | `openssl rand -base64 64` |

**Important**: All secret files must have no trailing newline!

```bash
# Generate without newline
echo -n "your-secret" > secrets/file.txt

# Verify no newline
od -An -tx1 secrets/file.txt | tail -1 | grep -o '0a'
# (should show no output)
```

### Resource Limits

Production deployment includes resource limits:

| Service | CPU Limit | Memory Limit | Reservations |
|---------|-----------|--------------|--------------|
| MySQL | 2.0 | 2GB | 0.5 CPU, 512MB |
| Backend | 2.0 | 1GB | 0.25 CPU, 256MB |
| Frontend | 0.5 | 256MB | 0.1 CPU, 64MB |

Adjust in `docker-compose.prod.yml` based on your server capacity.

## Configuration

### Backend Configuration

Backend uses environment variables and secrets:

```yaml
environment:
  NODE_ENV: production
  DB_HOST: mysql
  DB_PASSWORD_FILE: /run/secrets/db_password
  JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### Frontend Configuration

Frontend is built with Vite and served by nginx:

- Production build optimizations enabled
- Gzip compression
- Static asset caching (1 year)
- Security headers
- API proxy to backend

### Nginx Configuration

Production nginx includes:

- Security headers (X-Frame-Options, CSP, etc.)
- Gzip compression
- Static asset caching
- Rate limiting
- Health check endpoint
- API reverse proxy

Edit `frontend/nginx.prod.conf` to customize.

## Security

### Security Features

✅ **Non-root Users**: All containers run as non-root
✅ **Read-only Mounts**: Video directory mounted read-only
✅ **Docker Secrets**: Sensitive data in encrypted secrets
✅ **No New Privileges**: `security_opt: no-new-privileges`
✅ **Resource Limits**: CPU and memory constraints
✅ **Security Headers**: HTTPS headers, CSP, X-Frame-Options
✅ **Rate Limiting**: API request rate limiting

### Additional Security Recommendations

#### 1. Enable HTTPS

Use a reverse proxy (nginx, Caddy, Traefik) with Let's Encrypt:

```bash
# Example with Caddy
caddy reverse-proxy --from your-domain.com --to localhost:80
```

#### 2. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### 3. Bind to Localhost

Backend and MySQL are bound to `127.0.0.1` in production config:

```yaml
ports:
  - "127.0.0.1:3000:3000"  # Not accessible from outside
```

#### 4. Regular Updates

```bash
# Update images
docker-compose -f docker-compose.prod.yml pull

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# Restart
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

### Health Checks

All services have health checks:

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost/health
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Log rotation is configured (10MB per file, 3 files max)
```

### Metrics

Access container stats:

```bash
# Real-time stats
docker stats

# Service-specific
docker stats media-player-backend-prod
```

## Maintenance

### Backup Database

```bash
# Create backup
docker exec media-player-mysql-prod mysqldump \
  -u root -p$(cat secrets/db_root_password.txt) \
  media_player > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i media-player-mysql-prod mysql \
  -u root -p$(cat secrets/db_root_password.txt) \
  media_player < backup_20240101.sql
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Restart services (zero-downtime with rolling update)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (BE CAREFUL!)
docker volume prune

# Clean build cache
docker builder prune
```

### Rotate Secrets

```bash
# Generate new secrets
./scripts/generate-secrets.sh

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check health
docker-compose -f docker-compose.prod.yml ps

# Verify secrets exist
ls -l secrets/
```

### Database Connection Failed

```bash
# Check MySQL is running
docker-compose -f docker-compose.prod.yml ps mysql

# Check logs
docker-compose -f docker-compose.prod.yml logs mysql

# Test connection
docker exec media-player-backend-prod \
  curl -f http://mysql:3306 || echo "Cannot connect"
```

### Out of Memory

```bash
# Check current usage
docker stats

# Increase limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G  # Increase this
```

### Permission Denied

```bash
# Check file permissions
ls -la secrets/

# Fix permissions
chmod 600 secrets/*.txt
chown 1001:1001 secrets/*.txt  # nodejs user ID
```

### Video Files Not Found

```bash
# Verify mount
docker exec media-player-backend-prod ls -la /media

# Check .env.prod
grep VIDEO_PATH .env.prod

# Verify path exists on host
ls -la /path/to/your/videos
```

## Performance Tuning

### Database Optimization

Edit `docker-compose.prod.yml` to add MySQL configuration:

```yaml
mysql:
  command:
    - --max-connections=200
    - --innodb-buffer-pool-size=1G
    - --query-cache-size=64M
```

### HLS Cache

HLS cache is persistent in production:

```bash
# Check cache size
docker exec media-player-backend-prod du -sh /app/cache

# Clear cache if needed
docker exec media-player-backend-prod rm -rf /app/cache/*
```

### Image Size Optimization

Production images are optimized:

- Backend: ~150MB (Alpine + Node.js + FFmpeg)
- Frontend: ~25MB (Alpine + nginx + static files)
- Total: ~175MB (well under 500MB requirement)

Verify:

```bash
docker images | grep media-player
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend (multiple replicas)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Use load balancer (nginx, HAProxy, Traefik)
```

### Vertical Scaling

Increase resource limits in `docker-compose.prod.yml`.

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this guide
3. Check GitHub issues
4. Contact support

## Checklist

Before going live:

- [ ] Secrets generated and secured
- [ ] Environment variables configured
- [ ] Video path mounted correctly
- [ ] Database backed up
- [ ] HTTPS enabled (recommended)
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] Resource limits appropriate
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation reviewed
