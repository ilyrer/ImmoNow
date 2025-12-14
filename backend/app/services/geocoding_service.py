"""
Geocoding & Location Service
Provides geocoding via OpenStreetMap Nominatim and POI data via Overpass API
"""
import httpx
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio

from app.schemas.avm import GeoLocation, POI

logger = logging.getLogger(__name__)


class GeocodingService:
    """
    Geocoding service using free OpenStreetMap APIs
    
    - Nominatim for address geocoding
    - Overpass for Points of Interest
    - Walkability scoring based on POI density
    """
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org"
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    
    # User-Agent required by Nominatim terms of service
    USER_AGENT = "ImmoNow-AVM/2.0 (Professional Real Estate Valuation)"
    
    def __init__(self):
        self.timeout = 10.0
        self.cache: Dict[str, Any] = {}  # Simple in-memory cache
        self.cache_ttl = timedelta(hours=24)
    
    async def geocode_address(
        self,
        street: str,
        city: str,
        postal_code: str,
        country: str = "Germany"
    ) -> Optional[GeoLocation]:
        """
        Geocode an address to latitude/longitude
        
        Args:
            street: Street name and number
            city: City name
            postal_code: Postal code
            country: Country name (default: Germany)
        
        Returns:
            GeoLocation object or None if geocoding fails
        """
        try:
            # Create cache key
            cache_key = f"geocode_{street}_{city}_{postal_code}".lower().replace(" ", "_")
            
            # Check cache
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if datetime.utcnow() - cached_time < self.cache_ttl:
                    logger.info(f"📍 Geocoding cache hit for {city}")
                    return cached_data
            
            # Build search query
            query_parts = []
            if street:
                query_parts.append(street)
            if postal_code:
                query_parts.append(postal_code)
            if city:
                query_parts.append(city)
            if country:
                query_parts.append(country)
            
            query = ", ".join(query_parts)
            
            # Make request to Nominatim
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.NOMINATIM_URL}/search",
                    params={
                        "q": query,
                        "format": "json",
                        "limit": 1,
                        "addressdetails": 1
                    },
                    headers={"User-Agent": self.USER_AGENT},
                    timeout=self.timeout
                )
                
                if response.status_code != 200:
                    logger.warning(f"⚠️ Nominatim API error: {response.status_code}")
                    return None
                
                results = response.json()
                
                if not results:
                    logger.warning(f"⚠️ No geocoding results for: {query}")
                    return None
                
                result = results[0]
                
                geo_location = GeoLocation(
                    latitude=float(result['lat']),
                    longitude=float(result['lon']),
                    display_name=result.get('display_name', query)
                )
                
                # Cache result
                self.cache[cache_key] = (geo_location, datetime.utcnow())
                
                logger.info(f"✅ Geocoded: {city} → ({geo_location.latitude}, {geo_location.longitude})")
                
                return geo_location
                
        except Exception as e:
            logger.error(f"❌ Geocoding error for {city}: {e}")
            return None
    
    async def get_nearby_pois(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 1000
    ) -> List[POI]:
        """
        Get nearby Points of Interest using Overpass API
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_m: Search radius in meters (default: 1000)
        
        Returns:
            List of POI objects
        """
        try:
            # Cache key
            cache_key = f"pois_{latitude:.4f}_{longitude:.4f}_{radius_m}"
            
            # Check cache
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if datetime.utcnow() - cached_time < self.cache_ttl:
                    logger.info(f"📍 POI cache hit for ({latitude}, {longitude})")
                    return cached_data
            
            # Overpass QL query for important POIs
            overpass_query = f"""
            [out:json][timeout:25];
            (
              node["amenity"~"^(school|kindergarten|university|hospital|pharmacy|doctors|dentist|supermarket|restaurant|cafe|bank|atm|post_office)$"](around:{radius_m},{latitude},{longitude});
              node["shop"~"^(supermarket|convenience|bakery)$"](around:{radius_m},{latitude},{longitude});
              node["public_transport"~"^(station|stop_position|platform)$"](around:{radius_m},{latitude},{longitude});
              node["leisure"~"^(park|playground|sports_centre)$"](around:{radius_m},{latitude},{longitude});
            );
            out body;
            """
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.OVERPASS_URL,
                    data=overpass_query,
                    headers={"User-Agent": self.USER_AGENT},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.warning(f"⚠️ Overpass API error: {response.status_code}")
                    return []
                
                data = response.json()
                
                pois = []
                for element in data.get('elements', []):
                    poi_lat = element.get('lat')
                    poi_lon = element.get('lon')
                    tags = element.get('tags', {})
                    
                    if not poi_lat or not poi_lon:
                        continue
                    
                    # Determine POI type
                    poi_type = self._determine_poi_type(tags)
                    
                    # Get name
                    name = tags.get('name', tags.get('amenity', tags.get('shop', 'Unknown')))
                    
                    # Calculate distance
                    distance = self._calculate_distance(
                        latitude, longitude, poi_lat, poi_lon
                    )
                    
                    poi = POI(
                        type=poi_type,
                        name=name,
                        distance_m=int(distance),
                        latitude=poi_lat,
                        longitude=poi_lon
                    )
                    pois.append(poi)
                
                # Sort by distance
                pois.sort(key=lambda p: p.distance_m)
                
                # Cache result
                self.cache[cache_key] = (pois, datetime.utcnow())
                
                logger.info(f"✅ Found {len(pois)} POIs within {radius_m}m")
                
                return pois
                
        except Exception as e:
            logger.error(f"❌ POI fetch error: {e}")
            return []
    
    def _determine_poi_type(self, tags: Dict[str, str]) -> str:
        """Determine POI type from OSM tags"""
        # Schools and education
        if tags.get('amenity') in ['school', 'kindergarten', 'university', 'college']:
            return 'school'
        
        # Public transport
        if 'public_transport' in tags or tags.get('railway') == 'station':
            return 'transit'
        
        # Shopping
        if tags.get('shop') or tags.get('amenity') == 'supermarket':
            return 'shopping'
        
        # Medical
        if tags.get('amenity') in ['hospital', 'pharmacy', 'doctors', 'dentist', 'clinic']:
            return 'medical'
        
        # Leisure / Parks
        if tags.get('leisure') in ['park', 'playground', 'sports_centre', 'garden']:
            return 'park'
        
        # Restaurant / Food
        if tags.get('amenity') in ['restaurant', 'cafe', 'fast_food', 'bar']:
            return 'restaurant'
        
        # Default
        return tags.get('amenity', tags.get('shop', 'other'))
    
    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in meters
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371000  # Earth radius in meters
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return distance
    
    def calculate_walkability_score(
        self,
        pois: List[POI],
        weights: Optional[Dict[str, float]] = None
    ) -> int:
        """
        Calculate walkability score based on POI density and types
        
        Args:
            pois: List of POIs
            weights: Optional custom weights for POI types
        
        Returns:
            Score from 0-100 (higher is better)
        """
        if not pois:
            return 0
        
        # Default weights for different POI types
        if weights is None:
            weights = {
                'transit': 3.0,      # Public transport is very important
                'shopping': 2.5,     # Daily needs
                'school': 2.0,       # Education
                'medical': 1.5,      # Healthcare
                'park': 1.5,         # Recreation
                'restaurant': 1.0,   # Quality of life
                'other': 0.5         # General amenities
            }
        
        score = 0.0
        
        # Count POIs by type within different radius rings
        rings = [
            (500, 1.0),    # 0-500m: full weight
            (1000, 0.5),   # 500-1000m: half weight
            (2000, 0.25),  # 1000-2000m: quarter weight
        ]
        
        for poi in pois:
            poi_weight = weights.get(poi.type, weights.get('other', 0.5))
            
            # Determine ring
            for max_distance, distance_weight in rings:
                if poi.distance_m <= max_distance:
                    score += poi_weight * distance_weight
                    break
        
        # Normalize to 0-100 scale
        # Assume a score of 30+ is excellent (100 points)
        normalized_score = min(100, int((score / 30.0) * 100))
        
        return normalized_score
    
    def calculate_transit_score(self, pois: List[POI]) -> int:
        """
        Calculate public transport accessibility score
        
        Args:
            pois: List of POIs
        
        Returns:
            Score from 0-100 (higher is better)
        """
        transit_pois = [p for p in pois if p.type == 'transit']
        
        if not transit_pois:
            return 0
        
        # Count transit stops within walking distance
        within_300m = len([p for p in transit_pois if p.distance_m <= 300])
        within_500m = len([p for p in transit_pois if p.distance_m <= 500])
        within_1000m = len([p for p in transit_pois if p.distance_m <= 1000])
        
        # Calculate score
        score = 0
        score += within_300m * 40  # Very close: high score
        score += within_500m * 20  # Close: medium score
        score += within_1000m * 10  # Walking distance: low score
        
        # Cap at 100
        return min(100, score)
    
    async def enrich_geolocation(
        self,
        geo_location: GeoLocation,
        radius_m: int = 1000
    ) -> GeoLocation:
        """
        Enrich a GeoLocation with walkability and transit scores
        
        Args:
            geo_location: Base GeoLocation object
            radius_m: Search radius for POIs
        
        Returns:
            Enriched GeoLocation with scores
        """
        try:
            # Fetch POIs
            pois = await self.get_nearby_pois(
                geo_location.latitude,
                geo_location.longitude,
                radius_m
            )
            
            # Calculate scores
            walkability_score = self.calculate_walkability_score(pois)
            transit_score = self.calculate_transit_score(pois)
            
            # Update geo_location
            geo_location.walkability_score = walkability_score
            geo_location.transit_score = transit_score
            
            logger.info(
                f"✅ Location enriched: Walkability={walkability_score}, Transit={transit_score}"
            )
            
            return geo_location
            
        except Exception as e:
            logger.error(f"❌ Location enrichment error: {e}")
            return geo_location

