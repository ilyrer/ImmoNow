/**
 * Location Types - For dynamic city/location data
 */

export interface LocationMarketData {
    id: number;
    city: string;
    state: string | null;
    country: string;
    postal_code_start: string | null;
    postal_code_end: string | null;
    base_price_per_sqm: number;
    adjusted_price_per_sqm: number;
    is_premium_location: boolean;
    is_suburban: boolean;
    population: number | null;
    location_type: 'metropolis' | 'city' | 'town' | 'village';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LocationSearchResult {
    id: number;
    city: string;
    state: string | null;
    postal_code_start: string | null;
    population: number | null;
    base_price_per_sqm: number;
}

export interface LocationCreate {
    city: string;
    state?: string;
    country?: string;
    postal_code_start?: string;
    postal_code_end?: string;
    base_price_per_sqm: number;
    is_premium_location?: boolean;
    is_suburban?: boolean;
    population?: number;
    location_type?: 'metropolis' | 'city' | 'town' | 'village';
    is_active?: boolean;
}

export interface LocationUpdate {
    city?: string;
    state?: string;
    country?: string;
    postal_code_start?: string;
    postal_code_end?: string;
    base_price_per_sqm?: number;
    is_premium_location?: boolean;
    is_suburban?: boolean;
    population?: number;
    location_type?: 'metropolis' | 'city' | 'town' | 'village';
    is_active?: boolean;
}

export interface LocationListResponse {
    items: LocationMarketData[];
    total: number;
    page: number;
    page_size: number;
}
