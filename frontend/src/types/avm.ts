/**
 * AVM & Marktintelligenz Types
 * Typdefinitionen für Bewertung und Marktanalyse
 */

export interface ComparableListing {
  id: string;
  address: string;
  city: string;
  postal_code: string;
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  size: number; // m²
  rooms?: number;
  buildYear?: number;
  condition: 'new' | 'renovated' | 'good' | 'needs_renovation' | 'poor';
  price: number; // €
  pricePerSqm: number; // €/m²
  soldDate?: string;
  distance: number; // km zum Zielobjekt
  matchScore: number; // 0-100
}

export interface AvmResult {
  estimatedValue: number; // €
  confidenceLevel: 'high' | 'medium' | 'low';
  valuationRange: {
    min: number;
    max: number;
  };
  pricePerSqm: number; // €/m²
  methodology: string;
  factors: AvmFactor[];
  comparablesUsed: number;
  lastUpdated: string;
}

export interface AvmFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100%
  description: string;
}

export interface MarketTrendPoint {
  date: string;
  averagePrice: number; // €
  averagePricePerSqm: number; // €/m²
  transactionCount: number;
  medianPrice: number; // €
  region: string;
}

export interface MarketIntelligence {
  region: string;
  postal_code: string;
  demandLevel: 'very_high' | 'high' | 'medium' | 'low';
  supplyLevel: 'very_high' | 'high' | 'medium' | 'low';
  priceGrowth12m: number; // %
  priceGrowth36m: number; // %
  averageDaysOnMarket: number;
  competitionIndex: number; // 0-100
  trends: MarketTrendPoint[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  walkabilityScore?: number; // 0-100
  transitScore?: number; // 0-100
}

export interface POI {
  type: string; // school, transit, shopping, park, medical, etc.
  name: string;
  distanceM: number; // distance in meters
  latitude?: number;
  longitude?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface AvmRequest {
  // === LOCATION ===
  address: string;
  city: string;
  postal_code: string;
  
  // === PROPERTY TYPE ===
  property_type: 'apartment' | 'house' | 'commercial' | 'land' | 'parking';
  
  // === AREAS (differentiated) ===
  livingArea: number; // m² Wohnfläche (primary)
  usableArea?: number; // m² Nutzfläche
  plotArea?: number; // m² Grundstücksfläche (for houses)
  
  // === BASIC PROPERTY DATA ===
  rooms?: number;
  bathrooms?: number;
  separateToilet?: boolean;
  buildYear?: number;
  
  // === FLOOR & BUILDING ===
  floor?: number; // 0 = ground floor
  totalFloors?: number;
  hasElevator?: boolean;
  
  // === OUTDOOR SPACES ===
  balconyArea?: number; // m²
  terraceArea?: number; // m²
  gardenArea?: number; // m²
  parkingSpaces?: number;
  
  // === CONDITION & RENOVATION ===
  condition: 'new' | 'renovated' | 'good' | 'needs_renovation' | 'poor';
  lastRenovationYear?: number;
  
  // === ENERGY & HEATING ===
  heatingType?: 'gas' | 'oil' | 'district' | 'heat_pump' | 'electric' | 'pellets';
  energyClass?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  energyConsumption?: number; // kWh/m²a
  
  // === QUALITY & FEATURES ===
  fittedKitchen?: boolean;
  flooringType?: 'parquet' | 'tiles' | 'laminate' | 'carpet';
  barrierFree?: boolean;
  monumentProtected?: boolean;
  orientation?: 'north' | 'south' | 'east' | 'west' | 'mixed';
  noiseLevel?: 'quiet' | 'moderate' | 'loud';
  
  // === INVESTMENT DATA ===
  isRented?: boolean;
  currentRent?: number; // € per month
  rentalAgreementType?: 'indefinite' | 'fixed' | 'index' | 'stepped';
  
  // === LEGACY (for backwards compatibility) ===
  size?: number; // deprecated, use livingArea
  features?: string[];
}

export interface AvmResponseData {
  result: AvmResult;
  comparables: ComparableListing[];
  marketIntelligence: MarketIntelligence;
  geoLocation?: GeoLocation;
  nearbyPois?: POI[];
  valuationId?: string;
}
