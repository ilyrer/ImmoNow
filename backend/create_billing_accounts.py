#!/usr/bin/env python3
"""
Script to create BillingAccounts for all tenants without one
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, str(Path(__file__).parent))

# Configure Django
django.setup()

from app.db.models import BillingAccount, Tenant
from django.utils import timezone
from datetime import timedelta

def create_billing_accounts():
    """Create BillingAccounts for all tenants without one"""
    
    tenants = Tenant.objects.all()
    print(f'Found {tenants.count()} tenants')
    
    created_count = 0
    existing_count = 0
    
    for tenant in tenants:
        # Check if BillingAccount already exists
        if not BillingAccount.objects.filter(tenant=tenant).exists():
            # Create BillingAccount with free plan
            billing = BillingAccount.objects.create(
                tenant=tenant,
                stripe_customer_id=f'cus_free_{tenant.id}',  # Dummy Stripe customer ID
                plan_key='free',
                status='active',
                current_period_end=timezone.now() + timedelta(days=30),
                trial_end=timezone.now() + timedelta(days=14),
                trial_days=14
            )
            print(f'Created BillingAccount for tenant: {tenant.name} (ID: {tenant.id})')
            created_count += 1
        else:
            print(f'BillingAccount already exists for tenant: {tenant.name}')
            existing_count += 1
    
    print(f'\nSummary:')
    print(f'- Created: {created_count}')
    print(f'- Already existed: {existing_count}')
    print(f'- Total: {created_count + existing_count}')

if __name__ == '__main__':
    try:
        create_billing_accounts()
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

