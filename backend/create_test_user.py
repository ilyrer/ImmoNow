#!/usr/bin/env python
"""
Create test user for authentication testing
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

django.setup()

from app.db.models import User, Tenant, TenantUser
from django.utils import timezone
from django.contrib.auth.hashers import make_password

def create_test_user():
    """Create a test user with tenant"""
    
    # Create tenant
    tenant, created = Tenant.objects.get_or_create(
        slug='test-company',
        defaults={
            'name': 'Test Company',
            'email': 'test@example.com',
            'phone': '+49 123 456789',
            'plan': 'professional',
            'billing_cycle': 'monthly',
            'subscription_status': 'active',
            'is_active': True,
            'subscription_start_date': timezone.now(),
            'max_users': 20,
            'max_properties': 100,
            'storage_limit_gb': 50
        }
    )
    
    if created:
        print(f"✅ Created tenant: {tenant.name}")
    else:
        print(f"ℹ️ Using existing tenant: {tenant.name}")
    
    # Create user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '+49 123 456789',
            'is_active': True,
            'email_verified': True,
            'password': make_password('test123')
        }
    )
    
    if created:
        print(f"✅ Created user: {user.email}")
    else:
        print(f"ℹ️ Using existing user: {user.email}")
        # Update password in case it changed
        user.password = make_password('test123')
        user.save()
    
    # Create tenant-user relationship
    tenant_user, created = TenantUser.objects.get_or_create(
        user=user,
        tenant=tenant,
        defaults={
            'role': 'owner',
            'can_manage_properties': True,
            'can_manage_documents': True,
            'can_manage_users': True,
            'can_view_analytics': True,
            'can_export_data': True,
            'is_active': True,
            'joined_at': timezone.now()
        }
    )
    
    if created:
        print(f"✅ Created tenant-user relationship: {user.email} -> {tenant.name}")
    else:
        print(f"ℹ️ Using existing tenant-user relationship")
    
    print(f"\n🎯 Test credentials:")
    print(f"   Email: test@example.com")
    print(f"   Password: test123")
    print(f"   Tenant: {tenant.name} ({tenant.slug})")
    print(f"   User ID: {user.id}")
    print(f"   Tenant ID: {tenant.id}")

if __name__ == '__main__':
    create_test_user()
