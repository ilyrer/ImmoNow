"""
Multi-Tenancy Module
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.security import TokenData


class TenantResponse(BaseModel):
    """Tenant response model"""
    id: str
    name: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime
    settings: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = {"from_attributes": True}


class CreateTenantRequest(BaseModel):
    """Create tenant request model"""
    name: str = Field(..., min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    settings: Dict[str, Any] = Field(default_factory=dict)


class UpdateTenantRequest(BaseModel):
    """Update tenant request model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


def get_tenant_context(current_user: TokenData) -> Dict[str, Any]:
    """Get tenant context from current user"""
    return {
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id,
        "role": current_user.role,
        "scopes": current_user.scopes
    }
