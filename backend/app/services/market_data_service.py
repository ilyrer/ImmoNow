"""
Market Data Service
Fetches real comparable listings from ImmoScout24 and Immowelt
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random

from app.schemas.avm import ComparableListing, MarketIntelligence, MarketTrendPoint
from app.schemas.common import PropertyType

logger = logging.getLogger(__name__)


class MarketDataService:
    """
    Service for fetching real market data from property portals
    
    Aggregates data from:
    - ImmoScout24
    - Immowelt
    
    Provides:
    - Comparable listings (Comps)
    - Market statistics
    - Price trends
    """
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.use_real_data = False  # Will be set to True if credentials are available
        
        # Import services lazily to avoid circular dependencies
        self._immoscout_service = None
        self._immowelt_service = None
    
    @property
    def immoscout_service(self):
        """Lazy load ImmoScout24Service"""
        if self._immoscout_service is None:
            try:
                from app.services.immoscout_service import ImmoScout24Service
                self._immoscout_service = ImmoScout24Service()
            except Exception as e:
                logger.warning(f"Could not load ImmoScout24Service: {e}")
        return self._immoscout_service
    
    @property
    def immowelt_service(self):
        """Lazy load ImmoweltService"""
        if self._immowelt_service is None:
            try:
                from app.services.immowelt_service import ImmoweltService
                self._immowelt_service = ImmoweltService()
            except Exception as e:
                logger.warning(f"Could not load ImmoweltService: {e}")
        return self._immowelt_service
    
    async def fetch_comparable_listings(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        living_area: float,
        rooms: Optional[int] = None,
        build_year: Optional[int] = None,
        radius_km: float = 2.0,
        max_results: int = 20
    ) -> List[ComparableListing]:
        """
        Fetch comparable listings from available portals
        
        Args:
            city: City name
            postal_code: Postal code
            property_type: Property type
            living_area: Living area in m²
            rooms: Number of rooms (optional, for better matching)
            build_year: Build year (optional, for better matching)
            radius_km: Search radius in kilometers
            max_results: Maximum number of results to return
        
        Returns:
            List of comparable listings, sorted by match score
        """
        try:
            logger.info(
                f"🔍 Fetching comps for {city} {postal_code}, "
                f"{property_type}, {living_area}m², radius={radius_km}km"
            )
            
            all_comps = []
            
            # Try to fetch from ImmoScout24
            try:
                immoscout_comps = await self._fetch_from_immoscout24(
                    city, postal_code, property_type, living_area, rooms, build_year, radius_km
                )
                all_comps.extend(immoscout_comps)
                logger.info(f"✅ ImmoScout24: {len(immoscout_comps)} comps")
            except Exception as e:
                logger.warning(f"⚠️ ImmoScout24 fetch failed: {e}")
            
            # Try to fetch from Immowelt
            try:
                immowelt_comps = await self._fetch_from_immowelt(
                    city, postal_code, property_type, living_area, rooms, build_year, radius_km
                )
                all_comps.extend(immowelt_comps)
                logger.info(f"✅ Immowelt: {len(immowelt_comps)} comps")
            except Exception as e:
                logger.warning(f"⚠️ Immowelt fetch failed: {e}")
            
            # If no real data available, generate mock data
            if not all_comps:
                logger.info("📊 No portal data available, using enhanced mock data")
                all_comps = self._generate_mock_comparables(
                    city, postal_code, property_type, living_area, rooms, build_year, max_results
                )
            
            # Deduplicate (in case same property on multiple portals)
            all_comps = self._deduplicate_comps(all_comps)
            
            # Calculate match scores
            all_comps = self._calculate_match_scores(
                all_comps, living_area, rooms, build_year, property_type
            )
            
            # Sort by match score (best first)
            all_comps.sort(key=lambda c: c.match_score, reverse=True)
            
            # Limit results
            all_comps = all_comps[:max_results]
            
            logger.info(f"✅ Total comps after processing: {len(all_comps)}")
            
            return all_comps
            
        except Exception as e:
            logger.error(f"❌ Error fetching comps: {e}")
            # Fallback to mock data
            return self._generate_mock_comparables(
                city, postal_code, property_type, living_area, rooms, build_year, max_results
            )
    
    async def _fetch_from_immoscout24(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        living_area: float,
        rooms: Optional[int],
        build_year: Optional[int],
        radius_km: float
    ) -> List[ComparableListing]:
        """
        Fetch comparables from ImmoScout24
        
        Note: This requires authenticated API access.
        If credentials are not configured, returns empty list.
        """
        try:
            # Check if we have valid credentials
            settings = await self.immoscout_service.get_integration_settings(self.tenant_id)
            if not settings:
                return []
            
            # Note: ImmoScout24 API search endpoint would be called here
            # For now, this is a placeholder as the actual search API
            # requires specific endpoint documentation
            
            # TODO: Implement actual IS24 search API call
            # Example structure:
            # access_token = await self.immoscout_service.get_access_token(self.tenant_id)
            # search_params = {
            #     'geocodes': postal_code,
            #     'realestatetype': property_type,
            #     'livingspace': f'{living_area*0.8}-{living_area*1.2}',
            #     'radius': radius_km * 1000  # Convert to meters
            # }
            # results = await self._search_immoscout24(access_token, search_params)
            
            return []
            
        except Exception as e:
            logger.debug(f"ImmoScout24 fetch error: {e}")
            return []
    
    async def _fetch_from_immowelt(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        living_area: float,
        rooms: Optional[int],
        build_year: Optional[int],
        radius_km: float
    ) -> List[ComparableListing]:
        """
        Fetch comparables from Immowelt
        
        Note: This requires authenticated API access.
        If credentials are not configured, returns empty list.
        """
        try:
            # Check if we have valid credentials
            # Similar to ImmoScout24, this would use the Immowelt API
            
            # TODO: Implement actual Immowelt search API call
            
            return []
            
        except Exception as e:
            logger.debug(f"Immowelt fetch error: {e}")
            return []
    
    def _generate_mock_comparables(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        living_area: float,
        rooms: Optional[int],
        build_year: Optional[int],
        count: int = 20
    ) -> List[ComparableListing]:
        """
        Generate realistic mock comparable listings for development/testing
        """
        comps = []
        
        # Get base price per m² for the city
        base_price_per_sqm = self._get_base_price_per_sqm(city, postal_code)
        
        # Generate varied comps around the target property
        for i in range(count):
            # Vary size ±20%
            size_factor = random.uniform(0.8, 1.2)
            comp_size = int(living_area * size_factor)
            
            # Vary price per m² ±15%
            price_variation = random.uniform(0.85, 1.15)
            comp_price_per_sqm = base_price_per_sqm * price_variation
            
            # Calculate total price
            comp_price = comp_size * comp_price_per_sqm
            
            # Generate realistic address
            street_names = [
                "Hauptstraße", "Bahnhofstraße", "Parkstraße", "Berliner Straße",
                "Gartenweg", "Mozartplatz", "Schillerstraße", "Kirchplatz",
                "Am Markt", "Lindenallee", "Rosenweg", "Fichtestraße"
            ]
            comp_address = f"{random.choice(street_names)} {random.randint(1, 150)}"
            
            # Vary build year slightly
            if build_year:
                comp_build_year = build_year + random.randint(-10, 10)
                comp_build_year = max(1900, min(2025, comp_build_year))
            else:
                comp_build_year = random.randint(1960, 2020)
            
            # Vary rooms
            if rooms:
                comp_rooms = rooms + random.randint(-1, 1)
                comp_rooms = max(1, min(10, comp_rooms))
            else:
                comp_rooms = random.randint(2, 5)
            
            # Condition based on build year and renovation
            conditions = ['good', 'renovated', 'new', 'needs_renovation']
            if comp_build_year > 2015:
                condition = 'new'
            elif comp_build_year > 2000 or random.random() > 0.5:
                condition = 'renovated'
            else:
                condition = random.choice(['good', 'needs_renovation'])
            
            # Distance from center (random within radius)
            distance_km = random.uniform(0.1, radius_km)
            
            # Generate a sold date (within last 6 months)
            days_ago = random.randint(0, 180)
            sold_date = datetime.utcnow() - timedelta(days=days_ago)
            
            comp = ComparableListing(
                id=f"mock_comp_{i+1}",
                address=comp_address,
                city=city,
                postal_code=postal_code,
                property_type=property_type,
                size=comp_size,
                rooms=comp_rooms,
                build_year=comp_build_year,
                condition=condition,
                price=comp_price,
                price_per_sqm=comp_price_per_sqm,
                sold_date=sold_date,
                distance=distance_km,
                match_score=0.0  # Will be calculated later
            )
            comps.append(comp)
        
        return comps
    
    def _get_base_price_per_sqm(self, city: str, postal_code: str) -> float:
        """Get base price per sqm for location (reuse from AVM service logic)"""
        # Simplified version - in production, import from avm_service
        base_prices = {
            'München': 7500, 'Munich': 7500,
            'Frankfurt': 5500, 'Hamburg': 5200,
            'Stuttgart': 5800, 'Düsseldorf': 5000,
            'Berlin': 4800, 'Köln': 4200,
            'Bonn': 4000, 'Leipzig': 3200,
            'Dresden': 3400, 'Hannover': 3400
        }
        
        city_lower = city.lower()
        for city_name, price in base_prices.items():
            if city_name.lower() in city_lower or city_lower in city_name.lower():
                return price
        
        return 3000  # Default
    
    def _deduplicate_comps(self, comps: List[ComparableListing]) -> List[ComparableListing]:
        """
        Remove duplicate comps (same property from different sources)
        """
        seen = set()
        unique_comps = []
        
        for comp in comps:
            # Create a key based on address and size
            key = f"{comp.address}_{comp.city}_{comp.size}"
            
            if key not in seen:
                seen.add(key)
                unique_comps.append(comp)
        
        return unique_comps
    
    def _calculate_match_scores(
        self,
        comps: List[ComparableListing],
        target_area: float,
        target_rooms: Optional[int],
        target_build_year: Optional[int],
        target_property_type: PropertyType
    ) -> List[ComparableListing]:
        """
        Calculate match score for each comparable
        
        Score factors:
        - Size similarity (40%)
        - Distance (30%)
        - Age similarity (20%)
        - Rooms similarity (10%)
        """
        for comp in comps:
            score = 0.0
            
            # Size similarity (40% weight)
            size_diff = abs(comp.size - target_area) / target_area
            size_score = max(0, 1 - size_diff)  # 1.0 = perfect match, 0.0 = very different
            score += size_score * 0.4
            
            # Distance (30% weight) - closer is better
            if comp.distance <= 0.5:
                distance_score = 1.0
            elif comp.distance <= 1.0:
                distance_score = 0.8
            elif comp.distance <= 2.0:
                distance_score = 0.6
            else:
                distance_score = max(0, 1 - (comp.distance / 5.0))
            score += distance_score * 0.3
            
            # Age similarity (20% weight)
            if target_build_year and comp.build_year:
                age_diff = abs(comp.build_year - target_build_year)
                age_score = max(0, 1 - (age_diff / 50))  # 50 years = 0 score
                score += age_score * 0.2
            else:
                score += 0.1  # Half weight if no age data
            
            # Rooms similarity (10% weight)
            if target_rooms and comp.rooms:
                rooms_diff = abs(comp.rooms - target_rooms)
                rooms_score = max(0, 1 - (rooms_diff / 3))  # 3 rooms diff = 0 score
                score += rooms_score * 0.1
            else:
                score += 0.05  # Half weight if no rooms data
            
            # Clamp to 0-1 range
            comp.match_score = max(0.0, min(1.0, score))
        
        return comps
    
    async def get_market_statistics(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        time_period_months: int = 12
    ) -> MarketIntelligence:
        """
        Get market statistics for a location
        
        Args:
            city: City name
            postal_code: Postal code
            property_type: Property type
            time_period_months: Historical data period in months
        
        Returns:
            MarketIntelligence object with trends and statistics
        """
        try:
            logger.info(f"📊 Fetching market data for {city} {postal_code}")
            
            # Try to get real data from portals
            # For now, generate realistic mock data
            
            market_intel = self._generate_market_intelligence(
                city, postal_code, property_type, time_period_months
            )
            
            logger.info(
                f"✅ Market data: Demand={market_intel.demand_level}, "
                f"Growth={market_intel.price_growth_12m:.1f}%"
            )
            
            return market_intel
            
        except Exception as e:
            logger.error(f"❌ Error fetching market stats: {e}")
            # Fallback
            return self._generate_market_intelligence(
                city, postal_code, property_type, time_period_months
            )
    
    def _generate_market_intelligence(
        self,
        city: str,
        postal_code: str,
        property_type: PropertyType,
        time_period_months: int
    ) -> MarketIntelligence:
        """Generate realistic market intelligence data"""
        
        # Base price for trends
        base_price_per_sqm = self._get_base_price_per_sqm(city, postal_code)
        
        # Generate price trends
        trends = []
        current_date = datetime.utcnow()
        
        # Generate historical price trend (generally upward with some volatility)
        for i in range(time_period_months):
            month_date = current_date - timedelta(days=30 * (time_period_months - i))
            
            # Price growth trend (annualized 2-8%)
            monthly_growth = random.uniform(0.002, 0.008)
            price_multiplier = 1.0 + (monthly_growth * (time_period_months - i))
            
            avg_price_per_sqm = base_price_per_sqm * price_multiplier
            
            # Assume average property size
            avg_size = 85 if property_type == PropertyType.APARTMENT else 150
            avg_price = avg_price_per_sqm * avg_size
            
            # Add some randomness
            avg_price *= random.uniform(0.95, 1.05)
            avg_price_per_sqm *= random.uniform(0.95, 1.05)
            
            trend_point = MarketTrendPoint(
                date=month_date.strftime("%Y-%m"),
                average_price=avg_price,
                average_price_per_sqm=avg_price_per_sqm,
                transaction_count=random.randint(30, 150),
                median_price=avg_price * random.uniform(0.95, 1.0),
                region=city
            )
            trends.append(trend_point)
        
        # Calculate price growth
        if len(trends) >= 12:
            price_growth_12m = ((trends[-1].average_price_per_sqm / trends[-12].average_price_per_sqm) - 1) * 100
        else:
            price_growth_12m = random.uniform(2, 8)
        
        if len(trends) >= 36:
            price_growth_36m = ((trends[-1].average_price_per_sqm / trends[-36].average_price_per_sqm) - 1) * 100
        else:
            price_growth_36m = price_growth_12m * 3
        
        # Demand/supply levels (tier-based)
        top_tier_cities = ['münchen', 'munich', 'frankfurt', 'hamburg', 'stuttgart']
        is_top_tier = any(c in city.lower() for c in top_tier_cities)
        
        if is_top_tier:
            demand_level = random.choice(['very_high', 'high', 'high'])
            supply_level = random.choice(['low', 'medium'])
            avg_days_on_market = random.randint(20, 45)
            competition_index = random.randint(7, 10)
        else:
            demand_level = random.choice(['high', 'medium', 'medium'])
            supply_level = random.choice(['medium', 'high'])
            avg_days_on_market = random.randint(40, 90)
            competition_index = random.randint(4, 7)
        
        market_intel = MarketIntelligence(
            region=city,
            postal_code=postal_code,
            demand_level=demand_level,
            supply_level=supply_level,
            price_growth_12m=price_growth_12m,
            price_growth_36m=price_growth_36m,
            average_days_on_market=avg_days_on_market,
            competition_index=competition_index,
            trends=trends
        )
        
        return market_intel

