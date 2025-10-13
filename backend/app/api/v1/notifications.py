"""
Notification API Endpoints
Vollständige CRUD-Operationen für Benachrichtigungen
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from django.db.models import Q, Count
from django.utils import timezone

from app.api.deps import get_current_user, get_tenant_id
from app.core.security import TokenData
from app.models import User, Tenant, Notification, NotificationPreference
from app.schemas.notification import (
    NotificationResponse,
    NotificationCreate,
    NotificationUpdate,
    NotificationBulkAction,
    NotificationMarkAsRead,
    NotificationListResponse,
    NotificationStats,
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
    NotificationPreferencesBulk,
    NotificationType,
    NotificationCategory,
    NotificationPriority,
)
from app.core.pagination import paginate

router = APIRouter()


def get_tenant(tenant_id: str = Depends(get_tenant_id)) -> Tenant:
    """Get tenant object from tenant_id"""
    try:
        return Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    read: Optional[bool] = None,
    archived: Optional[bool] = Query(False),
    category: Optional[NotificationCategory] = None,
    priority: Optional[NotificationPriority] = None,
    type: Optional[NotificationType] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    include_stats: bool = Query(False),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """
    Get paginated list of notifications for current user
    
    - **read**: Filter by read status (true/false/null for all)
    - **archived**: Show archived notifications (default: false)
    - **category**: Filter by category
    - **priority**: Filter by priority
    - **type**: Filter by type
    - **from_date**: Filter notifications from this date
    - **to_date**: Filter notifications until this date
    - **include_stats**: Include statistics in response
    """
    # Build query
    query = Q(tenant=tenant, user=current_user)
    
    if read is not None:
        query &= Q(read=read)
    
    query &= Q(archived=archived)
    
    if category:
        query &= Q(category=category.value)
    
    if priority:
        query &= Q(priority=priority.value)
    
    if type:
        query &= Q(type=type.value)
    
    if from_date:
        query &= Q(created_at__gte=from_date)
    
    if to_date:
        query &= Q(created_at__lte=to_date)
    
    # Get notifications
    queryset = Notification.objects.filter(query).order_by('-created_at')
    
    # Paginate
    paginated = paginate(queryset, page, size)
    
    # Convert to response
    notifications = [
        NotificationResponse.model_validate(notif)
        for notif in paginated['items']
    ]
    
    response = NotificationListResponse(
        items=notifications,
        total=paginated['total'],
        page=page,
        size=size,
        pages=paginated['pages'],
        has_next=paginated['has_next'],
        has_prev=paginated['has_prev'],
    )
    
    # Add stats if requested
    if include_stats:
        all_notifications = Notification.objects.filter(
            tenant=tenant,
            user=current_user,
            archived=False
        )
        
        total = all_notifications.count()
        unread = all_notifications.filter(read=False).count()
        
        by_category = {}
        for cat in NotificationCategory:
            count = all_notifications.filter(category=cat.value).count()
            if count > 0:
                by_category[cat.value] = count
        
        by_priority = {}
        for prio in NotificationPriority:
            count = all_notifications.filter(priority=prio.value).count()
            if count > 0:
                by_priority[prio.value] = count
        
        by_type = {}
        for ntype in NotificationType:
            count = all_notifications.filter(type=ntype.value).count()
            if count > 0:
                by_type[ntype.value] = count
        
        response.stats = NotificationStats(
            total=total,
            unread=unread,
            by_category=by_category,
            by_priority=by_priority,
            by_type=by_type,
        )
    
    return response


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Get count of unread notifications"""
    count = Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        read=False,
        archived=False
    ).count()
    
    return {"count": count}


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Get notification statistics"""
    notifications = Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        archived=False
    )
    
    total = notifications.count()
    unread = notifications.filter(read=False).count()
    
    by_category = {}
    for cat in NotificationCategory:
        count = notifications.filter(category=cat.value).count()
        if count > 0:
            by_category[cat.value] = count
    
    by_priority = {}
    for prio in NotificationPriority:
        count = notifications.filter(priority=prio.value).count()
        if count > 0:
            by_priority[prio.value] = count
    
    by_type = {}
    for ntype in NotificationType:
        count = notifications.filter(type=ntype.value).count()
        if count > 0:
            by_type[ntype.value] = count
    
    return NotificationStats(
        total=total,
        unread=unread,
        by_category=by_category,
        by_priority=by_priority,
        by_type=by_type,
    )


@router.post("", response_model=NotificationResponse, status_code=201)
async def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """
    Create a new notification
    (Usually called by system or other services, not directly by users)
    """
    # Verify target user exists and belongs to tenant
    try:
        target_user = User.objects.get(id=data.user_id, tenantuser__tenant=tenant)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found"
        )
    
    notification = Notification.objects.create(
        tenant=tenant,
        user=target_user,
        type=data.type.value,
        category=data.category.value,
        priority=data.priority.value,
        title=data.title,
        message=data.message,
        action_url=data.action_url,
        action_label=data.action_label,
        related_entity_type=data.related_entity_type,
        related_entity_id=data.related_entity_id,
        related_entity_title=data.related_entity_title,
        metadata=data.metadata,
        expires_at=data.expires_at,
        created_by=current_user,
    )
    
    return NotificationResponse.model_validate(notification)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Get a specific notification"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            tenant=tenant,
            user=current_user
        )
    except Notification.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Update notification (mark as read/unread, archive)"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            tenant=tenant,
            user=current_user
        )
    except Notification.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if data.read is not None:
        if data.read:
            notification.mark_as_read()
        else:
            notification.mark_as_unread()
    
    if data.archived is not None:
        if data.archived:
            notification.archive()
        else:
            notification.archived = False
            notification.archived_at = None
            notification.save(update_fields=['archived', 'archived_at', 'updated_at'])
    
    notification.refresh_from_db()
    return NotificationResponse.model_validate(notification)


@router.post("/mark-as-read", response_model=dict)
async def mark_notifications_as_read(
    data: NotificationMarkAsRead,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Mark multiple notifications as read"""
    updated = Notification.objects.filter(
        id__in=data.notification_ids,
        tenant=tenant,
        user=current_user,
        read=False
    ).update(
        read=True,
        read_at=timezone.now(),
        updated_at=timezone.now()
    )
    
    return {"updated": updated, "message": f"{updated} notifications marked as read"}


@router.post("/mark-all-as-read", response_model=dict)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Mark all unread notifications as read"""
    updated = Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        read=False,
        archived=False
    ).update(
        read=True,
        read_at=timezone.now(),
        updated_at=timezone.now()
    )
    
    return {"updated": updated, "message": f"All {updated} notifications marked as read"}


@router.post("/bulk-action", response_model=dict)
async def bulk_action(
    data: NotificationBulkAction,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Perform bulk action on notifications"""
    notifications = Notification.objects.filter(
        id__in=data.notification_ids,
        tenant=tenant,
        user=current_user
    )
    
    count = 0
    
    if data.action == "mark_read":
        count = notifications.filter(read=False).update(
            read=True,
            read_at=timezone.now(),
            updated_at=timezone.now()
        )
    elif data.action == "mark_unread":
        count = notifications.filter(read=True).update(
            read=False,
            read_at=None,
            updated_at=timezone.now()
        )
    elif data.action == "archive":
        count = notifications.filter(archived=False).update(
            archived=True,
            archived_at=timezone.now(),
            updated_at=timezone.now()
        )
    elif data.action == "delete":
        count, _ = notifications.delete()
    
    return {"count": count, "action": data.action}


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Delete a notification"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            tenant=tenant,
            user=current_user
        )
        notification.delete()
    except Notification.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )


@router.delete("/bulk-delete", status_code=204)
async def bulk_delete_notifications(
    notification_ids: List[str],
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Delete multiple notifications"""
    Notification.objects.filter(
        id__in=notification_ids,
        tenant=tenant,
        user=current_user
    ).delete()


# Notification Preferences Endpoints

@router.get("/preferences/all", response_model=List[NotificationPreferenceResponse])
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Get all notification preferences for current user"""
    preferences = NotificationPreference.objects.filter(
        tenant=tenant,
        user=current_user
    )
    
    # Create default preferences if none exist
    if not preferences.exists():
        for category in NotificationCategory:
            NotificationPreference.objects.create(
                tenant=tenant,
                user=current_user,
                category=category.value
            )
        preferences = NotificationPreference.objects.filter(
            tenant=tenant,
            user=current_user
        )
    
    return [
        NotificationPreferenceResponse.model_validate(pref)
        for pref in preferences
    ]


@router.put("/preferences/{category}", response_model=NotificationPreferenceResponse)
async def update_notification_preference(
    category: NotificationCategory,
    data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Update notification preference for a specific category"""
    preference, created = NotificationPreference.objects.get_or_create(
        tenant=tenant,
        user=current_user,
        category=category.value
    )
    
    # Update fields
    if data.enabled is not None:
        preference.enabled = data.enabled
    if data.email_enabled is not None:
        preference.email_enabled = data.email_enabled
    if data.push_enabled is not None:
        preference.push_enabled = data.push_enabled
    if data.in_app_enabled is not None:
        preference.in_app_enabled = data.in_app_enabled
    if data.min_priority is not None:
        preference.min_priority = data.min_priority.value
    if data.quiet_hours_enabled is not None:
        preference.quiet_hours_enabled = data.quiet_hours_enabled
    if data.quiet_hours_start is not None:
        preference.quiet_hours_start = data.quiet_hours_start
    if data.quiet_hours_end is not None:
        preference.quiet_hours_end = data.quiet_hours_end
    
    preference.save()
    
    return NotificationPreferenceResponse.model_validate(preference)


@router.post("/preferences/bulk", response_model=List[NotificationPreferenceResponse])
async def bulk_update_preferences(
    data: NotificationPreferencesBulk,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_tenant),
):
    """Bulk update notification preferences"""
    updated_preferences = []
    
    for pref_data in data.preferences:
        preference, created = NotificationPreference.objects.get_or_create(
            tenant=tenant,
            user=current_user,
            category=pref_data.category.value
        )
        
        # Update fields
        if pref_data.enabled is not None:
            preference.enabled = pref_data.enabled
        if pref_data.email_enabled is not None:
            preference.email_enabled = pref_data.email_enabled
        if pref_data.push_enabled is not None:
            preference.push_enabled = pref_data.push_enabled
        if pref_data.in_app_enabled is not None:
            preference.in_app_enabled = pref_data.in_app_enabled
        if pref_data.min_priority is not None:
            preference.min_priority = pref_data.min_priority.value
        if pref_data.quiet_hours_enabled is not None:
            preference.quiet_hours_enabled = pref_data.quiet_hours_enabled
        if pref_data.quiet_hours_start is not None:
            preference.quiet_hours_start = pref_data.quiet_hours_start
        if pref_data.quiet_hours_end is not None:
            preference.quiet_hours_end = pref_data.quiet_hours_end
        
        preference.save()
        updated_preferences.append(preference)
    
    return [
        NotificationPreferenceResponse.model_validate(pref)
        for pref in updated_preferences
    ]
