"""
Energy Certificate Schemas
"""
from typing import Optional
from datetime import date
from pydantic import BaseModel, Field


class EnergyCertificateUpdate(BaseModel):
    """Schema for updating energy certificate data"""
    energy_class: Optional[str] = Field(None, description="Energy efficiency class (A+ to H)")
    energy_consumption: Optional[int] = Field(None, description="Energy consumption in kWh/m²a")
    energy_certificate_type: Optional[str] = Field(None, description="Certificate type")
    energy_certificate_valid_until: Optional[date] = Field(None, description="Certificate valid until date")
    energy_certificate_issue_date: Optional[date] = Field(None, description="Certificate issue date")
    co2_emissions: Optional[int] = Field(None, description="CO₂ emissions in kg/m²a")
    heating_type: Optional[str] = Field(None, description="Heating type")


class EnergyCertificateResponse(BaseModel):
    """Schema for energy certificate response"""
    energy_class: Optional[str] = None
    energy_consumption: Optional[int] = None
    energy_certificate_type: Optional[str] = None
    energy_certificate_valid_until: Optional[date] = None
    energy_certificate_issue_date: Optional[date] = None
    co2_emissions: Optional[int] = None
    heating_type: Optional[str] = None


class EnergyCertificatePDFRequest(BaseModel):
    """Schema for PDF generation request"""
    include_logo: bool = Field(True, description="Include company logo in PDF")
    language: str = Field("de", description="PDF language (de/en)")
    template: str = Field("standard", description="PDF template to use")


class EnergyCertificatePDFResponse(BaseModel):
    """Schema for PDF generation response"""
    pdf_url: str = Field(..., description="URL to download the generated PDF")
    filename: str = Field(..., description="Suggested filename for download")
    generated_at: str = Field(..., description="Generation timestamp")
