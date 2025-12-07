/**
 * Property Types - Clean Interface basierend auf Backend Contract
 * Keine Mockdaten, keine überflüssigen Felder
 */

import { PropertyResponse, Address, ContactPerson, PropertyFeatures, PropertyImage } from '../lib/api/types';

// Re-export Backend Types
export type { PropertyResponse, Address, ContactPerson, PropertyFeatures, PropertyImage };

// Property Status Enum
export enum PropertyStatus {
  AKQUISE = 'akquise',
  VORBEREITUNG = 'vorbereitung',
  AKTIV = 'aktiv',
  RESERVIERT = 'reserviert',
  VERKAUFT = 'verkauft',
  ZURUCKGEZOGEN = 'zurückgezogen',
}

// Property Type Enum
export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  COMMERCIAL = 'commercial',
  LAND = 'land',
  OFFICE = 'office',
  RETAIL = 'retail',
  INDUSTRIAL = 'industrial',
}

// UI-only fields (nicht vom Backend)
export interface PropertyUIExtensions {
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  isFavorite?: boolean;
}

// Property mit UI-Extensions
export type Property = PropertyResponse & PropertyUIExtensions;

// Property Metrics (Performance-Daten)
export interface PropertyMetrics {
  views: number;
  inquiries: number;
  visits: number;
  favorites: number;
  daysOnMarket: number;
  averageViewDuration: number;
  conversionRate: number;
  chartData: PropertyMetricsChart[];
}

export interface PropertyMetricsChart {
  date: string;
  views: number;
  inquiries: number;
  visits: number;
  favorites: number;
}

// Property Media (erweiterte Medien-Info)
export interface PropertyMedia {
  id: string;
  property_id: string;
  type: 'image' | 'video' | 'document' | '360tour' | 'floorplan';
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number; // für Videos
  uploaded_at: string;
  uploaded_by: string;
}

// Property Analytics (detaillierte Analytics)
export interface PropertyAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  topReferrers: Array<{ source: string; count: number }>;
  deviceStats: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  geographicDistribution: Array<{
    city: string;
    count: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
}

// Property Filter Params (Frontend)
export interface PropertyFilterParams {
  search?: string;
  property_type?: PropertyType | string;
  status?: PropertyStatus | string;
  price_min?: number;
  price_max?: number;
  location?: string;
  city?: string;
  rooms_min?: number;
  rooms_max?: number;
  living_area_min?: number;
  living_area_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  features?: string[];
  tags?: string[];
  sort_by?: 'created_at' | 'updated_at' | 'price' | 'living_area' | 'rooms' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// Property List Response (mit Pagination)
export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  size: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Property Create/Update Payloads
export interface CreatePropertyPayload {
  title: string;
  description?: string;
  property_type: PropertyType;
  price?: number;
  location: string;
  living_area?: number;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  address?: Partial<Address>;
  contact_person_id?: string;
  features?: Partial<PropertyFeatures>;
  tags?: string[];
}

export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  status?: PropertyStatus;
}

// Property Card Data (für Listen-Ansicht)
export interface PropertyCardData {
  id: string;
  title: string;
  location: string;
  price?: number;
  priceFormatted: string;
  status: PropertyStatus;
  statusLabel: string;
  property_type: PropertyType;
  typeLabel: string;
  rooms?: number;
  bathrooms?: number;
  living_area?: number;
  primaryImage?: string;
  created_at: string;
  updated_at: string;
  isPriority: boolean;
  tags: string[];
}

// Helper Functions
export const formatPropertyPrice = (price?: number, currency: string = 'EUR'): string => {
  if (!price) return 'Preis auf Anfrage';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatPropertyArea = (area?: number): string => {
  if (!area) return '—';
  return `${area} m²`;
};

export const getPropertyStatusLabel = (status: PropertyStatus | string): string => {
  const labels: Record<string, string> = {
    akquise: 'Akquise',
    vorbereitung: 'Vorbereitung',
    aktiv: 'Aktiv',
    reserviert: 'Reserviert',
    verkauft: 'Verkauft',
    zurückgezogen: 'Zurückgezogen',
  };
  return labels[status] || status;
};

export const getPropertyTypeLabel = (type: PropertyType | string): string => {
  const labels: Record<string, string> = {
    apartment: 'Wohnung',
    house: 'Haus',
    commercial: 'Gewerbe',
    land: 'Grundstück',
    office: 'Büro',
    retail: 'Einzelhandel',
    industrial: 'Industrie',
  };
  return labels[type] || type;
};

export const getPropertyStatusColor = (status: PropertyStatus | string): string => {
  const colors: Record<string, string> = {
    akquise: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    vorbereitung: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    aktiv: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    reserviert: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    verkauft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    zurückgezogen: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
};

export const calculateDaysOnMarket = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Property to CardData converter
export const propertyToCardData = (property: Property): PropertyCardData => {
  return {
    id: property.id,
    title: property.title,
    location: property.location,
    price: property.price,
    priceFormatted: formatPropertyPrice(property.price),
    status: property.status as PropertyStatus,
    statusLabel: getPropertyStatusLabel(property.status),
    property_type: property.property_type as PropertyType,
    typeLabel: getPropertyTypeLabel(property.property_type),
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    living_area: property.living_area,
    primaryImage: property.images?.find(img => img.is_primary)?.url || property.images?.[0]?.url,
    created_at: property.created_at,
    updated_at: property.updated_at,
    isPriority: property.priority === 'high',
    tags: property.tags || [],
  };
};
