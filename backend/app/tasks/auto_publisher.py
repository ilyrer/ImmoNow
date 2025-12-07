"""
Auto Publisher Task

Automatically publishes/updates properties to real estate portals.
Runs every 2-3 hours to achieve approximately 10 pushes per day per property.
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from asgiref.sync import sync_to_async

from app.db.models import Property, SocialAccount, PublishJob, Tenant
from app.services.immoscout_service import ImmoScout24Service
from app.services.rate_limit_manager import RateLimitManager
from app.core.errors import ExternalServiceError

logger = logging.getLogger(__name__)

# Celery availability check
try:
    from celery import shared_task

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    logger.warning("Celery not installed. Using async functions directly.")

    # Define a dummy decorator if Celery is not available
    def shared_task(func=None, **kwargs):
        def decorator(f):
            return f

        if func:
            return decorator(func)
        return decorator


class AutoPublisher:
    """
    Handles automatic publishing of properties to real estate portals

    Features:
    - Publishes properties with auto_publish_enabled to configured portals
    - Respects rate limits per portal
    - Tracks publish history
    - Retries failed publishes
    - Updates existing listings
    """

    SUPPORTED_PORTALS = {
        "immoscout24": {
            "name": "ImmoScout24",
            "service_class": "ImmoScout24Service",
            "max_daily_updates": 48,  # 2 per hour
        },
        "immowelt": {
            "name": "Immowelt",
            "service_class": "ImmoweltService",
            "max_daily_updates": 48,
        },
    }

    def __init__(self):
        self.rate_limiter = RateLimitManager()

    async def get_properties_for_auto_publish(self) -> List[Property]:
        """
        Get all properties that need to be auto-published

        Returns properties where:
        - auto_publish_enabled is True
        - status is 'aktiv'
        - last_auto_published_at is older than interval or null
        """
        now = datetime.utcnow()

        # Get properties with auto-publish enabled
        properties = await sync_to_async(list)(
            Property.objects.filter(
                auto_publish_enabled=True, status="aktiv"
            ).select_related("tenant", "address")
        )

        # Filter by last publish time
        eligible_properties = []
        for prop in properties:
            interval_hours = prop.auto_publish_interval_hours or 2

            if prop.last_auto_published_at is None:
                eligible_properties.append(prop)
            elif now - prop.last_auto_published_at >= timedelta(hours=interval_hours):
                eligible_properties.append(prop)

        return eligible_properties

    async def publish_property(
        self, property: Property, portal: str, update_if_exists: bool = True
    ) -> Dict[str, Any]:
        """
        Publish a single property to a portal

        Args:
            property: Property to publish
            portal: Portal identifier (e.g., 'immoscout24')
            update_if_exists: Update listing if already published

        Returns:
            Dict with publish result
        """
        if portal not in self.SUPPORTED_PORTALS:
            return {"success": False, "error": f"Unsupported portal: {portal}"}

        tenant_id = str(property.tenant_id)

        # Check rate limit
        if not await self.rate_limiter.check_limit(portal, tenant_id):
            logger.warning(f"Rate limit exceeded for {portal}, tenant {tenant_id}")
            return {
                "success": False,
                "error": "Rate limit exceeded",
                "retry_later": True,
            }

        # Check for portal account
        account = await sync_to_async(
            SocialAccount.objects.filter(
                tenant_id=tenant_id, platform=portal, is_active=True
            ).first
        )()

        if not account:
            return {"success": False, "error": f"No active {portal} account connected"}

        try:
            # Check if already published to this portal
            existing_job = await sync_to_async(
                PublishJob.objects.filter(
                    property=property, portal=portal, status="published"
                ).first
            )()

            if portal == "immoscout24":
                service = ImmoScout24Service()

                if existing_job and update_if_exists:
                    # Update existing listing
                    result = await service.update_property(
                        str(property.id), tenant_id, str(property.created_by_id)
                    )
                    action = "updated"
                else:
                    # Create new listing
                    result = await service.publish_property(
                        str(property.id), tenant_id, str(property.created_by_id)
                    )
                    action = "published"

                await self.rate_limiter.record_call(portal, tenant_id)

                # Update last auto-publish time
                property.last_auto_published_at = datetime.utcnow()
                await sync_to_async(property.save)()

                return {
                    "success": True,
                    "portal": portal,
                    "action": action,
                    "portal_property_id": result.get("portal_property_id"),
                    "portal_url": result.get("portal_url"),
                }

            # Add more portals here as they're implemented
            elif portal == "immowelt":
                # TODO: Implement Immowelt service
                return {
                    "success": False,
                    "error": "Immowelt integration not yet implemented",
                }

        except ExternalServiceError as e:
            logger.error(f"Portal publish error for property {property.id}: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.exception(
                f"Unexpected error publishing property {property.id} to {portal}"
            )
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def run_auto_publish_cycle(self) -> Dict[str, Any]:
        """
        Run a complete auto-publish cycle

        Returns:
            Summary of publish actions taken
        """
        logger.info("Starting auto-publish cycle")

        properties = await self.get_properties_for_auto_publish()
        logger.info(f"Found {len(properties)} properties for auto-publish")

        results = {
            "total_properties": len(properties),
            "successful_publishes": 0,
            "failed_publishes": 0,
            "rate_limited": 0,
            "details": [],
        }

        for property in properties:
            portals = property.auto_publish_portals or []

            if not portals:
                # Default to configured portals if none specified
                portals = ["immoscout24"]

            for portal in portals:
                result = await self.publish_property(property, portal)

                detail = {
                    "property_id": str(property.id),
                    "property_title": property.title,
                    "portal": portal,
                    **result,
                }
                results["details"].append(detail)

                if result.get("success"):
                    results["successful_publishes"] += 1
                elif result.get("retry_later"):
                    results["rate_limited"] += 1
                else:
                    results["failed_publishes"] += 1

        logger.info(
            f"Auto-publish cycle complete: "
            f"{results['successful_publishes']} successful, "
            f"{results['failed_publishes']} failed, "
            f"{results['rate_limited']} rate limited"
        )

        return results


# Celery task wrapper
@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def auto_publish_properties(self):
    """
    Celery task: Auto-publish all eligible properties

    This task should be scheduled to run every 2-3 hours via celery beat.
    """
    try:
        publisher = AutoPublisher()
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(publisher.run_auto_publish_cycle())
        return result
    except Exception as exc:
        logger.exception("Auto-publish task failed")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_property_to_portals(self, property_id: str, portals: List[str] = None):
    """
    Celery task: Publish a specific property to portals immediately

    Args:
        property_id: UUID of the property
        portals: List of portal IDs (defaults to property's configured portals)
    """
    try:

        async def _publish():
            property = await sync_to_async(Property.objects.get)(id=property_id)

            if portals is None:
                target_portals = property.auto_publish_portals or ["immoscout24"]
            else:
                target_portals = portals

            publisher = AutoPublisher()
            results = []

            for portal in target_portals:
                result = await publisher.publish_property(property, portal)
                results.append(result)

            return results

        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_publish())

    except Property.DoesNotExist:
        logger.error(f"Property {property_id} not found")
        return {"success": False, "error": "Property not found"}
    except Exception as exc:
        logger.exception(f"Publish task failed for property {property_id}")
        raise self.retry(exc=exc)


# Async version for direct use without Celery
async def async_auto_publish_properties() -> Dict[str, Any]:
    """Async function for auto-publishing (use when Celery is not available)"""
    publisher = AutoPublisher()
    return await publisher.run_auto_publish_cycle()


async def async_publish_property_to_portals(
    property_id: str, portals: List[str] = None
) -> List[Dict[str, Any]]:
    """Async function to publish a specific property"""
    property = await sync_to_async(Property.objects.get)(id=property_id)

    if portals is None:
        target_portals = property.auto_publish_portals or ["immoscout24"]
    else:
        target_portals = portals

    publisher = AutoPublisher()
    results = []

    for portal in target_portals:
        result = await publisher.publish_property(property, portal)
        results.append(result)

    return results
