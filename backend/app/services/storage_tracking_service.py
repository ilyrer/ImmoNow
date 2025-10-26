"""
Storage Tracking Service
Handles automatic storage usage tracking and quota enforcement
"""
import os
from pathlib import Path
from typing import Dict, Any, Optional
from asgiref.sync import sync_to_async
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.utils import timezone

from app.db.models import PropertyImage, PropertyDocument, Document, Tenant
from app.core.errors import ValidationError


class StorageTrackingService:
    """Service for tracking storage usage per tenant"""
    
    @staticmethod
    async def get_tenant_storage_usage(tenant_id: str) -> Dict[str, Any]:
        """
        Get current storage usage for a tenant
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            Dict with storage usage information
        """
        try:
            # Get tenant
            tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
            
            # Calculate storage from database records
            property_images_size = await sync_to_async(
                PropertyImage.objects.filter(
                    property__tenant_id=tenant_id
                ).aggregate(
                    total_size=models.Sum('size')
                )
            )()
            
            property_documents_size = await sync_to_async(
                PropertyDocument.objects.filter(
                    property__tenant_id=tenant_id
                ).aggregate(
                    total_size=models.Sum('size')
                )
            )()
            
            documents_size = await sync_to_async(
                Document.objects.filter(
                    tenant_id=tenant_id
                ).aggregate(
                    total_size=models.Sum('size')
                )
            )()
            
            # Calculate total
            total_bytes = (
                (property_images_size['total_size'] or 0) +
                (property_documents_size['total_size'] or 0) +
                (documents_size['total_size'] or 0)
            )
            
            # Convert to MB and GB
            total_mb = total_bytes / (1024 * 1024)
            total_gb = total_mb / 1024
            
            return {
                'tenant_id': tenant_id,
                'total_bytes': total_bytes,
                'total_mb': round(total_mb, 2),
                'total_gb': round(total_gb, 2),
                'limit_gb': tenant.storage_limit_gb,
                'usage_percentage': round((total_gb / tenant.storage_limit_gb) * 100, 2) if tenant.storage_limit_gb > 0 else 0,
                'breakdown': {
                    'property_images_mb': round((property_images_size['total_size'] or 0) / (1024 * 1024), 2),
                    'property_documents_mb': round((property_documents_size['total_size'] or 0) / (1024 * 1024), 2),
                    'documents_mb': round((documents_size['total_size'] or 0) / (1024 * 1024), 2)
                }
            }
            
        except Tenant.DoesNotExist:
            raise ValidationError(f"Tenant {tenant_id} not found")
        except Exception as e:
            raise ValidationError(f"Failed to calculate storage usage: {str(e)}")
    
    @staticmethod
    async def reconcile_storage_usage(tenant_id: str) -> Dict[str, Any]:
        """
        Reconcile storage usage by scanning actual files
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            Dict with reconciliation results
        """
        try:
            # Get tenant
            tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
            
            # Calculate from database
            db_usage = await StorageTrackingService.get_tenant_storage_usage(tenant_id)
            
            # Calculate from filesystem
            fs_usage = await StorageTrackingService._calculate_filesystem_usage(tenant_id)
            
            # Compare
            discrepancy = abs(db_usage['total_bytes'] - fs_usage['total_bytes'])
            discrepancy_mb = discrepancy / (1024 * 1024)
            
            return {
                'tenant_id': tenant_id,
                'database_bytes': db_usage['total_bytes'],
                'filesystem_bytes': fs_usage['total_bytes'],
                'discrepancy_bytes': discrepancy,
                'discrepancy_mb': round(discrepancy_mb, 2),
                'is_consistent': discrepancy < (1024 * 1024),  # Less than 1MB difference
                'filesystem_breakdown': fs_usage['breakdown']
            }
            
        except Exception as e:
            raise ValidationError(f"Failed to reconcile storage: {str(e)}")
    
    @staticmethod
    async def _calculate_filesystem_usage(tenant_id: str) -> Dict[str, Any]:
        """Calculate storage usage from filesystem"""
        try:
            media_root = Path(settings.MEDIA_ROOT)
            tenant_path = media_root / tenant_id
            
            if not tenant_path.exists():
                return {
                    'total_bytes': 0,
                    'breakdown': {
                        'properties': 0,
                        'documents': 0,
                        'messages': 0,
                        'other': 0
                    }
                }
            
            total_bytes = 0
            breakdown = {
                'properties': 0,
                'documents': 0,
                'messages': 0,
                'other': 0
            }
            
            # Scan all files in tenant directory
            for file_path in tenant_path.rglob('*'):
                if file_path.is_file():
                    file_size = file_path.stat().st_size
                    total_bytes += file_size
                    
                    # Categorize by path
                    relative_path = file_path.relative_to(tenant_path)
                    if 'properties' in str(relative_path):
                        breakdown['properties'] += file_size
                    elif 'documents' in str(relative_path):
                        breakdown['documents'] += file_size
                    elif 'messages' in str(relative_path):
                        breakdown['messages'] += file_size
                    else:
                        breakdown['other'] += file_size
            
            # Convert to MB
            for key in breakdown:
                breakdown[key] = round(breakdown[key] / (1024 * 1024), 2)
            
            return {
                'total_bytes': total_bytes,
                'breakdown': breakdown
            }
            
        except Exception as e:
            raise ValidationError(f"Failed to calculate filesystem usage: {str(e)}")
    
    @staticmethod
    async def check_storage_limit(tenant_id: str, additional_bytes: int) -> None:
        """
        Check if adding additional bytes would exceed storage limit
        
        Args:
            tenant_id: Tenant ID
            additional_bytes: Additional bytes to add
            
        Raises:
            ValidationError: If limit would be exceeded
        """
        try:
            usage = await StorageTrackingService.get_tenant_storage_usage(tenant_id)
            tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
            
            # Calculate new total
            new_total_bytes = usage['total_bytes'] + additional_bytes
            new_total_gb = new_total_bytes / (1024 * 1024 * 1024)
            
            # Check limit
            if tenant.storage_limit_gb > 0 and new_total_gb > tenant.storage_limit_gb:
                raise ValidationError(
                    f"Storage limit exceeded. Current: {usage['total_gb']:.2f}GB, "
                    f"Limit: {tenant.storage_limit_gb}GB, "
                    f"Additional: {additional_bytes / (1024 * 1024 * 1024):.2f}GB"
                )
                
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to check storage limit: {str(e)}")


# Signal handlers for automatic storage tracking
@receiver(post_save, sender=PropertyImage)
def update_storage_on_property_image_save(sender, instance, created, **kwargs):
    """Update storage usage when property image is saved"""
    if created and instance.size:
        try:
            tenant = instance.property.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = (tenant.storage_bytes_used or 0) + instance.size
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on property image save: {e}")


@receiver(post_delete, sender=PropertyImage)
def update_storage_on_property_image_delete(sender, instance, **kwargs):
    """Update storage usage when property image is deleted"""
    if instance.size:
        try:
            tenant = instance.property.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = max(0, (tenant.storage_bytes_used or 0) - instance.size)
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on property image delete: {e}")


@receiver(post_save, sender=PropertyDocument)
def update_storage_on_property_document_save(sender, instance, created, **kwargs):
    """Update storage usage when property document is saved"""
    if created and instance.size:
        try:
            tenant = instance.property.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = (tenant.storage_bytes_used or 0) + instance.size
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on property document save: {e}")


@receiver(post_delete, sender=PropertyDocument)
def update_storage_on_property_document_delete(sender, instance, **kwargs):
    """Update storage usage when property document is deleted"""
    if instance.size:
        try:
            tenant = instance.property.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = max(0, (tenant.storage_bytes_used or 0) - instance.size)
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on property document delete: {e}")


@receiver(post_save, sender=Document)
def update_storage_on_document_save(sender, instance, created, **kwargs):
    """Update storage usage when document is saved"""
    if created and instance.size:
        try:
            tenant = instance.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = (tenant.storage_bytes_used or 0) + instance.size
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on document save: {e}")


@receiver(post_delete, sender=Document)
def update_storage_on_document_delete(sender, instance, **kwargs):
    """Update storage usage when document is deleted"""
    if instance.size:
        try:
            tenant = instance.tenant
            # Update tenant storage usage (if field exists)
            if hasattr(tenant, 'storage_bytes_used'):
                tenant.storage_bytes_used = max(0, (tenant.storage_bytes_used or 0) - instance.size)
                tenant.save(update_fields=['storage_bytes_used'])
        except Exception as e:
            print(f"Error updating storage on document delete: {e}")
