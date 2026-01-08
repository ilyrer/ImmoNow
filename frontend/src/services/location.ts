/**
 * Location Service - API client for dynamic location management
 */

import { apiClient } from '../api/config';
import {
    LocationMarketData,
    LocationSearchResult,
    LocationCreate,
    LocationUpdate,
    LocationListResponse
} from '../types/location';

class LocationService {
    /**
     * Search locations by city name (autocomplete)
     */
    async searchLocations(query: string, limit: number = 20): Promise<LocationSearchResult[]> {
        const params = new URLSearchParams({
            query,
            limit: limit.toString()
        });
        return await apiClient.get<LocationSearchResult[]>(`/api/v1/locations/search?${params}`);
    }

    /**
     * Get location by postal code
     */
    async getLocationByPostalCode(postalCode: string): Promise<LocationMarketData | null> {
        return await apiClient.get<LocationMarketData | null>(`/api/v1/locations/by-postal-code/${postalCode}`);
    }

    /**
     * List all locations with pagination
     */
    async listLocations(
        page: number = 1,
        pageSize: number = 50,
        search?: string,
        isActive?: boolean
    ): Promise<LocationListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        if (search) params.append('search', search);
        if (isActive !== undefined) params.append('is_active', isActive.toString());

        return await apiClient.get<LocationListResponse>(`/api/v1/locations/?${params}`);
    }

    /**
     * Get location by ID
     */
    async getLocation(locationId: number): Promise<LocationMarketData> {
        return await apiClient.get<LocationMarketData>(`/api/v1/locations/${locationId}`);
    }

    /**
     * Create new location (admin only)
     */
    async createLocation(data: LocationCreate): Promise<LocationMarketData> {
        return await apiClient.post<LocationMarketData>('/api/v1/locations/', data);
    }

    /**
     * Update location (admin only)
     */
    async updateLocation(locationId: number, data: LocationUpdate): Promise<LocationMarketData> {
        return await apiClient.put<LocationMarketData>(`/api/v1/locations/${locationId}`, data);
    }

    /**
     * Delete location (admin only)
     */
    async deleteLocation(locationId: number, hardDelete: boolean = false): Promise<void> {
        const params = hardDelete ? '?hard_delete=true' : '';
        return await apiClient.delete(`/api/v1/locations/${locationId}${params}`);
    }
}

export const locationService = new LocationService();
export default locationService;
