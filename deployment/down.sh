#!/bin/bash

# ImmoNow Docker Stop Script
# This script stops all services and cleans up

set -e

echo "🛑 Stopping ImmoNow Docker Services..."
echo "====================================="

# Use docker compose (newer) or docker-compose (older)
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Stop all services
echo "📦 Stopping services..."
$COMPOSE_CMD down

echo ""
echo "🧹 Cleanup options:"
echo "1. Keep volumes (data preserved)"
echo "2. Remove volumes (data will be lost)"
echo "3. Remove everything including images"
echo ""
read -p "Choose cleanup level (1-3, default: 1): " choice

case $choice in
    2)
        echo "🗑️  Removing volumes..."
        $COMPOSE_CMD down -v
        ;;
    3)
        echo "🗑️  Removing everything including images..."
        $COMPOSE_CMD down -v --rmi all
        ;;
    *)
        echo "✅ Services stopped. Volumes preserved."
        ;;
esac

echo ""
echo "🔍 Checking for orphaned containers..."
if [ "$($COMPOSE_CMD ps -q)" ]; then
    echo "⚠️  Some containers are still running:"
    $COMPOSE_CMD ps
else
    echo "✅ All containers stopped successfully."
fi

echo ""
echo "📊 Final status:"
$COMPOSE_CMD ps

echo ""
echo "🎉 Cleanup completed!"
