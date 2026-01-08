"""
SLAs API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.sla import (
    SLAResponse,
    CreateSLARequest,
    UpdateSLARequest,
    SLAInstanceResponse,
)
from app.services.sla import SLAService

router = APIRouter()


@router.get("", response_model=List[SLAResponse])
async def list_slas(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Liste aller SLAs für Tenant"""
    
    sla_service = SLAService(tenant_id)
    slas = await sla_service.get_slas()
    
    # Konvertiere zu Response
    result = []
    for sla in slas:
        result.append(SLAResponse(
            id=str(sla.id),
            name=sla.name,
            description=sla.description,
            sla_type=sla.sla_type,
            time_limit_hours=sla.time_limit_hours,
            applies_to=sla.applies_to,
            created_by=str(sla.created_by.id) if sla.created_by else None,
            created_at=sla.created_at,
            updated_at=sla.updated_at,
            is_active=sla.is_active,
        ))
    
    return result


@router.post("", response_model=SLAResponse, status_code=status.HTTP_201_CREATED)
async def create_sla(
    sla_data: CreateSLARequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstellt neue SLA-Definition"""
    
    sla_service = SLAService(tenant_id)
    sla = await sla_service.create_sla(
        name=sla_data.name,
        description=sla_data.description,
        sla_type=sla_data.sla_type,
        time_limit_hours=sla_data.time_limit_hours,
        applies_to=sla_data.applies_to,
        created_by_id=current_user.user_id,
    )
    
    return SLAResponse(
        id=str(sla.id),
        name=sla.name,
        description=sla.description,
        sla_type=sla.sla_type,
        time_limit_hours=sla.time_limit_hours,
        applies_to=sla.applies_to,
        created_by=str(sla.created_by.id) if sla.created_by else None,
        created_at=sla.created_at,
        updated_at=sla.updated_at,
        is_active=sla.is_active,
    )


@router.get("/{sla_id}", response_model=SLAResponse)
async def get_sla(
    sla_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt einzelne SLA"""
    
    sla_service = SLAService(tenant_id)
    sla = await sla_service.get_sla(sla_id)
    
    if not sla:
        raise NotFoundError("SLA not found")
    
    return SLAResponse(
        id=str(sla.id),
        name=sla.name,
        description=sla.description,
        sla_type=sla.sla_type,
        time_limit_hours=sla.time_limit_hours,
        applies_to=sla.applies_to,
        created_by=str(sla.created_by.id) if sla.created_by else None,
        created_at=sla.created_at,
        updated_at=sla.updated_at,
        is_active=sla.is_active,
    )


@router.get("/tasks/{task_id}/instances", response_model=List[SLAInstanceResponse])
async def get_task_sla_instances(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt alle SLAInstances für Task"""
    
    sla_service = SLAService(tenant_id)
    instances = await sla_service.get_task_slas(task_id)
    
    # Konvertiere zu Response
    result = []
    for instance in instances:
        result.append(SLAInstanceResponse(
            id=str(instance.id),
            sla_id=str(instance.sla_id),
            sla_name=instance.sla.name,
            sla_type=instance.sla.sla_type,
            task_id=str(instance.task_id),
            status=instance.status,
            started_at=instance.started_at,
            deadline=instance.deadline,
            paused_at=instance.paused_at,
            resolved_at=instance.resolved_at,
            breached_at=instance.breached_at,
            remaining_time_hours=instance.get_remaining_time_hours(),
            is_breached=instance.is_breached(),
        ))
    
    return result


@router.post("/tasks/{task_id}/start", response_model=SLAInstanceResponse)
async def start_sla_for_task(
    task_id: str,
    sla_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Startet SLA-Timer für Task"""
    
    sla_service = SLAService(tenant_id)
    instance = await sla_service.start_sla_for_task(task_id, sla_id)
    
    return SLAInstanceResponse(
        id=str(instance.id),
        sla_id=str(instance.sla_id),
        sla_name=instance.sla.name,
        sla_type=instance.sla.sla_type,
        task_id=str(instance.task_id),
        status=instance.status,
        started_at=instance.started_at,
        deadline=instance.deadline,
        paused_at=instance.paused_at,
        resolved_at=instance.resolved_at,
        breached_at=instance.breached_at,
        remaining_time_hours=instance.get_remaining_time_hours(),
        is_breached=instance.is_breached(),
    )


@router.post("/instances/{instance_id}/pause", response_model=SLAInstanceResponse)
async def pause_sla_instance(
    instance_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Pausiert SLA-Instance"""
    
    sla_service = SLAService(tenant_id)
    instance = await sla_service.pause_sla_instance(instance_id)
    
    if not instance:
        raise NotFoundError("SLA instance not found")
    
    return SLAInstanceResponse(
        id=str(instance.id),
        sla_id=str(instance.sla_id),
        sla_name=instance.sla.name,
        sla_type=instance.sla.sla_type,
        task_id=str(instance.task_id),
        status=instance.status,
        started_at=instance.started_at,
        deadline=instance.deadline,
        paused_at=instance.paused_at,
        resolved_at=instance.resolved_at,
        breached_at=instance.breached_at,
        remaining_time_hours=instance.get_remaining_time_hours(),
        is_breached=instance.is_breached(),
    )


@router.post("/instances/{instance_id}/resume", response_model=SLAInstanceResponse)
async def resume_sla_instance(
    instance_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Setzt SLA-Instance fort"""
    
    sla_service = SLAService(tenant_id)
    instance = await sla_service.resume_sla_instance(instance_id)
    
    if not instance:
        raise NotFoundError("SLA instance not found")
    
    return SLAInstanceResponse(
        id=str(instance.id),
        sla_id=str(instance.sla_id),
        sla_name=instance.sla.name,
        sla_type=instance.sla.sla_type,
        task_id=str(instance.task_id),
        status=instance.status,
        started_at=instance.started_at,
        deadline=instance.deadline,
        paused_at=instance.paused_at,
        resolved_at=instance.resolved_at,
        breached_at=instance.breached_at,
        remaining_time_hours=instance.get_remaining_time_hours(),
        is_breached=instance.is_breached(),
    )


@router.post("/instances/{instance_id}/resolve", response_model=SLAInstanceResponse)
async def resolve_sla_instance(
    instance_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Markiert SLA-Instance als resolved"""
    
    sla_service = SLAService(tenant_id)
    instance = await sla_service.resolve_sla_instance(instance_id)
    
    if not instance:
        raise NotFoundError("SLA instance not found")
    
    return SLAInstanceResponse(
        id=str(instance.id),
        sla_id=str(instance.sla_id),
        sla_name=instance.sla.name,
        sla_type=instance.sla_type,
        task_id=str(instance.task_id),
        status=instance.status,
        started_at=instance.started_at,
        deadline=instance.deadline,
        paused_at=instance.paused_at,
        resolved_at=instance.resolved_at,
        breached_at=instance.breached_at,
        remaining_time_hours=instance.get_remaining_time_hours(),
        is_breached=instance.is_breached(),
    )

