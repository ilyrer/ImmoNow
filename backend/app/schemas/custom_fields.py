"""
Custom Fields Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CustomFieldResponse(BaseModel):
    """Custom Field Response"""
    id: str
    name: str
    key: str
    field_type: str  # text, number, date, dropdown, checkbox, user
    resource_type: str  # task, property
    description: Optional[str] = None
    required: bool
    default_value: Optional[str] = None
    options: List[str] = Field(default_factory=list)
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    order: int
    
    model_config = ConfigDict(from_attributes=True)


class CreateCustomFieldRequest(BaseModel):
    """Create Custom Field Request"""
    name: str = Field(..., min_length=1, max_length=200)
    key: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9_]+$")
    field_type: str = Field(..., description="text, number, date, dropdown, checkbox, user")
    resource_type: str = Field(default="task", description="task oder property")
    description: Optional[str] = None
    required: bool = False
    default_value: Optional[str] = None
    options: List[str] = Field(default_factory=list, description="Options für dropdown")
    order: int = Field(default=0)


class UpdateCustomFieldRequest(BaseModel):
    """Update Custom Field Request"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    required: Optional[bool] = None
    default_value: Optional[str] = None
    options: Optional[List[str]] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class CustomFieldValueResponse(BaseModel):
    """Custom Field Value Response"""
    field_id: str
    field_name: str
    field_type: str
    value: Any  # Kann string, number, boolean, etc. sein


class SetCustomFieldValueRequest(BaseModel):
    """Set Custom Field Value Request"""
    field_id: str
    value: Optional[str] = None


class ResourceCustomFieldsResponse(BaseModel):
    """Response für alle Custom Fields eines Resources"""
    resource_type: str
    resource_id: str
    fields: Dict[str, CustomFieldValueResponse] = Field(default_factory=dict)

