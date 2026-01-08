"""
AVM Service - Premium Enterprise Edition
Automated Valuation Model with real market data integration
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import logging
import os
import uuid

from app.schemas.avm import (
    AvmRequest,
    AvmResponse,
    AvmResult,
    ValuationRange,
    ValuationFactor,
    ComparableListing,
    MarketIntelligence,
    MarketTrendPoint,
    GeoLocation,
    POI,
)
from app.schemas.common import PropertyType
from app.services.ai_manager import AIManager
from app.services.geocoding_service import GeocodingService
from app.services.market_data_service import MarketDataService
from locations.models import LocationMarketData

logger = logging.getLogger(__name__)


class AVMService:
    """
    Premium AVM service for automated property valuation

    Features:
    - Real comparable listings from portals
    - Geocoding and POI analysis
    - Enhanced valuation logic (floor, elevator, energy, etc.)
    - LLM-based qualitative analysis
    - Investment analysis for rented properties
    """

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

        # Initialize services
        self.geocoding_service = GeocodingService()
        self.market_data_service = MarketDataService(tenant_id)

        # Initialize AI/LLM (optional)
        self.use_llm = os.getenv("AI_PROVIDER") and os.getenv("OPENROUTER_API_KEY")
        if self.use_llm:
            try:
                self.ai_manager = AIManager(tenant_id)
                logger.info("✅ AVM Service initialized with LLM support")
            except Exception as e:
                logger.warning(f"⚠️ LLM initialization failed, using fallback: {e}")
                self.use_llm = False

    async def valuate_property(self, avm_request: AvmRequest) -> AvmResponse:
        """
        Valuate a property using premium AVM methodology

        Process:
        1. Geocode address and get POIs
        2. Fetch real comparable listings
        3. Calculate base value with enhanced factors
        4. Apply comparable-based adjustments
        5. Optional: LLM qualitative analysis
        6. Generate comprehensive report
        """

        logger.info(
            f"🏠 Starting premium valuation: {avm_request.city}, "
            f"{avm_request.property_type}, {avm_request.living_area}m²"
        )

        # Generate unique valuation ID
        valuation_id = str(uuid.uuid4())

        # Step 1: Geocoding and location analysis
        geo_location = None
        nearby_pois = []

        try:
            geo_location = await self.geocoding_service.geocode_address(
                street=avm_request.address,
                city=avm_request.city,
                postal_code=avm_request.postal_code,
            )

            if geo_location:
                # Get POIs
                nearby_pois = await self.geocoding_service.get_nearby_pois(
                    latitude=geo_location.latitude,
                    longitude=geo_location.longitude,
                    radius_m=1000,
                )

                # Enrich with scores
                geo_location = await self.geocoding_service.enrich_geolocation(
                    geo_location, radius_m=1000
                )

                logger.info(
                    f"📍 Location: Walkability={geo_location.walkability_score}, "
                    f"Transit={geo_location.transit_score}, POIs={len(nearby_pois)}"
                )
        except Exception as e:
            logger.warning(f"⚠️ Geocoding failed: {e}")

        # Step 2: Fetch real comparable listings
        comparables = []
        try:
            comparables = await self.market_data_service.fetch_comparable_listings(
                city=avm_request.city,
                postal_code=avm_request.postal_code,
                property_type=avm_request.property_type,
                living_area=avm_request.living_area,
                rooms=avm_request.rooms,
                build_year=avm_request.build_year,
                radius_km=2.0,
                max_results=20,
            )
            logger.info(f"📊 Fetched {len(comparables)} comparable listings")
        except Exception as e:
            logger.error(f"❌ Comparables fetch failed: {e}")

        # Step 3: Base calculation with enhanced factors
        base_price_per_sqm = self._get_base_price_per_sqm(
            avm_request.city, avm_request.postal_code
        )

        # Calculate all adjustments (floor, elevator, energy, etc.)
        adjustments = self._calculate_enhanced_adjustments(
            avm_request, geo_location, nearby_pois
        )

        base_estimated_value = (
            avm_request.living_area
            * base_price_per_sqm
            * adjustments["total_multiplier"]
        )

        logger.info(
            f"💰 Base valuation: €{base_estimated_value:,.0f} "
            f"(€{base_price_per_sqm:,.0f}/m² × {adjustments['total_multiplier']:.3f})"
        )

        # Step 4: Comparable-based adjustment
        comp_adjustment = 1.0
        if comparables and len(comparables) >= 3:
            comp_adjustment = self._calculate_comparable_adjustment(
                comparables, avm_request.living_area
            )
            logger.info(f"📈 Comparable adjustment: {comp_adjustment:.3f}x")

        estimated_value = base_estimated_value * comp_adjustment

        # Step 5: LLM-based qualitative analysis (optional)
        llm_adjustment_percent = 0.0
        llm_insights = []

        if self.use_llm:
            try:
                property_data = {
                    "property_type": avm_request.property_type,
                    "living_area": avm_request.living_area,
                    "rooms": avm_request.rooms,
                    "build_year": avm_request.build_year,
                    "condition": avm_request.condition,
                    "city": avm_request.city,
                    "postal_code": avm_request.postal_code,
                    "floor": avm_request.floor,
                    "has_elevator": avm_request.has_elevator,
                    "energy_class": avm_request.energy_class,
                    "orientation": avm_request.orientation,
                }

                geodata = None
                if geo_location:
                    geodata = {
                        "latitude": geo_location.latitude,
                        "longitude": geo_location.longitude,
                        "walkability_score": geo_location.walkability_score,
                        "transit_score": geo_location.transit_score,
                        "pois_count": len(nearby_pois),
                    }

                llm_analysis = await self.ai_manager.analyze_property(
                    property_data=property_data, geodata=geodata
                )

                llm_adjustment_percent = llm_analysis.get("value_adjustment_percent", 0)
                llm_insights = llm_analysis.get("insights", [])

                logger.info(f"🤖 LLM adjustment: {llm_adjustment_percent:+.1f}%")

            except Exception as e:
                logger.warning(f"⚠️ LLM analysis failed: {e}")

        # Apply LLM adjustment
        estimated_value = estimated_value * (1 + llm_adjustment_percent / 100)

        # Step 6: Calculate confidence level
        confidence_level = self._calculate_confidence_level(
            avm_request,
            comparables_count=len(comparables),
            has_geodata=geo_location is not None,
            has_llm=self.use_llm,
        )

        # Create valuation range
        range_percentage = (
            0.10
            if confidence_level == "high"
            else 0.18 if confidence_level == "medium" else 0.28
        )
        valuation_range = ValuationRange(
            min=estimated_value * (1 - range_percentage),
            max=estimated_value * (1 + range_percentage),
        )

        # Create valuation factors
        factors = self._create_enhanced_valuation_factors(
            avm_request, adjustments, llm_insights, geo_location
        )

        # Determine methodology
        methodology_parts = []
        if len(comparables) >= 5:
            methodology_parts.append("Vergleichswertverfahren (Real Market Data)")
        else:
            methodology_parts.append("Vergleichswertverfahren (Heuristic)")

        if avm_request.is_rented and avm_request.current_rent:
            methodology_parts.append("Ertragswertverfahren")

        if self.use_llm:
            methodology_parts.append("KI-gestützte Qualitätsanalyse")

        methodology = " + ".join(methodology_parts)

        # Create result
        result = AvmResult(
            estimated_value=estimated_value,
            confidence_level=confidence_level,
            valuation_range=valuation_range,
            price_per_sqm=estimated_value / avm_request.living_area,
            methodology=methodology,
            factors=factors,
            comparables_used=len(comparables),
            last_updated=datetime.utcnow(),
        )

        # Get market intelligence
        market_intelligence = await self.market_data_service.get_market_statistics(
            city=avm_request.city,
            postal_code=avm_request.postal_code,
            property_type=avm_request.property_type,
            time_period_months=12,
        )

        logger.info(
            f"✅ Valuation complete: €{estimated_value:,.0f} "
            f"(Confidence: {confidence_level}, Comps: {len(comparables)})"
        )

        return AvmResponse(
            result=result,
            comparables=comparables,
            market_intelligence=market_intelligence,
            geo_location=geo_location,
            nearby_pois=nearby_pois,
            valuation_id=valuation_id,
        )

    def _calculate_comparable_adjustment(
        self, comparables: List[ComparableListing], target_area: float
    ) -> float:
        """
        Calculate adjustment factor based on comparable listings

        Uses top 5 comparables weighted by match score
        """
        if not comparables or len(comparables) < 3:
            return 1.0

        # Take top 5 by match score
        top_comps = sorted(comparables, key=lambda c: c.match_score, reverse=True)[:5]

        # Calculate weighted average price per m²
        total_weight = 0.0
        weighted_price_sum = 0.0

        for comp in top_comps:
            weight = comp.match_score
            weighted_price_sum += comp.price_per_sqm * weight
            total_weight += weight

        if total_weight == 0:
            return 1.0

        avg_comp_price_per_sqm = weighted_price_sum / total_weight

        # Compare to base price
        base_price = self._get_base_price_per_sqm("", "")  # Will use default

        # Adjustment factor
        adjustment = avg_comp_price_per_sqm / base_price if base_price > 0 else 1.0

        # Clamp to reasonable range (0.7 - 1.3)
        adjustment = max(0.7, min(1.3, adjustment))

        return adjustment

    def _get_base_price_per_sqm(self, city: str, postal_code: str) -> float:
        """
        Get base price per sqm for location from database

        Dynamically loads pricing from LocationMarketData table
        Falls back to default if location not found
        """
        # Try to find location by postal code first (most accurate)
        location = None
        if postal_code:
            location = LocationMarketData.get_by_postal_code(postal_code)

        # If not found by postal code, try by city name
        if not location and city:
            location = LocationMarketData.get_by_city(city)

        if location:
            price = location.get_adjusted_price()
            logger.debug(f"📍 Base price for {city} (from DB): €{price}/m²")
            return price

        # Default price for unknown cities (conservative estimate)
        logger.warning(f"⚠️ Unknown city '{city}', using default pricing")
        return 3000.0

    # NOTE: _apply_postal_code_adjustment is now integrated into LocationMarketData.get_adjusted_price()
    # The database model handles premium/suburban adjustments automatically

    def _calculate_enhanced_adjustments(
        self,
        avm_request: AvmRequest,
        geo_location: Optional[GeoLocation],
        nearby_pois: List[POI],
    ) -> dict:
        """
        Calculate comprehensive adjustments based on all property characteristics

        Includes: size, rooms, condition, age, floor, elevator, outdoor spaces,
        energy efficiency, location quality, and more
        """

        adjustments = {
            "size_multiplier": 1.0,
            "rooms_multiplier": 1.0,
            "condition_multiplier": 1.0,
            "age_multiplier": 1.0,
            "floor_multiplier": 1.0,
            "elevator_multiplier": 1.0,
            "outdoor_multiplier": 1.0,
            "energy_multiplier": 1.0,
            "location_multiplier": 1.0,
            "quality_multiplier": 1.0,
            "parking_multiplier": 1.0,
            "investment_multiplier": 1.0,
            "total_multiplier": 1.0,
        }

        # Size adjustment (small properties have premium per m²)
        if avm_request.living_area < 50:
            adjustments["size_multiplier"] = 1.12
        elif avm_request.living_area < 70:
            adjustments["size_multiplier"] = 1.05
        elif avm_request.living_area > 150:
            adjustments["size_multiplier"] = 0.96
        elif avm_request.living_area > 200:
            adjustments["size_multiplier"] = 0.92

        # Rooms adjustment (optimal ratio is ~30-40m² per room)
        if avm_request.rooms:
            sqm_per_room = avm_request.living_area / avm_request.rooms
            if 30 <= sqm_per_room <= 40:
                adjustments["rooms_multiplier"] = 1.03  # Optimal
            elif sqm_per_room < 20:
                adjustments["rooms_multiplier"] = 0.95  # Too many small rooms
            elif sqm_per_room > 60:
                adjustments["rooms_multiplier"] = 0.97  # Too few rooms

        # Condition adjustment
        condition_multipliers = {
            "new": 1.15,
            "renovated": 1.08,
            "good": 1.0,
            "needs_renovation": 0.82,
            "poor": 0.68,
        }
        adjustments["condition_multiplier"] = condition_multipliers.get(
            avm_request.condition, 1.0
        )

        # Age adjustment with renovation consideration
        if avm_request.build_year:
            current_year = datetime.now().year
            age = current_year - avm_request.build_year

            # Check if renovated recently
            if avm_request.last_renovation_year:
                years_since_renovation = current_year - avm_request.last_renovation_year
                if years_since_renovation < 5:
                    adjustments["age_multiplier"] = 1.08
                elif years_since_renovation < 10:
                    adjustments["age_multiplier"] = 1.04
                else:
                    adjustments["age_multiplier"] = 1.0
            else:
                # No renovation data, use age
                if age < 5:
                    adjustments["age_multiplier"] = 1.12
                elif age < 15:
                    adjustments["age_multiplier"] = 1.05
                elif age > 50:
                    adjustments["age_multiplier"] = 0.88
                elif age > 70:
                    adjustments["age_multiplier"] = 0.82

        # Floor adjustment (for apartments)
        if (
            avm_request.property_type == PropertyType.APARTMENT
            and avm_request.floor is not None
        ):
            if avm_request.floor == 0:
                adjustments["floor_multiplier"] = 0.95  # Ground floor (noise, privacy)
            elif avm_request.floor == 1:
                adjustments["floor_multiplier"] = 0.98
            elif (
                avm_request.total_floors
                and avm_request.floor == avm_request.total_floors - 1
            ):
                adjustments["floor_multiplier"] = 1.08  # Top floor
            elif (
                avm_request.total_floors
                and avm_request.floor == avm_request.total_floors
            ):
                adjustments["floor_multiplier"] = 1.15  # Penthouse
            elif avm_request.floor >= 3:
                adjustments["floor_multiplier"] = 1.03  # Higher floors (view, quiet)

        # Elevator adjustment (important for higher floors)
        if avm_request.property_type == PropertyType.APARTMENT:
            if avm_request.has_elevator:
                if avm_request.floor and avm_request.floor > 2:
                    adjustments["elevator_multiplier"] = 1.05  # Elevator essential
            else:
                if avm_request.floor and avm_request.floor > 2:
                    adjustments["elevator_multiplier"] = 0.92  # No elevator penalty
                elif avm_request.floor and avm_request.floor > 4:
                    adjustments["elevator_multiplier"] = 0.85  # Significant penalty

        # Outdoor spaces (balcony, terrace, garden)
        outdoor_bonus = 0.0
        if avm_request.balcony_area and avm_request.balcony_area > 0:
            outdoor_bonus += min(0.05, avm_request.balcony_area / 100 * 0.5)
        if avm_request.terrace_area and avm_request.terrace_area > 0:
            outdoor_bonus += min(0.08, avm_request.terrace_area / 100 * 0.4)
        if avm_request.garden_area and avm_request.garden_area > 0:
            outdoor_bonus += min(0.12, avm_request.garden_area / 500 * 0.6)
        adjustments["outdoor_multiplier"] = 1.0 + outdoor_bonus

        # Energy efficiency
        if avm_request.energy_class:
            energy_multipliers = {
                "A+": 1.10,
                "A": 1.08,
                "B": 1.04,
                "C": 1.0,
                "D": 0.98,
                "E": 0.95,
                "F": 0.90,
                "G": 0.85,
                "H": 0.80,
            }
            adjustments["energy_multiplier"] = energy_multipliers.get(
                avm_request.energy_class, 1.0
            )

        # Heating type
        if avm_request.heating_type:
            heating_multipliers = {
                "heat_pump": 1.05,  # Modern, efficient
                "district": 1.02,  # Convenient
                "gas": 1.0,  # Standard
                "pellets": 0.98,  # Niche
                "oil": 0.95,  # Outdated
                "electric": 0.93,  # Expensive
            }
            heating_mult = heating_multipliers.get(avm_request.heating_type, 1.0)
            adjustments["energy_multiplier"] *= heating_mult

        # Location quality (based on POIs and scores)
        if geo_location:
            location_bonus = 0.0
            if geo_location.walkability_score:
                location_bonus += (
                    geo_location.walkability_score - 50
                ) / 1000  # -0.05 to +0.05
            if geo_location.transit_score:
                location_bonus += (geo_location.transit_score - 50) / 1000

            adjustments["location_multiplier"] = 1.0 + location_bonus

        # Orientation (south-facing is premium)
        if avm_request.orientation:
            orientation_multipliers = {
                "south": 1.04,
                "west": 1.02,
                "east": 1.01,
                "north": 0.98,
                "mixed": 1.0,
            }
            adjustments["quality_multiplier"] *= orientation_multipliers.get(
                avm_request.orientation, 1.0
            )

        # Quality features
        quality_bonus = 0.0
        if avm_request.fitted_kitchen:
            quality_bonus += 0.03
        if avm_request.barrier_free:
            quality_bonus += 0.04
        if avm_request.flooring_type == "parquet":
            quality_bonus += 0.02
        if avm_request.bathrooms and avm_request.bathrooms >= 2:
            quality_bonus += 0.03
        if avm_request.separate_toilet:
            quality_bonus += 0.01

        adjustments["quality_multiplier"] *= 1.0 + quality_bonus

        # Parking
        if avm_request.parking_spaces > 0:
            adjustments["parking_multiplier"] = 1.0 + (
                avm_request.parking_spaces * 0.03
            )

        # Noise level
        if avm_request.noise_level:
            noise_multipliers = {"quiet": 1.03, "moderate": 1.0, "loud": 0.95}
            adjustments["quality_multiplier"] *= noise_multipliers.get(
                avm_request.noise_level, 1.0
            )

        # Monument protection (can be positive or negative)
        if avm_request.monument_protected:
            adjustments["quality_multiplier"] *= 0.97  # Restrictions, but character

        # Investment multiplier (for rented properties)
        if avm_request.is_rented and avm_request.current_rent:
            # Calculate yield-based value
            annual_rent = avm_request.current_rent * 12
            base_value = avm_request.living_area * self._get_base_price_per_sqm(
                avm_request.city, avm_request.postal_code
            )

            # Typical multiplier is 20-30x annual rent
            yield_value = annual_rent * 25

            # If yield value is significantly different, adjust
            if yield_value > base_value * 1.1:
                adjustments["investment_multiplier"] = 1.05  # Good yield
            elif yield_value < base_value * 0.9:
                adjustments["investment_multiplier"] = 0.95  # Poor yield

        # Calculate total multiplier
        adjustments["total_multiplier"] = (
            adjustments["size_multiplier"]
            * adjustments["rooms_multiplier"]
            * adjustments["condition_multiplier"]
            * adjustments["age_multiplier"]
            * adjustments["floor_multiplier"]
            * adjustments["elevator_multiplier"]
            * adjustments["outdoor_multiplier"]
            * adjustments["energy_multiplier"]
            * adjustments["location_multiplier"]
            * adjustments["quality_multiplier"]
            * adjustments["parking_multiplier"]
            * adjustments["investment_multiplier"]
        )

        return adjustments

    def _calculate_confidence_level(
        self,
        avm_request: AvmRequest,
        comparables_count: int = 0,
        has_geodata: bool = False,
        has_llm: bool = False,
    ) -> str:
        """
        Calculate confidence level based on data quality and availability

        Factors:
        - Number of real comparables (most important)
        - Completeness of property data
        - Geodata availability
        - LLM analysis
        """

        confidence_score = 0.0

        # Comparables (most important factor)
        if comparables_count >= 10:
            confidence_score += 4.0
        elif comparables_count >= 5:
            confidence_score += 3.0
        elif comparables_count >= 3:
            confidence_score += 2.0
        elif comparables_count > 0:
            confidence_score += 1.0

        # Property data completeness
        if avm_request.rooms:
            confidence_score += 0.5
        if avm_request.build_year:
            confidence_score += 0.5
        if avm_request.floor is not None:
            confidence_score += 0.3
        if avm_request.energy_class:
            confidence_score += 0.3
        if avm_request.condition:
            confidence_score += 0.4
        if avm_request.bathrooms:
            confidence_score += 0.2
        if avm_request.parking_spaces > 0:
            confidence_score += 0.2

        # Outdoor spaces
        if (
            avm_request.balcony_area
            or avm_request.terrace_area
            or avm_request.garden_area
        ):
            confidence_score += 0.3

        # Size plausibility
        if 30 <= avm_request.living_area <= 300:
            confidence_score += 0.5

        # Geodata availability
        if has_geodata:
            confidence_score += 1.0

        # LLM analysis
        if has_llm:
            confidence_score += 1.0

        # Determine level
        if confidence_score >= 7.0:
            return "high"
        elif confidence_score >= 4.0:
            return "medium"
        else:
            return "low"

    def _create_enhanced_valuation_factors(
        self,
        avm_request: AvmRequest,
        adjustments: dict,
        llm_insights: List[str],
        geo_location: Optional[GeoLocation],
    ) -> List[ValuationFactor]:
        """
        Create comprehensive valuation factors explaining the valuation

        Returns top factors sorted by impact
        """

        factors = []

        # Location factor (always important)
        location_impact = (
            "positive"
            if adjustments.get("location_multiplier", 1.0) > 1.0
            else "neutral"
        )
        location_weight = 25
        location_desc = f"Lage in {avm_request.city}"
        if geo_location and geo_location.walkability_score:
            location_desc += f" (Walkability: {geo_location.walkability_score}/100)"

        factors.append(
            ValuationFactor(
                name="Lage & Standortqualität",
                impact=location_impact,
                weight=location_weight,
                description=location_desc,
            )
        )

        # Condition & Age
        condition_mult = adjustments.get("condition_multiplier", 1.0) * adjustments.get(
            "age_multiplier", 1.0
        )
        if condition_mult > 1.05:
            factors.append(
                ValuationFactor(
                    name="Zustand & Alter",
                    impact="positive",
                    weight=20,
                    description=f"Zustand: {avm_request.condition}, Baujahr: {avm_request.build_year or 'unbekannt'}",
                )
            )
        elif condition_mult < 0.95:
            factors.append(
                ValuationFactor(
                    name="Zustand & Alter",
                    impact="negative",
                    weight=20,
                    description=f"Zustand: {avm_request.condition}, Sanierungsbedarf möglich",
                )
            )

        # Floor & Elevator (for apartments)
        if avm_request.property_type == PropertyType.APARTMENT:
            floor_mult = adjustments.get("floor_multiplier", 1.0) * adjustments.get(
                "elevator_multiplier", 1.0
            )
            if floor_mult != 1.0:
                impact = "positive" if floor_mult > 1.0 else "negative"
                desc = f"Etage {avm_request.floor or '?'}"
                if avm_request.has_elevator:
                    desc += " mit Aufzug"
                else:
                    desc += " ohne Aufzug"

                factors.append(
                    ValuationFactor(
                        name="Etage & Aufzug",
                        impact=impact,
                        weight=12,
                        description=desc,
                    )
                )

        # Outdoor spaces
        outdoor_mult = adjustments.get("outdoor_multiplier", 1.0)
        if outdoor_mult > 1.02:
            outdoor_desc = []
            if avm_request.balcony_area:
                outdoor_desc.append(f"Balkon {avm_request.balcony_area}m²")
            if avm_request.terrace_area:
                outdoor_desc.append(f"Terrasse {avm_request.terrace_area}m²")
            if avm_request.garden_area:
                outdoor_desc.append(f"Garten {avm_request.garden_area}m²")

            factors.append(
                ValuationFactor(
                    name="Außenflächen",
                    impact="positive",
                    weight=10,
                    description=", ".join(outdoor_desc),
                )
            )

        # Energy efficiency
        energy_mult = adjustments.get("energy_multiplier", 1.0)
        if energy_mult != 1.0:
            impact = "positive" if energy_mult > 1.0 else "negative"
            desc = f"Energieeffizienzklasse: {avm_request.energy_class or 'unbekannt'}"
            if avm_request.heating_type:
                desc += f", Heizung: {avm_request.heating_type}"

            factors.append(
                ValuationFactor(
                    name="Energieeffizienz", impact=impact, weight=15, description=desc
                )
            )

        # Quality features
        quality_mult = adjustments.get("quality_multiplier", 1.0)
        if quality_mult > 1.02:
            quality_features = []
            if avm_request.fitted_kitchen:
                quality_features.append("Einbauküche")
            if avm_request.barrier_free:
                quality_features.append("Barrierefrei")
            if avm_request.flooring_type == "parquet":
                quality_features.append("Parkett")
            if avm_request.bathrooms and avm_request.bathrooms >= 2:
                quality_features.append(f"{avm_request.bathrooms} Bäder")

            if quality_features:
                factors.append(
                    ValuationFactor(
                        name="Ausstattungsqualität",
                        impact="positive",
                        weight=10,
                        description=", ".join(quality_features),
                    )
                )

        # Parking
        if avm_request.parking_spaces > 0:
            factors.append(
                ValuationFactor(
                    name="Stellplätze",
                    impact="positive",
                    weight=8,
                    description=f"{avm_request.parking_spaces} Stellplatz/Garage",
                )
            )

        # Size factor
        size_mult = adjustments.get("size_multiplier", 1.0)
        if size_mult > 1.05:
            factors.append(
                ValuationFactor(
                    name="Wohnflächengröße",
                    impact="positive",
                    weight=10,
                    description=f"{avm_request.living_area}m² - kompakte Größe mit Premium pro m²",
                )
            )
        elif size_mult < 0.95:
            factors.append(
                ValuationFactor(
                    name="Wohnflächengröße",
                    impact="negative",
                    weight=10,
                    description=f"{avm_request.living_area}m² - große Fläche, geringerer Preis pro m²",
                )
            )

        # Investment (for rented properties)
        if avm_request.is_rented and avm_request.current_rent:
            annual_rent = avm_request.current_rent * 12
            factors.append(
                ValuationFactor(
                    name="Vermietung & Rendite",
                    impact="positive",
                    weight=15,
                    description=f"Vermietet für €{avm_request.current_rent:,.0f}/Monat (€{annual_rent:,.0f}/Jahr)",
                )
            )

        # Add LLM insights
        if llm_insights:
            for i, insight in enumerate(llm_insights[:3]):
                impact = "neutral"
                if any(
                    word in insight.lower()
                    for word in [
                        "gut",
                        "excellent",
                        "vorteil",
                        "premium",
                        "attraktiv",
                        "positiv",
                    ]
                ):
                    impact = "positive"
                elif any(
                    word in insight.lower()
                    for word in ["negativ", "nachteil", "problem", "schlecht", "risiko"]
                ):
                    impact = "negative"

                factors.append(
                    ValuationFactor(
                        name=f"KI-Analyse #{i+1}",
                        impact=impact,
                        weight=8,
                        description=insight,
                    )
                )

        # Sort by weight (most important first)
        factors.sort(key=lambda f: f.weight, reverse=True)

        # Return top 10 factors
        return factors[:10]
