import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import User, Tenant, TenantUser
from django.utils import timezone
from django.contrib.auth.hashers import make_password

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

print(f"Tenant: {tenant.name} (created: {created})")

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

if not created:
    user.password = make_password('test123')
    user.save()

print(f"User: {user.email} (created: {created})")

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

print(f"TenantUser: {user.email} -> {tenant.name} (created: {created})")
print(f"Test credentials: test@example.com / test123")
