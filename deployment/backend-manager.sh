#!/bin/bash

# ImmoNow Backend Services Management Script

echo "🏠 ImmoNow Backend Services Manager"
echo ""

case "$1" in
    "fastapi")
        echo "🚀 Starting FastAPI server via main.py..."
        cd /app
        python main.py
        ;;
    "django")
        echo "🔧 Starting Django admin server on port 8001..."
        cd /app
        python manage.py runserver 0.0.0.0:8001
        ;;
    "setup")
        echo "⚙️ Setting up database and creating users..."
        cd /app
        python manage.py makemigrations
        python manage.py migrate
        python manage.py collectstatic --noinput
        python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@immonow.com', 'admin123');
    print('✅ Superuser admin created successfully!');
else:
    print('ℹ️ Superuser admin already exists');
if not User.objects.filter(username='demo').exists():
    User.objects.create_user('demo', 'demo@immonow.com', 'demo123', first_name='Demo', last_name='User');
    print('✅ Demo user created successfully!');
else:
    print('ℹ️ Demo user already exists');
        "
        ;;
    "full")
        echo "🔄 Full setup and FastAPI start via main.py..."
        /app/scripts/backend-manager.sh setup
        echo "🚀 Starting FastAPI server via main.py..."
        python main.py
        ;;
    *)
        echo "Usage: $0 {fastapi|django|setup|full}"
        echo ""
        echo "  fastapi  - Start FastAPI server only"
        echo "  django   - Start Django admin server only"  
        echo "  setup    - Setup database and create users"
        echo "  full     - Full setup + start FastAPI"
        exit 1
        ;;
esac