"""
Profile Management API Endpoints
Handles user profile data, preferences, and settings
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from asgiref.sync import sync_to_async
from pydantic import BaseModel, Field
from datetime import datetime
from django.utils import timezone
import uuid

from app.services.auth_service import AuthService
from app.core.errors import UnauthorizedError, NotFoundError
from app.db.models import User, TenantUser, NotificationPreference, AuditLog

router = APIRouter(prefix="/profile")
security = HTTPBearer()


# ============================================================================
# SCHEMAS
# ============================================================================

class ProfileUpdateRequest(BaseModel):
    """Request schema for updating user profile"""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)


class ProfileResponse(BaseModel):
    """Response schema for user profile"""
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    avatar: Optional[str]
    language: str
    timezone: str
    email_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    google_id: Optional[str]
    
    model_config = {"from_attributes": True}


class NotificationPreferencesRequest(BaseModel):
    """Request schema for notification preferences"""
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    property_updates: Optional[bool] = None
    task_reminders: Optional[bool] = None
    appointment_reminders: Optional[bool] = None
    marketing_emails: Optional[bool] = None


class NotificationPreferencesResponse(BaseModel):
    """Response schema for notification preferences"""
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    property_updates: bool
    task_reminders: bool
    appointment_reminders: bool
    marketing_emails: bool
    
    model_config = {"from_attributes": True}


class PasswordChangeRequest(BaseModel):
    """Request schema for password change"""
    current_password: str
    new_password: str = Field(..., min_length=8)


class ActivityLogResponse(BaseModel):
    """Response schema for activity logs"""
    id: uuid.UUID
    action: str
    resource_type: str
    resource_id: str
    timestamp: datetime
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        user = await AuthService.get_current_user(token)
        return user
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_tenant_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TenantUser:
    """Get current user's tenant membership from JWT token"""
    try:
        token = credentials.credentials
        payload = AuthService.decode_token(token)
        
        @sync_to_async
        def get_tenant_membership():
            return TenantUser.objects.select_related('user', 'tenant').get(
                user__id=payload.sub,
                tenant__id=payload.tenant_id,
                is_active=True
            )
        
        tenant_user = await get_tenant_membership()
        return tenant_user
    except TenantUser.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant membership not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# PROFILE ENDPOINTS
# ============================================================================

@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get user profile",
    description="Get current user's profile information"
)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return ProfileResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=ProfileResponse,
    summary="Update user profile",
    description="Update current user's profile information"
)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    try:
        # Update only provided fields
        update_data = profile_data.model_dump(exclude_unset=True)
        
        @sync_to_async
        def update_user():
            for field, value in update_data.items():
                setattr(current_user, field, value)
            current_user.save()
            return current_user
        
        updated_user = await update_user()
        return ProfileResponse.model_validate(updated_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post(
    "/me/avatar",
    summary="Upload profile avatar",
    description="Upload a new profile avatar image"
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile avatar"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # In a real implementation, you would upload to cloud storage
        # For now, we'll just return a placeholder URL
        avatar_url = f"/media/avatars/{current_user.id}_{file.filename}"
        
        @sync_to_async
        def update_avatar():
            current_user.avatar = avatar_url
            current_user.save()
            return current_user
        
        await update_avatar()
        
        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )


@router.delete(
    "/me/avatar",
    summary="Remove profile avatar",
    description="Remove current profile avatar"
)
async def remove_avatar(current_user: User = Depends(get_current_user)):
    """Remove profile avatar"""
    try:
        @sync_to_async
        def remove_avatar():
            current_user.avatar = None
            current_user.save()
            return current_user
        
        await remove_avatar()
        
        return {"message": "Avatar removed successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove avatar: {str(e)}"
        )


# ============================================================================
# PASSWORD MANAGEMENT
# ============================================================================

@router.post(
    "/me/password",
    summary="Change password",
    description="Change user password"
)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        # Verify current password
        if not current_user.check_password(password_data.current_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        @sync_to_async
        def update_password():
            current_user.set_password(password_data.new_password)
            current_user.save()
        
        await update_password()
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


# ============================================================================
# NOTIFICATION PREFERENCES
# ============================================================================

@router.get(
    "/me/notifications",
    response_model=NotificationPreferencesResponse,
    summary="Get notification preferences",
    description="Get user's notification preferences"
)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    tenant_user: TenantUser = Depends(get_current_tenant_user)
):
    """Get user's notification preferences"""
    try:
        @sync_to_async
        def get_preferences():
            # Get all notification preferences for this user/tenant
            preferences = NotificationPreference.objects.filter(
                user=current_user,
                tenant=tenant_user.tenant
            )
            
            # Create default preferences if none exist
            if not preferences.exists():
                # Create default preferences for all categories
                categories = ['system', 'property', 'contact', 'task', 'appointment', 'document', 'financial', 'message', 'team', 'cim']
                for category in categories:
                    NotificationPreference.objects.create(
                        user=current_user,
                        tenant=tenant_user.tenant,
                        category=category,
                        enabled=True,
                        email_enabled=True,
                        push_enabled=True,
                        in_app_enabled=True,
                        min_priority='low'
                    )
                preferences = NotificationPreference.objects.filter(
                    user=current_user,
                    tenant=tenant_user.tenant
                )
            
            # Convert to simple format for profile
            return {
                'email_notifications': preferences.filter(email_enabled=True).exists(),
                'push_notifications': preferences.filter(push_enabled=True).exists(),
                'sms_notifications': False,  # Not implemented yet
                'property_updates': preferences.filter(category='property', enabled=True).exists(),
                'task_reminders': preferences.filter(category='task', enabled=True).exists(),
                'appointment_reminders': preferences.filter(category='appointment', enabled=True).exists(),
                'marketing_emails': False,  # Not implemented yet
            }
        
        preferences_data = await get_preferences()
        return NotificationPreferencesResponse.model_validate(preferences_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notification preferences: {str(e)}"
        )


@router.put(
    "/me/notifications",
    response_model=NotificationPreferencesResponse,
    summary="Update notification preferences",
    description="Update user's notification preferences"
)
async def update_notification_preferences(
    preferences_data: NotificationPreferencesRequest,
    current_user: User = Depends(get_current_user),
    tenant_user: TenantUser = Depends(get_current_tenant_user)
):
    """Update user's notification preferences"""
    try:
        @sync_to_async
        def update_preferences():
            # Get all notification preferences for this user/tenant
            preferences = NotificationPreference.objects.filter(
                user=current_user,
                tenant=tenant_user.tenant
            )
            
            # Create default preferences if none exist
            if not preferences.exists():
                categories = ['system', 'property', 'contact', 'task', 'appointment', 'document', 'financial', 'message', 'team', 'cim']
                for category in categories:
                    NotificationPreference.objects.create(
                        user=current_user,
                        tenant=tenant_user.tenant,
                        category=category,
                        enabled=True,
                        email_enabled=True,
                        push_enabled=True,
                        in_app_enabled=True,
                        min_priority='low'
                    )
                preferences = NotificationPreference.objects.filter(
                    user=current_user,
                    tenant=tenant_user.tenant
                )
            
            # Update preferences based on the request
            update_data = preferences_data.model_dump(exclude_unset=True)
            
            # Update email preferences
            if 'email_notifications' in update_data:
                email_enabled = update_data['email_notifications']
                preferences.update(email_enabled=email_enabled)
            
            # Update push preferences
            if 'push_notifications' in update_data:
                push_enabled = update_data['push_notifications']
                preferences.update(push_enabled=push_enabled)
            
            # Update category-specific preferences
            if 'property_updates' in update_data:
                property_enabled = update_data['property_updates']
                preferences.filter(category='property').update(enabled=property_enabled)
            
            if 'task_reminders' in update_data:
                task_enabled = update_data['task_reminders']
                preferences.filter(category='task').update(enabled=task_enabled)
            
            if 'appointment_reminders' in update_data:
                appointment_enabled = update_data['appointment_reminders']
                preferences.filter(category='appointment').update(enabled=appointment_enabled)
            
            # Return updated preferences in simple format
            return {
                'email_notifications': preferences.filter(email_enabled=True).exists(),
                'push_notifications': preferences.filter(push_enabled=True).exists(),
                'sms_notifications': False,  # Not implemented yet
                'property_updates': preferences.filter(category='property', enabled=True).exists(),
                'task_reminders': preferences.filter(category='task', enabled=True).exists(),
                'appointment_reminders': preferences.filter(category='appointment', enabled=True).exists(),
                'marketing_emails': False,  # Not implemented yet
            }
        
        preferences_data = await update_preferences()
        return NotificationPreferencesResponse.model_validate(preferences_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification preferences: {str(e)}"
        )


# ============================================================================
# ACTIVITY LOGS
# ============================================================================

@router.get(
    "/me/activity",
    response_model=list[ActivityLogResponse],
    summary="Get user activity logs",
    description="Get user's recent activity logs"
)
async def get_activity_logs(
    current_user: User = Depends(get_current_user),
    tenant_user: TenantUser = Depends(get_current_tenant_user),
    limit: int = 20
):
    """Get user's activity logs"""
    try:
        @sync_to_async
        def get_logs():
            return list(AuditLog.objects.filter(
                user=current_user,
                tenant=tenant_user.tenant
            ).order_by('-timestamp')[:limit])
        
        logs = await get_logs()
        return [ActivityLogResponse.model_validate(log) for log in logs]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activity logs: {str(e)}"
        )


# ============================================================================
# ACCOUNT MANAGEMENT
# ============================================================================

@router.post(
    "/me/deactivate",
    summary="Deactivate account",
    description="Deactivate user account"
)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    tenant_user: TenantUser = Depends(get_current_tenant_user)
):
    """Deactivate user account"""
    try:
        @sync_to_async
        def deactivate():
            # Deactivate tenant membership
            tenant_user.is_active = False
            tenant_user.save()
            
            # If user has no other active memberships, deactivate user
            active_memberships = TenantUser.objects.filter(
                user=current_user,
                is_active=True
            ).count()
            
            if active_memberships == 0:
                current_user.is_active = False
                current_user.save()
        
        await deactivate()
        
        return {"message": "Account deactivated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate account: {str(e)}"
        )


@router.get(
    "/me/stats",
    summary="Get user statistics",
    description="Get user's statistics and metrics"
)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    tenant_user: TenantUser = Depends(get_current_tenant_user)
):
    """Get user's statistics"""
    try:
        @sync_to_async
        def get_stats():
            from app.db.models import Property, Contact, Task, Appointment
            
            stats = {
                'properties_managed': Property.objects.filter(
                    tenant=tenant_user.tenant,
                    assigned_to=current_user
                ).count(),
                'contacts_managed': Contact.objects.filter(
                    tenant=tenant_user.tenant,
                    assigned_to=current_user
                ).count(),
                'tasks_completed': Task.objects.filter(
                    tenant=tenant_user.tenant,
                    assigned_to=current_user,
                    status='completed'
                ).count(),
                'appointments_scheduled': Appointment.objects.filter(
                    tenant=tenant_user.tenant,
                    attendees__user=current_user
                ).count(),
                'account_age_days': (timezone.now() - current_user.created_at).days,
                'last_login_days_ago': (timezone.now() - current_user.last_login).days if current_user.last_login else None,
            }
            return stats
        
        stats = await get_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user stats: {str(e)}"
        )
