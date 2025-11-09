#!/bin/bash
# Production deployment script for Media Player

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Media Player Production Deployment"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run as root${NC}"
    exit 1
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check for secrets
if [ ! -f "./secrets/db_password.txt" ] || [ ! -f "./secrets/jwt_secret.txt" ]; then
    echo -e "${YELLOW}⚠️  Docker secrets not found${NC}"
    echo "Would you like to generate them now? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        ./scripts/generate-secrets.sh
    else
        echo -e "${RED}❌ Cannot deploy without secrets${NC}"
        exit 1
    fi
fi

# Check for .env.prod
if [ ! -f ".env.prod" ]; then
    echo -e "${YELLOW}⚠️  .env.prod not found${NC}"
    echo "Creating from template..."
    cp .env.production .env.prod
    echo -e "${YELLOW}⚠️  Please edit .env.prod with your configuration${NC}"
    exit 1
fi

# Load environment
set -a
source .env.prod
set +a

# Validate VIDEO_PATH
if [ -z "$VIDEO_PATH" ]; then
    echo -e "${RED}❌ VIDEO_PATH not set in .env.prod${NC}"
    exit 1
fi

if [ ! -d "$VIDEO_PATH" ]; then
    echo -e "${RED}❌ VIDEO_PATH does not exist: $VIDEO_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# Choose database
echo "Select database type:"
echo "  1) MySQL (default)"
echo "  2) PostgreSQL"
read -p "Choice [1]: " db_choice
db_choice=${db_choice:-1}

if [ "$db_choice" = "2" ]; then
    COMPOSE_FILE="docker-compose.prod.postgres.yml"
    echo -e "${GREEN}Using PostgreSQL${NC}"
else
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${GREEN}Using MySQL${NC}"
fi

echo ""

# Build images
echo "📦 Building production images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

echo ""
echo "✅ Build completed"
echo ""

# Check if services are already running
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Services are already running${NC}"
    echo "What would you like to do?"
    echo "  1) Restart services"
    echo "  2) Stop and rebuild"
    echo "  3) Cancel"
    read -p "Choice [1]: " action
    action=${action:-1}

    case $action in
        1)
            echo "♻️  Restarting services..."
            docker-compose -f "$COMPOSE_FILE" restart
            ;;
        2)
            echo "🛑 Stopping services..."
            docker-compose -f "$COMPOSE_FILE" down
            echo "🚀 Starting services..."
            docker-compose -f "$COMPOSE_FILE" up -d
            ;;
        3)
            echo "Cancelled"
            exit 0
            ;;
    esac
else
    echo "🚀 Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
fi

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
    echo -e "${RED}❌ Some services are unhealthy${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Check logs with: docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" ps
echo ""
echo "📍 Access Points:"
echo "  - Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "  - Backend: http://localhost:3000/health"
echo ""
echo "📝 Next Steps:"
echo "  - Check logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Monitor: docker stats"
echo "  - Create user: Access frontend and register"
echo ""
echo "📚 Documentation:"
echo "  - Production guide: ./PRODUCTION.md"
echo "  - Docker guide: ./docs/DOCKER-PRODUCTION.md"
