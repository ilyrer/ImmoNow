"""
Audit Service
"""

from typing import Optional, Dict, Any
from datetime import datetime
from django.db import models
import logging
from asgiref.sync import sync_to_async

from app.db.models import AuditLog, User

logger = logging.getLogger(__name__)


class AuditService:
    """Audit service for logging actions"""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

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
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log an action in the audit log"""

        # Get tenant from user profile (safe access)
        tenant = None
        if hasattr(user, "profile") and user.profile:
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
            ip_address=ip_address or "127.0.0.1",
            user_agent=user_agent or "",
        )

        return audit_log

    async def log_action(
        self,
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        success: bool = True,
        resource_type: str = "tool",
        resource_id: Optional[str] = None,
    ):
        """Log a general action (for tool calls, etc.)"""
        try:
            await sync_to_async(AuditLog.objects.create)(
                tenant_id=self.tenant_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id or action,
                old_values={},
                new_values=details or {},
                timestamp=datetime.utcnow(),
                ip_address="127.0.0.1",
                user_agent="AI-Orchestrator",
            )
        except Exception as e:
            logger.error(f"Failed to log action: {str(e)}")

    async def log_llm_request(self, audit_log: "LLMAuditLog"):
        """Log LLM request for audit trail"""
        try:
            await sync_to_async(AuditLog.objects.create)(
                tenant_id=self.tenant_id,
                user_id=audit_log.user_id,
                action="llm_request",
                resource_type="llm",
                resource_id=audit_log.request_id or "unknown",
                details={
                    "request_type": audit_log.request_type,
                    "model": audit_log.model,
                    "tokens_used": audit_log.tokens_used,
                    "prompt_length": len(audit_log.prompt),
                    "response_length": len(audit_log.response),
                },
                ip_address="127.0.0.1",  # Will be set by middleware
                user_agent="LLM-Service",
            )
        except Exception as e:
            logger.error(f"Failed to log LLM request: {str(e)}")

    @staticmethod
    def get_audit_logs(
        tenant_id: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
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

        logs = list(queryset.order_by("-timestamp")[offset : offset + limit])

        return logs, total
