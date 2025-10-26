"""
Django Management Command für Storage-Reconciliation
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from asgiref.sync import sync_to_async
import logging

from app.db.models import Tenant, TenantUsage, UserProfile, Property, Document
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Reconcile storage usage for all tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Reconcile only specific tenant (UUID)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reconciliation even if recently updated',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        dry_run = options.get('dry_run', False)
        force = options.get('force', False)

        self.stdout.write(
            self.style.SUCCESS('Starting storage reconciliation...')
        )

        try:
            if tenant_id:
                # Reconcile specific tenant
                await self.reconcile_tenant(tenant_id, dry_run, force)
            else:
                # Reconcile all tenants
                await self.reconcile_all_tenants(dry_run, force)

            self.stdout.write(
                self.style.SUCCESS('Storage reconciliation completed successfully')
            )

        except Exception as e:
            logger.error(f"Storage reconciliation failed: {e}")
            raise CommandError(f'Storage reconciliation failed: {e}')

    async def reconcile_all_tenants(self, dry_run: bool, force: bool):
        """Reconcile storage for all tenants"""
        tenants = await sync_to_async(list)(Tenant.objects.all())
        
        self.stdout.write(f"Found {len(tenants)} tenants to reconcile")
        
        for tenant in tenants:
            await self.reconcile_tenant(str(tenant.id), dry_run, force)

    async def reconcile_tenant(self, tenant_id: str, dry_run: bool, force: bool):
        """Reconcile storage for a specific tenant"""
        try:
            # Get or create TenantUsage record
            tenant_usage, created = await sync_to_async(TenantUsage.objects.get_or_create)(
                tenant_id=tenant_id,
                defaults={
                    'active_users_count': 0,
                    'storage_bytes_used': 0,
                    'properties_count': 0,
                    'documents_count': 0,
                }
            )

            # Check if recently reconciled (unless forced)
            if not force and tenant_usage.last_reconciled_at:
                time_diff = timezone.now() - tenant_usage.last_reconciled_at
                if time_diff.total_seconds() < 3600:  # Less than 1 hour
                    self.stdout.write(
                        f"Skipping tenant {tenant_id} - reconciled {time_diff.total_seconds()/60:.1f} minutes ago"
                    )
                    return

            self.stdout.write(f"Reconciling tenant {tenant_id}...")

            # Calculate current usage
            usage_data = await self.calculate_tenant_usage(tenant_id)

            if dry_run:
                self.stdout.write(
                    f"DRY RUN - Would update tenant {tenant_id}:"
                )
                self.stdout.write(f"  Users: {usage_data['users']}")
                self.stdout.write(f"  Properties: {usage_data['properties']}")
                self.stdout.write(f"  Documents: {usage_data['documents']}")
                self.stdout.write(f"  Storage: {usage_data['storage_bytes']} bytes ({usage_data['storage_bytes']/(1024**3):.2f} GB)")
            else:
                # Update TenantUsage record
                await sync_to_async(tenant_usage.__setattr__)('active_users_count', usage_data['users'])
                await sync_to_async(tenant_usage.__setattr__)('properties_count', usage_data['properties'])
                await sync_to_async(tenant_usage.__setattr__)('documents_count', usage_data['documents'])
                await sync_to_async(tenant_usage.__setattr__)('storage_bytes_used', usage_data['storage_bytes'])
                await sync_to_async(tenant_usage.__setattr__)('last_reconciled_at', timezone.now())
                await sync_to_async(tenant_usage.save)()

                self.stdout.write(
                    f"Updated tenant {tenant_id}: "
                    f"{usage_data['users']} users, "
                    f"{usage_data['properties']} properties, "
                    f"{usage_data['documents']} documents, "
                    f"{usage_data['storage_bytes']/(1024**3):.2f} GB storage"
                )

        except Exception as e:
            logger.error(f"Failed to reconcile tenant {tenant_id}: {e}")
            self.stdout.write(
                self.style.ERROR(f"Failed to reconcile tenant {tenant_id}: {e}")
            )

    async def calculate_tenant_usage(self, tenant_id: str) -> dict:
        """Calculate current usage for a tenant"""
        # Count active users
        users_count = await sync_to_async(UserProfile.objects.filter(
            tenant_id=tenant_id,
            is_active=True
        ).count)()

        # Count properties
        properties_count = await sync_to_async(Property.objects.filter(
            tenant_id=tenant_id
        ).count)()

        # Count documents
        documents_count = await sync_to_async(Document.objects.filter(
            tenant_id=tenant_id
        ).count)()

        # Calculate storage size from S3/MinIO
        storage_bytes = storage_service.get_tenant_storage_size(tenant_id)

        return {
            'users': users_count,
            'properties': properties_count,
            'documents': documents_count,
            'storage_bytes': storage_bytes,
        }