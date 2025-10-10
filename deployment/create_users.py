#!/usr/bin/env python3
"""
Script to create default users for ImmoNow
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Configure Django
django.setup()

from django.contrib.auth import get_user_model

def create_default_users():
    """Create default admin and demo users"""
    User = get_user_model()
    
    # Create admin user
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@immonow.com', 
            password='admin123'
        )
        print('✅ Superuser admin created successfully!')
    else:
        print('ℹ️ Superuser admin already exists')
    
    # Create demo user
    if not User.objects.filter(username='demo').exists():
        User.objects.create_user(
            username='demo',
            email='demo@immonow.com',
            password='demo123',
            first_name='Demo',
            last_name='User'
        )
        print('✅ Demo user created successfully!')
    else:
        print('ℹ️ Demo user already exists')

if __name__ == '__main__':
    create_default_users()