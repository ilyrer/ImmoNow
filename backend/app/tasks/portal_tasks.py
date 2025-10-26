"""
Celery Tasks für Portal-Background-Jobs
"""
import logging
from typing import Dict, Any
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from app.db.models import PortalConnection, PortalPublishJob, PortalSyncLog, Property
from app.services.real_portal_service import RealPortalPublishingService
from app.core.portal_config import PortalOAuthConfig, PortalType
from app.schemas.portals import LogLevel

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def publish_property_to_portal_task(self, job_id: str, tenant_id: str):
    """Background-Task für Portal-Veröffentlichung"""
    
    try:
        # Job aus DB laden
        job = PortalPublishJob.objects.get(id=job_id)
        connection = job.portal_connection
        property_obj = job.property
        
        # Publishing-Service verwenden
        async def publish():
            async with RealPortalPublishingService(tenant_id) as publishing_service:
                await publishing_service._publish_to_real_portal(job, connection, property_obj)
        
        # Async-Funktion ausführen
        import asyncio
        asyncio.run(publish())
        
        logger.info(f"Property {property_obj.id} successfully published to {connection.portal}")
        
    except Exception as exc:
        logger.error(f"Publish task failed: {str(exc)}")
        
        # Retry-Logik
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying publish task (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (self.request.retries + 1))
        else:
            # Max Retries erreicht - Job als fehlgeschlagen markieren
            try:
                job = PortalPublishJob.objects.get(id=job_id)
                job.status = 'failed'
                job.error_message = f"Max retries exceeded: {str(exc)}"
                job.save()
                
                # Fehler loggen
                PortalSyncLog.objects.create(
                    portal_connection=job.portal_connection,
                    property=job.property,
                    level=LogLevel.ERROR,
                    message=f"Publish task failed after {self.max_retries} retries: {str(exc)}",
                    details={'error': str(exc), 'retries': self.request.retries}
                )
            except Exception as log_error:
                logger.error(f"Failed to update job status: {str(log_error)}")


@shared_task(bind=True, max_retries=3)
def sync_property_on_portal_task(self, job_id: str, tenant_id: str):
    """Background-Task für Portal-Synchronisation"""
    
    try:
        # Job aus DB laden
        job = PortalPublishJob.objects.get(id=job_id)
        connection = job.portal_connection
        property_obj = job.property
        
        # Sync-Logik implementieren
        async def sync():
            async with RealPortalPublishingService(tenant_id) as publishing_service:
                # Token prüfen
                access_token = await publishing_service._ensure_valid_token(connection)
                
                # Portal-spezifische Sync-API aufrufen
                await publishing_service._call_portal_sync_api(
                    connection.portal,
                    access_token,
                    job.portal_property_id
                )
                
                # Job aktualisieren
                job.last_sync_at = timezone.now()
                job.save()
        
        # Async-Funktion ausführen
        import asyncio
        asyncio.run(sync())
        
        logger.info(f"Property {property_obj.id} successfully synced on {connection.portal}")
        
    except Exception as exc:
        logger.error(f"Sync task failed: {str(exc)}")
        
        # Retry-Logik
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying sync task (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (self.request.retries + 1))
        else:
            # Max Retries erreicht
            try:
                job = PortalPublishJob.objects.get(id=job_id)
                job.error_message = f"Sync failed after {self.max_retries} retries: {str(exc)}"
                job.save()
                
                # Fehler loggen
                PortalSyncLog.objects.create(
                    portal_connection=job.portal_connection,
                    property=job.property,
                    level=LogLevel.ERROR,
                    message=f"Sync task failed after {self.max_retries} retries: {str(exc)}",
                    details={'error': str(exc), 'retries': self.request.retries}
                )
            except Exception as log_error:
                logger.error(f"Failed to update job status: {str(log_error)}")


@shared_task
def refresh_portal_tokens_task():
    """Periodische Task für Token-Erneuerung"""
    
    try:
        # Alle Verbindungen mit bald ablaufenden Tokens finden
        threshold_time = timezone.now() + timedelta(minutes=5)
        
        connections = PortalConnection.objects.filter(
            is_active=True,
            token_expires_at__lte=threshold_time,
            refresh_token__isnull=False
        )
        
        for connection in connections:
            try:
                # Token erneuern
                async def refresh_token():
                    async with RealPortalPublishingService(connection.tenant_id) as service:
                        await service._ensure_valid_token(connection)
                
                import asyncio
                asyncio.run(refresh_token())
                
                logger.info(f"Token refreshed for {connection.portal} connection {connection.id}")
                
            except Exception as e:
                logger.error(f"Failed to refresh token for {connection.portal}: {str(e)}")
                
                # Verbindung deaktivieren bei Token-Refresh-Fehler
                connection.is_active = False
                connection.last_error = f"Token refresh failed: {str(e)}"
                connection.save()
                
                # Fehler loggen
                PortalSyncLog.objects.create(
                    portal_connection=connection,
                    level=LogLevel.ERROR,
                    message=f"Token refresh failed: {str(e)}",
                    details={'error': str(e)}
                )
        
        logger.info(f"Token refresh task completed for {connections.count()} connections")
        
    except Exception as e:
        logger.error(f"Token refresh task failed: {str(e)}")


@shared_task
def sync_portal_analytics_task():
    """Periodische Task für Portal-Analytics-Synchronisation"""
    
    try:
        # Alle aktiven Veröffentlichungen finden
        published_jobs = PortalPublishJob.objects.filter(
            status='published',
            portal_property_id__isnull=False,
            portal_connection__is_active=True
        )
        
        for job in published_jobs:
            try:
                # Analytics von Portal abrufen
                async def fetch_analytics():
                    async with RealPortalPublishingService(job.portal_connection.tenant_id) as service:
                        access_token = await service._ensure_valid_token(job.portal_connection)
                        
                        # Portal-spezifische Analytics-API aufrufen
                        analytics_data = await service._call_portal_analytics_api(
                            job.portal_connection.portal,
                            access_token,
                            job.portal_property_id
                        )
                        
                        # Analytics-Daten in Job speichern
                        job.sync_data.update({
                            'analytics': analytics_data,
                            'last_analytics_sync': timezone.now().isoformat()
                        })
                        job.save()
                
                import asyncio
                asyncio.run(fetch_analytics())
                
                logger.info(f"Analytics synced for property {job.property.id} on {job.portal_connection.portal}")
                
            except Exception as e:
                logger.error(f"Failed to sync analytics for property {job.property.id}: {str(e)}")
        
        logger.info(f"Analytics sync task completed for {published_jobs.count()} properties")
        
    except Exception as e:
        logger.error(f"Analytics sync task failed: {str(e)}")


@shared_task
def cleanup_old_sync_logs_task():
    """Task für Bereinigung alter Sync-Logs"""
    
    try:
        # Logs älter als 30 Tage löschen
        cutoff_date = timezone.now() - timedelta(days=30)
        
        deleted_count = PortalSyncLog.objects.filter(
            created_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old sync logs")
        
    except Exception as e:
        logger.error(f"Log cleanup task failed: {str(e)}")


# Celery Beat Schedule Configuration
CELERY_BEAT_SCHEDULE = {
    'refresh-portal-tokens': {
        'task': 'app.tasks.portal_tasks.refresh_portal_tokens_task',
        'schedule': 300.0,  # Alle 5 Minuten
    },
    'sync-portal-analytics': {
        'task': 'app.tasks.portal_tasks.sync_portal_analytics_task',
        'schedule': 3600.0,  # Alle Stunde
    },
    'cleanup-old-logs': {
        'task': 'app.tasks.portal_tasks.cleanup_old_sync_logs_task',
        'schedule': 86400.0,  # Täglich
    },
}
