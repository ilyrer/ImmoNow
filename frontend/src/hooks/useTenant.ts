/**
 * Hook to get current tenant information
 */
import { useState, useEffect } from 'react';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  logo_url?: string;
}

export const useTenant = () => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get tenant from localStorage (set during login)
    const tenantData = localStorage.getItem('tenant_info');
    
    if (tenantData) {
      try {
        const parsed = JSON.parse(tenantData);
        setTenant(parsed);
      } catch (error) {
        console.error('Failed to parse tenant data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  return { tenant, loading };
};
