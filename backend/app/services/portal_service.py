"""
Portal Service für OAuth-Integration mit Immobilienportalen
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
    Immoscout24Mapping, ImmoweltMapping, KleinanzeigenMapping,
    PortalType, PublishJobStatus, LogLevel
)
from app.core.errors import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class PortalOAuthService:
    """OAuth-Service für Portal-Verbindungen"""
    
    # Portal-spezifische OAuth-Konfigurationen
    OAUTH_CONFIGS = {
        PortalType.IMMOSCOUT24: {
            'auth_url': 'https://restapi.immobilienscout24.de/oauth/authorize',
            'token_url': 'https://restapi.immobilienscout24.de/oauth/token',
            'client_id': 'immoscout24_client_id',  # Aus Umgebungsvariablen
            'client_secret': 'immoscout24_client_secret',  # Aus Umgebungsvariablen
            'scope': 'read write',
            'redirect_uri': 'https://your-app.com/oauth/callback/immoscout24',
        },
        PortalType.IMMOWELT: {
            'auth_url': 'https://api.immowelt.de/oauth/authorize',
            'token_url': 'https://api.immowelt.de/oauth/token',
            'client_id': 'immowelt_client_id',
            'client_secret': 'immowelt_client_secret',
            'scope': 'read write',
            'redirect_uri': 'https://your-app.com/oauth/callback/immowelt',
        },
        PortalType.KLEINANZEIGEN: {
            'auth_url': 'https://api.ebay-kleinanzeigen.de/oauth/authorize',
            'token_url': 'https://api.ebay-kleinanzeigen.de/oauth/token',
            'client_id': 'kleinanzeigen_client_id',
            'client_secret': 'kleinanzeigen_client_secret',
            'scope': 'read write',
            'redirect_uri': 'https://your-app.com/oauth/callback/kleinanzeigen',
        },
    }
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def initiate_oauth_flow(self, request: OAuthInitiateRequest) -> OAuthUrlResponse:
        """OAuth-Flow starten"""
        
        @sync_to_async
        def create_oauth_url():
            config = self.OAUTH_CONFIGS.get(request.portal)
            if not config:
                raise ValidationError(f"Unsupported portal: {request.portal}")
            
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
                expires_at=timezone.now() + timedelta(minutes=10)  # State läuft nach 10 Min ab
            )
        
        return await create_oauth_url()
    
    async def handle_oauth_callback(self, request: OAuthCallbackRequest, user_id: str) -> PortalConnectionResponse:
        """OAuth-Callback verarbeiten und Token speichern"""
        
        @sync_to_async
        def process_callback():
            config = self.OAUTH_CONFIGS.get(request.portal)
            if not config:
                raise ValidationError(f"Unsupported portal: {request.portal}")
            
            # Token gegen Code tauschen
            token_data = self._exchange_code_for_token(request.code, config)
            
            # Portal-Benutzerdaten abrufen
            user_data = self._get_portal_user_data(token_data['access_token'], request.portal)
            
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
    
    def _exchange_code_for_token(self, code: str, config: Dict[str, str]) -> Dict[str, Any]:
        """Code gegen Access Token tauschen"""
        # Hier würde der echte OAuth-Token-Exchange stattfinden
        # Für Demo-Zwecke simulieren wir das
        
        return {
            'access_token': f"demo_access_token_{secrets.token_urlsafe(32)}",
            'refresh_token': f"demo_refresh_token_{secrets.token_urlsafe(32)}",
            'expires_in': 3600,
            'scope': config['scope'],
            'token_type': 'Bearer',
        }
    
    def _get_portal_user_data(self, access_token: str, portal: PortalType) -> Dict[str, Any]:
        """Portal-Benutzerdaten abrufen"""
        # Hier würde der echte API-Call stattfinden
        # Für Demo-Zwecke simulieren wir das
        
        return {
            'id': f"portal_user_{secrets.token_urlsafe(16)}",
            'username': f"demo_user_{portal}",
            'email': f"demo@{portal}.com",
            'name': f"Demo User {portal}",
        }


class PortalPublishingService:
    """Service für Portal-Veröffentlichungen"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_portal_status(self, property_id: str) -> PropertyPortalStatusResponse:
        """Portal-Status für eine Immobilie abrufen"""
        
        @sync_to_async
        def get_status():
            portals = []
            
            for portal in PortalType:
                try:
                    connection = PortalConnection.objects.get(
                        tenant_id=self.tenant_id,
                        portal=portal,
                        is_active=True
                    )
                    
                    # Publish Job für diese Immobilie finden
                    try:
                        job = PortalPublishJob.objects.get(
                            property_id=property_id,
                            portal_connection=connection
                        )
                        publish_status = PublishJobStatus(job.status)
                        portal_property_id = job.portal_property_id
                        portal_url = job.portal_url
                        last_sync_at = job.last_sync_at
                        error_message = job.error_message
                        retry_count = job.retry_count
                    except PortalPublishJob.DoesNotExist:
                        publish_status = None
                        portal_property_id = None
                        portal_url = None
                        last_sync_at = None
                        error_message = None
                        retry_count = 0
                    
                    # Connection Status bestimmen
                    if connection.is_token_expired():
                        connection_status = "expired"
                    elif connection.last_error:
                        connection_status = "error"
                    elif connection.is_active:
                        connection_status = "active"
                    else:
                        connection_status = "inactive"
                    
                    portals.append(PortalStatusResponse(
                        portal=portal,
                        connection_status=connection_status,
                        publish_status=publish_status,
                        portal_property_id=portal_property_id,
                        portal_url=portal_url,
                        last_sync_at=last_sync_at,
                        error_message=error_message,
                        retry_count=retry_count,
                        views=0,  # TODO: Echte Analytics implementieren
                        inquiries=0,  # TODO: Echte Analytics implementieren
                    ))
                    
                except PortalConnection.DoesNotExist:
                    portals.append(PortalStatusResponse(
                        portal=portal,
                        connection_status="inactive",
                        views=0,
                        inquiries=0,
                    ))
            
            return PropertyPortalStatusResponse(
                property_id=property_id,
                portals=portals
            )
        
        return await get_status()
    
    async def publish_to_portal(self, request: PortalPublishRequest, user_id: str) -> PortalPublishJobResponse:
        """Immobilie auf Portal veröffentlichen"""
        
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
            
            # Publish Job erstellen oder aktualisieren
            job, created = PortalPublishJob.objects.update_or_create(
                property=property_obj,
                portal_connection=connection,
                defaults={
                    'status': PublishJobStatus.PENDING,
                    'portal_data': request.portal_data or {},
                    'retry_count': 0,
                }
            )
            
            # Job in Background-Queue einreihen
            # TODO: Celery-Task implementieren
            self._queue_publish_job(job.id)
            
            return PortalPublishJobResponse.model_validate(job)
        
        return await publish()
    
    async def sync_portal(self, request: PortalSyncRequest, user_id: str) -> List[PortalPublishJobResponse]:
        """Portal-Synchronisation starten"""
        
        @sync_to_async
        def sync():
            try:
                connection = PortalConnection.objects.get(
                    tenant_id=self.tenant_id,
                    portal=request.portal,
                    is_active=True
                )
            except PortalConnection.DoesNotExist:
                raise NotFoundError(f"No active connection to {request.portal}")
            
            # Jobs für Synchronisation finden
            if request.property_id:
                jobs = PortalPublishJob.objects.filter(
                    property_id=request.property_id,
                    portal_connection=connection
                )
            else:
                jobs = PortalPublishJob.objects.filter(
                    portal_connection=connection,
                    status__in=[PublishJobStatus.PUBLISHED, PublishJobStatus.FAILED]
                )
            
            # Jobs aktualisieren und in Queue einreihen
            updated_jobs = []
            for job in jobs:
                job.status = PublishJobStatus.PENDING
                job.save()
                self._queue_sync_job(job.id)
                updated_jobs.append(PortalPublishJobResponse.model_validate(job))
            
            return updated_jobs
        
        return await sync()
    
    async def unpublish_from_portal(self, request: PortalUnpublishRequest, user_id: str) -> PortalPublishJobResponse:
        """Immobilie von Portal zurückziehen"""
        
        @sync_to_async
        def unpublish():
            try:
                connection = PortalConnection.objects.get(
                    tenant_id=self.tenant_id,
                    portal=request.portal,
                    is_active=True
                )
            except PortalConnection.DoesNotExist:
                raise NotFoundError(f"No active connection to {request.portal}")
            
            try:
                job = PortalPublishJob.objects.get(
                    property_id=request.property_id,
                    portal_connection=connection
                )
            except PortalPublishJob.DoesNotExist:
                raise NotFoundError("Publish job not found")
            
            # Job-Status aktualisieren
            job.status = PublishJobStatus.UNPUBLISHED
            job.save()
            
            # Unpublish in Background-Queue einreihen
            self._queue_unpublish_job(job.id)
            
            return PortalPublishJobResponse.model_validate(job)
        
        return await unpublish()
    
    def _queue_publish_job(self, job_id: str):
        """Publish Job in Background-Queue einreihen"""
        # TODO: Celery-Task implementieren
        logger.info(f"Queuing publish job: {job_id}")
    
    def _queue_sync_job(self, job_id: str):
        """Sync Job in Background-Queue einreihen"""
        # TODO: Celery-Task implementieren
        logger.info(f"Queuing sync job: {job_id}")
    
    def _queue_unpublish_job(self, job_id: str):
        """Unpublish Job in Background-Queue einreihen"""
        # TODO: Celery-Task implementieren
        logger.info(f"Queuing unpublish job: {job_id}")


class PortalMappingService:
    """Service für Portal-spezifische Feld-Mappings"""
    
    @staticmethod
    def map_property_to_portal(property_obj: Property, portal: PortalType) -> Dict[str, Any]:
        """Property zu Portal-spezifischem Format mappen"""
        
        if portal == PortalType.IMMOSCOUT24:
            return PortalMappingService._map_to_immoscout24(property_obj)
        elif portal == PortalType.IMMOWELT:
            return PortalMappingService._map_to_immowelt(property_obj)
        elif portal == PortalType.KLEINANZEIGEN:
            return PortalMappingService._map_to_kleinanzeigen(property_obj)
        else:
            raise ValidationError(f"Unsupported portal: {portal}")
    
    @staticmethod
    def _map_to_immoscout24(property_obj: Property) -> Dict[str, Any]:
        """Property zu Immoscout24-Format mappen"""
        mapping = {
            'title': property_obj.title,
            'description': property_obj.description or '',
            'price': float(property_obj.price) if property_obj.price else 0,
            'living_space': float(property_obj.living_area) if property_obj.living_area else None,
            'number_of_rooms': float(property_obj.rooms) if property_obj.rooms else None,
            'number_of_bedrooms': property_obj.bedrooms,
            'number_of_bathrooms': property_obj.bathrooms,
            'year_built': property_obj.year_built,
            'energy_class': property_obj.energy_class,
            'heating_type': property_obj.heating_type,
            'floor': property_obj.floor_number,
            'condition': property_obj.condition_status,
            'availability': property_obj.availability_date.isoformat() if property_obj.availability_date else None,
            'commission': float(property_obj.commission) if property_obj.commission else None,
            'parking_type': property_obj.parking_type,
        }
        
        # Adresse hinzufügen
        if hasattr(property_obj, 'address') and property_obj.address:
            mapping.update({
                'street': property_obj.address.street,
                'house_number': property_obj.address.house_number,
                'zip_code': property_obj.address.zip_code,
                'city': property_obj.address.city,
            })
        
        return {k: v for k, v in mapping.items() if v is not None}
    
    @staticmethod
    def _map_to_immowelt(property_obj: Property) -> Dict[str, Any]:
        """Property zu Immowelt-Format mappen"""
        # Ähnlich wie Immoscout24, aber mit Immowelt-spezifischen Feldnamen
        mapping = {
            'title': property_obj.title,
            'description': property_obj.description or '',
            'price': float(property_obj.price) if property_obj.price else 0,
            'living_space': float(property_obj.living_area) if property_obj.living_area else None,
            'rooms': float(property_obj.rooms) if property_obj.rooms else None,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': property_obj.bathrooms,
            'year_built': property_obj.year_built,
            'energy_class': property_obj.energy_class,
            'heating_type': property_obj.heating_type,
            'floor': property_obj.floor_number,
            'condition': property_obj.condition_status,
            'availability': property_obj.availability_date.isoformat() if property_obj.availability_date else None,
            'commission': float(property_obj.commission) if property_obj.commission else None,
            'parking_type': property_obj.parking_type,
        }
        
        # Adresse hinzufügen
        if hasattr(property_obj, 'address') and property_obj.address:
            mapping.update({
                'street': property_obj.address.street,
                'house_number': property_obj.address.house_number,
                'zip_code': property_obj.address.zip_code,
                'city': property_obj.address.city,
            })
        
        return {k: v for k, v in mapping.items() if v is not None}
    
    @staticmethod
    def _map_to_kleinanzeigen(property_obj: Property) -> Dict[str, Any]:
        """Property zu eBay Kleinanzeigen-Format mappen"""
        # Ähnlich wie andere Portale, aber mit Kleinanzeigen-spezifischen Feldnamen
        mapping = {
            'title': property_obj.title,
            'description': property_obj.description or '',
            'price': float(property_obj.price) if property_obj.price else 0,
            'living_space': float(property_obj.living_area) if property_obj.living_area else None,
            'rooms': float(property_obj.rooms) if property_obj.rooms else None,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': property_obj.bathrooms,
            'year_built': property_obj.year_built,
            'energy_class': property_obj.energy_class,
            'heating_type': property_obj.heating_type,
            'floor': property_obj.floor_number,
            'condition': property_obj.condition_status,
            'availability': property_obj.availability_date.isoformat() if property_obj.availability_date else None,
            'commission': float(property_obj.commission) if property_obj.commission else None,
            'parking_type': property_obj.parking_type,
        }
        
        # Adresse hinzufügen
        if hasattr(property_obj, 'address') and property_obj.address:
            mapping.update({
                'street': property_obj.address.street,
                'house_number': property_obj.address.house_number,
                'zip_code': property_obj.address.zip_code,
                'city': property_obj.address.city,
            })
        
        return {k: v for k, v in mapping.items() if v is not None}
