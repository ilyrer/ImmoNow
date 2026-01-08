"""
Automations API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.automation import (
    AutomationRuleResponse,
    CreateAutomationRuleRequest,
    UpdateAutomationRuleRequest,
    AutomationLogResponse,
)
from app.services.automation import AutomationService

router = APIRouter()


@router.get("", response_model=List[AutomationRuleResponse])
async def list_automation_rules(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Liste aller Automation Rules für Tenant"""
    
    automation_service = AutomationService(tenant_id)
    rules = await automation_service.get_rules()
    
    # Konvertiere zu Response
    result = []
    for rule in rules:
        from app.schemas.automation import Condition, Action
        
        conditions = [Condition(**c) for c in rule.conditions]
        actions = [Action(**a) for a in rule.actions]
        
        result.append(AutomationRuleResponse(
            id=str(rule.id),
            name=rule.name,
            description=rule.description,
            trigger=rule.trigger,
            conditions=conditions,
            actions=actions,
            is_active=rule.is_active,
            created_by=str(rule.created_by.id) if rule.created_by else None,
            created_at=rule.created_at,
            updated_at=rule.updated_at,
            execution_count=rule.execution_count,
            last_executed_at=rule.last_executed_at,
        ))
    
    return result


@router.post("", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    rule_data: CreateAutomationRuleRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstellt neue Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    
    # Konvertiere Conditions und Actions zu Dict
    conditions = [c.model_dump() for c in rule_data.conditions]
    actions = [a.model_dump() for a in rule_data.actions]
    
    rule = await automation_service.create_rule(
        name=rule_data.name,
        description=rule_data.description,
        trigger=rule_data.trigger,
        conditions=conditions,
        actions=actions,
        created_by_id=current_user.user_id,
    )
    
    # Konvertiere zu Response
    from app.schemas.automation import Condition, Action
    
    conditions_resp = [Condition(**c) for c in rule.conditions]
    actions_resp = [Action(**a) for a in rule.actions]
    
    return AutomationRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        trigger=rule.trigger,
        conditions=conditions_resp,
        actions=actions_resp,
        is_active=rule.is_active,
        created_by=str(rule.created_by.id) if rule.created_by else None,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
        execution_count=rule.execution_count,
        last_executed_at=rule.last_executed_at,
    )


@router.get("/{rule_id}", response_model=AutomationRuleResponse)
async def get_automation_rule(
    rule_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt einzelne Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    rule = await automation_service.get_rule(rule_id)
    
    if not rule:
        raise NotFoundError("Automation rule not found")
    
    # Konvertiere zu Response
    from app.schemas.automation import Condition, Action
    
    conditions = [Condition(**c) for c in rule.conditions]
    actions = [Action(**a) for a in rule.actions]
    
    return AutomationRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        trigger=rule.trigger,
        conditions=conditions,
        actions=actions,
        is_active=rule.is_active,
        created_by=str(rule.created_by.id) if rule.created_by else None,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
        execution_count=rule.execution_count,
        last_executed_at=rule.last_executed_at,
    )


@router.put("/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation_rule(
    rule_id: str,
    rule_data: UpdateAutomationRuleRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Aktualisiert Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    
    # Konvertiere Conditions und Actions zu Dict (falls vorhanden)
    conditions = None
    if rule_data.conditions is not None:
        conditions = [c.model_dump() for c in rule_data.conditions]
    
    actions = None
    if rule_data.actions is not None:
        actions = [a.model_dump() for a in rule_data.actions]
    
    rule = await automation_service.update_rule(
        rule_id=rule_id,
        name=rule_data.name,
        description=rule_data.description,
        trigger=rule_data.trigger,
        conditions=conditions,
        actions=actions,
        is_active=rule_data.is_active,
    )
    
    if not rule:
        raise NotFoundError("Automation rule not found")
    
    # Konvertiere zu Response
    from app.schemas.automation import Condition, Action
    
    conditions_resp = [Condition(**c) for c in rule.conditions]
    actions_resp = [Action(**a) for a in rule.actions]
    
    return AutomationRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        trigger=rule.trigger,
        conditions=conditions_resp,
        actions=actions_resp,
        is_active=rule.is_active,
        created_by=str(rule.created_by.id) if rule.created_by else None,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
        execution_count=rule.execution_count,
        last_executed_at=rule.last_executed_at,
    )


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_automation_rule(
    rule_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Löscht Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    deleted = await automation_service.delete_rule(rule_id)
    
    if not deleted:
        raise NotFoundError("Automation rule not found")


@router.post("/{rule_id}/toggle", response_model=AutomationRuleResponse)
async def toggle_automation_rule(
    rule_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Enable/Disable Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    rule = await automation_service.get_rule(rule_id)
    
    if not rule:
        raise NotFoundError("Automation rule not found")
    
    # Toggle is_active
    rule = await automation_service.update_rule(
        rule_id=rule_id,
        is_active=not rule.is_active,
    )
    
    # Konvertiere zu Response
    from app.schemas.automation import Condition, Action
    
    conditions = [Condition(**c) for c in rule.conditions]
    actions = [Action(**a) for a in rule.actions]
    
    return AutomationRuleResponse(
        id=str(rule.id),
        name=rule.name,
        description=rule.description,
        trigger=rule.trigger,
        conditions=conditions,
        actions=actions,
        is_active=rule.is_active,
        created_by=str(rule.created_by.id) if rule.created_by else None,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
        execution_count=rule.execution_count,
        last_executed_at=rule.last_executed_at,
    )


@router.get("/{rule_id}/logs", response_model=List[AutomationLogResponse])
async def get_automation_logs(
    rule_id: str,
    limit: int = 50,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt Execution Logs für Automation Rule"""
    
    automation_service = AutomationService(tenant_id)
    logs = await automation_service.get_execution_logs(rule_id=rule_id, limit=limit)
    
    # Konvertiere zu Response
    result = []
    for log in logs:
        result.append(AutomationLogResponse(
            id=str(log.id),
            automation_rule_id=str(log.automation_rule.id),
            automation_rule_name=log.automation_rule.name,
            trigger_event=log.trigger_event,
            status=log.status,
            error_message=log.error_message,
            conditions_met=log.conditions_met,
            actions_executed=log.actions_executed,
            started_at=log.started_at,
            completed_at=log.completed_at,
            execution_time_ms=log.execution_time_ms,
        ))
    
    return result

