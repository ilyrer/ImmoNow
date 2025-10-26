"""
Management Command: Create Employee objects for existing Users
Erstellt Employee-Objekte für alle bestehenden User
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from app.db.models import User, Employee, Tenant


class Command(BaseCommand):
    help = 'Create Employee objects for all existing Users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Tenant ID to create employees for (optional)',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        
        if tenant_id:
            # Erstelle Employee für spezifischen Tenant
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                users = User.objects.filter(tenant_memberships__tenant=tenant)
                self.stdout.write(f'Creating employees for tenant: {tenant.name}')
            except Tenant.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Tenant with ID {tenant_id} not found'))
                return
        else:
            # Erstelle Employee für alle User mit Tenants
            users = User.objects.filter(tenant_memberships__isnull=False).distinct()
            tenant = None  # Kein spezifischer Tenant
            self.stdout.write('Creating employees for all users with tenants')

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for user in users:
                # Hole den ersten Tenant für den User
                user_tenant = user.tenant_memberships.first().tenant if user.tenant_memberships.exists() else None
                
                employee, created = Employee.objects.get_or_create(
                    user=user,
                    defaults={
                        'employee_number': f'EMP{str(user.id)[:8].upper()}',
                        'department': 'General',
                        'position': 'Employee',
                        'employment_type': 'full-time',
                        'start_date': user.created_at.date(),
                        'work_email': user.email,
                        'is_active': user.is_active,
                        'is_on_leave': False,
                        'notes': 'Auto-created from existing user',
                        'created_by': user,  # Set created_by to the user itself
                        'tenant': tenant or user_tenant,  # Set tenant
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(f'Created employee for user: {user.email}')
                else:
                    updated_count += 1
                    self.stdout.write(f'Employee already exists for user: {user.email}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count + updated_count} users. '
                f'Created: {created_count}, Already existed: {updated_count}'
            )
        )
