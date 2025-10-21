import { apiClient } from '../lib/api/client';

export type MarketTrendsResponse = {
  city: string;
  postal_code: string;
  trends: Array<{
    date: string;
    average_price: number;
    average_price_per_sqm: number;
    transaction_count: number;
    median_price: number;
    region: string;
  }>;
};

export type PoiSummaryResponse = {
  radius: number;
  schools: number;
  stops: number;
  parks: number;
  schools_density: number;
  stops_density: number;
  parks_density: number;
  composite_score: number;
};

class MarketService {
  async getTrends(city: string, postalCode: string): Promise<MarketTrendsResponse> {
    return apiClient.get(`/api/v1/market/trends?city=${encodeURIComponent(city)}&postal_code=${encodeURIComponent(postalCode)}`);
  }

  async getPoi(lat: number, lng: number, radius: number = 1200): Promise<PoiSummaryResponse> {
    return apiClient.get(`/api/v1/market/poi?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getHpi(region?: string): Promise<{ country: string; index: number }> {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return apiClient.get(`/api/v1/market/hpi${query}`);
  }
}

export const marketService = new MarketService();


