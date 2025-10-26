#!/bin/bash

# ImmoNow Docker Deployment Scripts
# This script starts all services using Docker Compose

set -e

echo "🚀 Starting ImmoNow Docker Deployment..."
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    echo "   Current .env file contains default values."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "📦 Building and starting services..."
$COMPOSE_CMD up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service health..."

# Check if services are running
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ Services are starting up successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend:     http://localhost:80"
    echo "   Backend API:  http://localhost:80/api/"
    echo "   Django Admin: http://localhost:80/admin/"
    echo "   Health Check: http://localhost:80/healthz"
    echo ""
    echo "📊 Service Status:"
    $COMPOSE_CMD ps
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:    $COMPOSE_CMD logs -f [service_name]"
    echo "   Stop all:     ./down.sh"
    echo "   Restart:      $COMPOSE_CMD restart [service_name]"
    echo ""
    echo "🎉 Deployment completed successfully!"
else
    echo "❌ Some services failed to start. Check logs with:"
    echo "   $COMPOSE_CMD logs"
    exit 1
fi
