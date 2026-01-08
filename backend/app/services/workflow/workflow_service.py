"""
Workflow Service
CRUD-Operationen für Workflows
"""
from typing import List, Optional, Dict, Any
from asgiref.sync import sync_to_async
import logging

from app.db.models import Workflow, WorkflowInstance, Board
from app.core.errors import ValidationError, NotFoundError
from app.services.workflow.workflow_engine import WorkflowEngine

logger = logging.getLogger(__name__)


class WorkflowService:
    """Service für Workflow-Management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.engine = WorkflowEngine(tenant_id)
    
    async def create_workflow(
        self,
        name: str,
        stages: List[Dict[str, Any]],
        description: Optional[str] = None,
        board_id: Optional[str] = None,
        created_by_id: Optional[str] = None,
    ) -> Workflow:
        """Erstellt neuen Workflow"""
        
        # Validiere Stages
        self._validate_stages(stages)
        
        # Prüfe Board-Verknüpfung
        if board_id:
            board = await self._get_board(board_id)
            if not board:
                raise ValidationError(f"Board {board_id} not found")
            
            # Prüfe ob Board bereits Workflow hat
            existing_workflow = await self._get_workflow_by_board(board_id)
            if existing_workflow:
                raise ValidationError(f"Board {board_id} already has a workflow")
        
        @sync_to_async
        def create():
            from app.db.models import User
            
            created_by = None
            if created_by_id:
                try:
                    created_by = User.objects.get(id=created_by_id)
                except User.DoesNotExist:
                    pass
            
            workflow = Workflow.objects.create(
                tenant_id=self.tenant_id,
                name=name,
                description=description,
                stages=stages,
                board_id=board_id,
                created_by=created_by,
                is_active=True,
            )
            
            return workflow
        
        workflow = await create()
        
        # Synchronisiere BoardStatuses (async)
        if board_id:
            await self._sync_board_statuses_from_workflow_async(board_id, stages)
        
        return workflow
    
    async def get_workflows(self) -> List[Workflow]:
        """Holt alle Workflows für Tenant"""
        
        @sync_to_async
        def fetch():
            return list(
                Workflow.objects.filter(tenant_id=self.tenant_id).order_by("-created_at")
            )
        
        return await fetch()
    
    async def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Holt einzelnen Workflow"""
        
        @sync_to_async
        def fetch():
            try:
                return Workflow.objects.get(id=workflow_id, tenant_id=self.tenant_id)
            except Workflow.DoesNotExist:
                return None
        
        return await fetch()
    
    async def update_workflow(
        self,
        workflow_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        stages: Optional[List[Dict[str, Any]]] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Workflow]:
        """Aktualisiert Workflow"""
        
        if stages is not None:
            self._validate_stages(stages)
        
        @sync_to_async
        def update():
            try:
                workflow = Workflow.objects.get(id=workflow_id, tenant_id=self.tenant_id)
            except Workflow.DoesNotExist:
                return None
            
            if name is not None:
                workflow.name = name
            if description is not None:
                workflow.description = description
            if stages is not None:
                workflow.stages = stages
            if is_active is not None:
                workflow.is_active = is_active
            
            workflow.save()
            
            return workflow
        
        workflow = await update()
        
        # Synchronisiere BoardStatuses wenn Stages geändert wurden
        if workflow and stages is not None and workflow.board_id:
            await self._sync_board_statuses_from_workflow_async(workflow.board_id, stages)
        
        return workflow
    
    async def delete_workflow(self, workflow_id: str) -> bool:
        """Löscht Workflow"""
        
        @sync_to_async
        def delete():
            try:
                workflow = Workflow.objects.get(id=workflow_id, tenant_id=self.tenant_id)
                workflow.delete()
                return True
            except Workflow.DoesNotExist:
                return False
        
        return await delete()
    
    async def get_workflow_instance(self, task_id: str) -> Optional[WorkflowInstance]:
        """Holt WorkflowInstance für Task"""
        return await self.engine._get_workflow_instance(task_id)
    
    def _validate_stages(self, stages: List[Dict[str, Any]]) -> None:
        """Validiert Stage-Definition"""
        if not stages:
            raise ValidationError("Workflow must have at least one stage")
        
        stage_ids = set()
        for stage in stages:
            stage_id = stage.get("id")
            if not stage_id:
                raise ValidationError("Stage must have an 'id' field")
            
            if stage_id in stage_ids:
                raise ValidationError(f"Duplicate stage ID: {stage_id}")
            stage_ids.add(stage_id)
            
            # Validiere Transitions
            transitions = stage.get("transitions", [])
            for transition_id in transitions:
                if transition_id not in stage_ids and transition_id not in [s.get("id") for s in stages]:
                    raise ValidationError(f"Transition references unknown stage: {transition_id}")
    
    async def _get_board(self, board_id: str):
        """Holt Board"""
        @sync_to_async
        def fetch():
            try:
                return Board.objects.get(id=board_id, tenant_id=self.tenant_id)
            except Board.DoesNotExist:
                return None
        
        return await fetch()
    
    async def _get_workflow_by_board(self, board_id: str) -> Optional[Workflow]:
        """Holt Workflow für Board"""
        @sync_to_async
        def fetch():
            try:
                return Workflow.objects.get(board_id=board_id, tenant_id=self.tenant_id)
            except Workflow.DoesNotExist:
                return None
        
        return await fetch()
    
    async def _sync_board_statuses_from_workflow_async(
        self, 
        board_id: str, 
        stages: List[Dict[str, Any]]
    ) -> None:
        """Synchronisiert BoardStatuses aus Workflow-Stages (async)"""
        @sync_to_async
        def sync():
            from app.db.models import BoardStatus
            
            board = Board.objects.get(id=board_id, tenant_id=self.tenant_id)
            
            # Lösche alte BoardStatuses (die nicht mehr im Workflow sind)
            existing_status_keys = {s.get("status_mapping") for s in stages if s.get("status_mapping")}
            BoardStatus.objects.filter(board=board).exclude(key__in=existing_status_keys).delete()
            
            # Erstelle/Update BoardStatuses aus Stages
            for order, stage in enumerate(stages):
                status_mapping = stage.get("status_mapping")
                if not status_mapping:
                    continue  # Skip Stages ohne Status-Mapping
                
                # Finde erlaubte Vorgänger (Stages die zu dieser Stage transitionieren können)
                allow_from = []
                current_stage_id = stage.get("id")
                for other_stage in stages:
                    # Prüfe ob other_stage zu current_stage transitionieren kann
                    if current_stage_id in other_stage.get("transitions", []):
                        other_status_mapping = other_stage.get("status_mapping")
                        if other_status_mapping:
                            allow_from.append(other_status_mapping)
                
                # Erstelle oder Update BoardStatus
                BoardStatus.objects.update_or_create(
                    board=board,
                    key=status_mapping,
                    defaults={
                        "title": stage.get("name", status_mapping),
                        "order": order,
                        "color": self._get_stage_color(order, len(stages)),
                        "is_terminal": stage.get("is_terminal", False),
                        "allow_from": allow_from,
                    }
                )
        
        await sync()
    
    def _get_stage_color(self, order: int, total: int) -> str:
        """Gibt Farbe für Stage basierend auf Position zurück"""
        colors = [
            "#8E8E93",  # Grau (Start)
            "#0A84FF",  # Blau
            "#FF9F0A",  # Orange
            "#32D74B",  # Grün (Ende)
        ]
        if total <= len(colors):
            return colors[min(order, len(colors) - 1)]
        # Interpoliere zwischen Farben
        return colors[min(order % len(colors), len(colors) - 1)]

