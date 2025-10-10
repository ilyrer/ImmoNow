/**
 * AVM & Marktintelligenz Types
 * Typdefinitionen für Bewertung und Marktanalyse
 */

export interface ComparableListing {
  id: string;
  address: string;
  city: string;
  postalCode: string;
  propertyType: 'apartment' | 'house' | 'commercial' | 'land';
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
  postalCode: string;
  demandLevel: 'very_high' | 'high' | 'medium' | 'low';
  supplyLevel: 'very_high' | 'high' | 'medium' | 'low';
  priceGrowth12m: number; // %
  priceGrowth36m: number; // %
  averageDaysOnMarket: number;
  competitionIndex: number; // 0-100
  trends: MarketTrendPoint[];
}

export interface AvmRequest {
  address: string;
  city: string;
  postalCode: string;
  propertyType: 'apartment' | 'house' | 'commercial' | 'land';
  size: number; // m²
  rooms?: number;
  buildYear?: number;
  condition: 'new' | 'renovated' | 'good' | 'needs_renovation' | 'poor';
  features?: string[]; // ['balkon', 'garage', 'garten', etc.]
  floor?: number;
  hasElevator?: boolean;
}
