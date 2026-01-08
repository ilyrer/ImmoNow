"""
OAuth Service - Centralized OAuth2 flow management for all platforms
"""

import os
import secrets
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from urllib.parse import urlencode
import httpx
from asgiref.sync import sync_to_async
from cryptography.fernet import Fernet

from communications.models import SocialAccount
from accounts.models import Tenant, User
from app.core.errors import ValidationError, ExternalServiceError

logger = logging.getLogger(__name__)


class OAuthConfig:
    """OAuth configuration for each platform"""

    PLATFORMS = {
        "instagram": {
            "auth_url": "https://api.instagram.com/oauth/authorize",
            "token_url": "https://api.instagram.com/oauth/access_token",
            "long_lived_token_url": "https://graph.instagram.com/access_token",
            "scopes": [
                "instagram_basic",
                "instagram_content_publish",
                "instagram_manage_comments",
                "instagram_manage_insights",
            ],
            "client_id_env": "INSTAGRAM_APP_ID",
            "client_secret_env": "INSTAGRAM_APP_SECRET",
        },
        "facebook": {
            "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "scopes": [
                "pages_manage_posts",
                "pages_read_engagement",
                "pages_show_list",
                "pages_read_user_content",
            ],
            "client_id_env": "FACEBOOK_APP_ID",
            "client_secret_env": "FACEBOOK_APP_SECRET",
        },
        "linkedin": {
            "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "scopes": [
                "w_member_social",
                "r_organization_social",
                "rw_organization_admin",
            ],
            "client_id_env": "LINKEDIN_CLIENT_ID",
            "client_secret_env": "LINKEDIN_CLIENT_SECRET",
        },
        "youtube": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "scopes": [
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube.readonly",
            ],
            "client_id_env": "YOUTUBE_CLIENT_ID",
            "client_secret_env": "YOUTUBE_CLIENT_SECRET",
        },
        "tiktok": {
            "auth_url": "https://www.tiktok.com/v2/auth/authorize/",
            "token_url": "https://open.tiktokapis.com/v2/oauth/token/",
            "scopes": ["user.info.basic", "video.list", "video.upload"],
            "client_id_env": "TIKTOK_CLIENT_KEY",
            "client_secret_env": "TIKTOK_CLIENT_SECRET",
        },
        "immoscout24": {
            "auth_url": "https://rest.immobilienscout24.de/restapi/security/oauth/authorize",
            "token_url": "https://rest.immobilienscout24.de/restapi/security/oauth/access_token",
            "scopes": [],
            "client_id_env": "IMMOSCOUT_CLIENT_ID",
            "client_secret_env": "IMMOSCOUT_CLIENT_SECRET",
        },
        "immowelt": {
            "auth_url": "https://api.immowelt.com/auth/oauth2/authorize",
            "token_url": "https://api.immowelt.com/auth/oauth2/token",
            "scopes": ["properties.read", "properties.write", "statistics.read"],
            "client_id_env": "IMMOWELT_CLIENT_ID",
            "client_secret_env": "IMMOWELT_CLIENT_SECRET",
        },
    }

    @classmethod
    def get_platform_config(cls, platform: str) -> Dict[str, Any]:
        """Get OAuth config for a platform"""
        if platform not in cls.PLATFORMS:
            raise ValidationError(f"Unsupported platform: {platform}")
        return cls.PLATFORMS[platform]

    @classmethod
    def get_credentials(cls, platform: str) -> Tuple[str, str]:
        """Get client credentials for a platform"""
        config = cls.get_platform_config(platform)
        client_id = os.getenv(config["client_id_env"])
        client_secret = os.getenv(config["client_secret_env"])

        if not client_id or not client_secret:
            raise ValidationError(f"OAuth credentials not configured for {platform}")

        return client_id, client_secret


class OAuthService:
    """Service for managing OAuth2 flows across platforms"""

    # In-memory state store (should use Redis in production)
    _state_store: Dict[str, Dict[str, Any]] = {}

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

        # Initialize encryption
        encryption_key = os.getenv("SOCIAL_ENCRYPTION_KEY")
        if not encryption_key:
            encryption_key = Fernet.generate_key().decode()
            logger.warning("SOCIAL_ENCRYPTION_KEY not set, using generated key")

        self.cipher = Fernet(
            encryption_key.encode()
            if isinstance(encryption_key, str)
            else encryption_key
        )

    def _encrypt_token(self, token: str) -> str:
        """Encrypt a token for storage"""
        return self.cipher.encrypt(token.encode()).decode()

    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a stored token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()

    def generate_oauth_url(
        self,
        platform: str,
        redirect_uri: str,
        user_id: str,
        account_label: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Generate OAuth authorization URL for a platform

        Returns:
            Dict with 'url' and 'state' keys
        """
        config = OAuthConfig.get_platform_config(platform)
        client_id, _ = OAuthConfig.get_credentials(platform)

        # Generate state token
        state = secrets.token_urlsafe(32)

        # Store state with metadata (expires in 10 minutes)
        self._state_store[state] = {
            "platform": platform,
            "tenant_id": self.tenant_id,
            "user_id": user_id,
            "account_label": account_label,
            "redirect_uri": redirect_uri,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
        }

        # Build authorization URL
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "response_type": "code",
        }

        # Platform-specific parameters
        if platform == "instagram":
            params["scope"] = ",".join(config["scopes"])
        elif platform == "facebook":
            params["scope"] = ",".join(config["scopes"])
        elif platform == "linkedin":
            params["scope"] = " ".join(config["scopes"])
        elif platform == "youtube":
            params["scope"] = " ".join(config["scopes"])
            params["access_type"] = "offline"
            params["prompt"] = "consent"
        elif platform == "tiktok":
            params["scope"] = ",".join(config["scopes"])
            params["client_key"] = client_id
            del params["client_id"]

        auth_url = f"{config['auth_url']}?{urlencode(params)}"

        return {"url": auth_url, "state": state}

    def validate_state(self, state: str) -> Dict[str, Any]:
        """Validate and consume a state token"""
        if state not in self._state_store:
            raise ValidationError("Invalid or expired state token")

        state_data = self._state_store[state]

        # Check expiration
        if datetime.utcnow() > state_data["expires_at"]:
            del self._state_store[state]
            raise ValidationError("State token expired")

        # Consume state (one-time use)
        del self._state_store[state]

        return state_data

    async def exchange_code_for_token(
        self, platform: str, code: str, redirect_uri: str
    ) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        config = OAuthConfig.get_platform_config(platform)
        client_id, client_secret = OAuthConfig.get_credentials(platform)

        async with httpx.AsyncClient() as client:
            if platform == "instagram":
                # Instagram uses form data
                response = await client.post(
                    config["token_url"],
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                        "code": code,
                    },
                )
            elif platform == "tiktok":
                # TikTok uses JSON
                response = await client.post(
                    config["token_url"],
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "client_key": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                )
            elif platform == "linkedin":
                response = await client.post(
                    config["token_url"],
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                )
            else:
                # Default: POST with form data
                response = await client.post(
                    config["token_url"],
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                )

            if response.status_code != 200:
                logger.error(f"Token exchange failed for {platform}: {response.text}")
                raise ExternalServiceError(
                    f"Failed to exchange code for token: {response.text}"
                )

            token_data = response.json()

            # Normalize token response
            return self._normalize_token_response(platform, token_data)

    def _normalize_token_response(
        self, platform: str, token_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Normalize token response across platforms"""
        if platform == "instagram":
            return {
                "access_token": token_data.get("access_token"),
                "user_id": str(token_data.get("user_id")),
                "token_type": "bearer",
                "expires_in": token_data.get("expires_in", 3600),
            }
        elif platform == "tiktok":
            return {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "user_id": token_data.get("open_id"),
                "token_type": "bearer",
                "expires_in": token_data.get("expires_in", 86400),
            }
        elif platform == "linkedin":
            return {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "token_type": "bearer",
                "expires_in": token_data.get("expires_in", 5184000),  # 60 days
            }
        elif platform == "youtube":
            return {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "token_type": "bearer",
                "expires_in": token_data.get("expires_in", 3600),
            }
        else:
            return {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "token_type": token_data.get("token_type", "bearer"),
                "expires_in": token_data.get("expires_in", 3600),
            }

    async def get_instagram_long_lived_token(
        self, short_lived_token: str
    ) -> Dict[str, Any]:
        """Exchange short-lived Instagram token for long-lived token"""
        config = OAuthConfig.get_platform_config("instagram")
        _, client_secret = OAuthConfig.get_credentials("instagram")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                config["long_lived_token_url"],
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": client_secret,
                    "access_token": short_lived_token,
                },
            )

            if response.status_code != 200:
                logger.error(f"Long-lived token exchange failed: {response.text}")
                raise ExternalServiceError("Failed to get long-lived token")

            data = response.json()
            return {
                "access_token": data.get("access_token"),
                "token_type": "bearer",
                "expires_in": data.get("expires_in", 5184000),  # 60 days
            }

    async def get_account_info(
        self, platform: str, access_token: str
    ) -> Dict[str, Any]:
        """Get user account info from platform API"""
        async with httpx.AsyncClient() as client:
            if platform == "instagram":
                response = await client.get(
                    "https://graph.instagram.com/me",
                    params={
                        "fields": "id,username,account_type,media_count",
                        "access_token": access_token,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "account_id": data.get("id"),
                        "account_name": data.get("username"),
                        "account_type": data.get("account_type"),
                        "media_count": data.get("media_count"),
                    }

            elif platform == "facebook":
                # Get pages the user manages
                response = await client.get(
                    "https://graph.facebook.com/v18.0/me/accounts",
                    params={"access_token": access_token},
                )
                if response.status_code == 200:
                    data = response.json()
                    pages = data.get("data", [])
                    if pages:
                        # Return first page info
                        page = pages[0]
                        return {
                            "account_id": page.get("id"),
                            "account_name": page.get("name"),
                            "access_token": page.get(
                                "access_token"
                            ),  # Page access token
                            "pages": pages,
                        }

            elif platform == "linkedin":
                response = await client.get(
                    "https://api.linkedin.com/v2/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "account_id": data.get("id"),
                        "account_name": f"{data.get('localizedFirstName', '')} {data.get('localizedLastName', '')}".strip(),
                    }

            elif platform == "youtube":
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={
                        "part": "snippet,statistics",
                        "mine": "true",
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("items", [])
                    if items:
                        channel = items[0]
                        return {
                            "account_id": channel.get("id"),
                            "account_name": channel.get("snippet", {}).get("title"),
                            "subscriber_count": channel.get("statistics", {}).get(
                                "subscriberCount"
                            ),
                        }

            elif platform == "tiktok":
                response = await client.get(
                    "https://open.tiktokapis.com/v2/user/info/",
                    params={"fields": "open_id,union_id,avatar_url,display_name"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("data", {}).get("user", {})
                    return {
                        "account_id": user_data.get("open_id"),
                        "account_name": user_data.get("display_name"),
                        "avatar_url": user_data.get("avatar_url"),
                    }

        raise ExternalServiceError(f"Failed to get account info from {platform}")

    async def save_connected_account(
        self,
        platform: str,
        token_data: Dict[str, Any],
        account_info: Dict[str, Any],
        user_id: str,
        account_label: Optional[str] = None,
    ) -> SocialAccount:
        """Save connected account to database"""

        # Calculate token expiration
        expires_in = token_data.get("expires_in", 3600)
        token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        # Encrypt tokens
        encrypted_access_token = self._encrypt_token(token_data["access_token"])
        encrypted_refresh_token = None
        if token_data.get("refresh_token"):
            encrypted_refresh_token = self._encrypt_token(token_data["refresh_token"])

        # Use account label or default name
        account_name = account_label or account_info.get(
            "account_name", f"{platform.title()} Account"
        )

        # Check for existing account with same platform and account_id
        existing_account = await sync_to_async(
            SocialAccount.objects.filter(
                tenant_id=self.tenant_id,
                platform=platform,
                account_id=account_info.get("account_id", ""),
            ).first
        )()

        if existing_account:
            # Update existing account
            existing_account.access_token = encrypted_access_token
            existing_account.refresh_token = encrypted_refresh_token
            existing_account.token_expires_at = token_expires_at
            existing_account.account_name = account_name
            existing_account.is_active = True
            existing_account.last_sync_at = datetime.utcnow()
            await sync_to_async(existing_account.save)()
            return existing_account

        # Create new account
        account = await sync_to_async(SocialAccount.objects.create)(
            tenant_id=self.tenant_id,
            platform=platform,
            account_id=account_info.get("account_id", ""),
            account_name=account_name,
            access_token=encrypted_access_token,
            refresh_token=encrypted_refresh_token,
            token_expires_at=token_expires_at,
            is_active=True,
            created_by_id=user_id,
            last_sync_at=datetime.utcnow(),
        )

        return account

    async def refresh_token(self, account: SocialAccount) -> SocialAccount:
        """Refresh access token for an account"""
        if not account.refresh_token:
            raise ValidationError("No refresh token available")

        platform = account.platform
        config = OAuthConfig.get_platform_config(platform)
        client_id, client_secret = OAuthConfig.get_credentials(platform)

        decrypted_refresh_token = self._decrypt_token(account.refresh_token)

        async with httpx.AsyncClient() as client:
            if platform == "instagram":
                # Instagram refresh endpoint
                response = await client.get(
                    "https://graph.instagram.com/refresh_access_token",
                    params={
                        "grant_type": "ig_refresh_token",
                        "access_token": self._decrypt_token(account.access_token),
                    },
                )
            else:
                response = await client.post(
                    config["token_url"],
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": decrypted_refresh_token,
                        "grant_type": "refresh_token",
                    },
                )

            if response.status_code != 200:
                logger.error(f"Token refresh failed for {platform}: {response.text}")
                raise ExternalServiceError(f"Failed to refresh token: {response.text}")

            token_data = response.json()

            # Update account with new token
            account.access_token = self._encrypt_token(token_data.get("access_token"))
            if token_data.get("refresh_token"):
                account.refresh_token = self._encrypt_token(token_data["refresh_token"])

            expires_in = token_data.get("expires_in", 3600)
            account.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            account.last_sync_at = datetime.utcnow()

            await sync_to_async(account.save)()

            return account
