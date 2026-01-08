"""
Notification API Endpoints - Async Version
Vollständige CRUD-Operationen für Benachrichtigungen mit korrekter async/sync Integration
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from django.db.models import Q, Count
from django.utils import timezone
from asgiref.sync import sync_to_async

from app.api.deps import get_current_user, get_tenant_id
from app.core.security import TokenData
from accounts.models import User, Tenant
from notifications.models import Notification, NotificationPreference
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


async def get_tenant(tenant_id: str = Depends(get_tenant_id)) -> Tenant:
    """Get tenant object from tenant_id"""
    try:
        return await sync_to_async(Tenant.objects.get)(id=tenant_id)
    except Tenant.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )


async def get_user_from_token(token_data: TokenData = Depends(get_current_user)) -> User:
    """Get User object from TokenData"""
    try:
        return await sync_to_async(User.objects.get)(id=token_data.user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Get count of unread notifications"""
    count = await sync_to_async(Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        read=False,
        archived=False
    ).count)()
    
    return {"count": count}


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
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """
    Get paginated list of notifications for current user
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
    paginated = await sync_to_async(paginate)(queryset, page, size)
    
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
        
        total = await sync_to_async(all_notifications.count)()
        unread = await sync_to_async(all_notifications.filter(read=False).count)()
        
        by_category = {}
        for cat in NotificationCategory:
            count = await sync_to_async(all_notifications.filter(category=cat.value).count)()
            if count > 0:
                by_category[cat.value] = count
        
        by_priority = {}
        for prio in NotificationPriority:
            count = await sync_to_async(all_notifications.filter(priority=prio.value).count)()
            if count > 0:
                by_priority[prio.value] = count
        
        by_type = {}
        for ntype in NotificationType:
            count = await sync_to_async(all_notifications.filter(type=ntype.value).count)()
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


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Get notification statistics"""
    notifications = Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        archived=False
    )
    
    total = await sync_to_async(notifications.count)()
    unread = await sync_to_async(notifications.filter(read=False).count)()
    
    by_category = {}
    for cat in NotificationCategory:
        count = await sync_to_async(notifications.filter(category=cat.value).count)()
        if count > 0:
            by_category[cat.value] = count
    
    by_priority = {}
    for prio in NotificationPriority:
        count = await sync_to_async(notifications.filter(priority=prio.value).count)()
        if count > 0:
            by_priority[prio.value] = count
    
    by_type = {}
    for ntype in NotificationType:
        count = await sync_to_async(notifications.filter(type=ntype.value).count)()
        if count > 0:
            by_type[ntype.value] = count
    
    return NotificationStats(
        total=total,
        unread=unread,
        by_category=by_category,
        by_priority=by_priority,
        by_type=by_type,
    )


@router.post("/mark-all-as-read", response_model=dict)
async def mark_all_as_read(
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Mark all unread notifications as read"""
    updated = await sync_to_async(Notification.objects.filter(
        tenant=tenant,
        user=current_user,
        read=False,
        archived=False
    ).update)(
        read=True,
        read_at=timezone.now(),
        updated_at=timezone.now()
    )
    
    return {"updated": updated, "message": f"All {updated} notifications marked as read"}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Get a specific notification"""
    try:
        notification = await sync_to_async(Notification.objects.get)(
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
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Update notification (mark as read/unread, archive)"""
    try:
        notification = await sync_to_async(Notification.objects.get)(
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
            await sync_to_async(notification.mark_as_read)()
        else:
            await sync_to_async(notification.mark_as_unread)()
    
    if data.archived is not None:
        if data.archived:
            await sync_to_async(notification.archive)()
        else:
            notification.archived = False
            notification.archived_at = None
            await sync_to_async(notification.save)(update_fields=['archived', 'archived_at', 'updated_at'])
    
    await sync_to_async(notification.refresh_from_db)()
    return NotificationResponse.model_validate(notification)


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_user_from_token),
    tenant: Tenant = Depends(get_tenant),
):
    """Delete a notification"""
    try:
        notification = await sync_to_async(Notification.objects.get)(
            id=notification_id,
            tenant=tenant,
            user=current_user
        )
        await sync_to_async(notification.delete)()
    except Notification.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )