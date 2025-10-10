#!/bin/bash

# ImmoNow Docker Development Setup Script

echo "🏠 Starting ImmoNow Development Environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

# Build and start all services
echo "🚀 Building and starting all services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ ImmoNow Development Environment is ready!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend (React):     http://localhost:3000"
echo "   FastAPI Backend:      http://localhost:8000"
echo "   FastAPI Docs:         http://localhost:8000/docs"
echo "   Django Admin:         http://localhost:8001/admin"
echo "   Nginx (Proxy):        http://localhost"
echo ""
echo "🔑 Default Login Credentials:"
echo "   Admin User:"
echo "     Username: admin"
echo "     Password: admin123"
echo "     Email: admin@immonow.com"
echo ""
echo "   Demo User:"
echo "     Username: demo"
echo "     Password: demo123" 
echo "     Email: demo@immonow.com"
echo ""
echo "💾 Database Access:"
echo "   Host: localhost:5432"
echo "   Database: immonow_db"
echo "   Username: immonow_user"
echo "   Password: immonow_password"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:           docker-compose logs -f"
echo "   Stop all:            docker-compose down"
echo "   Restart service:     docker-compose restart [service_name]"
echo "   Access container:    docker exec -it immonow_backend bash"
echo ""
echo "Happy coding! 🎉"