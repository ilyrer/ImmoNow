"""
AVM API Endpoints
"""
from fastapi import APIRouter, Depends

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.avm import AvmRequest, AvmResponse
from app.services.avm_service import AVMService

router = APIRouter()


@router.post("/valuate", response_model=AvmResponse)
async def valuate_property(
    avm_request: AvmRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Valuate a property using AVM"""
    
    avm_service = AVMService(tenant_id)
    result = await avm_service.valuate_property(avm_request)
    
    return result
