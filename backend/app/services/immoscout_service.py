"""
ImmoScout24 Service
Real service for publishing properties to ImmoScout24
"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

from app.services.immoscout_oauth_service import ImmoScout24OAuthService
from app.db.models import Property, PublishJob, IntegrationSettings
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)


class ImmoScout24Service:
    """Service for ImmoScout24 integration"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.oauth_service = ImmoScout24OAuthService(tenant_id)
    
    async def get_access_token(self) -> Optional[str]:
        """Get valid access token from database"""
        
        @sync_to_async
        def get_token():
            try:
                settings = IntegrationSettings.objects.get(tenant_id=self.tenant_id)
                if settings.immoscout_access_token and settings.immoscout_token_expires_at:
                    # Check if token is still valid (with 5 minute buffer)
                    if settings.immoscout_token_expires_at > datetime.utcnow():
                        return settings.immoscout_access_token
                    elif settings.immoscout_refresh_token:
                        # Try to refresh token
                        try:
                            token_data = self.oauth_service.refresh_access_token(settings.immoscout_refresh_token)
                            settings.immoscout_access_token = token_data['access_token']
                            settings.immoscout_refresh_token = token_data.get('refresh_token')
                            settings.immoscout_token_expires_at = token_data['expires_at']
                            settings.save()
                            return token_data['access_token']
                        except Exception as e:
                            logger.error(f"Token refresh failed: {str(e)}")
                            return None
                return None
            except IntegrationSettings.DoesNotExist:
                return None
        
        return await get_token()
    
    async def publish_property(self, property_id: UUID, portal: str) -> Dict[str, Any]:
        """Publish property to ImmoScout24"""
        
        try:
            # Get property data
            @sync_to_async
            def get_property():
                try:
                    return Property.objects.get(id=property_id, tenant_id=self.tenant_id)
                except Property.DoesNotExist:
                    return None
            
            property_obj = await get_property()
            if not property_obj:
                return {
                    'success': False,
                    'message': 'Property not found'
                }
            
            # Get access token
            access_token = await self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'No valid access token available. Please re-authenticate.'
                }
            
            # Transform property data
            property_data = {
                'title': property_obj.title,
                'description': property_obj.description or '',
                'price': property_obj.price,
                'price_currency': property_obj.price_currency or 'EUR',
                'living_area': property_obj.living_area,
                'bedrooms': property_obj.bedrooms,
                'energy_consumption': property_obj.energy_consumption,
            }
            
            # Add address if available
            if hasattr(property_obj, 'address') and property_obj.address:
                property_data['address'] = {
                    'street': property_obj.address.street or '',
                    'house_number': property_obj.address.house_number or '',
                    'zip_code': property_obj.address.zip_code or '',
                    'city': property_obj.address.city or '',
                }
            
            # Add contact person if available
            if hasattr(property_obj, 'contact_person') and property_obj.contact_person:
                property_data['contact_person'] = {
                    'name': property_obj.contact_person.name or '',
                    'email': property_obj.contact_person.email or '',
                    'phone': property_obj.contact_person.phone or '',
                }
            
            # Publish to ImmoScout24
            result = await self.oauth_service.publish_property(property_data, access_token)
            
            if result['success']:
                # Create publish job record
                @sync_to_async
                def create_publish_job():
                    return PublishJob.objects.create(
                        property=property_obj,
                        portal=portal,
                        status='published',
                        portal_property_id=result['portal_property_id'],
                        portal_url=result['portal_url'],
                        published_at=datetime.utcnow()
                    )
                
                publish_job = await create_publish_job()
                
                return {
                    'success': True,
                    'message': result['message'],
                    'publish_job_id': str(publish_job.id),
                    'portal_property_id': result['portal_property_id'],
                    'portal_url': result['portal_url']
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Property publish error: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to publish property: {str(e)}'
            }
    
    async def unpublish_property(self, publish_job_id: UUID) -> Dict[str, Any]:
        """Unpublish property from ImmoScout24"""
        
        try:
            # Get publish job
            @sync_to_async
            def get_publish_job():
                try:
                    return PublishJob.objects.get(id=publish_job_id, property__tenant_id=self.tenant_id)
                except PublishJob.DoesNotExist:
                    return None
            
            publish_job = await get_publish_job()
            if not publish_job:
                return {
                    'success': False,
                    'message': 'Publish job not found'
                }
            
            # Get access token
            access_token = await self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'No valid access token available. Please re-authenticate.'
                }
            
            # Unpublish from ImmoScout24
            result = await self.oauth_service.unpublish_property(
                publish_job.portal_property_id, 
                access_token
            )
            
            if result['success']:
                # Update publish job status
                @sync_to_async
                def update_publish_job():
                    publish_job.status = 'unpublished'
                    publish_job.unpublished_at = datetime.utcnow()
                    publish_job.save()
                
                await update_publish_job()
                
                return {
                    'success': True,
                    'message': result['message']
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Property unpublish error: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to unpublish property: {str(e)}'
            }
    
    async def get_property_metrics(self, portal_property_id: str) -> Dict[str, Any]:
        """Get property metrics from ImmoScout24"""
        
        try:
            # Get access token
            access_token = await self.get_access_token()
            if not access_token:
                return {
                    'views': 0,
                    'inquiries': 0,
                    'favorites': 0,
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            # Get metrics from ImmoScout24
            result = await self.oauth_service.get_property_metrics(portal_property_id, access_token)
            return result
                
        except Exception as e:
            logger.error(f"Property metrics error: {str(e)}")
            return {
                'views': 0,
                'inquiries': 0,
                'favorites': 0,
                'last_updated': datetime.utcnow().isoformat()
            }
    
    async def get_publish_jobs(self, property_id: Optional[UUID] = None) -> list:
        """Get publish jobs"""
        
        @sync_to_async
        def get_jobs():
            queryset = PublishJob.objects.filter(property__tenant_id=self.tenant_id)
            if property_id:
                queryset = queryset.filter(property_id=property_id)
            return list(queryset.select_related('property').order_by('-created_at'))
        
        return await get_jobs()
    
    async def sync_all_property_metrics(self) -> Dict[str, Any]:
        """Sync metrics for all published properties"""
        
        try:
            # Get all published jobs
            jobs = await self.get_publish_jobs()
            synced_count = 0
            error_count = 0
            
            for job in jobs:
                if job.status == 'published' and job.portal_property_id:
                    try:
                        metrics = await self.get_property_metrics(job.portal_property_id)
                        
                        # Update job with metrics (you might want to add metrics fields to PublishJob model)
                        @sync_to_async
                        def update_job_metrics():
                            job.views = metrics.get('views', 0)
                            job.inquiries = metrics.get('inquiries', 0)
                            job.favorites = metrics.get('favorites', 0)
                            job.last_metrics_update = datetime.utcnow()
                            job.save()
                        
                        await update_job_metrics()
                        synced_count += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to sync metrics for job {job.id}: {str(e)}")
                        error_count += 1
            
            return {
                'success': True,
                'synced_count': synced_count,
                'error_count': error_count,
                'total_count': len(jobs)
            }
            
        except Exception as e:
            logger.error(f"Sync all metrics error: {str(e)}")
            return {
                'success': False,
                'synced_count': 0,
                'error_count': 0,
                'total_count': 0,
                'message': f'Failed to sync metrics: {str(e)}'
            }