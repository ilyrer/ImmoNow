"""
AVM Schemas - Enterprise Ready
"""
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator, validator

from app.schemas.common import PropertyType


class AvmRequest(BaseModel):
    """
    AVM Request Model - Premium Enterprise Edition
    
    Validates property data for automated valuation.
    Extended with professional fields for bank-grade assessments.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "address": "Hauptstraße 1",
                "city": "München",
                "postal_code": "80331",
                "property_type": "apartment",
                "living_area": 85,
                "rooms": 3,
                "build_year": 2010,
                "condition": "good",
                "floor": 3,
                "total_floors": 5,
                "has_elevator": True,
                "balcony_area": 8,
                "parking_spaces": 1,
                "heating_type": "district",
                "energy_class": "B",
                "features": ["balcony", "parking", "elevator"]
            }
        }
    )
    
    # === LOCATION ===
    address: str = Field(
        ..., 
        min_length=3, 
        max_length=200,
        description="Street address of the property",
        examples=["Hauptstraße 1", "Berliner Allee 42"]
    )
    city: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="City name",
        examples=["München", "Berlin", "Hamburg"]
    )
    postal_code: str = Field(
        ...,
        min_length=4,
        max_length=10,
        description="Postal code (German: 5 digits, International: flexible)",
        examples=["80331", "10115", "12345"]
    )
    
    # === PROPERTY TYPE ===
    property_type: PropertyType = Field(
        ...,
        description="Type of property (apartment, house, commercial, land, parking)"
    )
    
    # === AREAS (differentiated) ===
    living_area: float = Field(
        ..., 
        ge=5, 
        le=10000,
        description="Living area in square meters (Wohnfläche)",
        examples=[85, 120, 250]
    )
    usable_area: Optional[float] = Field(
        None,
        ge=0,
        le=10000,
        description="Usable area in square meters (Nutzfläche)",
        examples=[95, 130, 280]
    )
    plot_area: Optional[float] = Field(
        None,
        ge=0,
        le=100000,
        description="Plot area in square meters - for houses (Grundstücksfläche)",
        examples=[250, 500, 1000]
    )
    
    # === BASIC PROPERTY DATA ===
    rooms: Optional[int] = Field(
        None, 
        ge=1, 
        le=50,
        description="Number of rooms (optional)",
        examples=[3, 4, 5]
    )
    bathrooms: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        description="Number of bathrooms",
        examples=[1, 2, 3]
    )
    separate_toilet: bool = Field(
        default=False,
        description="Guest WC available (Gäste-WC)"
    )
    build_year: Optional[int] = Field(
        None, 
        ge=1800, 
        le=2030,
        description="Year of construction (optional)",
        examples=[2010, 1995, 2020]
    )
    
    # === FLOOR & BUILDING ===
    floor: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Floor number (0 = ground floor, Etage)",
        examples=[0, 3, 8]
    )
    total_floors: Optional[int] = Field(
        None,
        ge=1,
        le=100,
        description="Total number of floors in building (Gesamtetagen)",
        examples=[5, 8, 15]
    )
    has_elevator: bool = Field(
        default=False,
        description="Elevator available (Aufzug vorhanden)"
    )
    
    # === OUTDOOR SPACES ===
    balcony_area: Optional[float] = Field(
        None,
        ge=0,
        le=200,
        description="Balcony area in m² (Balkonfläche)",
        examples=[6, 8, 12]
    )
    terrace_area: Optional[float] = Field(
        None,
        ge=0,
        le=500,
        description="Terrace area in m² (Terrassenfläche)",
        examples=[15, 25, 40]
    )
    garden_area: Optional[float] = Field(
        None,
        ge=0,
        le=10000,
        description="Garden area in m² (Gartenfläche)",
        examples=[50, 100, 300]
    )
    parking_spaces: int = Field(
        default=0,
        ge=0,
        le=20,
        description="Number of parking spaces/garages (Stellplätze/Garagen)",
        examples=[0, 1, 2]
    )
    
    # === CONDITION & RENOVATION ===
    condition: str = Field(
        default="good",
        description="Condition of the property",
        examples=["new", "renovated", "good", "needs_renovation", "poor"]
    )
    last_renovation_year: Optional[int] = Field(
        None,
        ge=1900,
        le=2030,
        description="Last renovation year (Letztes Sanierungsjahr)",
        examples=[2015, 2020, 2023]
    )
    
    # === ENERGY & HEATING ===
    heating_type: Optional[str] = Field(
        None,
        description="Heating type: gas, oil, district, heat_pump, electric, pellets",
        examples=["gas", "district", "heat_pump"]
    )
    energy_class: Optional[str] = Field(
        None,
        description="Energy efficiency class (Energieeffizienzklasse): A+, A, B, C, D, E, F, G, H",
        examples=["B", "C", "A"]
    )
    energy_consumption: Optional[float] = Field(
        None,
        ge=0,
        le=1000,
        description="Energy consumption value in kWh/m²a (Energiekennwert)",
        examples=[75, 120, 180]
    )
    
    # === QUALITY & FEATURES ===
    fitted_kitchen: bool = Field(
        default=False,
        description="Fitted kitchen included (Einbauküche)"
    )
    flooring_type: Optional[str] = Field(
        None,
        description="Flooring type: parquet, tiles, laminate, carpet (Bodenbeläge)",
        examples=["parquet", "tiles", "laminate"]
    )
    barrier_free: bool = Field(
        default=False,
        description="Barrier-free / wheelchair accessible (Barrierefrei)"
    )
    monument_protected: bool = Field(
        default=False,
        description="Monument protection (Denkmalschutz)"
    )
    orientation: Optional[str] = Field(
        None,
        description="Orientation: north, south, east, west, mixed (Ausrichtung)",
        examples=["south", "west", "mixed"]
    )
    noise_level: Optional[str] = Field(
        None,
        description="Noise level: quiet, moderate, loud (Lärmpegel)",
        examples=["quiet", "moderate"]
    )
    
    # === INVESTMENT DATA ===
    is_rented: bool = Field(
        default=False,
        description="Property currently rented (Vermietet)"
    )
    current_rent: Optional[float] = Field(
        None,
        ge=0,
        le=50000,
        description="Current monthly cold rent in EUR (Kaltmiete)",
        examples=[850, 1200, 2500]
    )
    rental_agreement_type: Optional[str] = Field(
        None,
        description="Rental agreement type: indefinite, fixed, index, stepped (Mietvertragsart)",
        examples=["indefinite", "index"]
    )
    
    # === LEGACY / COMPATIBILITY ===
    size: Optional[int] = Field(
        None,
        ge=5,
        le=10000,
        description="DEPRECATED: Use living_area instead. Size in square meters",
        examples=[85, 120, 250]
    )
    features: List[str] = Field(
        default_factory=list,
        description="List of property features (legacy, many moved to dedicated fields)",
        examples=[["balcony", "parking"], ["garden", "pool", "garage"]]
    )
    
    @field_validator('postal_code')
    @classmethod
    def validate_postal_code(cls, v: str) -> str:
        """Validate and normalize postal code"""
        # Remove spaces and special characters
        cleaned = ''.join(c for c in v if c.isalnum())
        
        # German postal code validation (5 digits)
        if len(cleaned) == 5 and cleaned.isdigit():
            return cleaned
        
        # International postal codes (be more flexible)
        if 4 <= len(cleaned) <= 10:
            return cleaned
        
        raise ValueError(
            f"Ungültige Postleitzahl: '{v}'. "
            f"Erwartet: 5-stellige Zahl (Deutschland) oder 4-10 Zeichen (International)"
        )
    
    @field_validator('condition')
    @classmethod
    def validate_condition(cls, v: str) -> str:
        """Validate and normalize condition"""
        # Normalize to lowercase
        v_lower = v.lower().strip()
        
        # Valid conditions
        valid_conditions = {
            'new': 'new',
            'neu': 'new',
            'brandneu': 'new',
            'renovated': 'renovated',
            'renoviert': 'renovated',
            'saniert': 'renovated',
            'good': 'good',
            'gut': 'good',
            'needs_renovation': 'needs_renovation',
            'renovierungsbedürftig': 'needs_renovation',
            'sanierungsbedürftig': 'needs_renovation',
            'poor': 'poor',
            'schlecht': 'poor',
            'sehr schlecht': 'poor'
        }
        
        if v_lower in valid_conditions:
            return valid_conditions[v_lower]
        
        # Default to 'good' if unknown
        return 'good'
    
    @field_validator('city')
    @classmethod
    def normalize_city(cls, v: str) -> str:
        """Normalize city name"""
        return v.strip().title()
    
    @field_validator('features')
    @classmethod
    def normalize_features(cls, v: List[str]) -> List[str]:
        """Normalize and deduplicate features"""
        # Convert to lowercase, strip, and deduplicate
        normalized = list(set(f.lower().strip() for f in v if f.strip()))
        return sorted(normalized)
    
    @field_validator('heating_type')
    @classmethod
    def validate_heating_type(cls, v: Optional[str]) -> Optional[str]:
        """Validate heating type"""
        if v is None:
            return None
        
        valid_types = {
            'gas': 'gas',
            'oil': 'oil',
            'öl': 'oil',
            'district': 'district',
            'fernwärme': 'district',
            'heat_pump': 'heat_pump',
            'wärmepumpe': 'heat_pump',
            'electric': 'electric',
            'elektro': 'electric',
            'pellets': 'pellets',
            'holz': 'pellets'
        }
        
        v_lower = v.lower().strip()
        return valid_types.get(v_lower, v_lower)
    
    @field_validator('energy_class')
    @classmethod
    def validate_energy_class(cls, v: Optional[str]) -> Optional[str]:
        """Validate energy efficiency class"""
        if v is None:
            return None
        
        v_upper = v.upper().strip()
        valid_classes = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        
        if v_upper in valid_classes:
            return v_upper
        
        # Try to normalize
        if v_upper.startswith('A'):
            return 'A+' if '+' in v_upper else 'A'
        
        return v_upper
    
    @field_validator('flooring_type')
    @classmethod
    def validate_flooring_type(cls, v: Optional[str]) -> Optional[str]:
        """Validate flooring type"""
        if v is None:
            return None
        
        valid_types = {
            'parquet': 'parquet',
            'parkett': 'parquet',
            'tiles': 'tiles',
            'fliesen': 'tiles',
            'laminate': 'laminate',
            'laminat': 'laminate',
            'carpet': 'carpet',
            'teppich': 'carpet'
        }
        
        v_lower = v.lower().strip()
        return valid_types.get(v_lower, v_lower)
    
    @field_validator('orientation')
    @classmethod
    def validate_orientation(cls, v: Optional[str]) -> Optional[str]:
        """Validate orientation"""
        if v is None:
            return None
        
        valid_orientations = {
            'north': 'north',
            'nord': 'north',
            'norden': 'north',
            'south': 'south',
            'süd': 'south',
            'süden': 'south',
            'east': 'east',
            'ost': 'east',
            'osten': 'east',
            'west': 'west',
            'westen': 'west',
            'mixed': 'mixed',
            'gemischt': 'mixed'
        }
        
        v_lower = v.lower().strip()
        return valid_orientations.get(v_lower, v_lower)
    
    @field_validator('noise_level')
    @classmethod
    def validate_noise_level(cls, v: Optional[str]) -> Optional[str]:
        """Validate noise level"""
        if v is None:
            return None
        
        valid_levels = {
            'quiet': 'quiet',
            'ruhig': 'quiet',
            'moderate': 'moderate',
            'mäßig': 'moderate',
            'mittel': 'moderate',
            'loud': 'loud',
            'laut': 'loud'
        }
        
        v_lower = v.lower().strip()
        return valid_levels.get(v_lower, v_lower)
    
    @field_validator('rental_agreement_type')
    @classmethod
    def validate_rental_agreement_type(cls, v: Optional[str]) -> Optional[str]:
        """Validate rental agreement type"""
        if v is None:
            return None
        
        valid_types = {
            'indefinite': 'indefinite',
            'unbefristet': 'indefinite',
            'fixed': 'fixed',
            'befristet': 'fixed',
            'index': 'index',
            'indexmiete': 'index',
            'stepped': 'stepped',
            'staffelmiete': 'stepped'
        }
        
        v_lower = v.lower().strip()
        return valid_types.get(v_lower, v_lower)
    
    def model_post_init(self, __context: Any) -> None:
        """Post-validation plausibility checks"""
        # Ensure living_area is set (fallback to size for backwards compatibility)
        if self.size is not None and self.living_area == 0:
            object.__setattr__(self, 'living_area', float(self.size))
        
        # Plausibility check: floor <= total_floors
        if self.floor is not None and self.total_floors is not None:
            if self.floor > self.total_floors:
                raise ValueError(
                    f"Etage ({self.floor}) kann nicht höher sein als Gesamtetagen ({self.total_floors})"
                )
        
        # Plausibility check: rooms vs area ratio
        if self.rooms is not None and self.living_area > 0:
            sqm_per_room = self.living_area / self.rooms
            if sqm_per_room < 10:
                # Warning: very small rooms (less than 10m² per room)
                pass  # Could log warning here
            elif sqm_per_room > 100:
                # Warning: very large rooms (more than 100m² per room)
                pass  # Could log warning here
        
        # Plausibility check: energy class vs consumption
        if self.energy_class and self.energy_consumption:
            # Energy class ranges (approximate)
            class_ranges = {
                'A+': (0, 30),
                'A': (30, 50),
                'B': (50, 75),
                'C': (75, 100),
                'D': (100, 130),
                'E': (130, 160),
                'F': (160, 200),
                'G': (200, 250),
                'H': (250, 1000)
            }
            
            if self.energy_class in class_ranges:
                min_val, max_val = class_ranges[self.energy_class]
                if not (min_val <= self.energy_consumption <= max_val):
                    # Inconsistency - could warn but don't fail
                    pass
        
        # Plausibility check: renovation year vs build year
        if self.last_renovation_year and self.build_year:
            if self.last_renovation_year < self.build_year:
                raise ValueError(
                    f"Sanierungsjahr ({self.last_renovation_year}) kann nicht vor Baujahr ({self.build_year}) liegen"
                )
        
        # Plausibility check: rent vs is_rented
        if self.is_rented and self.current_rent is None:
            # Warning: property marked as rented but no rent specified
            pass
        
        if not self.is_rented and self.current_rent is not None:
            # Auto-correct: if rent is specified, assume it's rented
            object.__setattr__(self, 'is_rented', True)


class GeoLocation(BaseModel):
    """Geographic location model"""
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude coordinate"
    )
    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude coordinate"
    )
    display_name: str = Field(
        ...,
        description="Human-readable address/location name"
    )
    walkability_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Walkability score (0-100, higher is better)"
    )
    transit_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Transit/public transport score (0-100)"
    )


class POI(BaseModel):
    """Point of Interest model"""
    type: str = Field(
        ...,
        description="POI type: school, transit, shopping, park, medical, restaurant, etc."
    )
    name: str = Field(
        ...,
        description="Name of the POI"
    )
    distance_m: int = Field(
        ...,
        ge=0,
        description="Distance from property in meters"
    )
    latitude: Optional[float] = Field(
        None,
        description="POI latitude"
    )
    longitude: Optional[float] = Field(
        None,
        description="POI longitude"
    )


class ValuationRange(BaseModel):
    """Valuation range model"""
    min: float
    max: float


class ValuationFactor(BaseModel):
    """Valuation factor model"""
    name: str
    impact: Literal['positive', 'neutral', 'negative']
    weight: int
    description: str


class ComparableListing(BaseModel):
    """Comparable listing model"""
    id: str
    address: str
    city: str
    postal_code: str
    property_type: PropertyType
    size: int
    rooms: Optional[int] = None
    build_year: int
    condition: str
    price: float
    price_per_sqm: float
    sold_date: datetime
    distance: float
    match_score: float
    
    model_config = ConfigDict(from_attributes=True)


class MarketTrendPoint(BaseModel):
    """Market trend point model"""
    date: str
    average_price: float
    average_price_per_sqm: float
    transaction_count: int
    median_price: float
    region: str


class MarketIntelligence(BaseModel):
    """Market intelligence model"""
    region: str
    postal_code: str
    demand_level: Literal['very_high', 'high', 'medium', 'low']
    supply_level: Literal['very_high', 'high', 'medium', 'low']
    price_growth_12m: float
    price_growth_36m: float
    average_days_on_market: int
    competition_index: int
    trends: List[MarketTrendPoint] = Field(default_factory=list)


class AvmResult(BaseModel):
    """AVM result model"""
    estimated_value: float
    confidence_level: Literal['high', 'medium', 'low']
    valuation_range: ValuationRange
    price_per_sqm: float
    methodology: str
    factors: List[ValuationFactor] = Field(default_factory=list)
    comparables_used: int
    last_updated: datetime


class AvmResponse(BaseModel):
    """AVM response model"""
    result: AvmResult
    comparables: List[ComparableListing] = Field(default_factory=list)
    market_intelligence: MarketIntelligence
    geo_location: Optional[GeoLocation] = Field(
        None,
        description="Geographic location data with walkability score"
    )
    nearby_pois: List[POI] = Field(
        default_factory=list,
        description="Nearby points of interest"
    )
    valuation_id: Optional[str] = Field(
        None,
        description="Unique ID for this valuation (for PDF export, sharing)"
    )


class ValidationWarning(BaseModel):
    """Validation warning model"""
    field: str = Field(..., description="Field name that triggered the warning")
    message: str = Field(..., description="Warning message")
    severity: Literal['info', 'warning', 'error'] = Field(
        default='warning',
        description="Severity level"
    )


class ValidationResult(BaseModel):
    """Input validation result"""
    is_valid: bool = Field(..., description="Whether the input is valid")
    errors: List[str] = Field(
        default_factory=list,
        description="Validation errors (blocking)"
    )
    warnings: List[ValidationWarning] = Field(
        default_factory=list,
        description="Validation warnings (non-blocking)"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Helpful suggestions to improve data quality"
    )
