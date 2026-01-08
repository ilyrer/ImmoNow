"""
SLA Service
Verwaltet SLA-Instances und prüft Breaches
"""
from typing import List, Optional, Dict, Any
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta
import logging

from sla.models import SLA, SLAInstance
from tasks.models import Task
from app.core.errors import ValidationError, NotFoundError

logger = logging.getLogger(__name__)


class SLAService:
    """Service für SLA-Management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def create_sla(
        self,
        name: str,
        sla_type: str,
        time_limit_hours: int,
        applies_to: Dict[str, Any],
        description: Optional[str] = None,
        created_by_id: Optional[str] = None,
    ) -> SLA:
        """Erstellt neue SLA-Definition"""
        
        @sync_to_async
        def create():
            from accounts.models import User
            
            created_by = None
            if created_by_id:
                try:
                    created_by = User.objects.get(id=created_by_id)
                except User.DoesNotExist:
                    pass
            
            return SLA.objects.create(
                tenant_id=self.tenant_id,
                name=name,
                description=description,
                sla_type=sla_type,
                time_limit_hours=time_limit_hours,
                applies_to=applies_to,
                created_by=created_by,
                is_active=True,
            )
        
        return await create()
    
    async def get_slas(self) -> List[SLA]:
        """Holt alle SLAs für Tenant"""
        
        @sync_to_async
        def fetch():
            return list(
                SLA.objects.filter(tenant_id=self.tenant_id).order_by("-created_at")
            )
        
        return await fetch()
    
    async def get_sla(self, sla_id: str) -> Optional[SLA]:
        """Holt einzelne SLA"""
        
        @sync_to_async
        def fetch():
            try:
                return SLA.objects.get(id=sla_id, tenant_id=self.tenant_id)
            except SLA.DoesNotExist:
                return None
        
        return await fetch()
    
    async def start_sla_for_task(self, task_id: str, sla_id: str) -> SLAInstance:
        """Startet SLA-Timer für Task"""
        
        sla = await self.get_sla(sla_id)
        if not sla:
            raise ValidationError(f"SLA {sla_id} not found")
        
        if not sla.is_active:
            raise ValidationError(f"SLA {sla_id} is not active")
        
        # Prüfe ob bereits SLAInstance existiert
        existing = await self._get_sla_instance(task_id, sla_id)
        if existing:
            raise ValidationError(f"Task {task_id} already has an SLA instance for {sla_id}")
        
        # Berechne Deadline
        started_at = datetime.utcnow()
        deadline = started_at + timedelta(hours=sla.time_limit_hours)
        
        @sync_to_async
        def create_instance():
            try:
                task = Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                raise ValidationError(f"Task {task_id} not found")
            
            return SLAInstance.objects.create(
                sla=sla,
                task=task,
                tenant_id=self.tenant_id,
                status="active",
                started_at=started_at,
                deadline=deadline,
            )
        
        instance = await create_instance()
        logger.info(f"Started SLA {sla_id} for task {task_id}, deadline: {deadline}")
        
        return instance
    
    async def pause_sla_instance(self, instance_id: str) -> Optional[SLAInstance]:
        """Pausiert SLA-Instance"""
        
        @sync_to_async
        def pause():
            try:
                instance = SLAInstance.objects.get(id=instance_id, tenant_id=self.tenant_id)
            except SLAInstance.DoesNotExist:
                return None
            
            if instance.status != "active":
                raise ValidationError(f"SLA instance {instance_id} is not active")
            
            instance.status = "paused"
            instance.paused_at = datetime.utcnow()
            instance.save()
            
            return instance
        
        return await pause()
    
    async def resume_sla_instance(self, instance_id: str) -> Optional[SLAInstance]:
        """Setzt SLA-Instance fort"""
        
        @sync_to_async
        def resume():
            try:
                instance = SLAInstance.objects.get(id=instance_id, tenant_id=self.tenant_id)
            except SLAInstance.DoesNotExist:
                return None
            
            if instance.status != "paused":
                raise ValidationError(f"SLA instance {instance_id} is not paused")
            
            # Berechne paused_duration
            if instance.paused_at:
                paused_duration = (datetime.utcnow() - instance.paused_at).total_seconds()
                instance.paused_duration_seconds += int(paused_duration)
            
            instance.status = "active"
            instance.paused_at = None
            instance.save()
            
            return instance
        
        return await resume()
    
    async def resolve_sla_instance(self, instance_id: str) -> Optional[SLAInstance]:
        """Markiert SLA-Instance als resolved"""
        
        @sync_to_async
        def resolve():
            try:
                instance = SLAInstance.objects.get(id=instance_id, tenant_id=self.tenant_id)
            except SLAInstance.DoesNotExist:
                return None
            
            instance.status = "resolved"
            instance.resolved_at = datetime.utcnow()
            instance.save()
            
            return instance
        
        return await resolve()
    
    async def check_breaches(self) -> List[SLAInstance]:
        """Prüft alle aktiven SLA-Instances auf Breaches"""
        
        @sync_to_async
        def check():
            now = datetime.utcnow()
            active_instances = SLAInstance.objects.filter(
                tenant_id=self.tenant_id,
                status__in=["active", "paused"]
            )
            
            breached = []
            for instance in active_instances:
                if instance.deadline < now and instance.status != "breached":
                    instance.status = "breached"
                    instance.breached_at = now
                    instance.save()
                    breached.append(instance)
            
            return breached
        
        return await check()
    
    async def get_sla_instance(self, task_id: str, sla_id: Optional[str] = None) -> Optional[SLAInstance]:
        """Holt SLAInstance für Task"""
        
        @sync_to_async
        def fetch():
            try:
                if sla_id:
                    return SLAInstance.objects.get(
                        task_id=task_id, 
                        sla_id=sla_id, 
                        tenant_id=self.tenant_id
                    )
                else:
                    # Hole erste aktive Instance
                    return SLAInstance.objects.filter(
                        task_id=task_id,
                        tenant_id=self.tenant_id,
                        status__in=["active", "paused"]
                    ).first()
            except SLAInstance.DoesNotExist:
                return None
        
        return await fetch()
    
    async def get_task_slas(self, task_id: str) -> List[SLAInstance]:
        """Holt alle SLAInstances für Task"""
        
        @sync_to_async
        def fetch():
            return list(
                SLAInstance.objects.filter(
                    task_id=task_id,
                    tenant_id=self.tenant_id
                ).order_by("-started_at")
            )
        
        return await fetch()
    
    async def _get_sla_instance(self, task_id: str, sla_id: str) -> Optional[SLAInstance]:
        """Holt SLAInstance (internal)"""
        return await self.get_sla_instance(task_id, sla_id)

