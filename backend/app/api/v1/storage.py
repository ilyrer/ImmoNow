"""
Storage Usage API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.services.storage_tracking_service import StorageTrackingService
from app.core.errors import ValidationError

router = APIRouter()


@router.get("/usage", response_model=Dict[str, Any])
async def get_storage_usage(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get current storage usage for the tenant
    
    Returns detailed storage usage information including:
    - Total usage in bytes, MB, and GB
    - Usage percentage of limit
    - Breakdown by file type
    - Current limit
    """
    try:
        usage = await StorageTrackingService.get_tenant_storage_usage(tenant_id)
        return usage
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get storage usage: {str(e)}"
        )


@router.post("/reconcile", response_model=Dict[str, Any])
async def reconcile_storage(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Reconcile storage usage by comparing database vs filesystem
    
    This endpoint compares the storage usage calculated from database records
    with the actual files on disk to detect any discrepancies.
    
    Returns reconciliation results including:
    - Database vs filesystem usage
    - Discrepancy amount
    - Consistency status
    """
    try:
        result = await StorageTrackingService.reconcile_storage_usage(tenant_id)
        return result
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reconcile storage: {str(e)}"
        )
