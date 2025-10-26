"""
Social Media Platform API Integration
Implementiert API-Calls für Facebook, Instagram, TikTok
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
from app.services.oauth_service import OAuthService

logger = logging.getLogger(__name__)


class SocialPlatformAPI:
    """Base class for social media platform APIs"""
    
    def __init__(self, platform: str, access_token: str):
        self.platform = platform
        self.access_token = access_token
        self.oauth_service = OAuthService()
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get user profile information"""
        raise NotImplementedError
    
    async def get_posts(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Get user posts"""
        raise NotImplementedError
    
    async def create_post(self, content: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Create a new post"""
        raise NotImplementedError
    
    async def get_analytics(self, post_id: str) -> Dict[str, Any]:
        """Get post analytics"""
        raise NotImplementedError


class FacebookAPI(SocialPlatformAPI):
    """Facebook API Integration"""
    
    def __init__(self, access_token: str):
        super().__init__('facebook', access_token)
        self.base_url = 'https://graph.facebook.com/v18.0'
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get Facebook user profile"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/me",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={'fields': 'id,name,email,picture'}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Facebook profile request failed: {e}")
                raise
    
    async def get_pages(self) -> List[Dict[str, Any]]:
        """Get Facebook pages"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/me/accounts",
                    headers={'Authorization': f'Bearer {self.access_token}'}
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', [])
            except httpx.HTTPError as e:
                logger.error(f"Facebook pages request failed: {e}")
                raise
    
    async def create_post(self, content: str, page_id: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Create a Facebook post"""
        async with httpx.AsyncClient() as client:
            try:
                post_data = {'message': content}
                
                if media_urls:
                    # Facebook supports multiple media attachments
                    attachments = []
                    for url in media_urls:
                        attachments.append({'url': url})
                    post_data['attachments'] = attachments
                
                response = await client.post(
                    f"{self.base_url}/{page_id}/feed",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    data=post_data
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Facebook post creation failed: {e}")
                raise
    
    async def get_posts(self, page_id: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Get Facebook page posts"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/{page_id}/posts",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={
                        'fields': 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
                        'limit': limit
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', [])
            except httpx.HTTPError as e:
                logger.error(f"Facebook posts request failed: {e}")
                raise
    
    async def get_analytics(self, post_id: str) -> Dict[str, Any]:
        """Get Facebook post analytics"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/{post_id}/insights",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={'metric': 'post_impressions,post_engaged_users,post_reactions_by_type_total'}
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', [])
            except httpx.HTTPError as e:
                logger.error(f"Facebook analytics request failed: {e}")
                raise


class InstagramAPI(SocialPlatformAPI):
    """Instagram API Integration"""
    
    def __init__(self, access_token: str):
        super().__init__('instagram', access_token)
        self.base_url = 'https://graph.instagram.com'
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get Instagram user profile"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/me",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={'fields': 'id,username,account_type,media_count'}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Instagram profile request failed: {e}")
                raise
    
    async def get_posts(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Get Instagram posts"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/me/media",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={
                        'fields': 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count',
                        'limit': limit
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', [])
            except httpx.HTTPError as e:
                logger.error(f"Instagram posts request failed: {e}")
                raise
    
    async def create_post(self, content: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Create an Instagram post"""
        if not media_urls:
            raise ValueError("Instagram requires media for posts")
        
        async with httpx.AsyncClient() as client:
            try:
                # Instagram requires media container creation first
                media_data = {
                    'image_url': media_urls[0],  # Instagram Basic Display only supports single image
                    'caption': content
                }
                
                response = await client.post(
                    f"{self.base_url}/me/media",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    data=media_data
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Instagram post creation failed: {e}")
                raise
    
    async def get_analytics(self, post_id: str) -> Dict[str, Any]:
        """Get Instagram post analytics"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/{post_id}/insights",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={'metric': 'impressions,reach,likes,comments,saves,shares'}
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', [])
            except httpx.HTTPError as e:
                logger.error(f"Instagram analytics request failed: {e}")
                raise


class TikTokAPI(SocialPlatformAPI):
    """TikTok API Integration"""
    
    def __init__(self, access_token: str):
        super().__init__('tiktok', access_token)
        self.base_url = 'https://open.tiktokapis.com/v2'
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get TikTok user profile"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/user/info/",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={'fields': 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count'}
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', {}).get('user', {})
            except httpx.HTTPError as e:
                logger.error(f"TikTok profile request failed: {e}")
                raise
    
    async def get_posts(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Get TikTok posts"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/video/list/",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={
                        'fields': 'id,title,description,create_time,cover_image_url,video_id,share_url,embed_html,embed_link',
                        'max_count': limit
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get('data', {}).get('videos', [])
            except httpx.HTTPError as e:
                logger.error(f"TikTok posts request failed: {e}")
                raise
    
    async def create_post(self, content: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Create a TikTok post"""
        if not media_urls:
            raise ValueError("TikTok requires video for posts")
        
        async with httpx.AsyncClient() as client:
            try:
                post_data = {
                    'post_info': {
                        'title': content[:100],  # TikTok title limit
                        'description': content,
                        'privacy_level': 'MUTUAL_FOLLOW_FRIENDS',
                        'disable_duet': False,
                        'disable_comment': False,
                        'disable_stitch': False,
                        'video_cover_timestamp_ms': 1000
                    },
                    'source_info': {
                        'source': 'FILE_UPLOAD',
                        'video_size': 0,  # Will be calculated
                        'chunk_size': 0,  # Will be calculated
                        'total_chunk_count': 1
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/post/publish/",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    json=post_data
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"TikTok post creation failed: {e}")
                raise
    
    async def get_analytics(self, post_id: str) -> Dict[str, Any]:
        """Get TikTok post analytics"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/video/query/",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={
                        'fields': 'id,title,description,create_time,cover_image_url,video_id,share_url,embed_html,embed_link,view_count,like_count,comment_count,share_count',
                        'video_ids': [post_id]
                    }
                )
                response.raise_for_status()
                data = response.json()
                videos = data.get('data', {}).get('videos', [])
                return videos[0] if videos else {}
            except httpx.HTTPError as e:
                logger.error(f"TikTok analytics request failed: {e}")
                raise


class SocialPlatformAPIFactory:
    """Factory for creating platform-specific API instances"""
    
    @staticmethod
    def create_api(platform: str, access_token: str) -> SocialPlatformAPI:
        """Create platform-specific API instance"""
        if platform == 'facebook':
            return FacebookAPI(access_token)
        elif platform == 'instagram':
            return InstagramAPI(access_token)
        elif platform == 'tiktok':
            return TikTokAPI(access_token)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    @staticmethod
    async def test_connection(platform: str, access_token: str) -> bool:
        """Test API connection"""
        try:
            api = SocialPlatformAPIFactory.create_api(platform, access_token)
            await api.get_user_profile()
            return True
        except Exception as e:
            logger.error(f"Connection test failed for {platform}: {e}")
            return False
