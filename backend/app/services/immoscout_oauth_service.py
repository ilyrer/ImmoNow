"""
ImmoScout24 OAuth Service
Handles OAuth authentication and API calls for ImmoScout24 integration
"""

import os
import logging
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from urllib.parse import urlencode, parse_qs
import secrets
import hashlib
import base64

from app.core.errors import ServiceError, ValidationError

logger = logging.getLogger(__name__)


class ImmoScout24OAuthService:
    """OAuth service for ImmoScout24 API integration"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.client_id = os.getenv('IMMOSCOUT24_CLIENT_ID')
        self.client_secret = os.getenv('IMMOSCOUT24_CLIENT_SECRET')
        self.redirect_uri = os.getenv('IMMOSCOUT24_REDIRECT_URI', 'http://localhost:3000/oauth/immoscout24/callback')
        self.base_url = 'https://rest.immobilienscout24.de/restapi/api'
        self.auth_url = 'https://rest.immobilienscout24.de/restapi/security/oauth/authorize'
        self.token_url = 'https://rest.immobilienscout24.de/restapi/security/oauth/token'
        
        if not self.client_id or not self.client_secret:
            raise ServiceError("ImmoScout24 OAuth credentials not configured")
    
    def generate_authorization_url(self, user_id: str, state: Optional[str] = None) -> str:
        """Generate OAuth authorization URL"""
        
        if not state:
            state = self._generate_state(user_id)
        
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'read write',
            'state': state
        }
        
        auth_url = f"{self.auth_url}?{urlencode(params)}"
        logger.info(f"Generated ImmoScout24 authorization URL for user {user_id}")
        
        return auth_url
    
    async def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        
        try:
            data = {
                'grant_type': 'authorization_code',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': code,
                'redirect_uri': self.redirect_uri
            }
            
            response = requests.post(
                self.token_url,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                raise ServiceError(f"Token exchange failed: {response.text}")
            
            token_data = response.json()
            
            # Calculate expiration time
            expires_in = token_data.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            return {
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),
                'token_type': token_data.get('token_type', 'Bearer'),
                'expires_in': expires_in,
                'expires_at': expires_at,
                'scope': token_data.get('scope', '')
            }
            
        except requests.RequestException as e:
            logger.error(f"Token exchange request failed: {str(e)}")
            raise ServiceError(f"Token exchange failed: {str(e)}")
        except Exception as e:
            logger.error(f"Token exchange error: {str(e)}")
            raise ServiceError(f"Token exchange failed: {str(e)}")
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        
        try:
            data = {
                'grant_type': 'refresh_token',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'refresh_token': refresh_token
            }
            
            response = requests.post(
                self.token_url,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.status_code} - {response.text}")
                raise ServiceError(f"Token refresh failed: {response.text}")
            
            token_data = response.json()
            
            # Calculate expiration time
            expires_in = token_data.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            return {
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', refresh_token),
                'token_type': token_data.get('token_type', 'Bearer'),
                'expires_in': expires_in,
                'expires_at': expires_at,
                'scope': token_data.get('scope', '')
            }
            
        except requests.RequestException as e:
            logger.error(f"Token refresh request failed: {str(e)}")
            raise ServiceError(f"Token refresh failed: {str(e)}")
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            raise ServiceError(f"Token refresh failed: {str(e)}")
    
    async def test_connection(self, access_token: str) -> Dict[str, Any]:
        """Test API connection with access token"""
        
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test with user info endpoint
            response = requests.get(
                f"{self.base_url}/user",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'message': 'ImmoScout24 connection successful',
                    'user_id': user_data.get('userid'),
                    'username': user_data.get('username'),
                    'email': user_data.get('email')
                }
            else:
                return {
                    'success': False,
                    'message': f'Connection test failed: {response.status_code} - {response.text}'
                }
                
        except requests.RequestException as e:
            logger.error(f"Connection test failed: {str(e)}")
            return {
                'success': False,
                'message': f'Connection test failed: {str(e)}'
            }
    
    async def publish_property(self, property_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """Publish property to ImmoScout24"""
        
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Transform property data to ImmoScout24 format
            immoscout_data = self._transform_property_data(property_data)
            
            response = requests.post(
                f"{self.base_url}/offer/v1.0/user/me/realestate",
                json=immoscout_data,
                headers=headers,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return {
                    'success': True,
                    'message': 'Property published successfully',
                    'portal_property_id': result.get('id'),
                    'portal_url': f"https://www.immobilienscout24.de/expose/{result.get('id')}"
                }
            else:
                logger.error(f"Property publish failed: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'message': f'Property publish failed: {response.text}'
                }
                
        except requests.RequestException as e:
            logger.error(f"Property publish request failed: {str(e)}")
            return {
                'success': False,
                'message': f'Property publish failed: {str(e)}'
            }
    
    async def unpublish_property(self, portal_property_id: str, access_token: str) -> Dict[str, Any]:
        """Unpublish property from ImmoScout24"""
        
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.delete(
                f"{self.base_url}/offer/v1.0/user/me/realestate/{portal_property_id}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                return {
                    'success': True,
                    'message': 'Property unpublished successfully'
                }
            else:
                logger.error(f"Property unpublish failed: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'message': f'Property unpublish failed: {response.text}'
                }
                
        except requests.RequestException as e:
            logger.error(f"Property unpublish request failed: {str(e)}")
            return {
                'success': False,
                'message': f'Property unpublish failed: {str(e)}'
            }
    
    async def get_property_metrics(self, portal_property_id: str, access_token: str) -> Dict[str, Any]:
        """Get property metrics from ImmoScout24"""
        
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/offer/v1.0/user/me/realestate/{portal_property_id}/statistics",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                stats = response.json()
                return {
                    'views': stats.get('viewCount', 0),
                    'inquiries': stats.get('inquiryCount', 0),
                    'favorites': stats.get('favoriteCount', 0),
                    'last_updated': datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"Metrics fetch failed: {response.status_code} - {response.text}")
                return {
                    'views': 0,
                    'inquiries': 0,
                    'favorites': 0,
                    'last_updated': datetime.utcnow().isoformat()
                }
                
        except requests.RequestException as e:
            logger.error(f"Metrics fetch request failed: {str(e)}")
            return {
                'views': 0,
                'inquiries': 0,
                'favorites': 0,
                'last_updated': datetime.utcnow().isoformat()
            }
    
    def _generate_state(self, user_id: str) -> str:
        """Generate secure state parameter"""
        random_bytes = secrets.token_bytes(32)
        state_data = f"{user_id}:{random_bytes.hex()}"
        return base64.urlsafe_b64encode(state_data.encode()).decode()
    
    def _transform_property_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform internal property data to ImmoScout24 format"""
        
        # Basic property information
        immoscout_data = {
            'title': property_data.get('title', ''),
            'description': property_data.get('description', ''),
            'price': {
                'value': property_data.get('price', 0),
                'currency': property_data.get('price_currency', 'EUR')
            },
            'realEstate': {
                'livingSpace': property_data.get('living_area', 0),
                'numberOfRooms': property_data.get('bedrooms', 0),
                'energyConsumptionEnev2014': {
                    'energyConsumptionEnev2014': property_data.get('energy_consumption', 0)
                }
            }
        }
        
        # Add address if available
        if 'address' in property_data and property_data['address']:
            address = property_data['address']
            immoscout_data['address'] = {
                'street': address.get('street', ''),
                'houseNumber': address.get('house_number', ''),
                'postcode': address.get('zip_code', ''),
                'city': address.get('city', ''),
                'country': 'DE'
            }
        
        # Add contact information
        if 'contact_person' in property_data and property_data['contact_person']:
            contact = property_data['contact_person']
            immoscout_data['contact'] = {
                'name': contact.get('name', ''),
                'email': contact.get('email', ''),
                'phone': contact.get('phone', '')
            }
        
        return immoscout_data
