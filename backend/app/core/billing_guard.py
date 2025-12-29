"""
Billing Guard für serverseitiges Feature-Gating
"""

from fastapi import HTTPException, status
from typing import Optional
from asgiref.sync import sync_to_async
from django.utils import timezone

from app.db.models import BillingAccount, UserProfile, Property, Document
from app.core.billing_config import PLAN_LIMITS, get_required_plan_for_limit


class BillingGuard:
    """Prüft Subscription-Status und Plan-Limits"""

    @staticmethod
    async def check_subscription_status(tenant_id: str) -> BillingAccount:
        """
        Prüfe Subscription-Status

        Args:
            tenant_id: Tenant ID

        Returns:
            BillingAccount

        Raises:
            HTTPException: 402 wenn Subscription inaktiv
        """
        try:
            billing = await sync_to_async(
                BillingAccount.objects.select_related("tenant").get
            )(tenant_id=tenant_id)
        except BillingAccount.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "BILLING_ACCOUNT_NOT_FOUND",
                    "message": "Billing account not found for tenant",
                },
            )

        # Prüfe Subscription-Status
        if billing.status not in ["active", "trialing"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "SUBSCRIPTION_REQUIRED",
                    "message": "Active subscription required",
                    "current_status": billing.status,
                    "required_action": (
                        "renew_subscription"
                        if billing.status == "canceled"
                        else "update_payment"
                    ),
                },
            )

        # Prüfe Trial-Ablauf
        if billing.status == "trialing" and billing.trial_end:
            if timezone.now() > billing.trial_end:
                # Email senden (falls nicht schon gesendet)
                if not billing.meta.get("trial_expired_email_sent"):
                    from app.services.email_service import EmailService

                    await EmailService.send_trial_expired_email(billing.tenant)
                    billing.meta["trial_expired_email_sent"] = True
                    await sync_to_async(billing.save)()

                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "code": "TRIAL_EXPIRED",
                        "message": "Your 14-day trial has expired",
                        "trial_end": billing.trial_end.isoformat(),
                        "show_payment_modal": True,
                        "required_action": "upgrade_subscription",
                    },
                )

        return billing

    @staticmethod
    async def check_limit(
        tenant_id: str, resource: str, action: str = "create", additional_count: int = 1
    ) -> None:
        """
        Prüft ob Resource-Limit erreicht ist

        Args:
            tenant_id: Tenant ID
            resource: Resource name (users, properties, storage_gb)
            action: Action type (create, update, delete)
            additional_count: Anzahl zusätzlicher Resources

        Raises:
            HTTPException: 403 wenn Limit erreicht, 402 wenn Subscription inaktiv
        """
        # Erst Subscription-Status prüfen
        billing = await BillingGuard.check_subscription_status(tenant_id)

        # Nur bei create/update-Aktionen Limits prüfen
        if action not in ["create", "update"]:
            return

        # Hole aktuelle Limits
        limits = PLAN_LIMITS[billing.plan_key]

        # Prüfe spezifische Resource-Limits
        if resource == "users":
            await BillingGuard._check_user_limit(
                tenant_id, limits, additional_count, billing.plan_key
            )

        elif resource == "properties":
            await BillingGuard._check_property_limit(
                tenant_id, limits, additional_count, billing.plan_key
            )

        elif resource == "storage_gb":
            await BillingGuard._check_storage_limit(
                tenant_id, limits, additional_count, billing.plan_key
            )

        else:
            raise ValueError(f"Unknown resource: {resource}")

    @staticmethod
    async def _check_user_limit(
        tenant_id: str, limits: dict, additional_count: int, current_plan: str
    ) -> None:
        """Prüfe User-Limit"""
        limit = limits["users"]

        # Unbegrenzt
        if limit == -1:
            return

        # Aktuelle Anzahl zählen
        current_count = await sync_to_async(
            UserProfile.objects.filter(tenant_id=tenant_id, is_active=True).count
        )()

        # Prüfe Limit
        if current_count + additional_count > limit:
            required_plan = get_required_plan_for_limit(current_plan, "users")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PLAN_LIMIT_REACHED",
                    "message": f"User limit reached ({limit})",
                    "current_count": current_count,
                    "limit": limit,
                    "required_plan": required_plan,
                    "resource": "users",
                },
            )

    @staticmethod
    async def _check_property_limit(
        tenant_id: str, limits: dict, additional_count: int, current_plan: str
    ) -> None:
        """Prüfe Property-Limit"""
        limit = limits["properties"]

        # Unbegrenzt
        if limit == -1:
            return

        # Aktuelle Anzahl zählen
        current_count = await sync_to_async(
            Property.objects.filter(tenant_id=tenant_id).count
        )()

        # Prüfe Limit
        if current_count + additional_count > limit:
            required_plan = get_required_plan_for_limit(current_plan, "properties")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PLAN_LIMIT_REACHED",
                    "message": f"Property limit reached ({limit})",
                    "current_count": current_count,
                    "limit": limit,
                    "required_plan": required_plan,
                    "resource": "properties",
                },
            )

    @staticmethod
    async def _check_storage_limit(
        tenant_id: str, limits: dict, additional_count: int, current_plan: str
    ) -> None:
        """Prüfe Storage-Limit"""
        from django.db.models import Sum
        from app.db.models import Document, PropertyImage, PropertyDocument, Attachment

        limit_gb = limits["storage_gb"]

        # Unbegrenzt
        if limit_gb == -1:
            return

        # Aktuelle Storage berechnen - summiere alle Dateigrößen
        # Documents (size in bytes)
        docs_size = await sync_to_async(
            lambda: Document.objects.filter(tenant_id=tenant_id).aggregate(
                total=Sum("size")
            )["total"]
            or 0
        )()

        # PropertyImages (size in bytes)
        images_size = await sync_to_async(
            lambda: PropertyImage.objects.filter(
                property__tenant_id=tenant_id
            ).aggregate(total=Sum("size"))["total"]
            or 0
        )()

        # PropertyDocuments (size in bytes)
        prop_docs_size = await sync_to_async(
            lambda: PropertyDocument.objects.filter(
                property__tenant_id=tenant_id
            ).aggregate(total=Sum("size"))["total"]
            or 0
        )()

        # Attachments (file_size in bytes, nullable)
        attachments_size = await sync_to_async(
            lambda: Attachment.objects.filter(tenant_id=tenant_id).aggregate(
                total=Sum("file_size")
            )["total"]
            or 0
        )()

        # Gesamtsumme in Bytes, konvertiert zu MB
        total_bytes = docs_size + images_size + prop_docs_size + attachments_size
        current_storage_mb = total_bytes / (1024 * 1024)  # Bytes zu MB

        # Prüfe Limit (additional_count ist in MB)
        additional_gb = additional_count / 1024  # MB zu GB
        if (current_storage_mb / 1024) + additional_gb > limit_gb:
            required_plan = get_required_plan_for_limit(current_plan, "storage_gb")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PLAN_LIMIT_REACHED",
                    "message": f"Storage limit reached ({limit_gb}GB)",
                    "current_storage_gb": round(current_storage_mb / 1024, 2),
                    "limit_gb": limit_gb,
                    "required_plan": required_plan,
                    "resource": "storage_gb",
                },
            )

    @staticmethod
    async def check_feature_access(tenant_id: str, feature: str) -> bool:
        """
        Prüfe ob Feature für Plan verfügbar ist

        Args:
            tenant_id: Tenant ID
            feature: Feature name (integrations, reporting, white_label)

        Returns:
            True wenn verfügbar, False sonst
        """
        try:
            billing = await sync_to_async(BillingAccount.objects.get)(
                tenant_id=tenant_id
            )

            limits = PLAN_LIMITS[billing.plan_key]
            return limits.get(feature, False)

        except BillingAccount.DoesNotExist:
            return False

    @staticmethod
    async def get_plan_info(tenant_id: str) -> dict:
        """
        Hole Plan-Informationen für Tenant

        Args:
            tenant_id: Tenant ID

        Returns:
            Dict mit Plan-Info
        """
        try:
            billing = await sync_to_async(BillingAccount.objects.get)(
                tenant_id=tenant_id
            )

            limits = PLAN_LIMITS[billing.plan_key]

            return {
                "plan_key": billing.plan_key,
                "status": billing.status,
                "limits": limits,
                "current_period_end": billing.current_period_end,
                "cancel_at_period_end": billing.cancel_at_period_end,
            }

        except BillingAccount.DoesNotExist:
            return {
                "plan_key": "free",
                "status": "active",
                "limits": PLAN_LIMITS["free"],
                "current_period_end": None,
                "cancel_at_period_end": False,
            }
