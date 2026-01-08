"""
Workflow Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class WorkflowStage(BaseModel):
    """Workflow Stage Definition"""
    id: str = Field(..., description="Stage-ID (unique within workflow)")
    name: str = Field(..., description="Stage-Name")
    order: int = Field(..., description="Order/Position")
    transitions: List[str] = Field(default_factory=list, description="Erlaubte nächste Stage-IDs")
    is_terminal: bool = Field(False, description="Ist Terminal-Stage (Workflow-Ende)")
    status_mapping: Optional[str] = Field(None, description="Task-Status-Mapping (optional)")


class WorkflowResponse(BaseModel):
    """Workflow Response"""
    id: str
    name: str
    description: Optional[str] = None
    stages: List[WorkflowStage] = Field(default_factory=list)
    board_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class CreateWorkflowRequest(BaseModel):
    """Create Workflow Request"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    stages: List[WorkflowStage] = Field(..., min_length=1, description="Mindestens eine Stage erforderlich")
    board_id: Optional[str] = None


class UpdateWorkflowRequest(BaseModel):
    """Update Workflow Request"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    stages: Optional[List[WorkflowStage]] = None
    is_active: Optional[bool] = None


class WorkflowInstanceResponse(BaseModel):
    """Workflow Instance Response"""
    id: str
    workflow_id: str
    workflow_name: str
    task_id: str
    current_stage_id: str
    current_stage_name: Optional[str] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)
    started_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class StartWorkflowRequest(BaseModel):
    """Start Workflow Request"""
    workflow_id: str


class AdvanceWorkflowRequest(BaseModel):
    """Advance Workflow Request"""
    next_stage_id: str

