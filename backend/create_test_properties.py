#!/usr/bin/env python
"""
Create test properties for development
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.db.models import Property, Tenant, User

def create_test_properties():
    """Create test properties"""
    
    # Get or create tenant
    tenant, _ = Tenant.objects.get_or_create(
        slug='test-tenant',
        defaults={
            'name': 'Test Tenant',
            'is_active': True
        }
    )
    
    print(f"Using tenant: {tenant.name} ({tenant.id})")
    
    # Get first user (or create if none exists)
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        print(f"✓ Created user: {user.email}")
    else:
        print(f"○ Using existing user: {user.email}")
    
    # Test property data
    properties_data = [
        {
            'title': 'Moderne 3-Zimmer Wohnung in München',
            'description': 'Schöne, helle Wohnung mit Balkon in zentraler Lage. Perfekt für Singles oder Paare.',
            'property_type': 'apartment',
            'status': 'active',
            'price': Decimal('450000.00'),
            'location': 'München, Schwabing',
            'living_area': 85,
            'rooms': 3,
            'bathrooms': 1,
            'year_built': 2018,
        },
        {
            'title': 'Luxusvilla mit Garten in Hamburg',
            'description': 'Exklusive Villa mit großem Garten, Pool und Doppelgarage. Premium-Ausstattung.',
            'property_type': 'house',
            'status': 'active',
            'price': Decimal('1250000.00'),
            'location': 'Hamburg, Blankenese',
            'living_area': 280,
            'rooms': 7,
            'bathrooms': 3,
            'year_built': 2020,
        },
        {
            'title': 'Penthouse-Wohnung mit Dachterrasse Berlin',
            'description': 'Atemberaubende Penthouse-Wohnung mit großer Dachterrasse und Panoramablick über Berlin.',
            'property_type': 'apartment',
            'status': 'active',
            'price': Decimal('980000.00'),
            'location': 'Berlin, Mitte',
            'living_area': 145,
            'rooms': 4,
            'bathrooms': 2,
            'year_built': 2019,
        },
        {
            'title': 'Gewerbeimmobilie Frankfurt Zentrum',
            'description': 'Top Gewerbeimmobilie in bester Innenstadtlage. Ideal für Büros oder Geschäfte.',
            'property_type': 'commercial',
            'status': 'active',
            'price': Decimal('2500000.00'),
            'location': 'Frankfurt, Innenstadt',
            'living_area': 450,
            'rooms': 12,
            'bathrooms': 4,
            'year_built': 2015,
        },
        {
            'title': 'Einfamilienhaus mit Garten Stuttgart',
            'description': 'Charmantes Einfamilienhaus in ruhiger Wohnlage mit großem Garten.',
            'property_type': 'house',
            'status': 'active',
            'price': Decimal('620000.00'),
            'location': 'Stuttgart, Degerloch',
            'living_area': 160,
            'rooms': 5,
            'bathrooms': 2,
            'year_built': 2005,
        },
        {
            'title': 'Bürogebäude Düsseldorf',
            'description': 'Modernes Bürogebäude mit Tiefgarage und ausgezeichneter Verkehrsanbindung.',
            'property_type': 'office',
            'status': 'active',
            'price': Decimal('3200000.00'),
            'location': 'Düsseldorf, Medienhafen',
            'living_area': 850,
            'rooms': 20,
            'bathrooms': 6,
            'year_built': 2021,
        },
        {
            'title': '2-Zimmer Wohnung Köln Altstadt',
            'description': 'Gemütliche Wohnung in der Kölner Altstadt, perfekt für Studenten oder Berufspendler.',
            'property_type': 'apartment',
            'status': 'active',
            'price': Decimal('280000.00'),
            'location': 'Köln, Altstadt',
            'living_area': 55,
            'rooms': 2,
            'bathrooms': 1,
            'year_built': 2010,
        },
        {
            'title': 'Baugrundstück Leipzig',
            'description': 'Attraktives Baugrundstück in aufstrebender Lage. Voll erschlossen.',
            'property_type': 'land',
            'status': 'active',
            'price': Decimal('180000.00'),
            'location': 'Leipzig, Gohlis',
            'living_area': None,
            'rooms': None,
            'bathrooms': None,
            'year_built': None,
        },
        {
            'title': 'Luxus-Apartment München Maxvorstadt',
            'description': 'Hochwertig ausgestattetes Apartment in bester Innenstadtlage.',
            'property_type': 'apartment',
            'status': 'reserved',
            'price': Decimal('750000.00'),
            'location': 'München, Maxvorstadt',
            'living_area': 95,
            'rooms': 3,
            'bathrooms': 2,
            'year_built': 2022,
        },
        {
            'title': 'Reihenhaus Hamburg Eimsbüttel',
            'description': 'Modernes Reihenhaus mit kleinem Garten in beliebter Wohnlage.',
            'property_type': 'house',
            'status': 'active',
            'price': Decimal('580000.00'),
            'location': 'Hamburg, Eimsbüttel',
            'living_area': 125,
            'rooms': 4,
            'bathrooms': 2,
            'year_built': 2017,
        },
        {
            'title': 'Loft-Wohnung Berlin Kreuzberg',
            'description': 'Stylisches Loft in angesagter Lage mit hohen Decken und offenem Wohnbereich.',
            'property_type': 'apartment',
            'status': 'active',
            'price': Decimal('520000.00'),
            'location': 'Berlin, Kreuzberg',
            'living_area': 110,
            'rooms': 3,
            'bathrooms': 1,
            'year_built': 2014,
        },
        {
            'title': 'Einzelhandelfläche Stuttgart',
            'description': 'Attraktive Ladenfläche in 1A-Lage mit großen Schaufenstern.',
            'property_type': 'retail',
            'status': 'active',
            'price': Decimal('1200000.00'),
            'location': 'Stuttgart, Königstraße',
            'living_area': 220,
            'rooms': 6,
            'bathrooms': 2,
            'year_built': 2016,
        },
    ]
    
    created_count = 0
    
    for prop_data in properties_data:
        # Check if property already exists
        existing = Property.objects.filter(
            tenant=tenant,
            title=prop_data['title']
        ).exists()
        
        if not existing:
            property_obj = Property.objects.create(
                tenant=tenant,
                title=prop_data['title'],
                description=prop_data['description'],
                property_type=prop_data['property_type'],
                status=prop_data['status'],
                price=prop_data['price'],
                location=prop_data['location'],
                living_area=prop_data['living_area'],
                rooms=prop_data['rooms'],
                bathrooms=prop_data['bathrooms'],
                year_built=prop_data['year_built'],
                created_by=user,
            )
            
            print(f"✓ Created property: {property_obj.title}")
            created_count += 1
        else:
            print(f"○ Property already exists: {prop_data['title']}")
    
    print(f"\n✓ Successfully created {created_count} test properties")
    print(f"Total properties in database: {Property.objects.filter(tenant=tenant).count()}")

if __name__ == '__main__':
    create_test_properties()
