"""
Exposé API Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.expose import (
    ExposeGenerateRequest, ExposeGenerateResponse,
    ExposeSaveRequest, ExposeVersionResponse,
    ExposeListResponse, ExposePDFRequest, ExposePDFResponse
)
from app.services.expose_service import ExposeService
from app.services.pdf_generator_service import PDFGeneratorService
from app.db.models import ExposeVersion

router = APIRouter()


@router.post("/{property_id}/expose/generate", response_model=ExposeGenerateResponse)
async def generate_expose(
    property_id: str,
    request: ExposeGenerateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate exposé using LLM"""
    
    expose_service = ExposeService(tenant_id)
    
    try:
        version = await expose_service.generate_expose(
            property_id=property_id,
            audience=request.audience,
            tone=request.tone,
            language=request.language,
            length=request.length,
            keywords=request.keywords,
            user_id=current_user.user_id
        )
        
        return ExposeGenerateResponse(
            version=ExposeVersionResponse(
                id=str(version.id),
                title=version.title,
                content=version.content,
                audience=version.audience,
                tone=version.tone,
                language=version.language,
                length=version.length,
                keywords=version.keywords,
                status=version.status,
                version_number=version.version_number,
                created_at=version.created_at.isoformat(),
                updated_at=version.updated_at.isoformat(),
                created_by=str(version.created_by.id)
            ),
            generated_at=version.created_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate exposé: {str(e)}"
        )


@router.get("/{property_id}/expose/versions", response_model=ExposeListResponse)
async def get_expose_versions(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all exposé versions for a property"""
    
    expose_service = ExposeService(tenant_id)
    
    try:
        versions = await expose_service.get_expose_versions(property_id)
        
        version_responses = [
            ExposeVersionResponse(
                id=str(version.id),
                title=version.title,
                content=version.content,
                audience=version.audience,
                tone=version.tone,
                language=version.language,
                length=version.length,
                keywords=version.keywords,
                status=version.status,
                version_number=version.version_number,
                created_at=version.created_at.isoformat(),
                updated_at=version.updated_at.isoformat(),
                created_by=str(version.created_by.id)
            )
            for version in versions
        ]
        
        return ExposeListResponse(
            versions=version_responses,
            total=len(version_responses)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get exposé versions: {str(e)}"
        )


@router.post("/{property_id}/expose/save", response_model=ExposeVersionResponse)
async def save_expose_version(
    property_id: str,
    request: ExposeSaveRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Save exposé version"""
    
    expose_service = ExposeService(tenant_id)
    
    try:
        version = await expose_service.save_expose_version(
            property_id=property_id,
            title=request.title,
            content=request.content,
            audience=request.audience,
            tone=request.tone,
            language=request.language,
            length=request.length,
            keywords=request.keywords,
            user_id=current_user.user_id
        )
        
        return ExposeVersionResponse(
            id=str(version.id),
            title=version.title,
            content=version.content,
            audience=version.audience,
            tone=version.tone,
            language=version.language,
            length=version.length,
            keywords=version.keywords,
            status=version.status,
            version_number=version.version_number,
            created_at=version.created_at.isoformat(),
            updated_at=version.updated_at.isoformat(),
            created_by=str(version.created_by.id)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save exposé: {str(e)}"
        )


@router.delete("/{property_id}/expose/{version_id}")
async def delete_expose_version(
    property_id: str,
    version_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete exposé version"""
    
    expose_service = ExposeService(tenant_id)
    
    try:
        await expose_service.delete_expose_version(version_id, current_user.user_id)
        return {"message": "Exposé version deleted successfully"}
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exposé version not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete exposé: {str(e)}"
        )


@router.post("/{property_id}/expose/{version_id}/publish", response_model=ExposeVersionResponse)
async def publish_expose_version(
    property_id: str,
    version_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Publish exposé version"""
    
    expose_service = ExposeService(tenant_id)
    
    try:
        version = await expose_service.publish_expose_version(version_id, current_user.user_id)
        
        return ExposeVersionResponse(
            id=str(version.id),
            title=version.title,
            content=version.content,
            audience=version.audience,
            tone=version.tone,
            language=version.language,
            length=version.length,
            keywords=version.keywords,
            status=version.status,
            version_number=version.version_number,
            created_at=version.created_at.isoformat(),
            updated_at=version.updated_at.isoformat(),
            created_by=str(version.created_by.id)
        )
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exposé version not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish exposé: {str(e)}"
        )


@router.post("/{property_id}/expose/pdf", response_model=ExposePDFResponse)
async def generate_expose_pdf(
    property_id: str,
    request: ExposePDFRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate exposé PDF"""
    
    # Get exposé version
    from asgiref.sync import sync_to_async
    
    @sync_to_async
    def get_expose_version():
        try:
            return ExposeVersion.objects.get(id=request.version_id)
        except ExposeVersion.DoesNotExist:
            return None
    
    version = await get_expose_version()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exposé version not found"
        )
    
    # Generate PDF using the same service as energy certificate
    pdf_service = PDFGeneratorService()
    
    # Prepare property data
    property_data = {
        'title': version.property.title,
        'address': {
            'street': getattr(version.property.address, 'street', '') if version.property.address else '',
            'zip_code': getattr(version.property.address, 'zip_code', '') if version.property.address else '',
            'city': getattr(version.property.address, 'city', '') if version.property.address else '',
        }
    }
    
    # Prepare exposé data
    expose_data = {
        'title': version.title,
        'content': version.content,
        'audience': version.audience,
        'tone': version.tone,
        'language': version.language,
        'length': version.length,
        'keywords': version.keywords
    }
    
    # Company data
    company_data = {
        'company_name': 'ImmoNow',
        'address': 'Musterstraße 123, 12345 Musterstadt',
        'phone': '+49 123 456789',
        'email': 'info@immonow.de'
    }
    
    try:
        # Generate PDF (using a modified method for exposé)
        pdf_bytes = pdf_service.generate_energy_certificate_pdf(
            property_data=property_data,
            energy_data=expose_data,  # Reusing the same method structure
            company_data=company_data,
            logo_path=None,
            language=version.language
        )
        
        # Save PDF (placeholder)
        filename = f"Expose_{version.property.title}_{version.version_number}_{version.created_at.strftime('%Y%m%d')}.pdf"
        pdf_url = f"/media/exposes/{filename}"
        
        return ExposePDFResponse(
            pdf_url=pdf_url,
            filename=filename,
            generated_at=version.created_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.get("/{property_id}/expose/{version_id}/download")
async def download_expose_pdf(
    property_id: str,
    version_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Download exposé PDF"""
    
    # Get exposé version
    from asgiref.sync import sync_to_async
    
    @sync_to_async
    def get_expose_version():
        try:
            return ExposeVersion.objects.get(id=version_id)
        except ExposeVersion.DoesNotExist:
            return None
    
    version = await get_expose_version()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exposé version not found"
        )
    
    # Generate PDF
    pdf_service = PDFGeneratorService()
    
    property_data = {
        'title': version.property.title,
        'address': {
            'street': getattr(version.property.address, 'street', '') if version.property.address else '',
            'zip_code': getattr(version.property.address, 'zip_code', '') if version.property.address else '',
            'city': getattr(version.property.address, 'city', '') if version.property.address else '',
        }
    }
    
    expose_data = {
        'title': version.title,
        'content': version.content,
        'audience': version.audience,
        'tone': version.tone,
        'language': version.language,
        'length': version.length,
        'keywords': version.keywords
    }
    
    company_data = {
        'company_name': 'ImmoNow',
        'address': 'Musterstraße 123, 12345 Musterstadt',
        'phone': '+49 123 456789',
        'email': 'info@immonow.de'
    }
    
    try:
        pdf_bytes = pdf_service.generate_energy_certificate_pdf(
            property_data=property_data,
            energy_data=expose_data,
            company_data=company_data,
            logo_path=None,
            language=version.language
        )
        
        filename = f"Expose_{version.property.title}_v{version.version_number}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )
