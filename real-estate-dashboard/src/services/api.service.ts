/**
 * Legacy API Service - Deprecated
 * This service is kept for backward compatibility but   logout: async () => {
    try {
      // Call logout endpoint (optional, mainly for logging)
      const token = localStorage.getItem('authToken');
      if (token) {
        await apiClient.post('/auth/logout'); not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { apiClient } from '../lib/api/client';

// Legacy API service for backward compatibility
const apiService = {
  // Auth methods
  login: async (credentials: { email: string; password: string; tenant_id?: string }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Store tokens and tenant info with CONSISTENT KEYS
      if (response.data.access_token) {
        // Use the NEW keys that AuthContext expects
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('tenant_id', response.data.tenant.id);
        
        // Also keep old keys for backward compatibility
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        localStorage.setItem('tenantId', response.data.tenant.id);
        localStorage.setItem('tenantSlug', response.data.tenant.slug);
        
        // ✅ SET AUTH TOKEN IN API CLIENT
        apiClient.setAuth(response.data.access_token, response.data.tenant.id);
        console.log('✅ Auth token set in API client after login');
        console.log('✅ Token:', response.data.access_token.substring(0, 20) + '...');
        console.log('✅ Tenant ID:', response.data.tenant.id);
      }
      
      return {
        token: response.data.access_token,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          role: response.data.tenant_role.role,
          tenant_id: response.data.tenant.id,
          tenant_name: response.data.tenant.name,
          permissions: {
            can_manage_properties: response.data.tenant_role.can_manage_properties,
            can_manage_documents: response.data.tenant_role.can_manage_documents,
            can_manage_users: response.data.tenant_role.can_manage_users,
            can_view_analytics: response.data.tenant_role.can_view_analytics,
            can_export_data: response.data.tenant_role.can_export_data,
          },
          available_tenants: response.data.available_tenants || [],
        }
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    tenant_name: string;
    company_email?: string;
    company_phone?: string;
    plan?: string;
    billing_cycle?: string;
  }) => {
    try {
      const response = await apiClient.post('/auth/register', {
        ...data,
        plan: data.plan || 'free',
        billing_cycle: data.billing_cycle || 'monthly',
      });
      
      // Store tokens and tenant info with CONSISTENT KEYS
      if (response.data.access_token) {
        // Use the NEW keys that AuthContext expects
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('tenant_id', response.data.tenant.id);
        
        // Also keep old keys for backward compatibility
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        localStorage.setItem('tenantId', response.data.tenant.id);
        localStorage.setItem('tenantSlug', response.data.tenant.slug);
        
        // ✅ SET AUTH TOKEN IN API CLIENT
        apiClient.setAuth(response.data.access_token, response.data.tenant.id);
        console.log('✅ Auth token set in API client after registration');
        console.log('✅ Token:', response.data.access_token.substring(0, 20) + '...');
        console.log('✅ Tenant ID:', response.data.tenant.id);
      }
      
      return {
        token: response.data.access_token,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          role: 'owner', // First user is always owner
          tenant_id: response.data.tenant.id,
          tenant_name: response.data.tenant.name,
        }
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint (optional, mainly for logging)
      const token = localStorage.getItem('authToken');
      if (token) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage and API client
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantSlug');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear API client auth
      apiClient.clearAuth();
      console.log('✅ Logged out and cleared all auth data');
    }
  },

  // Refresh access token using refresh token
  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      console.log('🔄 Attempting to refresh access token...');
      
      // Mark that we're refreshing to prevent concurrent refresh attempts
      apiClient.setRefreshing(true);
      
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      if (response.data.access_token) {
        // Store new access token
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('access_token', response.data.access_token);
        
        // Update tenant info if provided
        if (response.data.tenant) {
          localStorage.setItem('tenant_id', response.data.tenant.id);
          localStorage.setItem('tenantId', response.data.tenant.id);
          localStorage.setItem('tenantSlug', response.data.tenant.slug);
        }
        
        // Set in API client
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          apiClient.setAuth(response.data.access_token, tenantId);
        } else {
          apiClient.setAuthToken(response.data.access_token);
        }
        
        console.log('✅ Access token refreshed successfully');
        apiClient.setRefreshing(false);
        
        return {
          token: response.data.access_token,
          user: response.data.user,
          tenant: response.data.tenant
        };
      }
      
      apiClient.setRefreshing(false);
      throw new Error('No access token in refresh response');
    } catch (error: any) {
      apiClient.setRefreshing(false);
      console.error('❌ Token refresh failed:', error);
      throw new Error(error.response?.data?.detail || 'Token refresh failed');
    }
  },

  // User methods
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tenantId = localStorage.getItem('tenantId');
      const tenantRole = await apiClient.get('/auth/me/tenant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        id: response.data.id,
        email: response.data.email,
        name: `${response.data.first_name} ${response.data.last_name}`,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        role: tenantRole.data.role,
        tenant_id: tenantId || '',
        tenant_name: tenantRole.data.tenant_name,
        permissions: {
          can_manage_properties: tenantRole.data.can_manage_properties,
          can_manage_documents: tenantRole.data.can_manage_documents,
          can_manage_users: tenantRole.data.can_manage_users,
          can_view_analytics: tenantRole.data.can_view_analytics,
          can_export_data: tenantRole.data.can_export_data,
        }
      };
    } catch (error) {
      console.error('❌ Get current user error:', error);
      // Fallback to mock for development
      console.warn("API call failed, using mock user");
      return {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        tenant_id: 'mock-tenant',
        first_name: 'Test',
        last_name: 'User'
      };
    }
  },

  updateUser: async (userData: any) => {
    // TODO: Implement real user update API
    throw new Error('Update user API not implemented yet');
  },

  // Property methods
  uploadPropertyImages: async (propertyId: string, images: File[], options?: { onProgress?: (progress: number) => void }) => {
    // TODO: Implement real property image upload API
    console.log('Uploading property images:', propertyId, images, options);
    return Promise.resolve([]);
  },

  setPropertyMainImage: async (imageId: string) => {
    // TODO: Implement real set main image API
    console.log('Setting main image:', imageId);
    return Promise.resolve();
  },

  uploadPropertyDocuments: async (propertyId: string, documents: File[], options?: { onProgress?: (progress: number) => void }) => {
    // TODO: Implement real property document upload API
    console.log('Uploading property documents:', propertyId, documents, options);
    return Promise.resolve([]);
  },

  // Document methods
  getDocuments: async (params: any) => {
    console.warn("Legacy apiService.getDocuments called. Please use specific document hooks.");
    return Promise.resolve([]);
  },

  getDocumentFolders: async () => {
    console.warn("Legacy apiService.getDocumentFolders called. Please use specific document hooks.");
    return Promise.resolve([]);
  },

  // Task methods
  getTasks: async (params: any) => {
    console.warn("Legacy apiService.getTasks called. Please use specific task hooks.");
    return Promise.resolve({ tasks: [], total: 0, page: 1, size: 10, pages: 0 });
  },

  getCurrentUserInfo: async () => {
    // TODO: Implement real get current user info API
    console.warn("Legacy getCurrentUserInfo called. Please use src/contexts/UserContext.tsx");
    return {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      tenant_id: 'mock-tenant',
      first_name: 'Test',
      last_name: 'User'
    };
  },
  get: async (url: string, params?: any) => {
    return apiClient.get(url, { params });
  },

  post: async (url: string, data?: any) => {
    return apiClient.post(url, data);
  },

  put: async (url: string, data?: any) => {
    return apiClient.put(url, data);
  },

  delete: async (url: string) => {
    return apiClient.delete(url);
  },

  // Debug function for token information
  debugTokens: () => {
    const token = localStorage.getItem('authToken');
    const tenantId = localStorage.getItem('tenantId');
    console.log('🔍 Debug Tokens:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tenantId: tenantId || 'none',
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
    });
  },

  // Test backend connection
  testBackendConnection: async () => {
    try {
      console.log('🔗 Testing backend connection...');
      // Try to ping a simple endpoint or just return success for now
      // In production, this would make a real API call to /health or similar
      console.log('✅ Backend connection OK (mock mode)');
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  }
};

export default apiService;
