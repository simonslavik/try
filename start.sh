#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Portfolio Microservices - Startup Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Validate environment
echo -e "${BLUE}Step 1: Validating environment configuration...${NC}"
./check-env.sh
ENV_CHECK=$?

if [ $ENV_CHECK -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Environment validation failed!${NC}"
    echo -e "Please fix the errors above before starting the application."
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Starting services with Docker Compose...${NC}"
echo ""

# Check if services are already running
if docker-compose ps | grep -q "Up"; then
    echo -e "${BLUE}Services are already running. Restarting...${NC}"
    docker-compose down
fi

# Start services
docker-compose up --build

echo ""
echo -e "${GREEN}✓ Services started successfully!${NC}"
