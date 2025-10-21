"""
Management command to initialize investor data
Creates sample performance snapshots, vacancy records, and cost records
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random

from app.db.models import (
    Tenant, Property, PerformanceSnapshot, VacancyRecord, CostRecord,
    ROISimulation, MarketplacePackage
)


class Command(BaseCommand):
    help = 'Initialize investor data with sample records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Tenant ID to initialize data for',
        )
        parser.add_argument(
            '--months',
            type=int,
            default=12,
            help='Number of months of historical data to create',
        )

    def handle(self, *args, **options):
        tenant_id = options['tenant_id']
        months = options['months']
        
        if not tenant_id:
            self.stdout.write(
                self.style.ERROR('Please provide --tenant-id')
            )
            return

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Tenant with ID {tenant_id} not found')
            )
            return

        self.stdout.write(f'Initializing investor data for tenant: {tenant.name}')
        
        # Get properties for this tenant
        properties = Property.objects.filter(tenant=tenant)
        if not properties.exists():
            self.stdout.write(
                self.style.WARNING('No properties found for tenant. Creating sample properties...')
            )
            # Create sample properties
            properties = self.create_sample_properties(tenant)
        
        # Create performance snapshots
        self.create_performance_snapshots(tenant, months)
        
        # Create vacancy records
        self.create_vacancy_records(tenant, properties, months)
        
        # Create cost records
        self.create_cost_records(tenant, properties, months)
        
        # Create sample ROI simulations
        self.create_sample_simulations(tenant)
        
        # Create sample marketplace packages
        self.create_sample_marketplace_packages(tenant, properties)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully initialized investor data')
        )

    def create_sample_properties(self, tenant):
        """Create sample properties for the tenant"""
        properties = []
        
        sample_properties = [
            {
                'title': 'Hamburg Apartment Complex',
                'property_type': 'apartment',
                'living_area': 1200,
                'purchase_price': Decimal('800000'),
                'current_value': Decimal('850000'),
            },
            {
                'title': 'Berlin Office Building',
                'property_type': 'office',
                'living_area': 2000,
                'purchase_price': Decimal('1200000'),
                'current_value': Decimal('1300000'),
            },
            {
                'title': 'München Residential House',
                'property_type': 'house',
                'living_area': 150,
                'purchase_price': Decimal('600000'),
                'current_value': Decimal('650000'),
            }
        ]
        
        for prop_data in sample_properties:
            prop = Property.objects.create(
                tenant=tenant,
                **prop_data
            )
            properties.append(prop)
        
        return properties

    def create_performance_snapshots(self, tenant, months):
        """Create performance snapshots for the last N months"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        # Get properties for calculations
        properties = Property.objects.filter(tenant=tenant)
        total_value = sum(prop.current_value for prop in properties)
        
        current_date = start_date
        snapshot_count = 0
        
        while current_date <= end_date:
            # Create monthly snapshots
            if current_date.day == 1:  # First day of each month
                # Calculate portfolio metrics
                portfolio_value = total_value * (1 + random.uniform(-0.02, 0.03))  # ±2-3% variation
                avg_roi = random.uniform(4.0, 8.0)  # 4-8% ROI
                total_cashflow = random.uniform(3000, 8000)  # Monthly cashflow
                vacancy_rate = random.uniform(0.02, 0.08)  # 2-8% vacancy
                asset_count = properties.count()
                monthly_income = total_cashflow
                annual_return = portfolio_value * (avg_roi / 100)
                portfolio_growth = random.uniform(-1.0, 3.0)  # -1% to +3% growth
                
                PerformanceSnapshot.objects.create(
                    tenant=tenant,
                    snapshot_date=current_date,
                    total_portfolio_value=portfolio_value,
                    average_roi=avg_roi,
                    total_cashflow=total_cashflow,
                    vacancy_rate=vacancy_rate,
                    asset_count=asset_count,
                    monthly_income=monthly_income,
                    annual_return=annual_return,
                    portfolio_growth=portfolio_growth
                )
                snapshot_count += 1
            
            current_date += timedelta(days=1)
        
        self.stdout.write(f'Created {snapshot_count} performance snapshots')

    def create_vacancy_records(self, tenant, properties, months):
        """Create vacancy records for properties"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        record_count = 0
        
        for property in properties:
            current_date = start_date
            while current_date <= end_date:
                # Create monthly vacancy records
                if current_date.day == 1:
                    vacancy_rate = random.uniform(0.0, 0.15)  # 0-15% vacancy
                    total_units = random.randint(1, 10)  # 1-10 units
                    vacant_units = int(total_units * vacancy_rate)
                    vacancy_costs = vacant_units * random.uniform(500, 1500)  # Cost per vacant unit
                    
                    VacancyRecord.objects.create(
                        tenant=tenant,
                        property=property,
                        record_date=current_date,
                        vacancy_rate=vacancy_rate,
                        vacant_units=vacant_units,
                        total_units=total_units,
                        vacancy_costs=vacancy_costs,
                        notes=f'Monthly vacancy tracking for {property.title}'
                    )
                    record_count += 1
                
                current_date += timedelta(days=1)
        
        self.stdout.write(f'Created {record_count} vacancy records')

    def create_cost_records(self, tenant, properties, months):
        """Create cost records for properties"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        cost_categories = ['maintenance', 'utilities', 'management', 'insurance', 'property_tax', 'other']
        vendors = ['ABC Maintenance', 'City Utilities', 'Property Management Co', 'Insurance Corp', 'Tax Office', 'Other Services']
        
        record_count = 0
        
        for property in properties:
            current_date = start_date
            while current_date <= end_date:
                # Create random cost records throughout the month
                if random.random() < 0.1:  # 10% chance per day
                    category = random.choice(cost_categories)
                    amount = random.uniform(100, 2000)
                    vendor = random.choice(vendors)
                    
                    CostRecord.objects.create(
                        tenant=tenant,
                        property=property,
                        record_date=current_date,
                        category=category,
                        amount=amount,
                        description=f'{category.title()} expense for {property.title}',
                        invoice_number=f'INV-{random.randint(1000, 9999)}',
                        vendor=vendor
                    )
                    record_count += 1
                
                current_date += timedelta(days=1)
        
        self.stdout.write(f'Created {record_count} cost records')

    def create_sample_simulations(self, tenant):
        """Create sample ROI simulations"""
        simulations = [
            {
                'name': 'Optimistic Hamburg Investment',
                'scenario': 'optimistic',
                'property_value': Decimal('500000'),
                'down_payment': Decimal('100000'),
                'interest_rate': Decimal('3.5'),
                'loan_term_years': 25,
                'monthly_rent': Decimal('2500'),
                'vacancy_rate': Decimal('5.0'),
                'maintenance_rate': Decimal('1.5'),
                'property_tax_rate': Decimal('0.5'),
                'insurance_rate': Decimal('0.2'),
                'management_fee_rate': Decimal('8.0'),
                'appreciation_rate': Decimal('3.0'),
            },
            {
                'name': 'Realistic Berlin Office',
                'scenario': 'realistic',
                'property_value': Decimal('800000'),
                'down_payment': Decimal('160000'),
                'interest_rate': Decimal('4.0'),
                'loan_term_years': 20,
                'monthly_rent': Decimal('4000'),
                'vacancy_rate': Decimal('7.0'),
                'maintenance_rate': Decimal('2.0'),
                'property_tax_rate': Decimal('0.6'),
                'insurance_rate': Decimal('0.3'),
                'management_fee_rate': Decimal('10.0'),
                'appreciation_rate': Decimal('2.5'),
            },
            {
                'name': 'Pessimistic München House',
                'scenario': 'pessimistic',
                'property_value': Decimal('600000'),
                'down_payment': Decimal('120000'),
                'interest_rate': Decimal('4.5'),
                'loan_term_years': 30,
                'monthly_rent': Decimal('1800'),
                'vacancy_rate': Decimal('10.0'),
                'maintenance_rate': Decimal('2.5'),
                'property_tax_rate': Decimal('0.7'),
                'insurance_rate': Decimal('0.4'),
                'management_fee_rate': Decimal('12.0'),
                'appreciation_rate': Decimal('1.5'),
            }
        ]
        
        for sim_data in simulations:
            # Calculate simulation results (simplified)
            monthly_payment = (sim_data['property_value'] - sim_data['down_payment']) * (sim_data['interest_rate'] / 100 / 12)
            monthly_expenses = sim_data['monthly_rent'] * (sim_data['vacancy_rate'] / 100) + \
                              sim_data['property_value'] * (sim_data['maintenance_rate'] / 100 / 12) + \
                              sim_data['property_value'] * (sim_data['property_tax_rate'] / 100 / 12) + \
                              sim_data['property_value'] * (sim_data['insurance_rate'] / 100 / 12) + \
                              sim_data['monthly_rent'] * (sim_data['management_fee_rate'] / 100)
            
            monthly_cashflow = sim_data['monthly_rent'] - monthly_payment - monthly_expenses
            annual_cashflow = monthly_cashflow * 12
            annual_roi = (annual_cashflow / sim_data['down_payment']) * 100
            
            ROISimulation.objects.create(
                tenant=tenant,
                monthly_cashflow=monthly_cashflow,
                annual_cashflow=annual_cashflow,
                annual_roi=annual_roi,
                total_return_5y=annual_roi * 5,
                total_return_10y=annual_roi * 10,
                break_even_months=120,  # Simplified
                net_present_value=Decimal('50000'),
                internal_rate_return=Decimal('6.5'),
                cash_on_cash_return=annual_roi,
                roi_projection=[annual_roi + i for i in range(30)],
                scenarios=[
                    {'scenario': 'optimistic', 'roi': annual_roi + 2},
                    {'scenario': 'realistic', 'roi': annual_roi},
                    {'scenario': 'pessimistic', 'roi': annual_roi - 2}
                ],
                **sim_data
            )
        
        self.stdout.write('Created 3 sample ROI simulations')

    def create_sample_marketplace_packages(self, tenant, properties):
        """Create sample marketplace packages"""
        packages = [
            {
                'title': 'Hamburg Premium Portfolio',
                'description': 'High-yield apartment complex in prime Hamburg location',
                'location': 'Hamburg',
                'total_value': Decimal('2000000'),
                'expected_roi': Decimal('6.5'),
                'min_investment': Decimal('50000'),
                'max_investors': 20,
                'current_investors': 5,
                'status': 'available',
                'expires_at': timezone.now() + timedelta(days=30),
                'property_count': 3,
                'property_types': ['apartment'],
            },
            {
                'title': 'Berlin Office Investment',
                'description': 'Modern office building in Berlin business district',
                'location': 'Berlin',
                'total_value': Decimal('1500000'),
                'expected_roi': Decimal('5.8'),
                'min_investment': Decimal('75000'),
                'max_investors': 15,
                'current_investors': 8,
                'status': 'available',
                'expires_at': timezone.now() + timedelta(days=45),
                'property_count': 1,
                'property_types': ['office'],
            },
            {
                'title': 'München Residential Mix',
                'description': 'Diversified residential properties in München',
                'location': 'München',
                'total_value': Decimal('1200000'),
                'expected_roi': Decimal('7.2'),
                'min_investment': Decimal('40000'),
                'max_investors': 25,
                'current_investors': 12,
                'status': 'reserved',
                'expires_at': timezone.now() + timedelta(days=15),
                'property_count': 2,
                'property_types': ['house', 'apartment'],
            }
        ]
        
        for pkg_data in packages:
            package = MarketplacePackage.objects.create(
                tenant=tenant,
                **pkg_data
            )
            # Add some properties to the package
            package.properties.set(properties[:pkg_data['property_count']])
        
        self.stdout.write('Created 3 sample marketplace packages')
