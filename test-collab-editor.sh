#!/bin/bash

# Collaborative Editor Quick Start Script
# This script helps you quickly test the collaborative editor service

echo "🚀 Starting Collaborative Editor Test..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo -e "${BLUE}📋 Checking services...${NC}"
if ! docker ps | grep -q "collab-editor"; then
    echo -e "${YELLOW}⚠️  Collab editor service not running. Starting services...${NC}"
    docker compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

# Health check
echo ""
echo -e "${BLUE}🏥 Health Check${NC}"
HEALTH=$(curl -s http://localhost:3000/v1/editor/health)
echo $HEALTH | jq '.' 2>/dev/null || echo $HEALTH

# Create a room
echo ""
echo -e "${BLUE}🎨 Creating a new room...${NC}"
ROOM_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/editor/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room",
    "language": "javascript"
  }')

ROOM_ID=$(echo $ROOM_RESPONSE | jq -r '.roomId' 2>/dev/null)

if [ "$ROOM_ID" != "null" ] && [ ! -z "$ROOM_ID" ]; then
    echo -e "${GREEN}✅ Room created successfully!${NC}"
    echo ""
    echo "📋 Room Details:"
    echo $ROOM_RESPONSE | jq '.' 2>/dev/null || echo $ROOM_RESPONSE
    echo ""
    echo -e "${GREEN}🔗 Room ID: $ROOM_ID${NC}"
    echo ""
    echo "📱 You can now:"
    echo "  1. Open http://localhost:5173 in your browser"
    echo "  2. Navigate to the Collaborative Editor"
    echo "  3. Join with Room ID: $ROOM_ID"
    echo ""
    echo "Or test via WebSocket:"
    echo "  ws://localhost:4000"
    echo ""
    
    # Get room info
    echo -e "${BLUE}ℹ️  Getting room information...${NC}"
    ROOM_INFO=$(curl -s http://localhost:3000/v1/editor/rooms/$ROOM_ID)
    echo $ROOM_INFO | jq '.' 2>/dev/null || echo $ROOM_INFO
else
    echo -e "${YELLOW}⚠️  Failed to create room${NC}"
    echo $ROOM_RESPONSE
fi

echo ""
echo -e "${BLUE}📚 Useful Commands:${NC}"
echo "  View logs:        docker compose logs -f collab-editor"
echo "  Restart service:  docker compose restart collab-editor"
echo "  Stop services:    docker compose down"
echo ""
echo -e "${GREEN}✨ Happy coding together!${NC}"
