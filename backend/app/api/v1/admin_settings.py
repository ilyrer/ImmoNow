"""
Admin Settings API for Integration Keys

Provides secure management of API keys and integration settings
with encryption for sensitive data like Google Maps and ImmoScout24 keys.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from cryptography.fernet import Fernet
import os
import base64
from app.db.models import IntegrationSettings, Tenant, User
from app.core.settings import settings
from app.services.auth_service import AuthService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.errors import UnauthorizedError

router = APIRouter()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = AuthService.verify_token(token)
        
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token")
        
        user = await User.objects.aget(id=user_id)
        return user
    except Exception as e:
        raise UnauthorizedError(f"Authentication failed: {str(e)}")

async def require_admin_scope(current_user: User = Depends(get_current_user)) -> User:
    """Require admin scope for the current user"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

class IntegrationSettingsResponse(BaseModel):
    """Response model for integration settings"""
    google_maps_api_key: Optional[str] = None
    google_maps_configured: bool = False
    immoscout_client_id: Optional[str] = None
    immoscout_client_secret: Optional[str] = None
    immoscout_configured: bool = False
    immoscout_access_token: Optional[str] = None
    immoscout_refresh_token: Optional[str] = None
    immoscout_token_expires_at: Optional[str] = None
    immowelt_api_key: Optional[str] = None
    immowelt_configured: bool = False
    ebay_api_key: Optional[str] = None
    ebay_configured: bool = False

class IntegrationSettingsUpdate(BaseModel):
    """Update model for integration settings"""
    google_maps_api_key: Optional[str] = None
    immoscout_client_id: Optional[str] = None
    immoscout_client_secret: Optional[str] = None
    immoscout_access_token: Optional[str] = None
    immoscout_refresh_token: Optional[str] = None
    immoscout_token_expires_at: Optional[str] = None
    immowelt_api_key: Optional[str] = None
    ebay_api_key: Optional[str] = None

class EncryptionService:
    """Service for encrypting/decrypting sensitive data"""
    
    def __init__(self):
        # Use environment variable for encryption key or generate one
        key = os.getenv('ENCRYPTION_KEY')
        if not key:
            # Generate a new key if none exists (for development)
            key = Fernet.generate_key()
            print(f"Generated new encryption key: {key.decode()}")
            print("Please set ENCRYPTION_KEY environment variable for production!")
        
        if isinstance(key, str):
            key = key.encode()
        
        self.cipher = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string"""
        if not data:
            return ""
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string"""
        if not encrypted_data:
            return ""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.cipher.decrypt(encrypted_bytes)
            return decrypted_data.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""

# Global encryption service instance
encryption_service = EncryptionService()

@router.get(
    "/admin/settings/integrations",
    response_model=IntegrationSettingsResponse,
    summary="Get integration settings",
    dependencies=[Depends(require_admin_scope)]
)
async def get_integration_settings(
    current_user: User = Depends(require_admin_scope)
):
    """
    Get current integration settings for the tenant.
    Returns masked API keys for security.
    """
    try:
        # Get tenant from user
        tenant = current_user.tenant
        
        # Get or create integration settings
        settings_obj, created = await IntegrationSettings.objects.aget_or_create(
            tenant=tenant,
            defaults={
                'created_by': current_user
            }
        )
        
        # Decrypt and mask sensitive data
        response_data = IntegrationSettingsResponse(
            google_maps_api_key=_mask_api_key(settings_obj.google_maps_api_key),
            google_maps_configured=bool(settings_obj.google_maps_api_key),
            immoscout_client_id=_mask_api_key(settings_obj.immoscout_client_id),
            immoscout_client_secret=_mask_api_key(settings_obj.immoscout_client_secret),
            immoscout_configured=bool(settings_obj.immoscout_client_id and settings_obj.immoscout_client_secret),
            immoscout_access_token=_mask_api_key(settings_obj.immoscout_access_token),
            immoscout_refresh_token=_mask_api_key(settings_obj.immoscout_refresh_token),
            immoscout_token_expires_at=settings_obj.immoscout_token_expires_at.isoformat() if settings_obj.immoscout_token_expires_at else None,
            immowelt_api_key=_mask_api_key(settings_obj.immowelt_api_key),
            immowelt_configured=bool(settings_obj.immowelt_api_key),
            ebay_api_key=_mask_api_key(settings_obj.ebay_api_key),
            ebay_configured=bool(settings_obj.ebay_api_key)
        )
        
        return response_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving integration settings: {str(e)}"
        )

@router.put(
    "/admin/settings/integrations",
    response_model=IntegrationSettingsResponse,
    summary="Update integration settings",
    dependencies=[Depends(require_admin_scope)]
)
async def update_integration_settings(
    settings_update: IntegrationSettingsUpdate,
    current_user: User = Depends(require_admin_scope)
):
    """
    Update integration settings for the tenant.
    Encrypts sensitive data before storing.
    """
    try:
        # Get tenant from user
        tenant = current_user.tenant
        
        # Get or create integration settings
        settings_obj, created = await IntegrationSettings.objects.aget_or_create(
            tenant=tenant,
            defaults={
                'created_by': current_user
            }
        )
        
        # Update fields with encryption
        update_fields = []
        
        if settings_update.google_maps_api_key is not None:
            settings_obj.google_maps_api_key = encryption_service.encrypt(settings_update.google_maps_api_key)
            update_fields.append('google_maps_api_key')
        
        if settings_update.immoscout_client_id is not None:
            settings_obj.immoscout_client_id = encryption_service.encrypt(settings_update.immoscout_client_id)
            update_fields.append('immoscout_client_id')
        
        if settings_update.immoscout_client_secret is not None:
            settings_obj.immoscout_client_secret = encryption_service.encrypt(settings_update.immoscout_client_secret)
            update_fields.append('immoscout_client_secret')
        
        if settings_update.immoscout_access_token is not None:
            settings_obj.immoscout_access_token = encryption_service.encrypt(settings_update.immoscout_access_token)
            update_fields.append('immoscout_access_token')
        
        if settings_update.immoscout_refresh_token is not None:
            settings_obj.immoscout_refresh_token = encryption_service.encrypt(settings_update.immoscout_refresh_token)
            update_fields.append('immoscout_refresh_token')
        
        if settings_update.immoscout_token_expires_at is not None:
            from datetime import datetime
            settings_obj.immoscout_token_expires_at = datetime.fromisoformat(settings_update.immoscout_token_expires_at)
            update_fields.append('immoscout_token_expires_at')
        
        if settings_update.immowelt_api_key is not None:
            settings_obj.immowelt_api_key = encryption_service.encrypt(settings_update.immowelt_api_key)
            update_fields.append('immowelt_api_key')
        
        if settings_update.ebay_api_key is not None:
            settings_obj.ebay_api_key = encryption_service.encrypt(settings_update.ebay_api_key)
            update_fields.append('ebay_api_key')
        
        # Update the object
        settings_obj.updated_by = current_user
        update_fields.extend(['updated_at', 'updated_by'])
        
        await settings_obj.asave(update_fields=update_fields)
        
        # Return updated settings
        return await get_integration_settings(current_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating integration settings: {str(e)}"
        )

@router.post(
    "/admin/settings/integrations/test/google-maps",
    summary="Test Google Maps API key",
    dependencies=[Depends(require_admin_scope)]
)
async def test_google_maps_api_key(
    api_key: str,
    current_user: User = Depends(require_admin_scope)
):
    """
    Test if Google Maps API key is valid by making a test request.
    """
    try:
        import googlemaps
        
        # Test the API key
        gmaps = googlemaps.Client(key=api_key)
        
        # Make a simple geocoding request to test the key
        result = gmaps.geocode('Berlin, Germany')
        
        if result:
            return {
                "status": "success",
                "message": "Google Maps API key is valid",
                "test_result": f"Found {len(result)} results for Berlin"
            }
        else:
            return {
                "status": "error",
                "message": "Google Maps API key test failed - no results returned"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Google Maps API key test failed: {str(e)}"
        }

@router.post(
    "/admin/settings/integrations/test/immoscout",
    summary="Test ImmoScout24 API credentials",
    dependencies=[Depends(require_admin_scope)]
)
async def test_immoscout_api_credentials(
    client_id: str,
    client_secret: str,
    current_user: User = Depends(require_admin_scope)
):
    """
    Test ImmoScout24 API credentials by attempting OAuth flow.
    """
    try:
        import requests
        
        # Test OAuth token endpoint
        token_url = "https://rest.immobilienscout24.de/restapi/api/oauth/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        response = requests.post(token_url, data=data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            return {
                "status": "success",
                "message": "ImmoScout24 API credentials are valid",
                "token_type": token_data.get('token_type'),
                "expires_in": token_data.get('expires_in')
            }
        else:
            return {
                "status": "error",
                "message": f"ImmoScout24 API test failed: {response.status_code} - {response.text}"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"ImmoScout24 API test failed: {str(e)}"
        }

def _mask_api_key(encrypted_key: Optional[str]) -> Optional[str]:
    """Mask API key for display purposes"""
    if not encrypted_key:
        return None
    
    try:
        decrypted_key = encryption_service.decrypt(encrypted_key)
        if len(decrypted_key) > 8:
            return f"{decrypted_key[:4]}...{decrypted_key[-4:]}"
        else:
            return "***"
    except:
        return "***"
