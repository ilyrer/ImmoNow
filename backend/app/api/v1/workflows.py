"""
Workflows API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.workflow import (
    WorkflowResponse,
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    WorkflowInstanceResponse,
    StartWorkflowRequest,
    AdvanceWorkflowRequest,
    WorkflowStage,
)
from app.services.workflow import WorkflowService, WorkflowEngine

router = APIRouter()


@router.get("", response_model=List[WorkflowResponse])
async def list_workflows(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Liste aller Workflows für Tenant"""
    
    workflow_service = WorkflowService(tenant_id)
    workflows = await workflow_service.get_workflows()
    
    # Konvertiere zu Response
    result = []
    for workflow in workflows:
        stages = [WorkflowStage(**s) for s in workflow.stages]
        
        result.append(WorkflowResponse(
            id=str(workflow.id),
            name=workflow.name,
            description=workflow.description,
            stages=stages,
            board_id=str(workflow.board_id) if workflow.board_id else None,
            created_by=str(workflow.created_by.id) if workflow.created_by else None,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
            is_active=workflow.is_active,
        ))
    
    return result


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: CreateWorkflowRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstellt neuen Workflow"""
    
    workflow_service = WorkflowService(tenant_id)
    
    # Konvertiere Stages zu Dict
    stages = [s.model_dump() for s in workflow_data.stages]
    
    workflow = await workflow_service.create_workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        stages=stages,
        board_id=workflow_data.board_id,
        created_by_id=current_user.user_id,
    )
    
    # Konvertiere zu Response
    stages_resp = [WorkflowStage(**s) for s in workflow.stages]
    
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        stages=stages_resp,
        board_id=str(workflow.board_id) if workflow.board_id else None,
        created_by=str(workflow.created_by.id) if workflow.created_by else None,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        is_active=workflow.is_active,
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt einzelnen Workflow"""
    
    workflow_service = WorkflowService(tenant_id)
    workflow = await workflow_service.get_workflow(workflow_id)
    
    if not workflow:
        raise NotFoundError("Workflow not found")
    
    # Konvertiere zu Response
    stages = [WorkflowStage(**s) for s in workflow.stages]
    
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        stages=stages,
        board_id=str(workflow.board_id) if workflow.board_id else None,
        created_by=str(workflow.created_by.id) if workflow.created_by else None,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        is_active=workflow.is_active,
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_data: UpdateWorkflowRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Aktualisiert Workflow"""
    
    workflow_service = WorkflowService(tenant_id)
    
    # Konvertiere Stages zu Dict (falls vorhanden)
    stages = None
    if workflow_data.stages is not None:
        stages = [s.model_dump() for s in workflow_data.stages]
    
    workflow = await workflow_service.update_workflow(
        workflow_id=workflow_id,
        name=workflow_data.name,
        description=workflow_data.description,
        stages=stages,
        is_active=workflow_data.is_active,
    )
    
    if not workflow:
        raise NotFoundError("Workflow not found")
    
    # Konvertiere zu Response
    stages_resp = [WorkflowStage(**s) for s in workflow.stages]
    
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        stages=stages_resp,
        board_id=str(workflow.board_id) if workflow.board_id else None,
        created_by=str(workflow.created_by.id) if workflow.created_by else None,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        is_active=workflow.is_active,
    )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Löscht Workflow"""
    
    workflow_service = WorkflowService(tenant_id)
    deleted = await workflow_service.delete_workflow(workflow_id)
    
    if not deleted:
        raise NotFoundError("Workflow not found")


@router.post("/tasks/{task_id}/start", response_model=WorkflowInstanceResponse)
async def start_workflow(
    task_id: str,
    request: StartWorkflowRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Startet Workflow für Task"""
    
    engine = WorkflowEngine(tenant_id)
    instance = await engine.start_workflow(task_id, request.workflow_id, current_user.user_id)
    
    # Hole Stage-Name
    workflow = instance.workflow
    current_stage = None
    for stage in workflow.stages:
        if stage.get("id") == instance.current_stage_id:
            current_stage = stage
            break
    
    return WorkflowInstanceResponse(
        id=str(instance.id),
        workflow_id=str(instance.workflow_id),
        workflow_name=workflow.name,
        task_id=str(instance.task_id),
        current_stage_id=instance.current_stage_id,
        current_stage_name=current_stage.get("name") if current_stage else None,
        history=instance.history,
        started_at=instance.started_at,
        updated_at=instance.updated_at,
        completed_at=instance.completed_at,
    )


@router.post("/tasks/{task_id}/advance", response_model=WorkflowInstanceResponse)
async def advance_workflow(
    task_id: str,
    request: AdvanceWorkflowRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Führt Workflow-Transition aus"""
    
    engine = WorkflowEngine(tenant_id)
    instance = await engine.advance_workflow(task_id, request.next_stage_id, current_user.user_id)
    
    # Hole Stage-Name
    workflow = instance.workflow
    current_stage = None
    for stage in workflow.stages:
        if stage.get("id") == instance.current_stage_id:
            current_stage = stage
            break
    
    return WorkflowInstanceResponse(
        id=str(instance.id),
        workflow_id=str(instance.workflow_id),
        workflow_name=workflow.name,
        task_id=str(instance.task_id),
        current_stage_id=instance.current_stage_id,
        current_stage_name=current_stage.get("name") if current_stage else None,
        history=instance.history,
        started_at=instance.started_at,
        updated_at=instance.updated_at,
        completed_at=instance.completed_at,
    )


@router.get("/tasks/{task_id}/instance", response_model=Optional[WorkflowInstanceResponse])
async def get_workflow_instance(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt WorkflowInstance für Task"""
    
    workflow_service = WorkflowService(tenant_id)
    instance = await workflow_service.get_workflow_instance(task_id)
    
    if not instance:
        return None
    
    # Hole Stage-Name
    workflow = instance.workflow
    current_stage = None
    for stage in workflow.stages:
        if stage.get("id") == instance.current_stage_id:
            current_stage = stage
            break
    
    return WorkflowInstanceResponse(
        id=str(instance.id),
        workflow_id=str(instance.workflow_id),
        workflow_name=workflow.name,
        task_id=str(instance.task_id),
        current_stage_id=instance.current_stage_id,
        current_stage_name=current_stage.get("name") if current_stage else None,
        history=instance.history,
        started_at=instance.started_at,
        updated_at=instance.updated_at,
        completed_at=instance.completed_at,
    )


@router.get("/tasks/{task_id}/transitions", response_model=List[str])
async def get_workflow_transitions(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Gibt erlaubte nächste Stages für Task zurück"""
    
    engine = WorkflowEngine(tenant_id)
    transitions = await engine.get_available_transitions(task_id)
    
    return transitions

