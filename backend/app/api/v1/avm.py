"""
AVM API Endpoints - Premium Enterprise Edition
Professional automated valuation with comprehensive error handling
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse, Response
from typing import Optional
import logging

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import ValidationError, ServiceError
from app.schemas.avm import (
    AvmRequest, AvmResponse, GeoLocation, POI, ValidationResult, 
    ValidationWarning, MarketIntelligence
)
from app.schemas.common import PropertyType
from app.services.avm_service import AVMService
from app.services.geocoding_service import GeocodingService
from app.services.market_data_service import MarketDataService
from app.services.avm_pdf_service import AVMPDFService

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory cache for valuations (for PDF export)
# In production, use Redis or database
_valuation_cache = {}


@router.post(
    "/valuate", 
    response_model=AvmResponse,
    summary="Immobilienbewertung (AVM)",
    description="""
    **Enterprise Automated Valuation Model (AVM)**
    
    Professionelle Immobilienbewertung mit KI-Unterstützung.
    
    ## Features
    - 📊 Hybrid-Bewertung: Heuristische Basis + KI-Analyse
    - 🎯 Confidence-Level: High/Medium/Low
    - 📈 Marktdaten & Trends
    - 🏘️ Vergleichsobjekte
    - 🤖 Optional: LLM-basierte qualitative Analyse
    
    ## Beispiel-Request
    ```json
    {
      "address": "Hauptstraße 1",
      "city": "München",
      "postal_code": "80331",
      "property_type": "apartment",
      "size": 85,
      "rooms": 3,
      "build_year": 2010,
      "condition": "good",
      "features": ["balcony", "parking"]
    }
    ```
    
    ## Error Codes
    - 400: Ungültige Eingabedaten
    - 422: Validierungsfehler (z.B. falsche PLZ, ungültige Größe)
    - 500: Interner Server-Fehler
    
    ## Rate Limiting
    Standard: 60 Requests/Minute
    """,
    responses={
        200: {
            "description": "Erfolgreiche Bewertung",
            "content": {
                "application/json": {
                    "example": {
                        "result": {
                            "estimated_value": 425000,
                            "confidence_level": "high",
                            "valuation_range": {"min": 382500, "max": 467500},
                            "price_per_sqm": 5000,
                            "methodology": "Hybrid Valuation: CMA + AI",
                            "factors": [
                                {
                                    "name": "Location",
                                    "impact": "positive",
                                    "weight": 25,
                                    "description": "Property located in München"
                                }
                            ]
                        }
                    }
                }
            }
        },
        422: {
            "description": "Validierungsfehler",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "postal_code"],
                                "msg": "Ungültige Postleitzahl",
                                "type": "value_error"
                            }
                        ]
                    }
                }
            }
        }
    },
    tags=["AVM - Immobilienbewertung"]
)
async def valuate_property(
    avm_request: AvmRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Führt eine professionelle Immobilienbewertung durch.
    
    Nutzt einen Hybrid-Ansatz aus:
    1. Heuristischer Basis-Berechnung (Marktdaten × Größe × Faktoren)
    2. Optional: KI-basierte qualitative Analyse (wenn konfiguriert)
    
    Returns:
        AvmResponse: Vollständige Bewertung mit Vergleichsobjekten und Marktdaten
    """
    
    try:
        logger.info(
            f"🏠 AVM Valuation Request: {avm_request.city}, "
            f"{avm_request.property_type}, {avm_request.size}m² "
            f"(Tenant: {tenant_id}, User: {current_user.user_id})"
        )
        
        # Initialize AVM Service
        avm_service = AVMService(tenant_id)
        
        # Perform valuation
        result = await avm_service.valuate_property(avm_request)
        
        # Cache result for PDF export (if valuation_id exists)
        if result.valuation_id:
            _valuation_cache[result.valuation_id] = {
                'request': avm_request,
                'response': result
            }
        
        logger.info(
            f"✅ AVM Valuation Complete: €{result.result.estimated_value:,.0f} "
            f"(Confidence: {result.result.confidence_level})"
        )
        
        return result
        
    except ValidationError as e:
        logger.warning(f"⚠️ AVM Validation Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Validation Error",
                "message": str(e),
                "suggestion": "Bitte überprüfen Sie Ihre Eingabedaten. "
                             "PLZ muss 5-stellig sein, Größe zwischen 5-10000 m²."
            }
        )
    
    except ServiceError as e:
        logger.error(f"❌ AVM Service Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Service Error",
                "message": "Die Bewertung konnte nicht durchgeführt werden.",
                "technical_details": str(e) if logger.level <= logging.DEBUG else None
            }
        )
    
    except Exception as e:
        logger.error(f"❌ AVM Unexpected Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal Server Error",
                "message": "Ein unerwarteter Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.",
                "request_id": current_user.user_id  # For tracking
            }
        )


@router.get(
    "/geocode",
    response_model=GeoLocation,
    summary="Geocode Address",
    description="Konvertiert Adresse zu Koordinaten und holt POIs",
    tags=["AVM - Immobilienbewertung"]
)
async def geocode_address(
    address: str = Query(..., description="Straße und Hausnummer"),
    city: str = Query(..., description="Stadt"),
    postal_code: str = Query(..., description="Postleitzahl"),
    current_user: TokenData = Depends(require_read_scope)
):
    """
    Geocodiert eine Adresse und liefert Standortdaten
    
    Returns:
        GeoLocation mit Koordinaten, Walkability und Transit Score
    """
    try:
        geocoding_service = GeocodingService()
        
        geo_location = await geocoding_service.geocode_address(
            street=address,
            city=city,
            postal_code=postal_code
        )
        
        if not geo_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse konnte nicht geocodiert werden"
            )
        
        # Enrich with scores
        geo_location = await geocoding_service.enrich_geolocation(geo_location)
        
        return geo_location
        
    except Exception as e:
        logger.error(f"❌ Geocoding error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Geocoding fehlgeschlagen"
        )


@router.get(
    "/pois",
    response_model=list[POI],
    summary="Get Nearby POIs",
    description="Holt Points of Interest in der Nähe",
    tags=["AVM - Immobilienbewertung"]
)
async def get_nearby_pois(
    latitude: float = Query(..., description="Breitengrad"),
    longitude: float = Query(..., description="Längengrad"),
    radius_m: int = Query(1000, description="Suchradius in Metern", ge=100, le=5000),
    current_user: TokenData = Depends(require_read_scope)
):
    """
    Holt POIs (Schulen, ÖPNV, Shopping, etc.) in der Nähe
    
    Returns:
        Liste von POI-Objekten
    """
    try:
        geocoding_service = GeocodingService()
        
        pois = await geocoding_service.get_nearby_pois(
            latitude=latitude,
            longitude=longitude,
            radius_m=radius_m
        )
        
        return pois
        
    except Exception as e:
        logger.error(f"❌ POI fetch error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="POI-Abfrage fehlgeschlagen"
        )


@router.get(
    "/market-data",
    response_model=MarketIntelligence,
    summary="Get Market Data",
    description="Holt Marktstatistiken für eine Region",
    tags=["AVM - Immobilienbewertung"]
)
async def get_market_data(
    city: str = Query(..., description="Stadt"),
    postal_code: str = Query(..., description="Postleitzahl"),
    property_type: PropertyType = Query(..., description="Immobilientyp"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Liefert Marktstatistiken für eine Region
    
    Returns:
        MarketIntelligence mit Trends, Nachfrage, Angebot
    """
    try:
        market_service = MarketDataService(tenant_id)
        
        market_intel = await market_service.get_market_statistics(
            city=city,
            postal_code=postal_code,
            property_type=property_type,
            time_period_months=12
        )
        
        return market_intel
        
    except Exception as e:
        logger.error(f"❌ Market data error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Marktdaten-Abfrage fehlgeschlagen"
        )


@router.post(
    "/validate",
    response_model=ValidationResult,
    summary="Validate Input",
    description="Validiert Eingabedaten mit Plausibilitätschecks",
    tags=["AVM - Immobilienbewertung"]
)
async def validate_input(
    avm_request: AvmRequest,
    current_user: TokenData = Depends(require_read_scope)
):
    """
    Validiert Eingabedaten und gibt Warnungen/Fehler zurück
    
    Returns:
        ValidationResult mit Errors, Warnings, Suggestions
    """
    try:
        errors = []
        warnings = []
        suggestions = []
        
        # Plausibility checks
        if avm_request.rooms and avm_request.living_area:
            sqm_per_room = avm_request.living_area / avm_request.rooms
            if sqm_per_room < 15:
                warnings.append(ValidationWarning(
                    field="rooms",
                    message=f"Sehr kleine Zimmer ({sqm_per_room:.1f}m² pro Zimmer)",
                    severity="warning"
                ))
                suggestions.append("Prüfen Sie, ob die Anzahl der Zimmer korrekt ist")
            elif sqm_per_room > 80:
                warnings.append(ValidationWarning(
                    field="rooms",
                    message=f"Sehr große Zimmer ({sqm_per_room:.1f}m² pro Zimmer)",
                    severity="warning"
                ))
                suggestions.append("Prüfen Sie, ob die Anzahl der Zimmer korrekt ist")
        
        # Energy class vs consumption check
        if avm_request.energy_class and avm_request.energy_consumption:
            class_ranges = {
                'A+': (0, 30), 'A': (30, 50), 'B': (50, 75), 'C': (75, 100),
                'D': (100, 130), 'E': (130, 160), 'F': (160, 200), 'G': (200, 250), 'H': (250, 1000)
            }
            
            if avm_request.energy_class in class_ranges:
                min_val, max_val = class_ranges[avm_request.energy_class]
                if not (min_val <= avm_request.energy_consumption <= max_val):
                    warnings.append(ValidationWarning(
                        field="energy_consumption",
                        message=f"Energiekennwert passt nicht zur Klasse {avm_request.energy_class}",
                        severity="warning"
                    ))
        
        # Floor vs total_floors
        if avm_request.floor is not None and avm_request.total_floors is not None:
            if avm_request.floor > avm_request.total_floors:
                errors.append("Etage kann nicht höher als Gesamtetagen sein")
        
        # Renovation year vs build year
        if avm_request.last_renovation_year and avm_request.build_year:
            if avm_request.last_renovation_year < avm_request.build_year:
                errors.append("Sanierungsjahr kann nicht vor Baujahr liegen")
        
        # Rented property without rent
        if avm_request.is_rented and not avm_request.current_rent:
            warnings.append(ValidationWarning(
                field="current_rent",
                message="Immobilie als vermietet markiert, aber keine Miete angegeben",
                severity="info"
            ))
            suggestions.append("Geben Sie die aktuelle Kaltmiete an für eine genauere Bewertung")
        
        # Data completeness suggestions
        if not avm_request.energy_class:
            suggestions.append("Energieeffizienzklasse angeben für präzisere Bewertung")
        
        if not avm_request.floor and avm_request.property_type == PropertyType.APARTMENT:
            suggestions.append("Etage angeben für genauere Bewertung")
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Validierung fehlgeschlagen"
        )


@router.get(
    "/valuations/{valuation_id}/export/pdf",
    summary="Export PDF Report",
    description="Exportiert Bewertung als PDF-Report",
    tags=["AVM - Immobilienbewertung"]
)
async def export_pdf_report(
    valuation_id: str,
    include_comps: bool = Query(True, description="Vergleichsobjekte einschließen"),
    include_charts: bool = Query(True, description="Charts einschließen"),
    current_user: TokenData = Depends(require_read_scope)
):
    """
    Exportiert eine Bewertung als professionellen PDF-Report
    
    Returns:
        PDF file (application/pdf)
    """
    try:
        # Get valuation from cache
        if valuation_id not in _valuation_cache:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bewertung nicht gefunden. Bitte führen Sie zuerst eine Bewertung durch."
            )
        
        cached_data = _valuation_cache[valuation_id]
        avm_request = cached_data['request']
        avm_response = cached_data['response']
        
        # Generate PDF
        pdf_service = AVMPDFService()
        pdf_bytes = pdf_service.generate_avm_report_pdf(
            avm_request=avm_request,
            avm_response=avm_response,
            company_data={'company_name': 'ImmoNow'},
            include_comps=include_comps,
            include_charts=include_charts,
            language='de'
        )
        
        # Return PDF
        filename = f"Immobilienbewertung_{avm_request.city}_{valuation_id[:8]}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ PDF export error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF-Export fehlgeschlagen"
        )


@router.get(
    "/health",
    summary="AVM Service Health Check",
    description="Prüft den Status des AVM-Services",
    tags=["AVM - Immobilienbewertung"]
)
async def avm_health_check():
    """
    Health Check für AVM Service
    
    Returns:
        dict: Service status und konfigurierte Features
    """
    import os
    
    ai_configured = bool(os.getenv("AI_PROVIDER") and os.getenv("OPENROUTER_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "AVM - Automated Valuation Model Premium",
        "version": "2.0.0-premium",
        "features": {
            "hybrid_valuation": True,
            "ai_enhancement": ai_configured,
            "market_intelligence": True,
            "comparables": True,
            "geocoding": True,
            "poi_analysis": True,
            "pdf_export": True,
            "input_validation": True
        },
        "supported_property_types": [
            "apartment",
            "house",
            "commercial",
            "land",
            "parking"
        ],
        "supported_countries": ["DE"],
        "rate_limit": "60 requests/minute"
    }
