#!/usr/bin/env python3
"""
Verify Contact Budget Migration
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import Contact

def verify_migration():
    """Verify budget field migration"""
    print("🔍 Verifying Contact Budget Migration...")
    print("=" * 50)
    
    # Get all contacts
    contacts = Contact.objects.all()
    total = contacts.count()
    
    print(f"📊 Total contacts: {total}\n")
    
    if total == 0:
        print("ℹ️  No contacts in database yet")
        return
    
    # Check budget field
    with_budget = Contact.objects.filter(budget__isnull=False).count()
    with_budget_max = Contact.objects.filter(budget_max__isnull=False).count()
    with_budget_min = Contact.objects.filter(budget_min__isnull=False).count()
    
    print("Budget Field Status:")
    print(f"  - With budget: {with_budget}")
    print(f"  - With budget_max (legacy): {with_budget_max}")
    print(f"  - With budget_min (legacy): {with_budget_min}\n")
    
    # Show sample contacts
    print("Sample Contacts:")
    print("-" * 50)
    for contact in contacts[:5]:
        budget = contact.budget or contact.budget_max
        if budget:
            print(f"✅ {contact.name}: €{budget:,.2f}")
        else:
            print(f"⚪ {contact.name}: No budget")
    
    print("\n" + "=" * 50)
    print("✅ Migration verification complete!")

if __name__ == '__main__':
    try:
        verify_migration()
    except Exception as e:
        print(f"\n❌ Verification failed: {str(e)}")
        sys.exit(1)
