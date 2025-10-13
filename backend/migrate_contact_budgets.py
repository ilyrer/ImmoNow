#!/usr/bin/env python3
"""
Contact Budget Migration Script
Migrates budget_max values to new budget field
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import Contact

def migrate_budgets():
    """Migrate budget_max to budget field"""
    print("🔄 Starting Contact Budget Migration...")
    print("=" * 50)
    
    # Get all contacts that need migration
    contacts_to_migrate = Contact.objects.filter(
        budget__isnull=True,
        budget_max__isnull=False
    )
    
    total = contacts_to_migrate.count()
    print(f"📊 Found {total} contacts to migrate\n")
    
    if total == 0:
        print("✅ No migration needed - all contacts already have budget field")
        return
    
    migrated = 0
    errors = 0
    
    for contact in contacts_to_migrate:
        try:
            contact.budget = contact.budget_max
            contact.save(update_fields=['budget'])
            migrated += 1
            print(f"✅ {contact.name}: €{contact.budget_max:,.2f} → budget")
        except Exception as e:
            errors += 1
            print(f"❌ {contact.name}: ERROR - {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📈 Migration Complete!")
    print(f"   - Migrated: {migrated}")
    print(f"   - Errors: {errors}")
    print(f"   - Total: {total}")
    
    if errors == 0:
        print("\n🎉 All contacts migrated successfully!")
    else:
        print(f"\n⚠️  {errors} contacts had errors - please check manually")

if __name__ == '__main__':
    try:
        migrate_budgets()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed: {str(e)}")
        sys.exit(1)
