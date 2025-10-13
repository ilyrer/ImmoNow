"""
Audit Service
"""
from typing import Optional, Dict, Any
from datetime import datetime
from django.db import models

from app.db.models import AuditLog, User


class AuditService:
    """Audit service for logging actions"""
    
    @staticmethod
    def audit_action(
        user: User,
        action: str,
        resource_type: str,
        resource_id: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an action in the audit log"""
        
        # Get tenant from user profile (safe access)
        tenant = None
        if hasattr(user, 'profile') and user.profile:
            tenant = user.profile.tenant
        
        audit_log = AuditLog.objects.create(
            tenant=tenant,
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values or {},
            new_values=new_values or {},
            timestamp=datetime.utcnow(),
            ip_address=ip_address or '127.0.0.1',
            user_agent=user_agent or ''
        )
        
        return audit_log
    
    @staticmethod
    def get_audit_logs(
        tenant_id: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> tuple[list[AuditLog], int]:
        """Get audit logs with filters"""
        
        queryset = AuditLog.objects.filter(tenant_id=tenant_id)
        
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        total = queryset.count()
        
        logs = list(queryset.order_by('-timestamp')[offset:offset + limit])
        
        return logs, total
