/**
 * Tenant Management Service
 * API calls for tenant/organization management
 */

import { apiClient } from '../api/config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TenantUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  registration_number?: string;
  website?: string;
  
  // Address fields
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  
  // Branding fields
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  // Default settings
  currency?: string;
  timezone?: string;
  language?: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  tax_id: string | null;
  registration_number: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Nested objects
  branding?: {
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
  };
  
  address?: {
    street: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  };
  
  defaults?: {
    currency: string;
    timezone: string;
    language: string;
  };
  
  subscription?: {
    plan: string;
    billing_cycle: string;
    status: string;
    start_date: string;
    end_date: string | null;
    limits?: {
      max_users: number | null;
      max_properties: number | null;
      storage_limit_gb: number | null;
    };
  };
}

export interface BrandingInfo {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  name: string;
}

export interface UsageLimits {
  users: {
    current: number;
    limit: number;
    available: number;
    percentage: number;
  };
  properties: {
    current: number;
    limit: number;
    available: number;
    percentage: number;
  };
  storage: {
    current_gb: number;
    limit_gb: number;
    available_gb: number;
    percentage: number;
  };
  plan: string;
  subscription_active: boolean;
}

export interface LogoUploadResponse {
  success: boolean;
  logo_url: string;
  message: string;
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

class TenantService {
  /**
   * Get current tenant information
   */
  async getTenant(): Promise<TenantDetail> {
    const response = await apiClient.get<TenantDetail>('/api/v1/tenant');
    return response;
  }

  /**
   * Update tenant information
   */
  async updateTenant(data: TenantUpdateRequest): Promise<TenantDetail> {
    const response = await apiClient.put<TenantDetail>('/api/v1/tenant', data);
    return response;
  }

  /**
   * Upload company logo
   */
  async uploadLogo(file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<LogoUploadResponse>('/api/v1/tenant/logo', formData);
    return response;
  }

  /**
   * Get tenant branding information (logo, colors, name)
   */
  async getBranding(): Promise<BrandingInfo> {
    const response = await apiClient.get<BrandingInfo>('/api/v1/tenant/branding');
    return response;
  }

  /**
   * Get subscription limits and current usage
   */
  async getUsageLimits(): Promise<UsageLimits> {
    const response = await apiClient.get<UsageLimits>('/api/v1/tenant/limits');
    return response;
  }

  /**
   * Helper: Update only logo URL
   */
  async updateLogoUrl(logoUrl: string): Promise<TenantDetail> {
    return this.updateTenant({ logo_url: logoUrl });
  }

  /**
   * Helper: Update branding colors
   */
  async updateBrandingColors(
    primaryColor: string,
    secondaryColor: string
  ): Promise<TenantDetail> {
    return this.updateTenant({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
  }

  /**
   * Helper: Update contact information
   */
  async updateContactInfo(
    email: string,
    phone: string,
    website?: string
  ): Promise<TenantDetail> {
    return this.updateTenant({ email, phone, website });
  }

  /**
   * Helper: Update address
   */
  async updateAddress(
    street: string,
    city: string,
    postalCode: string,
    country: string
  ): Promise<TenantDetail> {
    return this.updateTenant({
      street,
      city,
      postal_code: postalCode,
      country,
    });
  }
}

// Export singleton instance
const tenantService = new TenantService();
export default tenantService;

