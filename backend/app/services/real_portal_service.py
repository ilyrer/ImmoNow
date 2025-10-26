"""
Echter Portal-Service mit HTTP-Client-Integration
"""
import json
import secrets
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from asgiref.sync import sync_to_async
import httpx
import logging

from app.db.models import PortalConnection, PortalPublishJob, PortalSyncLog, Property, User
from app.schemas.portals import (
    PortalConnectionResponse, PortalConnectionCreate, PortalConnectionUpdate,
    PortalPublishJobResponse, PortalPublishJobCreate, PortalPublishJobUpdate,
    PortalSyncLogResponse, PortalSyncLogCreate,
    PortalStatusResponse, PropertyPortalStatusResponse,
    OAuthInitiateRequest, OAuthCallbackRequest, OAuthUrlResponse,
    PortalPublishRequest, PortalSyncRequest, PortalUnpublishRequest,
    PortalType, PublishJobStatus, LogLevel
)
from app.core.errors import NotFoundError, ValidationError
from app.core.portal_config import PortalOAuthConfig, PortalFieldMapping, PortalAPIEndpoints

logger = logging.getLogger(__name__)


class RealPortalOAuthService:
    """Echter OAuth-Service für Portal-Verbindungen mit HTTP-Client"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def initiate_oauth_flow(self, request: OAuthInitiateRequest) -> OAuthUrlResponse:
        """OAuth-Flow mit echtem Portal starten"""
        
        @sync_to_async
        def create_oauth_url():
            try:
                config = PortalOAuthConfig.get_config(PortalType(request.portal))
            except ValueError as e:
                raise ValidationError(str(e))
            
            # State für CSRF-Schutz generieren
            state = secrets.token_urlsafe(32)
            
            # OAuth-URL zusammenbauen
            params = {
                'response_type': 'code',
                'client_id': config['client_id'],
                'redirect_uri': request.redirect_uri,
                'scope': config['scope'],
                'state': state,
            }
            
            auth_url = f"{config['auth_url']}?" + "&".join([f"{k}={v}" for k, v in params.items()])
            
            return OAuthUrlResponse(
                portal=request.portal,
                auth_url=auth_url,
                state=state,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
        
        return await create_oauth_url()
    
    async def handle_oauth_callback(self, request: OAuthCallbackRequest, user_id: str) -> PortalConnectionResponse:
        """Echten OAuth-Callback verarbeiten"""
        
        @sync_to_async
        def process_callback():
            try:
                config = PortalOAuthConfig.get_config(PortalType(request.portal))
            except ValueError as e:
                raise ValidationError(str(e))
            
            # Token gegen Code tauschen
            token_data = await self._exchange_code_for_token(request.code, config)
            
            # Portal-Benutzerdaten abrufen
            user_data = await self._get_portal_user_data(token_data['access_token'], request.portal)
            
            # Verbindung in DB speichern
            user = User.objects.get(id=user_id)
            
            connection, created = PortalConnection.objects.update_or_create(
                tenant_id=self.tenant_id,
                portal=request.portal,
                defaults={
                    'access_token': token_data['access_token'],
                    'refresh_token': token_data.get('refresh_token'),
                    'token_expires_at': timezone.now() + timedelta(seconds=token_data.get('expires_in', 3600)),
                    'scope': token_data.get('scope', ''),
                    'portal_user_id': user_data['id'],
                    'portal_username': user_data.get('username'),
                    'portal_email': user_data.get('email'),
                    'is_active': True,
                    'created_by': user,
                }
            )
            
            # Log erstellen
            PortalSyncLog.objects.create(
                portal_connection=connection,
                level=LogLevel.SUCCESS,
                message=f"OAuth-Verbindung zu {request.portal} erfolgreich hergestellt",
                details={'user_data': user_data}
            )
            
            return PortalConnectionResponse.model_validate(connection)
        
        return await process_callback()
    
    async def _exchange_code_for_token(self, code: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Code gegen Access Token tauschen - ECHTE API-Integration"""
        
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': config['client_id'],
            'client_secret': config['client_secret'],
            'redirect_uri': config['redirect_uri'],
        }
        
        try:
            response = await self.http_client.post(
                config['token_url'],
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            token_response = response.json()
            
            return {
                'access_token': token_response['access_token'],
                'refresh_token': token_response.get('refresh_token'),
                'expires_in': token_response.get('expires_in', 3600),
                'scope': token_response.get('scope', ''),
                'token_type': token_response.get('token_type', 'Bearer'),
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Token exchange failed: {e.response.status_code} - {e.response.text}")
            raise ValidationError(f"Token exchange failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Token exchange error: {str(e)}")
            raise ValidationError(f"Token exchange error: {str(e)}")
    
    async def _get_portal_user_data(self, access_token: str, portal: str) -> Dict[str, Any]:
        """Portal-Benutzerdaten abrufen - ECHTE API-Integration"""
        
        try:
            config = PortalOAuthConfig.get_config(PortalType(portal))
            endpoints = PortalAPIEndpoints.get_endpoints(PortalType(portal))
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = await self.http_client.get(
                endpoints['user_info'],
                headers=headers
            )
            response.raise_for_status()
            
            user_data = response.json()
            
            # Portal-spezifische Daten normalisieren
            return self._normalize_user_data(user_data, portal)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"User data fetch failed: {e.response.status_code} - {e.response.text}")
            raise ValidationError(f"User data fetch failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"User data fetch error: {str(e)}")
            raise ValidationError(f"User data fetch error: {str(e)}")
    
    def _normalize_user_data(self, user_data: Dict[str, Any], portal: str) -> Dict[str, Any]:
        """Portal-spezifische Benutzerdaten normalisieren"""
        
        if portal == 'immoscout24':
            return {
                'id': str(user_data.get('id', '')),
                'username': user_data.get('username', ''),
                'email': user_data.get('email', ''),
                'name': user_data.get('name', ''),
                'company': user_data.get('company', ''),
            }
        elif portal == 'immowelt':
            return {
                'id': str(user_data.get('userId', '')),
                'username': user_data.get('username', ''),
                'email': user_data.get('email', ''),
                'name': user_data.get('displayName', ''),
                'company': user_data.get('companyName', ''),
            }
        elif portal == 'kleinanzeigen':
            return {
                'id': str(user_data.get('userId', '')),
                'username': user_data.get('username', ''),
                'email': user_data.get('email', ''),
                'name': user_data.get('displayName', ''),
                'company': user_data.get('companyName', ''),
            }
        
        return user_data


class RealPortalPublishingService:
    """Echter Publishing-Service mit HTTP-Client-Integration"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def publish_to_portal(self, request: PortalPublishRequest, user_id: str) -> PortalPublishJobResponse:
        """Immobilie auf ECHTEM Portal veröffentlichen"""
        
        @sync_to_async
        def publish():
            # Portal-Verbindung prüfen
            try:
                connection = PortalConnection.objects.get(
                    tenant_id=self.tenant_id,
                    portal=request.portal,
                    is_active=True
                )
            except PortalConnection.DoesNotExist:
                raise NotFoundError(f"No active connection to {request.portal}")
            
            # Property laden
            try:
                property_obj = Property.objects.get(
                    id=request.property_id,
                    tenant_id=self.tenant_id
                )
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            # Publish Job erstellen
            job, created = PortalPublishJob.objects.update_or_create(
                property=property_obj,
                portal_connection=connection,
                defaults={
                    'status': PublishJobStatus.PENDING,
                    'portal_data': request.portal_data or {},
                    'retry_count': 0,
                }
            )
            
            # Echte Veröffentlichung starten
            await self._publish_to_real_portal(job, connection, property_obj)
            
            return PortalPublishJobResponse.model_validate(job)
        
        return await publish()
    
    async def _publish_to_real_portal(self, job: PortalPublishJob, connection: PortalConnection, property_obj: Property):
        """Echte Veröffentlichung auf Portal durchführen"""
        
        try:
            # Token prüfen und ggf. erneuern
            access_token = await self._ensure_valid_token(connection)
            
            # Property-Daten zu Portal-Format mappen
            portal_data = PortalFieldMapping.map_property_to_portal(
                self._property_to_dict(property_obj),
                PortalType(connection.portal)
            )
            
            # Portal-spezifische Veröffentlichung
            portal_property_id = await self._call_portal_publish_api(
                connection.portal,
                access_token,
                portal_data
            )
            
            # Job aktualisieren
            job.status = PublishJobStatus.PUBLISHED
            job.portal_property_id = portal_property_id
            job.published_at = timezone.now()
            job.last_sync_at = timezone.now()
            job.save()
            
            # Erfolg loggen
            PortalSyncLog.objects.create(
                portal_connection=connection,
                property=property_obj,
                level=LogLevel.SUCCESS,
                message=f"Immobilie erfolgreich auf {connection.portal} veröffentlicht",
                details={'portal_property_id': portal_property_id}
            )
            
        except Exception as e:
            # Fehler behandeln
            job.status = PublishJobStatus.FAILED
            job.error_message = str(e)
            job.retry_count += 1
            job.save()
            
            # Fehler loggen
            PortalSyncLog.objects.create(
                portal_connection=connection,
                property=property_obj,
                level=LogLevel.ERROR,
                message=f"Veröffentlichung auf {connection.portal} fehlgeschlagen: {str(e)}",
                details={'error': str(e)}
            )
            
            raise
    
    async def _ensure_valid_token(self, connection: PortalConnection) -> str:
        """Token-Gültigkeit prüfen und ggf. erneuern"""
        
        if not connection.is_token_expired():
            return connection.access_token
        
        # Token erneuern
        if not connection.refresh_token:
            raise ValidationError("No refresh token available")
        
        try:
            config = PortalOAuthConfig.get_config(PortalType(connection.portal))
            
            refresh_data = {
                'grant_type': 'refresh_token',
                'refresh_token': connection.refresh_token,
                'client_id': config['client_id'],
                'client_secret': config['client_secret'],
            }
            
            response = await self.http_client.post(
                config['token_url'],
                data=refresh_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            token_response = response.json()
            
            # Token in DB aktualisieren
            connection.access_token = token_response['access_token']
            if 'refresh_token' in token_response:
                connection.refresh_token = token_response['refresh_token']
            connection.token_expires_at = timezone.now() + timedelta(seconds=token_response.get('expires_in', 3600))
            connection.save()
            
            return connection.access_token
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise ValidationError(f"Token refresh failed: {str(e)}")
    
    async def _call_portal_publish_api(self, portal: str, access_token: str, portal_data: Dict[str, Any]) -> str:
        """Portal-spezifische Publish-API aufrufen"""
        
        try:
            endpoints = PortalAPIEndpoints.get_endpoints(PortalType(portal))
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = await self.http_client.post(
                endpoints['publish'],
                json=portal_data,
                headers=headers
            )
            response.raise_for_status()
            
            response_data = response.json()
            
            # Portal-spezifische Response verarbeiten
            if portal == 'immoscout24':
                return str(response_data.get('realEstateId', ''))
            elif portal == 'immowelt':
                return str(response_data.get('advertisementId', ''))
            elif portal == 'kleinanzeigen':
                return str(response_data.get('adId', ''))
            
            return str(response_data.get('id', ''))
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Portal publish API failed: {e.response.status_code} - {e.response.text}")
            raise ValidationError(f"Portal publish API failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Portal publish API error: {str(e)}")
            raise ValidationError(f"Portal publish API error: {str(e)}")
    
    def _property_to_dict(self, property_obj: Property) -> Dict[str, Any]:
        """Property-Objekt zu Dictionary konvertieren"""
        
        return {
            'title': property_obj.title,
            'description': property_obj.description,
            'price': float(property_obj.price) if property_obj.price else None,
            'living_area': float(property_obj.living_area) if property_obj.living_area else None,
            'rooms': float(property_obj.rooms) if property_obj.rooms else None,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': property_obj.bathrooms,
            'year_built': property_obj.year_built,
            'energy_class': property_obj.energy_class,
            'heating_type': property_obj.heating_type,
            'floor_number': property_obj.floor_number,
            'condition_status': property_obj.condition_status,
            'availability_date': property_obj.availability_date.isoformat() if property_obj.availability_date else None,
            'commission': float(property_obj.commission) if property_obj.commission else None,
            'parking_type': property_obj.parking_type,
            'street': property_obj.address.street if hasattr(property_obj, 'address') and property_obj.address else None,
            'house_number': property_obj.address.house_number if hasattr(property_obj, 'address') and property_obj.address else None,
            'zip_code': property_obj.address.zip_code if hasattr(property_obj, 'address') and property_obj.address else None,
            'city': property_obj.address.city if hasattr(property_obj, 'address') and property_obj.address else None,
            'coordinates_lat': property_obj.coordinates_lat,
            'coordinates_lng': property_obj.coordinates_lng,
        }
    
    async def _call_portal_sync_api(self, portal: str, access_token: str, portal_property_id: str) -> Dict[str, Any]:
        """Portal-spezifische Sync-API aufrufen"""
        
        try:
            endpoints = PortalAPIEndpoints.get_endpoints(PortalType(portal))
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = await self.http_client.get(
                f"{endpoints['sync']}/{portal_property_id}",
                headers=headers
            )
            response.raise_for_status()
            
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Portal sync API failed: {e.response.status_code} - {e.response.text}")
            raise ValidationError(f"Portal sync API failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Portal sync API error: {str(e)}")
            raise ValidationError(f"Portal sync API error: {str(e)}")
    
    async def _call_portal_analytics_api(self, portal: str, access_token: str, portal_property_id: str) -> Dict[str, Any]:
        """Portal-spezifische Analytics-API aufrufen"""
        
        try:
            endpoints = PortalAPIEndpoints.get_endpoints(PortalType(portal))
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = await self.http_client.get(
                f"{endpoints['analytics']}/{portal_property_id}",
                headers=headers
            )
            response.raise_for_status()
            
            analytics_data = response.json()
            
            # Portal-spezifische Analytics normalisieren
            return self._normalize_analytics_data(analytics_data, portal)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Portal analytics API failed: {e.response.status_code} - {e.response.text}")
            raise ValidationError(f"Portal analytics API failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Portal analytics API error: {str(e)}")
            raise ValidationError(f"Portal analytics API error: {str(e)}")
    
    def _normalize_analytics_data(self, analytics_data: Dict[str, Any], portal: str) -> Dict[str, Any]:
        """Portal-spezifische Analytics-Daten normalisieren"""
        
        if portal == 'immoscout24':
            return {
                'views': analytics_data.get('views', 0),
                'inquiries': analytics_data.get('inquiries', 0),
                'favorites': analytics_data.get('favorites', 0),
                'visits': analytics_data.get('visits', 0),
                'last_updated': analytics_data.get('lastUpdated'),
            }
        elif portal == 'immowelt':
            return {
                'views': analytics_data.get('viewCount', 0),
                'inquiries': analytics_data.get('inquiryCount', 0),
                'favorites': analytics_data.get('favoriteCount', 0),
                'visits': analytics_data.get('visitCount', 0),
                'last_updated': analytics_data.get('lastUpdated'),
            }
        elif portal == 'kleinanzeigen':
            return {
                'views': analytics_data.get('views', 0),
                'inquiries': analytics_data.get('messages', 0),
                'favorites': analytics_data.get('watchers', 0),
                'visits': analytics_data.get('visits', 0),
                'last_updated': analytics_data.get('lastUpdated'),
            }
        
        return analytics_data
