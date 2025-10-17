#!/usr/bin/env python3
"""
Migration Script: Setze trial_end für alle bestehenden Free-Accounts
"""

import os
import sys
import django
from datetime import timedelta

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from app.db.models import BillingAccount


def migrate_existing_trials():
    """Setze trial_end für alle bestehenden Free-Accounts"""
    
    print("Migrating existing BillingAccounts to trial system...")
    
    # Finde alle Free-Accounts ohne trial_end
    free_accounts = BillingAccount.objects.filter(
        plan_key='free',
        trial_end__isnull=True
    )
    
    print(f"Found {free_accounts.count()} free accounts to migrate")
    
    migrated_count = 0
    
    for billing in free_accounts:
        try:
            # Setze trial_end auf 14 Tage nach created_at
            billing.trial_end = billing.created_at + timedelta(days=14)
            billing.status = 'trialing'
            billing.trial_days = 14
            
            # Prüfe ob Trial bereits abgelaufen ist
            if timezone.now() > billing.trial_end:
                print(f"WARNING: Trial already expired for {billing.tenant.name} (expired: {billing.trial_end})")
                # Setze Status auf past_due für abgelaufene Trials
                billing.status = 'past_due'
            
            billing.save()
            migrated_count += 1
            
            print(f"SUCCESS: Migrated {billing.tenant.name} - Trial until {billing.trial_end}")
            
        except Exception as e:
            print(f"ERROR: Failed to migrate {billing.tenant.name}: {str(e)}")
    
    print(f"Migration complete! Migrated {migrated_count} accounts")
    
    # Statistiken
    active_trials = BillingAccount.objects.filter(status='trialing').count()
    expired_trials = BillingAccount.objects.filter(status='past_due').count()
    
    print(f"Statistics:")
    print(f"   - Active trials: {active_trials}")
    print(f"   - Expired trials: {expired_trials}")


if __name__ == "__main__":
    migrate_existing_trials()
