"""
ImmoScout24 Service

Handles OAuth2 authentication and API integration with ImmoScout24
for property publishing and metrics retrieval.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
from cryptography.fernet import Fernet
import base64
import os

from properties.models import IntegrationSettings, Property, PublishJob
from accounts.models import User
from app.core.errors import NotFoundError, UnauthorizedError, ExternalServiceError

logger = logging.getLogger(__name__)

class ImmoScout24Service:
    """Service for ImmoScout24 API integration"""
    
    BASE_URL = "https://rest.immobilienscout24.de/restapi/api"
    OAUTH_URL = "https://rest.immobilienscout24.de/restapi/api/oauth/token"
    
    def __init__(self):
        self.encryption_service = self._get_encryption_service()
    
    def _get_encryption_service(self):
        """Get encryption service for API keys"""
        key = os.getenv('ENCRYPTION_KEY')
        if not key:
            key = Fernet.generate_key()
            logger.warning("Generated new encryption key. Please set ENCRYPTION_KEY environment variable!")
        
        if isinstance(key, str):
            key = key.encode()
        
        return Fernet(key)
    
    def _encrypt(self, data: str) -> str:
        """Encrypt sensitive data"""
        if not data:
            return ""
        encrypted_data = self.encryption_service.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def _decrypt(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if not encrypted_data:
            return ""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.encryption_service.decrypt(encrypted_bytes)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            return ""
    
    async def get_integration_settings(self, tenant_id: str) -> Optional[IntegrationSettings]:
        """Get integration settings for tenant"""
        try:
            settings = await IntegrationSettings.objects.aget(tenant_id=tenant_id)
            return settings
        except IntegrationSettings.DoesNotExist:
            return None
    
    async def get_access_token(self, tenant_id: str) -> Optional[str]:
        """Get valid access token for ImmoScout24 API"""
        settings = await self.get_integration_settings(tenant_id)
        if not settings:
            raise NotFoundError("Integration settings not found")
        
        client_id = self._decrypt(settings.immoscout_client_id)
        client_secret = self._decrypt(settings.immoscout_client_secret)
        
        if not client_id or not client_secret:
            raise UnauthorizedError("ImmoScout24 credentials not configured")
        
        # Check if token is still valid
        if (settings.immoscout_access_token and 
            settings.immoscout_token_expires_at and 
            settings.immoscout_token_expires_at > datetime.now()):
            return self._decrypt(settings.immoscout_access_token)
        
        # Refresh token if needed
        if settings.immoscout_refresh_token:
            return await self._refresh_access_token(settings, client_id, client_secret)
        
        # Get new token
        return await self._get_new_access_token(settings, client_id, client_secret)
    
    async def _get_new_access_token(self, settings: IntegrationSettings, client_id: str, client_secret: str) -> str:
        """Get new access token using client credentials"""
        async with httpx.AsyncClient() as client:
            data = {
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret
            }
            
            response = await client.post(self.OAUTH_URL, data=data)
            
            if response.status_code != 200:
                raise ExternalServiceError(f"Failed to get access token: {response.text}")
            
            token_data = response.json()
            access_token = token_data['access_token']
            expires_in = token_data.get('expires_in', 3600)
            
            # Save token to database
            settings.immoscout_access_token = self._encrypt(access_token)
            settings.immoscout_token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)  # 1 minute buffer
            await settings.asave(update_fields=['immoscout_access_token', 'immoscout_token_expires_at'])
            
            return access_token
    
    async def _refresh_access_token(self, settings: IntegrationSettings, client_id: str, client_secret: str) -> str:
        """Refresh access token using refresh token"""
        refresh_token = self._decrypt(settings.immoscout_refresh_token)
        
        async with httpx.AsyncClient() as client:
            data = {
                'grant_type': 'refresh_token',
                'client_id': client_id,
                'client_secret': client_secret,
                'refresh_token': refresh_token
            }
            
            response = await client.post(self.OAUTH_URL, data=data)
            
            if response.status_code != 200:
                # If refresh fails, get new token
                return await self._get_new_access_token(settings, client_id, client_secret)
            
            token_data = response.json()
            access_token = token_data['access_token']
            expires_in = token_data.get('expires_in', 3600)
            
            # Update refresh token if provided
            if 'refresh_token' in token_data:
                settings.immoscout_refresh_token = self._encrypt(token_data['refresh_token'])
            
            # Save token to database
            settings.immoscout_access_token = self._encrypt(access_token)
            settings.immoscout_token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)
            await settings.asave(update_fields=['immoscout_access_token', 'immoscout_refresh_token', 'immoscout_token_expires_at'])
            
            return access_token
    
    async def publish_property(self, property_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Publish property to ImmoScout24"""
        try:
            # Get property data
            property_obj = await Property.objects.select_related('address').aget(id=property_id)
            
            # Get access token
            access_token = await self.get_access_token(tenant_id)
            
            # Convert property to ImmoScout24 format
            property_data = await self._convert_property_to_immoscout_format(property_obj)
            
            # Create publish job
            publish_job = await PublishJob.objects.acreate(
                property=property_obj,
                portal='immoscout24',
                status='publishing',
                created_by_id=user_id
            )
            
            try:
                # Publish to ImmoScout24
                portal_property_id = await self._publish_to_immoscout24(property_data, access_token)
                
                # Update publish job
                publish_job.status = 'published'
                publish_job.portal_property_id = portal_property_id
                publish_job.portal_url = f"https://www.immobilienscout24.de/expose/{portal_property_id}"
                publish_job.published_at = datetime.now()
                await publish_job.asave()
                
                return {
                    'success': True,
                    'portal_property_id': portal_property_id,
                    'portal_url': publish_job.portal_url,
                    'publish_job_id': str(publish_job.id)
                }
                
            except Exception as e:
                # Update publish job with error
                publish_job.status = 'failed'
                publish_job.error_message = str(e)
                await publish_job.asave()
                
                raise ExternalServiceError(f"Failed to publish property: {str(e)}")
                
        except Property.DoesNotExist:
            raise NotFoundError("Property not found")
        except Exception as e:
            logger.error(f"Error publishing property {property_id}: {e}")
            raise
    
    async def _convert_property_to_immoscout_format(self, property_obj: Property) -> Dict[str, Any]:
        """Convert property to ImmoScout24 API format"""
        # This is a simplified conversion - in reality, you'd need to map
        # all property fields according to ImmoScout24's API specification
        
        property_data = {
            "realestate": {
                "title": property_obj.title,
                "description": property_obj.description or "",
                "price": {
                    "value": property_obj.price,
                    "currency": "EUR"
                },
                "address": {
                    "street": property_obj.address.street,
                    "houseNumber": property_obj.address.house_number,
                    "postcode": property_obj.address.zip_code,
                    "city": property_obj.address.city,
                    "country": property_obj.address.country
                },
                "livingSpace": property_obj.living_area or 0,
                "numberOfRooms": property_obj.rooms or 0,
                "constructionYear": property_obj.year_built,
                "energyEfficiencyClass": property_obj.energy_class,
                "heatingType": property_obj.heating_type,
                "objectType": self._map_property_type(property_obj.property_type),
                "offerType": self._map_offer_type(property_obj.status)
            }
        }
        
        return property_data
    
    def _map_property_type(self, property_type: str) -> str:
        """Map internal property type to ImmoScout24 format"""
        mapping = {
            'apartment': 'APARTMENT_BUILDING',
            'house': 'SINGLE_FAMILY_HOUSE',
            'commercial': 'OFFICE_BUILDING'
        }
        return mapping.get(property_type, 'APARTMENT_BUILDING')
    
    def _map_offer_type(self, status: str) -> str:
        """Map internal status to ImmoScout24 offer type"""
        mapping = {
            'available': 'PURCHASE',
            'sold': 'PURCHASE',
            'reserved': 'PURCHASE',
            'akquise': 'PURCHASE',
            'vorbereitung': 'PURCHASE'
        }
        return mapping.get(status, 'PURCHASE')
    
    async def _publish_to_immoscout24(self, property_data: Dict[str, Any], access_token: str) -> str:
        """Publish property data to ImmoScout24 API"""
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = await client.post(
                f"{self.BASE_URL}/offer/v1.0/user/me/realestate",
                json=property_data,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                raise ExternalServiceError(f"ImmoScout24 API error: {response.status_code} - {response.text}")
            
            result = response.json()
            return result.get('id') or result.get('realestateId')
    
    async def unpublish_property(self, publish_job_id: str, tenant_id: str) -> Dict[str, Any]:
        """Unpublish property from ImmoScout24"""
        try:
            publish_job = await PublishJob.objects.aget(id=publish_job_id)
            
            if not publish_job.portal_property_id:
                raise NotFoundError("Property not published on portal")
            
            # Get access token
            access_token = await self.get_access_token(tenant_id)
            
            # Unpublish from ImmoScout24
            await self._unpublish_from_immoscout24(publish_job.portal_property_id, access_token)
            
            # Update publish job
            publish_job.status = 'unpublished'
            publish_job.unpublished_at = datetime.now()
            await publish_job.asave()
            
            return {
                'success': True,
                'message': 'Property unpublished successfully'
            }
            
        except PublishJob.DoesNotExist:
            raise NotFoundError("Publish job not found")
        except Exception as e:
            logger.error(f"Error unpublishing property {publish_job_id}: {e}")
            raise
    
    async def _unpublish_from_immoscout24(self, portal_property_id: str, access_token: str):
        """Unpublish property from ImmoScout24 API"""
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = await client.delete(
                f"{self.BASE_URL}/offer/v1.0/user/me/realestate/{portal_property_id}",
                headers=headers
            )
            
            if response.status_code not in [200, 204]:
                raise ExternalServiceError(f"ImmoScout24 API error: {response.status_code} - {response.text}")
    
    async def get_property_metrics(self, portal_property_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get property metrics from ImmoScout24"""
        try:
            access_token = await self.get_access_token(tenant_id)
            
            async with httpx.AsyncClient() as client:
                headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
                
                # Get property statistics
                response = await client.get(
                    f"{self.BASE_URL}/offer/v1.0/user/me/realestate/{portal_property_id}/statistics",
                    headers=headers
                )
                
                if response.status_code != 200:
                    raise ExternalServiceError(f"ImmoScout24 API error: {response.status_code} - {response.text}")
                
                stats = response.json()
                
                return {
                    'views': stats.get('viewCount', 0),
                    'inquiries': stats.get('inquiryCount', 0),
                    'favorites': stats.get('favoriteCount', 0),
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting metrics for property {portal_property_id}: {e}")
            raise
    
    async def sync_all_property_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """Sync metrics for all published properties"""
        try:
            published_jobs = await PublishJob.objects.filter(
                portal='immoscout24',
                status='published',
                portal_property_id__isnull=False
            ).select_related('property').aiterator()
            
            synced_count = 0
            error_count = 0
            
            async for job in published_jobs:
                try:
                    metrics = await self.get_property_metrics(job.portal_property_id, tenant_id)
                    
                    # Update property metrics (you might want to store this in a separate metrics table)
                    # For now, we'll just log the metrics
                    logger.info(f"Metrics for property {job.property.id}: {metrics}")
                    
                    synced_count += 1
                    
                except Exception as e:
                    logger.error(f"Error syncing metrics for property {job.property.id}: {e}")
                    error_count += 1
            
            return {
                'success': True,
                'synced_count': synced_count,
                'error_count': error_count,
                'total_count': synced_count + error_count
            }
            
        except Exception as e:
            logger.error(f"Error syncing all property metrics: {e}")
            raise ExternalServiceError(f"Failed to sync metrics: {str(e)}")
