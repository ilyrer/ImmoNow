"""
Tenant Management Service
Handles all tenant-related business logic
"""
from typing import Optional
from django.db import models
from django.core.files.uploadedfile import UploadedFile
from asgiref.sync import sync_to_async
import uuid
import os

from app.db.models import Tenant
from app.schemas.tenant import TenantDetailResponse, TenantUpdateRequest
from app.core.errors import NotFoundError, ValidationError


class TenantService:
    """Service for tenant management operations"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_tenant_info(self) -> TenantDetailResponse:
        """Get detailed tenant information"""
        
        @sync_to_async
        def get_tenant_sync():
            try:
                return Tenant.objects.get(id=self.tenant_id)
            except Tenant.DoesNotExist:
                raise NotFoundError("Tenant not found")
        
        tenant = await get_tenant_sync()
        return self._build_tenant_response(tenant)
    
    async def update_tenant(self, update_data: TenantUpdateRequest) -> TenantDetailResponse:
        """Update tenant information"""
        
        @sync_to_async
        def update_tenant_sync():
            try:
                tenant = Tenant.objects.get(id=self.tenant_id)
                
                # Update only provided fields
                update_dict = update_data.model_dump(exclude_unset=True)
                
                for field, value in update_dict.items():
                    if hasattr(tenant, field):
                        setattr(tenant, field, value)
                
                tenant.save()
                return tenant
                
            except Tenant.DoesNotExist:
                raise NotFoundError("Tenant not found")
        
        tenant = await update_tenant_sync()
        return self._build_tenant_response(tenant)
    
    async def update_logo_url(self, logo_url: str) -> TenantDetailResponse:
        """Update tenant logo URL"""
        
        @sync_to_async
        def update_logo_sync():
            try:
                tenant = Tenant.objects.get(id=self.tenant_id)
                tenant.logo_url = logo_url
                tenant.save()
                return tenant
            except Tenant.DoesNotExist:
                raise NotFoundError("Tenant not found")
        
        tenant = await update_logo_sync()
        return self._build_tenant_response(tenant)
    
    async def get_branding_info(self) -> dict:
        """Get tenant branding information (logo, colors)"""
        
        @sync_to_async
        def get_branding_sync():
            try:
                tenant = Tenant.objects.get(id=self.tenant_id)
                return {
                    "logo_url": tenant.logo_url,
                    "primary_color": getattr(tenant, 'primary_color', '#3B82F6'),
                    "secondary_color": getattr(tenant, 'secondary_color', '#1E40AF'),
                    "name": tenant.name
                }
            except Tenant.DoesNotExist:
                raise NotFoundError("Tenant not found")
        
        return await get_branding_sync()
    
    async def check_subscription_limits(self) -> dict:
        """Check current usage against subscription limits"""
        
        @sync_to_async
        def check_limits_sync():
            try:
                tenant = Tenant.objects.get(id=self.tenant_id)
                
                # Import here to avoid circular imports
                from app.db.models import UserProfile, Property
                
                # Count current usage
                user_count = UserProfile.objects.filter(tenant_id=self.tenant_id, is_active=True).count()
                property_count = Property.objects.filter(tenant_id=self.tenant_id).count()
                
                return {
                    "users": {
                        "current": user_count,
                        "limit": tenant.max_users,
                        "available": max(0, tenant.max_users - user_count),
                        "percentage": (user_count / tenant.max_users * 100) if tenant.max_users > 0 else 0
                    },
                    "properties": {
                        "current": property_count,
                        "limit": tenant.max_properties,
                        "available": max(0, tenant.max_properties - property_count),
                        "percentage": (property_count / tenant.max_properties * 100) if tenant.max_properties > 0 else 0
                    },
                    "storage": {
                        "current_gb": 0,  # TODO: Calculate actual storage usage
                        "limit_gb": tenant.storage_limit_gb,
                        "available_gb": tenant.storage_limit_gb,
                        "percentage": 0
                    },
                    "plan": tenant.plan,
                    "subscription_active": tenant.is_subscription_active()
                }
            except Tenant.DoesNotExist:
                raise NotFoundError("Tenant not found")
        
        return await check_limits_sync()
    
    def _build_tenant_response(self, tenant: Tenant) -> TenantDetailResponse:
        """Build TenantDetailResponse from Tenant model"""
        
        return TenantDetailResponse(
            id=str(tenant.id),
            name=tenant.name,
            slug=tenant.slug,
            email=tenant.email,
            phone=tenant.phone,
            logo_url=tenant.logo_url,
            primary_color=getattr(tenant, 'primary_color', '#3B82F6'),
            secondary_color=getattr(tenant, 'secondary_color', '#1E40AF'),
            address=tenant.address,
            city=tenant.city,
            postal_code=tenant.postal_code,
            country=tenant.country,
            tax_id=getattr(tenant, 'tax_id', None),
            registration_number=getattr(tenant, 'registration_number', None),
            website=getattr(tenant, 'website', None),
            currency=getattr(tenant, 'currency', 'EUR'),
            timezone=getattr(tenant, 'timezone', 'Europe/Berlin'),
            language=getattr(tenant, 'language', 'de'),
            plan=tenant.plan,
            billing_cycle=tenant.billing_cycle,
            subscription_status=tenant.subscription_status,
            max_users=tenant.max_users,
            max_properties=tenant.max_properties,
            storage_limit_gb=tenant.storage_limit_gb,
            is_active=tenant.is_active,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at,
            subscription_start_date=tenant.subscription_start_date,
            subscription_end_date=tenant.subscription_end_date
        )


class LogoUploadService:
    """Service for handling logo uploads"""
    
    @staticmethod
    async def save_logo(tenant_id: str, file: UploadedFile) -> str:
        """
        Save uploaded logo file and return URL
        For now, returns a placeholder URL
        In production, this should upload to S3/CloudFlare/CDN
        """
        
        # Validate file type
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp']
        file_ext = os.path.splitext(file.name)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise ValidationError(
                f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if file.size > max_size:
            raise ValidationError(f"File size exceeds maximum of 5MB")
        
        # Generate unique filename
        unique_filename = f"{tenant_id}-{uuid.uuid4()}{file_ext}"
        
        # TODO: Upload to actual storage (S3, CloudFlare R2, etc.)
        # For now, return a placeholder URL
        # In production, replace with actual CDN URL
        logo_url = f"/media/logos/{unique_filename}"
        
        @sync_to_async
        def save_file_sync():
            # Create media directory if it doesn't exist
            media_dir = os.path.join('media', 'logos')
            os.makedirs(media_dir, exist_ok=True)
            
            # Save file
            file_path = os.path.join(media_dir, unique_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            return logo_url
        
        return await save_file_sync()

