"""
Energy Certificate API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from datetime import datetime

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.energy_certificate import (
    EnergyCertificateUpdate, EnergyCertificateResponse,
    EnergyCertificatePDFRequest, EnergyCertificatePDFResponse
)
from app.services.properties_service import PropertiesService
from app.services.pdf_generator_service import PDFGeneratorService
from app.db.models import Property, IntegrationSettings

router = APIRouter()


@router.put("/{property_id}/energy-data", response_model=EnergyCertificateResponse)
async def update_energy_data(
    property_id: str,
    energy_data: EnergyCertificateUpdate,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update energy certificate data for a property"""
    
    properties_service = PropertiesService(tenant_id)
    
    # Get property to ensure it exists
    property_obj = await properties_service.get_property(property_id)
    if not property_obj:
        raise NotFoundError("Property not found")
    
    # Update energy data
    updated_property = await properties_service.update_property(
        property_id, 
        energy_data.model_dump(exclude_unset=True), 
        current_user.user_id
    )
    
    if not updated_property:
        raise NotFoundError("Property not found")
    
    # Return energy certificate data
    return EnergyCertificateResponse(
        energy_class=updated_property.energy_class,
        energy_consumption=updated_property.energy_consumption,
        energy_certificate_type=getattr(updated_property, 'energy_certificate_type', None),
        energy_certificate_valid_until=getattr(updated_property, 'energy_certificate_valid_until', None),
        energy_certificate_issue_date=getattr(updated_property, 'energy_certificate_issue_date', None),
        co2_emissions=getattr(updated_property, 'co2_emissions', None),
        heating_type=updated_property.heating_type
    )


@router.get("/{property_id}/energy-data", response_model=EnergyCertificateResponse)
async def get_energy_data(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get energy certificate data for a property"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.get_property(property_id)
    
    if not property_obj:
        raise NotFoundError("Property not found")
    
    return EnergyCertificateResponse(
        energy_class=property_obj.energy_class,
        energy_consumption=property_obj.energy_consumption,
        energy_certificate_type=getattr(property_obj, 'energy_certificate_type', None),
        energy_certificate_valid_until=getattr(property_obj, 'energy_certificate_valid_until', None),
        energy_certificate_issue_date=getattr(property_obj, 'energy_certificate_issue_date', None),
        co2_emissions=getattr(property_obj, 'co2_emissions', None),
        heating_type=property_obj.heating_type
    )


@router.post("/{property_id}/energy-certificate/generate", response_model=EnergyCertificatePDFResponse)
async def generate_energy_certificate_pdf(
    property_id: str,
    pdf_request: EnergyCertificatePDFRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate energy certificate PDF"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.get_property(property_id)
    
    if not property_obj:
        raise NotFoundError("Property not found")
    
    # Get company data (placeholder - should come from tenant settings)
    company_data = {
        'company_name': 'ImmoNow',
        'address': 'Musterstraße 123, 12345 Musterstadt',
        'phone': '+49 123 456789',
        'email': 'info@immonow.de'
    }
    
    # Prepare property data
    property_data = {
        'title': property_obj.title,
        'address': {
            'street': getattr(property_obj.address, 'street', '') if property_obj.address else '',
            'zip_code': getattr(property_obj.address, 'zip_code', '') if property_obj.address else '',
            'city': getattr(property_obj.address, 'city', '') if property_obj.address else '',
        }
    }
    
    # Prepare energy data
    energy_data = {
        'energy_class': property_obj.energy_class,
        'energy_consumption': property_obj.energy_consumption,
        'energy_certificate_type': getattr(property_obj, 'energy_certificate_type', None),
        'energy_certificate_valid_until': getattr(property_obj, 'energy_certificate_valid_until', None),
        'energy_certificate_issue_date': getattr(property_obj, 'energy_certificate_issue_date', None),
        'co2_emissions': getattr(property_obj, 'co2_emissions', None),
        'heating_type': property_obj.heating_type
    }
    
    # Generate PDF
    pdf_service = PDFGeneratorService()
    pdf_bytes = pdf_service.generate_energy_certificate_pdf(
        property_data=property_data,
        energy_data=energy_data,
        company_data=company_data,
        logo_path=tenant.logo_url if hasattr(tenant, 'logo_url') and tenant.logo_url else None,
        language=pdf_request.language
    )
    
    # Speichere PDF im lokalen Media-Verzeichnis (vereinfacht)
    import os
    media_dir = "media/energy_certificates"
    os.makedirs(media_dir, exist_ok=True)
    
    file_path = os.path.join(media_dir, filename)
    with open(file_path, 'wb') as f:
        f.write(pdf_bytes)
    
    pdf_url = f"/media/energy_certificates/{filename}"
    
    return EnergyCertificatePDFResponse(
        pdf_url=pdf_url,
        filename=filename,
        generated_at=datetime.now().isoformat()
    )


@router.get("/{property_id}/energy-certificate/download")
async def download_energy_certificate_pdf(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Download energy certificate PDF"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.get_property(property_id)
    
    if not property_obj:
        raise NotFoundError("Property not found")
    
    # Get company data
    company_data = {
        'company_name': 'ImmoNow',
        'address': 'Musterstraße 123, 12345 Musterstadt',
        'phone': '+49 123 456789',
        'email': 'info@immonow.de'
    }
    
    # Prepare property data
    property_data = {
        'title': property_obj.title,
        'address': {
            'street': getattr(property_obj.address, 'street', '') if property_obj.address else '',
            'zip_code': getattr(property_obj.address, 'zip_code', '') if property_obj.address else '',
            'city': getattr(property_obj.address, 'city', '') if property_obj.address else '',
        }
    }
    
    # Prepare energy data
    energy_data = {
        'energy_class': property_obj.energy_class,
        'energy_consumption': property_obj.energy_consumption,
        'energy_certificate_type': getattr(property_obj, 'energy_certificate_type', None),
        'energy_certificate_valid_until': getattr(property_obj, 'energy_certificate_valid_until', None),
        'energy_certificate_issue_date': getattr(property_obj, 'energy_certificate_issue_date', None),
        'co2_emissions': getattr(property_obj, 'co2_emissions', None),
        'heating_type': property_obj.heating_type
    }
    
    # Generate PDF
    pdf_service = PDFGeneratorService()
    pdf_bytes = pdf_service.generate_energy_certificate_pdf(
        property_data=property_data,
        energy_data=energy_data,
        company_data=company_data,
        logo_path=None,
        language="de"
    )
    
    # Return PDF as response
    filename = f"Energieausweis_{property_obj.title}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
