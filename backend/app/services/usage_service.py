"""
Usage Service für Resource-Tracking
"""

from typing import Dict, Any
from django.utils import timezone
from django.db import models
from asgiref.sync import sync_to_async

from app.db.models import (
    UserProfile,
    Property,
    Document,
    PropertyImage,
    PropertyDocument,
    BillingAccount,
    Attachment,
)


class UsageService:
    """Trackt aktuelle Resource-Usage für Tenant"""

    @staticmethod
    async def get_usage_snapshot(tenant_id: str) -> Dict[str, Any]:
        """
        Zählt aktuelle Usage für alle Resources

        Args:
            tenant_id: Tenant ID

        Returns:
            Dict mit Usage-Statistiken
        """
        try:
            # Users zählen (nur aktive)
            users_count = await sync_to_async(
                UserProfile.objects.filter(tenant_id=tenant_id, is_active=True).count
            )()

            # Properties zählen
            properties_count = await sync_to_async(
                Property.objects.filter(tenant_id=tenant_id).count
            )()

            # Storage berechnen (vereinfacht)
            storage_mb = await UsageService._calculate_storage_usage(tenant_id)

            # Documents zählen
            documents_count = await sync_to_async(
                Document.objects.filter(tenant_id=tenant_id).count
            )()

            # Property Images zählen
            property_images_count = await sync_to_async(
                PropertyImage.objects.filter(property__tenant_id=tenant_id).count
            )()

            # Property Documents zählen
            property_documents_count = await sync_to_async(
                PropertyDocument.objects.filter(property__tenant_id=tenant_id).count
            )()

            return {
                "users": users_count,
                "properties": properties_count,
                "storage_mb": storage_mb,
                "storage_gb": round(storage_mb / 1024, 2),
                "documents": documents_count,
                "property_images": property_images_count,
                "property_documents": property_documents_count,
                "timestamp": timezone.now().isoformat(),
            }

        except Exception as e:
            print(f"❌ UsageService: Error calculating usage: {str(e)}")
            return {
                "users": 0,
                "properties": 0,
                "storage_mb": 0,
                "storage_gb": 0,
                "documents": 0,
                "property_images": 0,
                "property_documents": 0,
                "timestamp": timezone.now().isoformat(),
                "error": str(e),
            }

    @staticmethod
    async def _calculate_storage_usage(tenant_id: str) -> int:
        """
        Berechne Storage-Usage in MB

        Args:
            tenant_id: Tenant ID

        Returns:
            Storage in MB
        """
        try:
            # Documents Storage
            documents_size = await sync_to_async(
                Document.objects.filter(tenant_id=tenant_id).aggregate(
                    total=models.Sum("size")
                )["total"]
                or 0
            )()

            # Property Images Storage
            property_images_size = await sync_to_async(
                PropertyImage.objects.filter(property__tenant_id=tenant_id).aggregate(
                    total=models.Sum("size")
                )["total"]
                or 0
            )()

            # Property Documents Storage
            property_documents_size = await sync_to_async(
                PropertyDocument.objects.filter(
                    property__tenant_id=tenant_id
                ).aggregate(total=models.Sum("size"))["total"]
                or 0
            )()

            # Attachments Storage (nullable file_size field)
            attachments_size = await sync_to_async(
                Attachment.objects.filter(tenant_id=tenant_id).aggregate(
                    total=models.Sum("file_size")
                )["total"]
                or 0
            )()

            # Summe in MB
            total_bytes = (
                documents_size
                + property_images_size
                + property_documents_size
                + attachments_size
            )
            total_mb = total_bytes / (1024 * 1024)

            return round(total_mb, 2)

        except Exception as e:
            print(f"❌ UsageService: Error calculating storage: {str(e)}")
            return 0

    @staticmethod
    async def get_usage_vs_limits(tenant_id: str) -> Dict[str, Any]:
        """
        Vergleiche aktuelle Usage mit Plan-Limits

        Args:
            tenant_id: Tenant ID

        Returns:
            Dict mit Usage vs Limits Vergleich
        """
        try:
            # Hole BillingAccount und Limits
            billing = await sync_to_async(BillingAccount.objects.get)(
                tenant_id=tenant_id
            )

            from app.core.billing_config import PLAN_LIMITS

            limits = PLAN_LIMITS[billing.plan_key]

            # Hole aktuelle Usage
            usage = await UsageService.get_usage_snapshot(tenant_id)

            # Berechne Prozent und Verfügbarkeit
            def calculate_percentage(current: int, limit: int) -> float:
                if limit == -1:  # Unbegrenzt
                    return 0.0
                if limit == 0:
                    return 100.0
                return min(100.0, (current / limit) * 100)

            def calculate_available(current: int, limit: int) -> int:
                if limit == -1:  # Unbegrenzt
                    return -1
                return max(0, limit - current)

            return {
                "plan_key": billing.plan_key,
                "status": billing.status,
                "users": {
                    "current": usage["users"],
                    "limit": limits["users"],
                    "available": calculate_available(usage["users"], limits["users"]),
                    "percentage": calculate_percentage(usage["users"], limits["users"]),
                    "unlimited": limits["users"] == -1,
                },
                "properties": {
                    "current": usage["properties"],
                    "limit": limits["properties"],
                    "available": calculate_available(
                        usage["properties"], limits["properties"]
                    ),
                    "percentage": calculate_percentage(
                        usage["properties"], limits["properties"]
                    ),
                    "unlimited": limits["properties"] == -1,
                },
                "storage": {
                    "current_gb": usage["storage_gb"],
                    "limit_gb": limits["storage_gb"],
                    "available_gb": calculate_available(
                        usage["storage_gb"], limits["storage_gb"]
                    ),
                    "percentage": calculate_percentage(
                        usage["storage_gb"], limits["storage_gb"]
                    ),
                    "unlimited": limits["storage_gb"] == -1,
                },
                "features": {
                    "integrations": limits.get("integrations", False),
                    "reporting": limits.get("reporting", False),
                    "white_label": limits.get("white_label", False),
                    "analytics": limits.get("analytics", "basic"),
                },
                "timestamp": usage["timestamp"],
            }

        except BillingAccount.DoesNotExist:
            # Fallback für Tenants ohne BillingAccount
            from app.core.billing_config import PLAN_LIMITS

            limits = PLAN_LIMITS["free"]
            usage = await UsageService.get_usage_snapshot(tenant_id)

            return {
                "plan_key": "free",
                "status": "active",
                "users": {
                    "current": usage["users"],
                    "limit": limits["users"],
                    "available": max(0, limits["users"] - usage["users"]),
                    "percentage": min(100.0, (usage["users"] / limits["users"]) * 100),
                    "unlimited": False,
                },
                "properties": {
                    "current": usage["properties"],
                    "limit": limits["properties"],
                    "available": max(0, limits["properties"] - usage["properties"]),
                    "percentage": min(
                        100.0, (usage["properties"] / limits["properties"]) * 100
                    ),
                    "unlimited": False,
                },
                "storage": {
                    "current_gb": usage["storage_gb"],
                    "limit_gb": limits["storage_gb"],
                    "available_gb": max(0, limits["storage_gb"] - usage["storage_gb"]),
                    "percentage": min(
                        100.0, (usage["storage_gb"] / limits["storage_gb"]) * 100
                    ),
                    "unlimited": False,
                },
                "features": {
                    "integrations": False,
                    "reporting": False,
                    "white_label": False,
                    "analytics": "basic",
                },
                "timestamp": usage["timestamp"],
            }

    @staticmethod
    async def get_usage_history(tenant_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Hole Usage-History (vereinfacht - später mit echten Daten)

        Args:
            tenant_id: Tenant ID
            days: Anzahl Tage zurück

        Returns:
            Dict mit historischen Daten
        """
        # TODO: Implementiere echte Usage-History
        # Für jetzt nur aktuelle Snapshot
        current_usage = await UsageService.get_usage_vs_limits(tenant_id)

        return {
            "tenant_id": tenant_id,
            "period_days": days,
            "current": current_usage,
            "history": [],  # TODO: Implementiere echte History
            "timestamp": timezone.now().isoformat(),
        }
