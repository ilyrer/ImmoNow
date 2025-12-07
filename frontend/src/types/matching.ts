/**
 * Matching & Recommendations Types
 * Typdefinitionen für KI-basiertes Matching von Kunden und Immobilien
 */

export interface Preference {
  id: string;
  category: 'location' | 'price' | 'size' | 'features' | 'condition';
  label: string;
  value: any;
  weight: number; // 0-100 (Wichtigkeit)
  isMustHave: boolean;
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'lead' | 'active' | 'viewing' | 'offer' | 'archived';
  budget: {
    min: number;
    max: number;
  };
  preferences: Preference[];
  matchScore?: number; // Wird beim Matching berechnet
  tags: string[];
  created_at: string;
  last_contact: string;
  notes?: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  address: string;
  city: string;
  postalCode: string;
  price: number;
  size: number; // m²
  rooms?: number;
  features: string[];
  condition: 'new' | 'renovated' | 'good' | 'needs_renovation' | 'poor';
  images?: string[];
  status: 'available' | 'reserved' | 'sold';
}

export interface MatchRecommendation {
  id: string;
  customer?: CustomerProfile; // Bei Property → Customer Matching
  property?: PropertyListing; // Bei Customer → Property Matching
  matchScore: number; // 0-100
  matchReason: string;
  matchDetails: MatchDetail[];
  confidence: 'high' | 'medium' | 'low';
  rank: number; // 1, 2, 3, ...
  created_at: string;
}

export interface MatchDetail {
  criterion: string;
  score: number; // 0-100
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: 'match' | 'partial' | 'mismatch';
  description: string;
}

export interface MatchingFilters {
  minScore?: number;
  maxResults?: number;
  includePartialMatches?: boolean;
  focusAreas?: string[]; // ['location', 'price', 'size', ...]
}
