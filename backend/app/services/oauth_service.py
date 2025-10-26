"""
OAuth Service für Social Media Plattformen
Implementiert OAuth 2.0 Flows für Facebook, Instagram, TikTok
"""

import os
import json
import logging
import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlencode, parse_qs
import httpx
from django.conf import settings
from django.core.cache import cache
from cryptography.fernet import Fernet
from app.core.security import encrypt_data, decrypt_data

logger = logging.getLogger(__name__)


class OAuthService:
    """OAuth Service für Social Media Plattformen"""
    
    def __init__(self):
        self.client_id = os.getenv('SOCIAL_OAUTH_CLIENT_ID')
        self.client_secret = os.getenv('SOCIAL_OAUTH_CLIENT_SECRET')
        self.redirect_uri = os.getenv('SOCIAL_OAUTH_REDIRECT_URI', 'http://localhost:3000/oauth/callback')
        
        # Platform-specific configurations
        self.platform_configs = {
            'facebook': {
                'auth_url': 'https://www.facebook.com/v18.0/dialog/oauth',
                'token_url': 'https://graph.facebook.com/v18.0/oauth/access_token',
                'user_info_url': 'https://graph.facebook.com/v18.0/me',
                'scopes': ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'],
                'client_id_key': 'FACEBOOK_CLIENT_ID',
                'client_secret_key': 'FACEBOOK_CLIENT_SECRET'
            },
            'instagram': {
                'auth_url': 'https://api.instagram.com/oauth/authorize',
                'token_url': 'https://api.instagram.com/oauth/access_token',
                'user_info_url': 'https://graph.instagram.com/me',
                'scopes': ['user_profile', 'user_media'],
                'client_id_key': 'INSTAGRAM_CLIENT_ID',
                'client_secret_key': 'INSTAGRAM_CLIENT_SECRET'
            },
            'tiktok': {
                'auth_url': 'https://www.tiktok.com/auth/authorize/',
                'token_url': 'https://open.tiktokapis.com/v2/oauth/token/',
                'user_info_url': 'https://open.tiktokapis.com/v2/user/info/',
                'scopes': ['user.info.basic', 'video.publish'],
                'client_id_key': 'TIKTOK_CLIENT_ID',
                'client_secret_key': 'TIKTOK_CLIENT_SECRET'
            }
        }
    
    def generate_state(self, user_id: str, tenant_id: str) -> str:
        """Generate OAuth state parameter"""
        state_data = {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'nonce': secrets.token_urlsafe(32),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        state_json = json.dumps(state_data)
        state_encoded = base64.urlsafe_b64encode(state_json.encode()).decode()
        
        # Store state in cache for validation
        cache.set(f"oauth_state:{state_encoded}", state_data, timeout=600)  # 10 minutes
        
        return state_encoded
    
    def validate_state(self, state: str) -> Optional[Dict[str, Any]]:
        """Validate OAuth state parameter"""
        try:
            state_data = cache.get(f"oauth_state:{state}")
            if not state_data:
                return None
            
            # Remove from cache after validation
            cache.delete(f"oauth_state:{state}")
            return state_data
        except Exception as e:
            logger.error(f"State validation error: {e}")
            return None
    
    def get_oauth_url(self, platform: str, user_id: str, tenant_id: str) -> str:
        """Generate OAuth authorization URL"""
        if platform not in self.platform_configs:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.platform_configs[platform]
        
        # Get platform-specific credentials
        client_id = os.getenv(config['client_id_key'])
        if not client_id:
            raise ValueError(f"Missing {config['client_id_key']} environment variable")
        
        # Generate state
        state = self.generate_state(user_id, tenant_id)
        
        # Build authorization URL
        params = {
            'client_id': client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ','.join(config['scopes']),
            'response_type': 'code',
            'state': state
        }
        
        # Platform-specific parameters
        if platform == 'facebook':
            params['response_type'] = 'code'
        elif platform == 'instagram':
            params['response_type'] = 'code'
        elif platform == 'tiktok':
            params['response_type'] = 'code'
            params['scope'] = ' '.join(config['scopes'])  # TikTok uses space-separated scopes
        
        auth_url = f"{config['auth_url']}?{urlencode(params)}"
        logger.info(f"Generated OAuth URL for {platform}: {auth_url}")
        
        return auth_url
    
    async def exchange_code_for_token(self, platform: str, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if platform not in self.platform_configs:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.platform_configs[platform]
        
        # Validate state
        state_data = self.validate_state(state)
        if not state_data:
            raise ValueError("Invalid or expired state parameter")
        
        # Get platform-specific credentials
        client_id = os.getenv(config['client_id_key'])
        client_secret = os.getenv(config['client_secret_key'])
        
        if not client_id or not client_secret:
            raise ValueError(f"Missing credentials for {platform}")
        
        # Prepare token request
        token_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        # Platform-specific token request parameters
        if platform == 'facebook':
            token_data['grant_type'] = 'authorization_code'
        elif platform == 'instagram':
            token_data['grant_type'] = 'authorization_code'
        elif platform == 'tiktok':
            token_data['grant_type'] = 'authorization_code'
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    config['token_url'],
                    data=token_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                response.raise_for_status()
                
                token_response = response.json()
                logger.info(f"Token exchange successful for {platform}")
                
                return {
                    'access_token': token_response.get('access_token'),
                    'refresh_token': token_response.get('refresh_token'),
                    'expires_in': token_response.get('expires_in'),
                    'token_type': token_response.get('token_type', 'Bearer'),
                    'scope': token_response.get('scope'),
                    'user_id': state_data['user_id'],
                    'tenant_id': state_data['tenant_id']
                }
                
            except httpx.HTTPError as e:
                logger.error(f"Token exchange failed for {platform}: {e}")
                raise ValueError(f"Token exchange failed: {e}")
    
    async def get_user_info(self, platform: str, access_token: str) -> Dict[str, Any]:
        """Get user information from platform"""
        if platform not in self.platform_configs:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.platform_configs[platform]
        
        async with httpx.AsyncClient() as client:
            try:
                headers = {'Authorization': f'Bearer {access_token}'}
                
                # Platform-specific user info requests
                if platform == 'facebook':
                    # Get user info and pages
                    user_response = await client.get(
                        config['user_info_url'],
                        headers=headers,
                        params={'fields': 'id,name,email'}
                    )
                    user_response.raise_for_status()
                    user_data = user_response.json()
                    
                    # Get pages for Facebook
                    pages_response = await client.get(
                        'https://graph.facebook.com/v18.0/me/accounts',
                        headers=headers
                    )
                    pages_response.raise_for_status()
                    pages_data = pages_response.json()
                    
                    return {
                        'id': user_data['id'],
                        'name': user_data['name'],
                        'email': user_data.get('email'),
                        'platform': platform,
                        'pages': pages_data.get('data', [])
                    }
                
                elif platform == 'instagram':
                    # Instagram Basic Display API
                    user_response = await client.get(
                        config['user_info_url'],
                        headers=headers,
                        params={'fields': 'id,username,account_type,media_count'}
                    )
                    user_response.raise_for_status()
                    user_data = user_response.json()
                    
                    return {
                        'id': user_data['id'],
                        'username': user_data['username'],
                        'account_type': user_data.get('account_type'),
                        'media_count': user_data.get('media_count'),
                        'platform': platform
                    }
                
                elif platform == 'tiktok':
                    # TikTok for Business API
                    user_response = await client.get(
                        config['user_info_url'],
                        headers=headers,
                        params={'fields': 'open_id,union_id,avatar_url,display_name'}
                    )
                    user_response.raise_for_status()
                    user_data = user_response.json()
                    
                    return {
                        'id': user_data['data']['user']['open_id'],
                        'display_name': user_data['data']['user']['display_name'],
                        'avatar_url': user_data['data']['user'].get('avatar_url'),
                        'platform': platform
                    }
                
            except httpx.HTTPError as e:
                logger.error(f"User info request failed for {platform}: {e}")
                raise ValueError(f"User info request failed: {e}")
    
    async def refresh_token(self, platform: str, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        if platform not in self.platform_configs:
            raise ValueError(f"Unsupported platform: {platform}")
        
        config = self.platform_configs[platform]
        
        # Get platform-specific credentials
        client_id = os.getenv(config['client_id_key'])
        client_secret = os.getenv(config['client_secret_key'])
        
        if not client_id or not client_secret:
            raise ValueError(f"Missing credentials for {platform}")
        
        refresh_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    config['token_url'],
                    data=refresh_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                response.raise_for_status()
                
                token_response = response.json()
                logger.info(f"Token refresh successful for {platform}")
                
                return {
                    'access_token': token_response.get('access_token'),
                    'refresh_token': token_response.get('refresh_token'),
                    'expires_in': token_response.get('expires_in'),
                    'token_type': token_response.get('token_type', 'Bearer')
                }
                
            except httpx.HTTPError as e:
                logger.error(f"Token refresh failed for {platform}: {e}")
                raise ValueError(f"Token refresh failed: {e}")
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt access token for storage"""
        return encrypt_data(token)
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt access token for use"""
        return decrypt_data(encrypted_token)
