"""
Exposé Schemas
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ExposeGenerateRequest(BaseModel):
    """Schema for exposé generation request"""
    audience: str = Field(..., description="Target audience (kauf/miete/investor)")
    tone: str = Field(..., description="Tone (neutral/elegant/kurz)")
    language: str = Field("de", description="Language (de/en)")
    length: str = Field("standard", description="Length (short/standard/long)")
    keywords: List[str] = Field(default=[], description="Keywords to include")


class ExposeSaveRequest(BaseModel):
    """Schema for saving exposé"""
    title: str = Field(..., description="Exposé title")
    content: str = Field(..., description="Exposé content")
    audience: str = Field(..., description="Target audience")
    tone: str = Field(..., description="Tone")
    language: str = Field("de", description="Language")
    length: str = Field("standard", description="Length")
    keywords: List[str] = Field(default=[], description="Keywords")


class ExposeVersionResponse(BaseModel):
    """Schema for exposé version response"""
    id: str
    title: str
    content: str
    audience: str
    tone: str
    language: str
    length: str
    keywords: List[str]
    status: str
    version_number: int
    created_at: str
    updated_at: str
    created_by: str


class ExposeGenerateResponse(BaseModel):
    """Schema for exposé generation response"""
    version: ExposeVersionResponse
    generated_at: str


class ExposeListResponse(BaseModel):
    """Schema for exposé list response"""
    versions: List[ExposeVersionResponse]
    total: int


class ExposePDFRequest(BaseModel):
    """Schema for PDF generation request"""
    version_id: str = Field(..., description="Version ID to convert to PDF")
    include_logo: bool = Field(True, description="Include company logo")
    template: str = Field("standard", description="PDF template")


class ExposePDFResponse(BaseModel):
    """Schema for PDF generation response"""
    pdf_url: str = Field(..., description="URL to download PDF")
    filename: str = Field(..., description="Suggested filename")
    generated_at: str = Field(..., description="Generation timestamp")
