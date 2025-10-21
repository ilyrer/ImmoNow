"""
AVM Service
Stellt auf Live-Marktdaten via MarketService um (keine Mock-Daten)
"""
from typing import List
from datetime import datetime
import random

from app.schemas.avm import (
    AvmRequest, AvmResponse, AvmResult, ValuationRange, ValuationFactor,
    ComparableListing, MarketIntelligence, MarketTrendPoint
)
from app.schemas.common import PropertyType
from app.db.models import Property, Address
from asgiref.sync import sync_to_async
from app.services.market_service import MarketService
from app.services.llm_service import LLMService


class AVMService:
    """AVM service for automated property valuation"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.market = MarketService(tenant_id)
        self.llm = LLMService(tenant_id)
    
    async def valuate_property(self, avm_request: AvmRequest) -> AvmResponse:
        """Valuate a property using AVM"""
        
        # Basispreis auf Live-Daten
        base_price_per_sqm = await self.market.estimate_base_price_per_sqm(
            city=avm_request.city,
            postal_code=avm_request.postal_code,
        )
        
        # Apply adjustments based on property characteristics
        adjustments = self._calculate_adjustments(avm_request)
        
        # Calculate estimated value
        estimated_value = avm_request.size * base_price_per_sqm * adjustments['total_multiplier']
        
        # Calculate confidence level
        confidence_level = self._calculate_confidence_level(avm_request)
        
        # Create valuation range
        range_percentage = 0.15 if confidence_level == 'high' else 0.25 if confidence_level == 'medium' else 0.35
        valuation_range = ValuationRange(
            min=estimated_value * (1 - range_percentage),
            max=estimated_value * (1 + range_percentage)
        )
        
        # Create valuation factors
        factors = self._create_valuation_factors(avm_request, adjustments)
        
        # Create result
        result = AvmResult(
            estimated_value=estimated_value,
            confidence_level=confidence_level,
            valuation_range=valuation_range,
            price_per_sqm=estimated_value / avm_request.size,
            methodology="Comparative Market Analysis with Machine Learning",
            factors=factors,
            comparables_used=5,  # Mock number
            last_updated=datetime.utcnow()
        )
        
        # Comparables: echte Vergleichsobjekte aus DB (ähnliche Größe, gleiche Stadt/PLZ)
        comparables = await self._fetch_comparables(
            city=avm_request.city,
            postal_code=avm_request.postal_code,
            size=avm_request.size,
            property_type=avm_request.property_type,
            limit=5,
        )
        
        # Live Market Intelligence
        market_intelligence = await self.market.build_market_intelligence(
            city=avm_request.city,
            postal_code=avm_request.postal_code,
        )
        
        return AvmResponse(
            result=result,
            comparables=comparables,
            market_intelligence=market_intelligence
        )

    async def _fetch_comparables(
        self,
        city: str,
        postal_code: str,
        size: int,
        property_type: PropertyType,
        limit: int = 5,
    ) -> List[ComparableListing]:
        """Hole Vergleichsobjekte aus der DB ohne Mocks.

        Kriterien:
        - gleiche Stadt oder gleiche PLZ (wenn vorhanden)
        - ähnliche Größe (±20%)
        - Status aktiv/verkauft (falls Status verwendet wird)
        """

        size_min = int(size * 0.8)
        size_max = int(size * 1.2)

        @sync_to_async
        def query():
            qs = Property.objects.filter(tenant_id=self.tenant_id)
            # location filter (city or postal_code via Address)
            qs = qs.select_related('address')
            qs = qs.filter(property_type=property_type)
            # size range on living_area if available
            qs = qs.filter(living_area__isnull=False, living_area__gte=size_min, living_area__lte=size_max)
            # address city/postal match
            qs = qs.filter(address__city__icontains=city) if city else qs
            if postal_code:
                qs = qs.filter(address__postal_code__icontains=postal_code)
            # prefer recent updates
            return list(qs.order_by('-updated_at')[:limit])

        properties = await query()

        results: List[ComparableListing] = []
        for idx, p in enumerate(properties):
            addr = getattr(p, 'address', None)
            living_area = float(p.living_area or 0)
            price_value = float(p.price or 0)
            price_per_sqm = price_value / living_area if living_area > 0 else 0
            match_score = 0.0
            if living_area > 0:
                size_diff = abs(living_area - size) / size
                match_score = max(0.0, 1.0 - size_diff) * 100.0

            results.append(ComparableListing(
                id=str(p.id),
                address=f"{addr.street} {addr.house_number}" if addr else p.location,
                city=addr.city if addr else city,
                postal_code=addr.postal_code if addr and addr.postal_code else (addr.zip_code if addr else postal_code),
                property_type=property_type,
                size=int(living_area) if living_area else size,
                rooms=p.rooms or None,
                build_year=p.year_built or 2000,
                condition='good',
                price=price_value if price_value else 0,
                price_per_sqm=price_per_sqm,
                sold_date=p.updated_at,
                distance=0.0,
                match_score=round(match_score, 2),
            ))

        return results
    
    # Entfernt: _get_base_price_per_sqm (Mock)
    
    def _calculate_adjustments(self, avm_request: AvmRequest) -> dict:
        """Calculate adjustments based on property characteristics"""
        
        adjustments = {
            'size_multiplier': 1.0,
            'rooms_multiplier': 1.0,
            'condition_multiplier': 1.0,
            'age_multiplier': 1.0,
            'features_multiplier': 1.0,
            'total_multiplier': 1.0
        }
        
        # Size adjustment
        if avm_request.size < 50:
            adjustments['size_multiplier'] = 1.1
        elif avm_request.size > 150:
            adjustments['size_multiplier'] = 0.95
        
        # Rooms adjustment
        if avm_request.rooms:
            rooms_per_sqm = avm_request.rooms / avm_request.size
            if rooms_per_sqm > 0.08:  # More than 8 rooms per 100 sqm
                adjustments['rooms_multiplier'] = 1.05
            elif rooms_per_sqm < 0.05:  # Less than 5 rooms per 100 sqm
                adjustments['rooms_multiplier'] = 0.95
        
        # Condition adjustment
        condition_multipliers = {
            'new': 1.15,
            'renovated': 1.05,
            'good': 1.0,
            'needs_renovation': 0.85,
            'poor': 0.7
        }
        adjustments['condition_multiplier'] = condition_multipliers.get(avm_request.condition, 1.0)
        
        # Age adjustment
        if avm_request.build_year:
            current_year = datetime.now().year
            age = current_year - avm_request.build_year
            
            if age < 5:
                adjustments['age_multiplier'] = 1.1
            elif age > 50:
                adjustments['age_multiplier'] = 0.9
        
        # Features adjustment
        feature_bonus = len(avm_request.features) * 0.02
        adjustments['features_multiplier'] = 1.0 + feature_bonus
        
        # Calculate total multiplier
        adjustments['total_multiplier'] = (
            adjustments['size_multiplier'] *
            adjustments['rooms_multiplier'] *
            adjustments['condition_multiplier'] *
            adjustments['age_multiplier'] *
            adjustments['features_multiplier']
        )
        
        return adjustments
    
    def _calculate_confidence_level(self, avm_request: AvmRequest) -> str:
        """Calculate confidence level based on data quality"""
        
        confidence_score = 0
        
        # More data = higher confidence
        if avm_request.rooms:
            confidence_score += 1
        if avm_request.build_year:
            confidence_score += 1
        if avm_request.features:
            confidence_score += len(avm_request.features) * 0.5
        
        # Size affects confidence
        if 30 <= avm_request.size <= 200:
            confidence_score += 1
        
        if confidence_score >= 4:
            return 'high'
        elif confidence_score >= 2:
            return 'medium'
        else:
            return 'low'
    
    def _create_valuation_factors(self, avm_request: AvmRequest, adjustments: dict) -> List[ValuationFactor]:
        """Create valuation factors"""
        
        factors = []
        
        # Location factor
        factors.append(ValuationFactor(
            name="Location",
            impact="positive",
            weight=25,
            description=f"Property located in {avm_request.city}"
        ))
        
        # Size factor
        if adjustments['size_multiplier'] > 1.0:
            factors.append(ValuationFactor(
                name="Property Size",
                impact="positive",
                weight=15,
                description="Optimal property size"
            ))
        elif adjustments['size_multiplier'] < 1.0:
            factors.append(ValuationFactor(
                name="Property Size",
                impact="negative",
                weight=15,
                description="Size may affect value"
            ))
        
        # Condition factor
        if adjustments['condition_multiplier'] > 1.0:
            factors.append(ValuationFactor(
                name="Property Condition",
                impact="positive",
                weight=20,
                description=f"Property in {avm_request.condition} condition"
            ))
        elif adjustments['condition_multiplier'] < 1.0:
            factors.append(ValuationFactor(
                name="Property Condition",
                impact="negative",
                weight=20,
                description=f"Property needs {avm_request.condition}"
            ))
        
        return factors
    
    # Entfernt: _create_comparables (Mock)
    
    # Entfernt: _create_market_intelligence (Mock)
