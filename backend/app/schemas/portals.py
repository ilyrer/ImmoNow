"""
Portal Schemas für OAuth-Integration
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class PortalType(str, Enum):
    IMMOSCOUT24 = "immoscout24"
    IMMOWELT = "immowelt"
    KLEINANZEIGEN = "kleinanzeigen"


class PortalConnectionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    ERROR = "error"


class PublishJobStatus(str, Enum):
    PENDING = "pending"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    PAUSED = "paused"
    UNPUBLISHED = "unpublished"


class LogLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


# Portal Connection Schemas
class PortalConnectionResponse(BaseModel):
    """Portal-Verbindung Response"""
    id: str
    tenant_id: str
    portal: PortalType
    portal_user_id: str
    portal_username: Optional[str] = None
    portal_email: Optional[str] = None
    is_active: bool
    last_sync_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    model_config = ConfigDict(from_attributes=True)


class PortalConnectionCreate(BaseModel):
    """Portal-Verbindung erstellen"""
    portal: PortalType
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: datetime
    scope: str
    portal_user_id: str
    portal_username: Optional[str] = None
    portal_email: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


class PortalConnectionUpdate(BaseModel):
    """Portal-Verbindung aktualisieren"""
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scope: Optional[str] = None
    portal_username: Optional[str] = None
    portal_email: Optional[str] = None
    is_active: Optional[bool] = None
    last_error: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


# Portal Publish Job Schemas
class PortalPublishJobResponse(BaseModel):
    """Portal-Veröffentlichungs-Job Response"""
    id: str
    property_id: str
    portal_connection_id: str
    portal_property_id: Optional[str] = None
    portal_url: Optional[str] = None
    status: PublishJobStatus
    error_message: Optional[str] = None
    retry_count: int
    portal_data: Dict[str, Any] = {}
    sync_data: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class PortalPublishJobCreate(BaseModel):
    """Portal-Veröffentlichungs-Job erstellen"""
    property_id: str
    portal_connection_id: str
    portal_data: Dict[str, Any] = {}
    
    model_config = ConfigDict(extra='ignore')


class PortalPublishJobUpdate(BaseModel):
    """Portal-Veröffentlichungs-Job aktualisieren"""
    status: Optional[PublishJobStatus] = None
    portal_property_id: Optional[str] = None
    portal_url: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None
    portal_data: Optional[Dict[str, Any]] = None
    sync_data: Optional[Dict[str, Any]] = None
    published_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    
    model_config = ConfigDict(extra='ignore')


# Portal Sync Log Schemas
class PortalSyncLogResponse(BaseModel):
    """Portal-Sync-Log Response"""
    id: str
    portal_connection_id: str
    property_id: Optional[str] = None
    level: LogLevel
    message: str
    details: Dict[str, Any] = {}
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PortalSyncLogCreate(BaseModel):
    """Portal-Sync-Log erstellen"""
    portal_connection_id: str
    property_id: Optional[str] = None
    level: LogLevel
    message: str
    details: Dict[str, Any] = {}
    
    model_config = ConfigDict(extra='ignore')


# Portal Status Schemas
class PortalStatusResponse(BaseModel):
    """Portal-Status für eine Immobilie"""
    portal: PortalType
    connection_status: PortalConnectionStatus
    publish_status: Optional[PublishJobStatus] = None
    portal_property_id: Optional[str] = None
    portal_url: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    error_message: Optional[str] = None
    views: Optional[int] = None
    inquiries: Optional[int] = None
    retry_count: int = 0


class PropertyPortalStatusResponse(BaseModel):
    """Portal-Status für alle Portale einer Immobilie"""
    property_id: str
    portals: List[PortalStatusResponse]


# OAuth Flow Schemas
class OAuthInitiateRequest(BaseModel):
    """OAuth-Flow starten"""
    portal: PortalType
    redirect_uri: str
    
    model_config = ConfigDict(extra='ignore')


class OAuthCallbackRequest(BaseModel):
    """OAuth-Callback verarbeiten"""
    portal: PortalType
    code: str
    state: str
    redirect_uri: str
    
    model_config = ConfigDict(extra='ignore')


class OAuthUrlResponse(BaseModel):
    """OAuth-URL Response"""
    portal: PortalType
    auth_url: str
    state: str
    expires_at: datetime


# Portal Publishing Schemas
class PortalPublishRequest(BaseModel):
    """Immobilie auf Portal veröffentlichen"""
    portal: PortalType
    property_id: str
    portal_data: Optional[Dict[str, Any]] = {}
    
    model_config = ConfigDict(extra='ignore')


class PortalSyncRequest(BaseModel):
    """Portal-Synchronisation starten"""
    portal: PortalType
    property_id: Optional[str] = None  # None = alle Immobilien
    
    model_config = ConfigDict(extra='ignore')


class PortalUnpublishRequest(BaseModel):
    """Immobilie von Portal zurückziehen"""
    portal: PortalType
    property_id: str
    
    model_config = ConfigDict(extra='ignore')


# Portal-spezifische Mapping Schemas
class Immoscout24Mapping(BaseModel):
    """Immoscout24-spezifische Feld-Mappings"""
    # Basis-Felder
    title: str
    description: str
    price: float
    living_space: Optional[float] = None
    number_of_rooms: Optional[float] = None
    number_of_bedrooms: Optional[int] = None
    number_of_bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    energy_class: Optional[str] = None
    heating_type: Optional[str] = None
    
    # Adresse
    street: Optional[str] = None
    house_number: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    
    # Zusätzliche Felder
    floor: Optional[str] = None
    condition: Optional[str] = None
    availability: Optional[str] = None
    commission: Optional[float] = None
    parking_type: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


class ImmoweltMapping(BaseModel):
    """Immowelt-spezifische Feld-Mappings"""
    # Basis-Felder
    title: str
    description: str
    price: float
    living_space: Optional[float] = None
    rooms: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    energy_class: Optional[str] = None
    heating_type: Optional[str] = None
    
    # Adresse
    street: Optional[str] = None
    house_number: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    
    # Zusätzliche Felder
    floor: Optional[str] = None
    condition: Optional[str] = None
    availability: Optional[str] = None
    commission: Optional[float] = None
    parking_type: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


class KleinanzeigenMapping(BaseModel):
    """eBay Kleinanzeigen-spezifische Feld-Mappings"""
    # Basis-Felder
    title: str
    description: str
    price: float
    living_space: Optional[float] = None
    rooms: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    energy_class: Optional[str] = None
    heating_type: Optional[str] = None
    
    # Adresse
    street: Optional[str] = None
    house_number: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    
    # Zusätzliche Felder
    floor: Optional[str] = None
    condition: Optional[str] = None
    availability: Optional[str] = None
    commission: Optional[float] = None
    parking_type: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')


# Portal Analytics Schemas
class PortalAnalyticsResponse(BaseModel):
    """Portal-Analytics für eine Immobilie"""
    portal: PortalType
    property_id: str
    views: int = 0
    inquiries: int = 0
    favorites: int = 0
    last_updated: datetime
    
    model_config = ConfigDict(from_attributes=True)
