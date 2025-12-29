"""
Profile Management API
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, EmailStr, Field
from asgiref.sync import sync_to_async

from app.db.models import User, UserProfile, Notification
from app.api.v1.auth import get_current_user
from app.schemas.auth import UserResponse


router = APIRouter()


# Request/Response Schemas
class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    language: Optional[str] = Field(None, description="Language code (de, en)")
    timezone: Optional[str] = Field(None, description="Timezone (Europe/Berlin)")
    date_format: Optional[str] = Field(None, description="Date format preference")
    currency: Optional[str] = Field(None, description="Currency code (EUR, USD)")
    theme: Optional[str] = Field(None, description="UI theme (light, dark, auto)")


class NotificationPreferencesRequest(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    task_reminders: Optional[bool] = None
    property_updates: Optional[bool] = None
    system_announcements: Optional[bool] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ApiTokenRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    scopes: List[str] = Field(default_factory=list)
    expires_in_days: Optional[int] = Field(90, ge=1, le=365)


class ApiTokenResponse(BaseModel):
    id: str
    name: str
    token: str
    scopes: List[str]
    created_at: str
    expires_at: Optional[str]
    last_used_at: Optional[str]


class LinkedAccountResponse(BaseModel):
    id: str
    provider: str
    provider_account_id: str
    email: Optional[str]
    connected_at: str
    last_sync: Optional[str]


# Endpoints


@router.get("/me/profile", response_model=Dict[str, Any])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's full profile"""

    @sync_to_async
    def get_profile_data():
        try:
            profile = current_user.profile
        except UserProfile.DoesNotExist:
            profile = None

        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": getattr(profile, "phone", None) if profile else None,
            "avatar": (
                getattr(profile, "avatar", None) if profile else current_user.avatar
            ),
            "bio": getattr(profile, "bio", None) if profile else None,
            "company": getattr(profile, "company", None) if profile else None,
            "position": getattr(profile, "position", None) if profile else None,
            "location": getattr(profile, "location", None) if profile else None,
            "website": getattr(profile, "website", None) if profile else None,
            "role": getattr(profile, "role", None) if profile else None,
            "language": getattr(profile, "language", "de") if profile else "de",
            "timezone": (
                getattr(profile, "timezone", "Europe/Berlin")
                if profile
                else "Europe/Berlin"
            ),
            "date_format": (
                getattr(profile, "date_format", "DD.MM.YYYY")
                if profile
                else "DD.MM.YYYY"
            ),
            "currency": getattr(profile, "currency", "EUR") if profile else "EUR",
            "theme": getattr(profile, "theme", "light") if profile else "light",
            "email_notifications": (
                getattr(profile, "email_notifications", True) if profile else True
            ),
            "push_notifications": (
                getattr(profile, "push_notifications", True) if profile else True
            ),
            "sms_notifications": (
                getattr(profile, "sms_notifications", False) if profile else False
            ),
            "marketing_emails": (
                getattr(profile, "marketing_emails", False) if profile else False
            ),
            "is_verified": current_user.is_verified,
            "is_active": current_user.is_active,
            "date_joined": current_user.date_joined.isoformat(),
            "last_login": (
                current_user.last_login.isoformat() if current_user.last_login else None
            ),
        }

    return await get_profile_data()


@router.patch("/me/profile", response_model=Dict[str, Any])
async def update_my_profile(
    data: ProfileUpdateRequest, current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""

    @sync_to_async
    def update_profile():
        # Update User model fields
        if data.first_name is not None:
            current_user.first_name = data.first_name
        if data.last_name is not None:
            current_user.last_name = data.last_name

        current_user.save(update_fields=["first_name", "last_name"])

        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=current_user)

        # Update profile fields
        if data.phone is not None:
            profile.phone = data.phone
        if data.bio is not None:
            profile.bio = data.bio
        if data.company is not None:
            profile.company = data.company
        if data.position is not None:
            profile.position = data.position
        if data.location is not None:
            profile.location = data.location
        if data.website is not None:
            profile.website = data.website

        profile.save()

        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": profile.phone,
            "bio": profile.bio,
            "company": profile.company,
            "position": profile.position,
            "location": profile.location,
            "website": profile.website,
            "avatar": profile.avatar or current_user.avatar,
        }

    return await update_profile()


@router.patch("/me/preferences", response_model=Dict[str, Any])
async def update_preferences(
    data: PreferencesUpdateRequest, current_user: User = Depends(get_current_user)
):
    """Update user preferences"""

    @sync_to_async
    def update_prefs():
        profile, created = UserProfile.objects.get_or_create(user=current_user)

        if data.language is not None:
            profile.language = data.language
        if data.timezone is not None:
            profile.timezone = data.timezone
        if data.date_format is not None:
            profile.date_format = data.date_format
        if data.currency is not None:
            profile.currency = data.currency
        if data.theme is not None:
            profile.theme = data.theme

        profile.save()

        return {
            "language": profile.language,
            "timezone": profile.timezone,
            "date_format": profile.date_format,
            "currency": profile.currency,
            "theme": profile.theme,
        }

    return await update_prefs()


@router.patch("/me/notifications", response_model=Dict[str, Any])
async def update_notification_preferences(
    data: NotificationPreferencesRequest, current_user: User = Depends(get_current_user)
):
    """Update notification preferences"""

    @sync_to_async
    def update_notif_prefs():
        profile, created = UserProfile.objects.get_or_create(user=current_user)

        if data.email_notifications is not None:
            profile.email_notifications = data.email_notifications
        if data.push_notifications is not None:
            profile.push_notifications = data.push_notifications
        if data.sms_notifications is not None:
            profile.sms_notifications = data.sms_notifications
        if data.marketing_emails is not None:
            profile.marketing_emails = data.marketing_emails

        # Store additional preferences in JSON field if available
        if hasattr(profile, "notification_settings"):
            settings = profile.notification_settings or {}
            if data.task_reminders is not None:
                settings["task_reminders"] = data.task_reminders
            if data.property_updates is not None:
                settings["property_updates"] = data.property_updates
            if data.system_announcements is not None:
                settings["system_announcements"] = data.system_announcements
            profile.notification_settings = settings

        profile.save()

        return {
            "email_notifications": profile.email_notifications,
            "push_notifications": profile.push_notifications,
            "sms_notifications": profile.sms_notifications,
            "marketing_emails": profile.marketing_emails,
            "task_reminders": data.task_reminders,
            "property_updates": data.property_updates,
            "system_announcements": data.system_announcements,
        }

    return await update_notif_prefs()


@router.post("/me/change-password")
async def change_password(
    data: PasswordChangeRequest, current_user: User = Depends(get_current_user)
):
    """Change user password"""
    from django.contrib.auth.hashers import check_password, make_password

    @sync_to_async
    def change_pwd():
        # Verify current password
        if not check_password(data.current_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # Set new password
        current_user.password = make_password(data.new_password)
        current_user.save(update_fields=["password"])

        return {"message": "Password changed successfully"}

    return await change_pwd()


@router.post("/me/avatar", response_model=Dict[str, str])
async def upload_avatar(
    file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    """Upload user avatar"""
    import os
    import uuid
    from pathlib import Path

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image"
        )

    # Save file
    uploads_dir = Path("uploads/avatars")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = uploads_dir / file_name

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    avatar_url = f"/uploads/avatars/{file_name}"

    @sync_to_async
    def update_avatar():
        profile, created = UserProfile.objects.get_or_create(user=current_user)
        profile.avatar = avatar_url
        profile.save()
        return avatar_url

    url = await update_avatar()

    return {"avatar_url": url}


@router.get("/me/api-tokens", response_model=List[Dict[str, Any]])
async def list_api_tokens(current_user: User = Depends(get_current_user)):
    """List user's API tokens"""
    # TODO: Implement API token system
    return []


@router.post("/me/api-tokens", response_model=ApiTokenResponse)
async def create_api_token(
    data: ApiTokenRequest, current_user: User = Depends(get_current_user)
):
    """Create new API token"""
    # TODO: Implement API token creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="API token system not yet implemented",
    )


@router.delete("/me/api-tokens/{token_id}")
async def delete_api_token(
    token_id: str, current_user: User = Depends(get_current_user)
):
    """Delete API token"""
    # TODO: Implement API token deletion
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="API token system not yet implemented",
    )


@router.get("/me/linked-accounts", response_model=List[LinkedAccountResponse])
async def list_linked_accounts(current_user: User = Depends(get_current_user)):
    """List linked social accounts"""
    # TODO: Implement linked accounts system
    return []


@router.delete("/me/linked-accounts/{provider}")
async def unlink_account(provider: str, current_user: User = Depends(get_current_user)):
    """Unlink social account"""
    # TODO: Implement account unlinking
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Linked accounts system not yet implemented",
    )
