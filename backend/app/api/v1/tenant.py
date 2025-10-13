"""
Tenant Management API Endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.tenant import (
    TenantDetailResponse,
    TenantUpdateRequest,
    LogoUploadResponse
)
from app.services.tenant_service import TenantService, LogoUploadService
from app.core.errors import NotFoundError, ValidationError


router = APIRouter()


@router.get("", response_model=TenantDetailResponse)
async def get_tenant(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get current tenant information
    
    Returns detailed information about the authenticated user's tenant,
    including branding, address, subscription details, and settings.
    """
    
    tenant_service = TenantService(tenant_id)
    return await tenant_service.get_tenant_info()


@router.put("", response_model=TenantDetailResponse)
async def update_tenant(
    update_data: TenantUpdateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Update tenant information
    
    Update tenant details such as name, contact information, address,
    branding colors, and default settings.
    
    Requires write permissions.
    """
    
    tenant_service = TenantService(tenant_id)
    return await tenant_service.update_tenant(update_data)


@router.post("/logo", response_model=LogoUploadResponse)
async def upload_logo(
    file: UploadFile = File(..., description="Logo file (PNG, JPG, SVG, max 5MB)"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Upload company logo
    
    Upload a logo file for the tenant. Accepted formats: PNG, JPG, JPEG, SVG, WebP.
    Maximum file size: 5MB.
    Recommended dimensions: 512x512px (square) or similar aspect ratio.
    
    Requires write permissions.
    """
    
    try:
        # Save logo file
        logo_url = await LogoUploadService.save_logo(tenant_id, file)
        
        # Update tenant with new logo URL
        tenant_service = TenantService(tenant_id)
        await tenant_service.update_logo_url(logo_url)
        
        return LogoUploadResponse(
            success=True,
            logo_url=logo_url,
            message="Logo successfully uploaded"
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload logo: {str(e)}"
        )


@router.get("/branding")
async def get_branding(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get tenant branding information
    
    Returns logo URL, primary color, secondary color, and company name.
    Useful for displaying branding in UI components.
    """
    
    tenant_service = TenantService(tenant_id)
    return await tenant_service.get_branding_info()


@router.get("/limits")
async def get_subscription_limits(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get subscription limits and current usage
    
    Returns current usage vs limits for:
    - Users (current, limit, available, percentage)
    - Properties (current, limit, available, percentage)
    - Storage (current GB, limit GB, available GB, percentage)
    - Plan information and subscription status
    """
    
    tenant_service = TenantService(tenant_id)
    return await tenant_service.check_subscription_limits()

