"""
Property Metrics Sync Task

Synchronizes property performance metrics from all connected portals.
Runs every hour to keep metrics up-to-date.
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from asgiref.sync import sync_to_async

from properties.models import Property, PublishJob, PropertyMetrics, PropertyMetricsSnapshot
from accounts.models import Tenant
from app.services.immoscout_service import ImmoScout24Service
from app.services.immowelt_service import ImmoweltService
from app.core.errors import ExternalServiceError

logger = logging.getLogger(__name__)

# Celery availability check
try:
    from celery import shared_task

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    logger.warning("Celery not installed. Using async functions directly.")

    def shared_task(func=None, **kwargs):
        def decorator(f):
            return f

        if func:
            return decorator(func)
        return decorator


class PropertyMetricsSync:
    """
    Handles synchronization of property metrics from real estate portals.

    Features:
    - Fetches metrics from ImmoScout24 and Immowelt APIs
    - Updates PropertyMetrics table with aggregated data
    - Creates daily snapshots for historical charts
    - Handles API errors gracefully
    """

    def __init__(self):
        self.immoscout_service = ImmoScout24Service()
        self.immowelt_service = ImmoweltService()
        self.sync_stats = {
            "total_properties": 0,
            "synced": 0,
            "errors": 0,
            "immoscout_synced": 0,
            "immowelt_synced": 0,
        }

    async def sync_all_tenant_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """
        Sync metrics for all published properties of a tenant.
        """
        logger.info(f"Starting metrics sync for tenant {tenant_id}")

        self.sync_stats = {
            "total_properties": 0,
            "synced": 0,
            "errors": 0,
            "immoscout_synced": 0,
            "immowelt_synced": 0,
        }

        # Get all properties with published jobs
        @sync_to_async
        def get_published_properties():
            return list(
                Property.objects.filter(tenant_id=tenant_id)
                .prefetch_related("publish_jobs")
                .distinct()
            )

        properties = await get_published_properties()
        self.sync_stats["total_properties"] = len(properties)

        for property_obj in properties:
            try:
                await self.sync_property_metrics(property_obj, tenant_id)
                self.sync_stats["synced"] += 1
            except Exception as e:
                logger.error(
                    f"Error syncing metrics for property {property_obj.id}: {e}"
                )
                self.sync_stats["errors"] += 1

        logger.info(f"Metrics sync completed: {self.sync_stats}")
        return self.sync_stats

    async def sync_property_metrics(self, property_obj: Property, tenant_id: str):
        """
        Sync metrics for a single property from all connected portals.
        """

        # Get published jobs for this property
        @sync_to_async
        def get_publish_jobs():
            return list(
                PublishJob.objects.filter(
                    property=property_obj,
                    status="published",
                    portal_property_id__isnull=False,
                )
            )

        jobs = await get_publish_jobs()

        if not jobs:
            logger.debug(f"No published jobs for property {property_obj.id}")
            return

        # Initialize metrics
        immoscout_metrics = {"views": 0, "inquiries": 0, "favorites": 0}
        immowelt_metrics = {"views": 0, "inquiries": 0, "favorites": 0}

        # Fetch from each portal
        for job in jobs:
            try:
                if job.portal == "immoscout24":
                    metrics = await self._fetch_immoscout_metrics(
                        job.portal_property_id, tenant_id
                    )
                    if metrics:
                        immoscout_metrics = metrics
                        self.sync_stats["immoscout_synced"] += 1

                elif job.portal == "immowelt":
                    metrics = await self._fetch_immowelt_metrics(
                        job.portal_property_id, tenant_id
                    )
                    if metrics:
                        immowelt_metrics = metrics
                        self.sync_stats["immowelt_synced"] += 1

            except Exception as e:
                logger.warning(
                    f"Error fetching {job.portal} metrics for {job.portal_property_id}: {e}"
                )

        # Update database
        await self._update_property_metrics(
            property_obj.id, immoscout_metrics, immowelt_metrics
        )

    async def _fetch_immoscout_metrics(
        self, portal_property_id: str, tenant_id: str
    ) -> Dict[str, int]:
        """Fetch metrics from ImmoScout24 API"""
        try:
            result = await self.immoscout_service.get_property_metrics(
                portal_property_id, tenant_id
            )
            return {
                "views": result.get("views", 0),
                "inquiries": result.get("inquiries", 0),
                "favorites": result.get("favorites", 0),
            }
        except Exception as e:
            logger.error(f"ImmoScout24 metrics fetch failed: {e}")
            return None

    async def _fetch_immowelt_metrics(
        self, portal_property_id: str, tenant_id: str
    ) -> Dict[str, int]:
        """Fetch metrics from Immowelt API"""
        try:
            result = await self.immowelt_service.get_property_metrics(
                portal_property_id, tenant_id
            )
            return {
                "views": result.get("views", 0),
                "inquiries": result.get("inquiries", 0),
                "favorites": result.get("favorites", 0),
            }
        except Exception as e:
            logger.error(f"Immowelt metrics fetch failed: {e}")
            return None

    @sync_to_async
    def _update_property_metrics(
        self,
        property_id: str,
        immoscout_metrics: Dict[str, int],
        immowelt_metrics: Dict[str, int],
    ):
        """Update PropertyMetrics and create daily snapshot"""
        # Get or create metrics record
        metrics, created = PropertyMetrics.objects.get_or_create(
            property_id=property_id
        )

        # Update portal-specific metrics
        metrics.immoscout_views = immoscout_metrics["views"]
        metrics.immoscout_inquiries = immoscout_metrics["inquiries"]
        metrics.immoscout_favorites = immoscout_metrics["favorites"]

        metrics.immowelt_views = immowelt_metrics["views"]
        metrics.immowelt_inquiries = immowelt_metrics["inquiries"]
        metrics.immowelt_favorites = immowelt_metrics["favorites"]

        metrics.last_synced_at = datetime.now()
        metrics.save()  # This triggers calculate_totals()

        # Create/update today's snapshot
        today = datetime.now().date()
        PropertyMetricsSnapshot.objects.update_or_create(
            property_id=property_id,
            date=today,
            defaults={
                "views": metrics.total_views,
                "inquiries": metrics.total_inquiries,
                "favorites": metrics.total_favorites,
                "clicks": metrics.total_clicks,
                "visits": metrics.total_visits,
                "immoscout_views": metrics.immoscout_views,
                "immoscout_inquiries": metrics.immoscout_inquiries,
                "immowelt_views": metrics.immowelt_views,
                "immowelt_inquiries": metrics.immowelt_inquiries,
            },
        )

        logger.debug(
            f"Updated metrics for property {property_id}: views={metrics.total_views}, inquiries={metrics.total_inquiries}"
        )


# Celery Tasks


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=300,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def sync_all_metrics_task(self):
    """
    Celery task to sync metrics for all tenants.
    Scheduled to run every hour.
    """

    async def run_sync():
        syncer = PropertyMetricsSync()

        # Get all active tenants
        @sync_to_async
        def get_active_tenants():
            return list(Tenant.objects.filter(is_active=True))

        tenants = await get_active_tenants()
        total_stats = {
            "tenants_processed": 0,
            "total_synced": 0,
            "total_errors": 0,
        }

        for tenant in tenants:
            try:
                stats = await syncer.sync_all_tenant_metrics(str(tenant.id))
                total_stats["tenants_processed"] += 1
                total_stats["total_synced"] += stats["synced"]
                total_stats["total_errors"] += stats["errors"]
            except Exception as e:
                logger.error(f"Error syncing metrics for tenant {tenant.id}: {e}")
                total_stats["total_errors"] += 1

        return total_stats

    return asyncio.run(run_sync())


@shared_task(bind=True)
def sync_property_metrics_task(self, property_id: str, tenant_id: str):
    """
    Celery task to sync metrics for a single property.
    Can be called on-demand.
    """

    async def run_sync():
        syncer = PropertyMetricsSync()

        @sync_to_async
        def get_property():
            return Property.objects.get(id=property_id, tenant_id=tenant_id)

        property_obj = await get_property()
        await syncer.sync_property_metrics(property_obj, tenant_id)

        return {"success": True, "property_id": property_id}

    return asyncio.run(run_sync())


# Utility functions for manual triggering


async def sync_metrics_for_tenant(tenant_id: str) -> Dict[str, Any]:
    """Manual trigger to sync metrics for a specific tenant"""
    syncer = PropertyMetricsSync()
    return await syncer.sync_all_tenant_metrics(tenant_id)


async def sync_metrics_for_property(property_id: str, tenant_id: str) -> Dict[str, Any]:
    """Manual trigger to sync metrics for a specific property"""
    syncer = PropertyMetricsSync()

    @sync_to_async
    def get_property():
        return Property.objects.get(id=property_id, tenant_id=tenant_id)

    property_obj = await get_property()
    await syncer.sync_property_metrics(property_obj, tenant_id)

    return {"success": True, "property_id": property_id}
