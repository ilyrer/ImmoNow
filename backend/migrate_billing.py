#!/usr/bin/env python3
"""
Migration Script für bestehende Tenants zu Stripe Billing
Erstellt BillingAccounts für alle existierenden Tenants ohne Stripe-Integration
"""

import os
import sys
import django
from django.conf import settings

# Django Setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import stripe
from django.utils import timezone
from app.db.models import Tenant, BillingAccount


def migrate_tenants_to_billing():
    """
    Erstelle BillingAccounts für alle existierenden Tenants
    """
    print("🚀 Starting migration of existing tenants to Stripe billing...")
    
    # Stripe API Key setzen
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    # Alle Tenants ohne BillingAccount finden
    tenants_without_billing = Tenant.objects.filter(billing__isnull=True)
    total_tenants = tenants_without_billing.count()
    
    print(f"📊 Found {total_tenants} tenants without billing accounts")
    
    if total_tenants == 0:
        print("✅ All tenants already have billing accounts!")
        return
    
    success_count = 0
    error_count = 0
    
    for i, tenant in enumerate(tenants_without_billing, 1):
        try:
            print(f"🔄 Processing tenant {i}/{total_tenants}: {tenant.name}")
            
            # Erstelle Stripe Customer
            customer = stripe.Customer.create(
                email=tenant.email,
                name=tenant.name,
                metadata={
                    'tenant_id': str(tenant.id),
                    'tenant_name': tenant.name,
                    'migration': 'true',
                    'migrated_at': timezone.now().isoformat()
                }
            )
            
            # Erstelle BillingAccount
            billing_account = BillingAccount.objects.create(
                tenant=tenant,
                stripe_customer_id=customer.id,
                plan_key='free',  # Alle bestehenden Tenants starten mit Free
                status='active',
                meta={
                    'migration': True,
                    'migrated_at': timezone.now().isoformat(),
                    'original_plan': tenant.plan,
                    'original_subscription_status': tenant.subscription_status
                }
            )
            
            print(f"✅ Created billing account for {tenant.name} (Stripe Customer: {customer.id})")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Error processing tenant {tenant.name}: {str(e)}")
            error_count += 1
            continue
    
    print(f"\n📈 Migration Summary:")
    print(f"✅ Successfully migrated: {success_count}")
    print(f"❌ Errors: {error_count}")
    print(f"📊 Total processed: {success_count + error_count}")
    
    if error_count > 0:
        print(f"\n⚠️  {error_count} tenants could not be migrated. Please check the errors above.")
        return False
    
    print(f"\n🎉 Migration completed successfully!")
    return True


def verify_migration():
    """
    Verifiziere dass alle Tenants jetzt BillingAccounts haben
    """
    print("\n🔍 Verifying migration...")
    
    tenants_without_billing = Tenant.objects.filter(billing__isnull=True).count()
    total_tenants = Tenant.objects.count()
    tenants_with_billing = total_tenants - tenants_without_billing
    
    print(f"📊 Total tenants: {total_tenants}")
    print(f"✅ Tenants with billing accounts: {tenants_with_billing}")
    print(f"❌ Tenants without billing accounts: {tenants_without_billing}")
    
    if tenants_without_billing == 0:
        print("🎉 All tenants now have billing accounts!")
        return True
    else:
        print(f"⚠️  {tenants_without_billing} tenants still missing billing accounts")
        return False


def update_tenant_limits():
    """
    Update Tenant-Limits basierend auf neuen Plan-Konfigurationen
    """
    print("\n🔄 Updating tenant limits based on new plan configuration...")
    
    from app.core.billing_config import PLAN_LIMITS
    
    updated_count = 0
    
    for tenant in Tenant.objects.all():
        try:
            # Hole aktuellen Plan (aus Tenant oder BillingAccount)
            if hasattr(tenant, 'billing'):
                plan_key = tenant.billing.plan_key
            else:
                plan_key = 'free'  # Fallback
            
            # Update Limits basierend auf Plan
            limits = PLAN_LIMITS.get(plan_key, PLAN_LIMITS['free'])
            
            tenant.max_users = limits['users']
            tenant.max_properties = limits['properties']
            tenant.storage_limit_gb = limits['storage_gb']
            tenant.save()
            
            print(f"✅ Updated limits for {tenant.name} (plan: {plan_key})")
            updated_count += 1
            
        except Exception as e:
            print(f"❌ Error updating limits for {tenant.name}: {str(e)}")
    
    print(f"📈 Updated limits for {updated_count} tenants")


def main():
    """
    Hauptfunktion für Migration
    """
    print("=" * 60)
    print("STRIPE BILLING MIGRATION SCRIPT")
    print("=" * 60)
    
    # Prüfe Stripe-Konfiguration
    if not settings.STRIPE_SECRET_KEY:
        print("❌ STRIPE_SECRET_KEY not configured!")
        print("Please set STRIPE_SECRET_KEY in your environment variables.")
        return False
    
    try:
        # Teste Stripe-Verbindung
        stripe.Customer.list(limit=1)
        print("✅ Stripe connection successful")
    except Exception as e:
        print(f"❌ Stripe connection failed: {str(e)}")
        return False
    
    # Migration durchführen
    if not migrate_tenants_to_billing():
        print("❌ Migration failed!")
        return False
    
    # Limits aktualisieren
    update_tenant_limits()
    
    # Verifikation
    if not verify_migration():
        print("❌ Migration verification failed!")
        return False
    
    print("\n🎉 Migration completed successfully!")
    print("\nNext steps:")
    print("1. Configure Stripe Price IDs in environment variables")
    print("2. Set up Stripe Webhooks pointing to /api/billing/stripe/webhook")
    print("3. Test the billing integration")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

