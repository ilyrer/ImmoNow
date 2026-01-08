"""
Automation Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class Condition(BaseModel):
    """Condition für Automation Rule"""
    field: str = Field(..., description="Feld-Name (z.B. 'status', 'priority')")
    operator: str = Field(..., description="Operator (equals, not_equals, contains, is_empty, greater_than, etc.)")
    value: Any = Field(None, description="Vergleichswert")


class Action(BaseModel):
    """Action für Automation Rule"""
    type: str = Field(..., description="Action-Type (assign_user, send_notification, update_field, add_comment, create_subtask)")
    params: Dict[str, Any] = Field(default_factory=dict, description="Action-Parameter")


class AutomationRuleResponse(BaseModel):
    """Automation Rule Response"""
    id: str
    name: str
    description: Optional[str] = None
    trigger: str
    conditions: List[Condition] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
    is_active: bool
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    execution_count: int = 0
    last_executed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class CreateAutomationRuleRequest(BaseModel):
    """Create Automation Rule Request"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    trigger: str = Field(..., description="Event-Type (task.created, task.status_changed, task.assigned)")
    conditions: List[Condition] = Field(default_factory=list)
    actions: List[Action] = Field(..., min_length=1, description="Mindestens eine Action erforderlich")
    is_active: bool = True


class UpdateAutomationRuleRequest(BaseModel):
    """Update Automation Rule Request"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    trigger: Optional[str] = None
    conditions: Optional[List[Condition]] = None
    actions: Optional[List[Action]] = None
    is_active: Optional[bool] = None


class AutomationLogResponse(BaseModel):
    """Automation Log Response"""
    id: str
    automation_rule_id: str
    automation_rule_name: str
    trigger_event: str
    status: str  # success, failed, skipped
    error_message: Optional[str] = None
    conditions_met: bool
    actions_executed: List[Dict[str, Any]] = Field(default_factory=list)
    started_at: datetime
    completed_at: Optional[datetime] = None
    execution_time_ms: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

