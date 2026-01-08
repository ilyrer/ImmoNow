"""
Workflow Engine
Validiert und führt Workflow-Transitions aus
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from asgiref.sync import sync_to_async
import logging

from workflow.models import Workflow, WorkflowInstance
from tasks.models import Task, Board
from app.core.errors import ValidationError

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Engine für Workflow-Execution"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def start_workflow(self, task_id: str, workflow_id: str, user_id: str) -> WorkflowInstance:
        """
        Startet Workflow für Task
        
        Args:
            task_id: Task-ID
            workflow_id: Workflow-ID
            user_id: User der Workflow startet
        
        Returns:
            WorkflowInstance
        """
        # Hole Workflow
        workflow = await self._get_workflow(workflow_id)
        if not workflow:
            raise ValidationError(f"Workflow {workflow_id} not found")
        
        if not workflow.is_active:
            raise ValidationError(f"Workflow {workflow_id} is not active")
        
        # Hole Task
        task = await self._get_task(task_id)
        if not task:
            raise ValidationError(f"Task {task_id} not found")
        
        # Prüfe ob bereits Workflow-Instance existiert
        existing = await self._get_workflow_instance(task_id)
        if existing:
            raise ValidationError(f"Task {task_id} already has a workflow instance")
        
        # Finde erste Stage (niedrigste order)
        stages = workflow.stages
        if not stages:
            raise ValidationError(f"Workflow {workflow_id} has no stages")
        
        first_stage = min(stages, key=lambda s: s.get("order", 0))
        first_stage_id = first_stage.get("id")
        
        if not first_stage_id:
            raise ValidationError(f"Workflow {workflow_id} has invalid stage definition")
        
        # Erstelle WorkflowInstance
        @sync_to_async
        def create_instance():
            instance = WorkflowInstance.objects.create(
                workflow=workflow,
                task=task,
                tenant_id=self.tenant_id,
                current_stage_id=first_stage_id,
                history=[{
                    "from": None,
                    "to": first_stage_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "user_id": user_id,
                }],
            )
            return instance
        
        instance = await create_instance()
        
        # Update Task Status (falls Stage einen Status-Mapping hat)
        await self._update_task_status_from_stage(task, first_stage)
        
        logger.info(f"Started workflow {workflow_id} for task {task_id}")
        
        return instance
    
    async def advance_workflow(
        self, 
        task_id: str, 
        next_stage_id: str, 
        user_id: str
    ) -> WorkflowInstance:
        """
        Führt Workflow-Transition aus
        
        Args:
            task_id: Task-ID
            next_stage_id: Ziel-Stage-ID
            user_id: User der Transition ausführt
        
        Returns:
            Updated WorkflowInstance
        """
        # Hole WorkflowInstance
        instance = await self._get_workflow_instance(task_id)
        if not instance:
            raise ValidationError(f"Task {task_id} has no workflow instance")
        
        workflow = instance.workflow
        current_stage_id = instance.current_stage_id
        
        # Validiere Transition
        await self._validate_transition(workflow, current_stage_id, next_stage_id)
        
        # Hole Stage-Definitionen
        current_stage = self._get_stage_by_id(workflow.stages, current_stage_id)
        next_stage = self._get_stage_by_id(workflow.stages, next_stage_id)
        
        if not current_stage or not next_stage:
            raise ValidationError("Invalid stage definition")
        
        # Führe Transition aus
        @sync_to_async
        def update_instance():
            instance.current_stage_id = next_stage_id
            instance.history.append({
                "from": current_stage_id,
                "to": next_stage_id,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
            })
            
            # Prüfe ob Terminal-Stage erreicht
            if next_stage.get("is_terminal", False):
                instance.completed_at = datetime.utcnow()
            
            instance.save()
            return instance
        
        instance = await update_instance()
        
        # Update Task Status
        await self._update_task_status_from_stage(instance.task, next_stage)
        
        logger.info(f"Advanced workflow for task {task_id}: {current_stage_id} → {next_stage_id}")
        
        return instance
    
    async def _validate_transition(
        self, 
        workflow: Workflow, 
        current_stage_id: str, 
        next_stage_id: str
    ) -> None:
        """Validiert ob Transition erlaubt ist"""
        stages = workflow.stages
        
        # Finde Current Stage
        current_stage = self._get_stage_by_id(stages, current_stage_id)
        if not current_stage:
            raise ValidationError(f"Current stage {current_stage_id} not found in workflow")
        
        # Prüfe ob Next Stage existiert
        next_stage = self._get_stage_by_id(stages, next_stage_id)
        if not next_stage:
            raise ValidationError(f"Next stage {next_stage_id} not found in workflow")
        
        # Prüfe Transitions
        allowed_transitions = current_stage.get("transitions", [])
        if next_stage_id not in allowed_transitions:
            raise ValidationError(
                f"Transition from {current_stage_id} to {next_stage_id} is not allowed. "
                f"Allowed transitions: {', '.join(allowed_transitions)}"
            )
    
    def _get_stage_by_id(self, stages: List[Dict[str, Any]], stage_id: str) -> Optional[Dict[str, Any]]:
        """Holt Stage-Definition nach ID"""
        for stage in stages:
            if stage.get("id") == stage_id:
                return stage
        return None
    
    async def get_available_transitions(self, task_id: str) -> List[str]:
        """Gibt erlaubte nächste Stages zurück"""
        instance = await self._get_workflow_instance(task_id)
        if not instance:
            return []
        
        workflow = instance.workflow
        current_stage = self._get_stage_by_id(workflow.stages, instance.current_stage_id)
        
        if not current_stage:
            return []
        
        return current_stage.get("transitions", [])
    
    async def _get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Holt Workflow"""
        @sync_to_async
        def fetch():
            try:
                return Workflow.objects.get(id=workflow_id, tenant_id=self.tenant_id)
            except Workflow.DoesNotExist:
                return None
        
        return await fetch()
    
    async def _get_task(self, task_id: str) -> Optional[Task]:
        """Holt Task"""
        @sync_to_async
        def fetch():
            try:
                return Task.objects.get(id=task_id, tenant_id=self.tenant_id)
            except Task.DoesNotExist:
                return None
        
        return await fetch()
    
    async def _get_workflow_instance(self, task_id: str) -> Optional[WorkflowInstance]:
        """Holt WorkflowInstance für Task"""
        @sync_to_async
        def fetch():
            try:
                return WorkflowInstance.objects.get(task_id=task_id, tenant_id=self.tenant_id)
            except WorkflowInstance.DoesNotExist:
                return None
        
        return await fetch()
    
    async def _update_task_status_from_stage(self, task: Task, stage: Dict[str, Any]) -> None:
        """Aktualisiert Task-Status basierend auf Stage"""
        # Stage kann einen status_mapping haben
        status_mapping = stage.get("status_mapping")
        
        if status_mapping:
            @sync_to_async
            def update():
                task.status = status_mapping
                task.save()
            
            await update()

