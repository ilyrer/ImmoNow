"""
AVM Service
"""
from typing import List
from datetime import datetime
import random

from app.schemas.avm import (
    AvmRequest, AvmResponse, AvmResult, ValuationRange, ValuationFactor,
    ComparableListing, MarketIntelligence, MarketTrendPoint
)
from app.schemas.common import PropertyType


class AVMService:
    """AVM service for automated property valuation"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def valuate_property(self, avm_request: AvmRequest) -> AvmResponse:
        """Valuate a property using AVM"""
        
        # Mock valuation calculation
        base_price_per_sqm = self._get_base_price_per_sqm(avm_request.city, avm_request.postal_code)
        
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
        
        # Create comparables
        comparables = self._create_comparables(avm_request, base_price_per_sqm)
        
        # Create market intelligence
        market_intelligence = self._create_market_intelligence(avm_request)
        
        return AvmResponse(
            result=result,
            comparables=comparables,
            market_intelligence=market_intelligence
        )
    
    def _get_base_price_per_sqm(self, city: str, postal_code: str) -> float:
        """Get base price per sqm for location"""
        # Mock pricing data
        base_prices = {
            'Berlin': 4500,
            'Munich': 6500,
            'Hamburg': 4200,
            'Frankfurt': 4800,
            'Cologne': 3800,
            'Stuttgart': 5200,
            'Düsseldorf': 4500,
            'Leipzig': 2800,
            'Dortmund': 2200,
            'Essen': 2000
        }
        
        # Find matching city
        for city_name, price in base_prices.items():
            if city_name.lower() in city.lower():
                return price
        
        # Default price
        return 3000
    
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
    
    def _create_comparables(self, avm_request: AvmRequest, base_price_per_sqm: float) -> List[ComparableListing]:
        """Create comparable listings"""
        
        comparables = []
        
        # Generate mock comparables
        for i in range(5):
            size_variation = random.uniform(0.8, 1.2)
            price_variation = random.uniform(0.9, 1.1)
            
            comparable = ComparableListing(
                id=f"comp_{i+1}",
                address=f"Mock Street {i+1}",
                city=avm_request.city,
                postal_code=avm_request.postal_code,
                property_type=avm_request.property_type,
                size=int(avm_request.size * size_variation),
                rooms=avm_request.rooms,
                build_year=avm_request.build_year or 2000,
                condition=avm_request.condition,
                price=avm_request.size * base_price_per_sqm * price_variation,
                price_per_sqm=base_price_per_sqm * price_variation,
                sold_date=datetime.utcnow(),
                distance=random.uniform(0.1, 2.0),
                match_score=random.uniform(0.7, 0.95)
            )
            comparables.append(comparable)
        
        return comparables
    
    def _create_market_intelligence(self, avm_request: AvmRequest) -> MarketIntelligence:
        """Create market intelligence data"""
        
        # Mock market data
        trends = []
        for i in range(12):
            date = datetime.utcnow().replace(month=i+1, day=1)
            trends.append(MarketTrendPoint(
                date=date.strftime("%Y-%m"),
                average_price=random.uniform(200000, 500000),
                average_price_per_sqm=random.uniform(3000, 6000),
                transaction_count=random.randint(50, 200),
                median_price=random.uniform(180000, 450000),
                region=avm_request.city
            ))
        
        return MarketIntelligence(
            region=avm_request.city,
            postal_code=avm_request.postal_code,
            demand_level=random.choice(['high', 'medium', 'low']),
            supply_level=random.choice(['high', 'medium', 'low']),
            price_growth_12m=random.uniform(-5, 15),
            price_growth_36m=random.uniform(0, 25),
            average_days_on_market=random.randint(30, 120),
            competition_index=random.randint(1, 10),
            trends=trends
        )
