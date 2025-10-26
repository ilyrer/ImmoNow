#!/bin/bash

# ImmoNow Database Migration Script
# This script runs database migrations for the backend

set -e

echo "🗄️  Running Database Migrations..."
echo "================================="

# Use docker compose (newer) or docker-compose (older)
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Check if backend container is running
if ! $COMPOSE_CMD ps backend | grep -q "Up"; then
    echo "❌ Backend service is not running. Please start services first with ./up.sh"
    exit 1
fi

echo "📦 Running migrations..."
$COMPOSE_CMD exec backend python manage.py makemigrations

echo "🔄 Applying migrations..."
$COMPOSE_CMD exec backend python manage.py migrate

echo "📁 Collecting static files..."
$COMPOSE_CMD exec backend python manage.py collectstatic --noinput

echo ""
echo "✅ Database migrations completed successfully!"
echo ""
echo "📝 Additional management commands:"
echo "   Create superuser: $COMPOSE_CMD exec backend python manage.py createsuperuser"
echo "   Django shell:     $COMPOSE_CMD exec backend python manage.py shell"
echo "   Show migrations:  $COMPOSE_CMD exec backend python manage.py showmigrations"
