/**
 * Legacy CIM API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { API_BASE_URL } from '../../config';

// Legacy types for backward compatibility
export interface RecentPropertySummary {
  id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  created_at: string;
  address?: string;
  area?: number;
  rooms?: number;
  property_type?: string;
  lead_quality?: 'high' | 'medium' | 'low';
  contact_count?: number;
  view_count?: number;
}

export interface RecentContactSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  quality: string;
  created_at: string;
  budget_formatted?: string;
  status?: string;
  lead_score?: number;
  property_preferences?: string;
  matching_count?: number;
}

export interface CIMSummary {
  total_properties: number;
  active_properties: number;
  new_properties_last_30_days: number;
  total_contacts: number;
  new_leads_last_30_days: number;
  high_priority_contacts: number;
  matched_contacts_properties: number;
}

export interface PerfectMatch {
  id: string;
  property_id: string;
  contact_id: string;
  match_score: number;
  created_at: string;
  contact_name?: string;
  contact_budget?: string;
  property_title?: string;
  property_price?: number;
  lead_quality?: 'high' | 'medium' | 'low';
  contact_email?: string;
  contact_phone?: string;
  contact_lead_score?: number;
}

export interface CIMFilters {
  limit?: number;
  days_back?: number;
}

export const cimApiService = {
  getOverview: async (params?: any) => {
    console.log("Legacy cimApiService.getOverview called with:", params);
    return {
      recent_properties: [],
      recent_contacts: [],
      perfect_matches: [],
      summary: {
        total_properties: 0,
        active_properties: 0,
        new_properties_last_30_days: 0,
        total_contacts: 0,
        new_leads_last_30_days: 0,
        high_priority_contacts: 0,
        matched_contacts_properties: 0,
      },
      generated_at: new Date().toISOString(),
    };
  },
};

// Mock CIM API for backward compatibility
export const cimApi = {
  getOverview: async (params: any) => {
    console.warn('Legacy CIM API call - please update to new services');
    return { data: null };
  },
  getProperties: async (params: any) => {
    console.warn('Legacy CIM API call - please update to new services');
    return { data: [] };
  },
  getContacts: async (params: any) => {
    console.warn('Legacy CIM API call - please update to new services');
    return { data: [] };
  },
  getMatches: async (params: any) => {
    console.warn('Legacy CIM API call - please update to new services');
    return { data: [] };
  },
};

export default cimApi;
