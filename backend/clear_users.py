"""
Clear all users and tenants from the database to start fresh
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import User, Tenant, TenantUser

# Delete all users and tenants
print("Clearing database...")
TenantUser.objects.all().delete()
print(f"Deleted all TenantUser records")

User.objects.all().delete()
print(f"Deleted all User records")

Tenant.objects.all().delete()
print(f"Deleted all Tenant records")

print("✅ Database cleared successfully!")
