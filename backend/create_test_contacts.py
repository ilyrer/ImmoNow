#!/usr/bin/env python
"""
Create test contacts for development
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import Contact, Tenant, User

def create_test_contacts():
    """Create test contacts"""
    
    # Get or create tenant
    tenant, _ = Tenant.objects.get_or_create(
        slug='test-tenant',
        defaults={
            'name': 'Test Tenant',
            'is_active': True
        }
    )
    
    print(f"Using tenant: {tenant.name} ({tenant.id})")
    
    # Test contact data
    contacts_data = [
        {
            'name': 'Max Mustermann',
            'email': 'max.mustermann@example.com',
            'phone': '+49 176 12345678',
            'company': 'Mustermann GmbH',
            'category': 'Käufer',
            'status': 'Kunde',
            'priority': 'high',
            'location': 'München',
            'budget_min': 300000,
            'budget_max': 500000,
            'lead_score': 85
        },
        {
            'name': 'Anna Schmidt',
            'email': 'anna.schmidt@example.com',
            'phone': '+49 160 98765432',
            'company': 'Schmidt Immobilien',
            'category': 'Verkäufer',
            'status': 'Lead',
            'priority': 'medium',
            'location': 'Berlin',
            'budget_min': 400000,
            'budget_max': 600000,
            'lead_score': 65
        },
        {
            'name': 'Thomas Weber',
            'email': 'thomas.weber@example.com',
            'phone': '+49 171 11223344',
            'company': 'Weber & Partner',
            'category': 'Investor',
            'status': 'Interessent',
            'priority': 'high',
            'location': 'Hamburg',
            'budget_min': 800000,
            'budget_max': 1200000,
            'lead_score': 90
        },
        {
            'name': 'Sarah Müller',
            'email': 'sarah.mueller@example.com',
            'phone': '+49 152 55667788',
            'company': 'Müller Real Estate',
            'category': 'Makler',
            'status': 'Kunde',
            'priority': 'medium',
            'location': 'Frankfurt',
            'budget_min': 250000,
            'budget_max': 400000,
            'lead_score': 70
        },
        {
            'name': 'Michael Koch',
            'email': 'michael.koch@example.com',
            'phone': '+49 173 99887766',
            'company': 'Koch Properties',
            'category': 'Käufer',
            'status': 'Lead',
            'priority': 'low',
            'location': 'Köln',
            'budget_min': 200000,
            'budget_max': 350000,
            'lead_score': 45
        },
        {
            'name': 'Julia Fischer',
            'email': 'julia.fischer@example.com',
            'phone': '+49 162 44556677',
            'company': 'Fischer Immobilien GmbH',
            'category': 'Investor',
            'status': 'Interessent',
            'priority': 'urgent',
            'location': 'Stuttgart',
            'budget_min': 1000000,
            'budget_max': 2000000,
            'lead_score': 95
        },
        {
            'name': 'Lukas Becker',
            'email': 'lukas.becker@example.com',
            'phone': '+49 174 33221100',
            'company': 'Becker Holding',
            'category': 'Verkäufer',
            'status': 'Kunde',
            'priority': 'high',
            'location': 'Düsseldorf',
            'budget_min': 500000,
            'budget_max': 750000,
            'lead_score': 80
        },
        {
            'name': 'Laura Hoffmann',
            'email': 'laura.hoffmann@example.com',
            'phone': '+49 151 22334455',
            'company': None,
            'category': 'Käufer',
            'status': 'Lead',
            'priority': 'medium',
            'location': 'Leipzig',
            'budget_min': 150000,
            'budget_max': 250000,
            'lead_score': 55
        },
    ]
    
    created_count = 0
    
    for contact_data in contacts_data:
        # Check if contact already exists
        existing = Contact.objects.filter(
            tenant=tenant,
            email=contact_data['email']
        ).exists()
        
        if not existing:
            # Random last_contact date in the last 30 days
            days_ago = random.randint(1, 30)
            last_contact = datetime.now() - timedelta(days=days_ago)
            
            contact = Contact.objects.create(
                tenant=tenant,
                name=contact_data['name'],
                email=contact_data['email'],
                phone=contact_data['phone'],
                company=contact_data['company'],
                category=contact_data['category'],
                status=contact_data['status'],
                priority=contact_data['priority'],
                location=contact_data['location'],
                budget_min=contact_data['budget_min'],
                budget_max=contact_data['budget_max'],
                lead_score=contact_data['lead_score'],
                last_contact=last_contact,
                preferences={
                    'property_types': ['apartment', 'house'],
                    'preferred_locations': [contact_data['location']],
                    'contact_method': 'email'
                }
            )
            
            print(f"✓ Created contact: {contact.name}")
            created_count += 1
        else:
            print(f"○ Contact already exists: {contact_data['name']}")
    
    print(f"\n✓ Successfully created {created_count} test contacts")
    print(f"Total contacts in database: {Contact.objects.filter(tenant=tenant).count()}")

if __name__ == '__main__':
    create_test_contacts()
