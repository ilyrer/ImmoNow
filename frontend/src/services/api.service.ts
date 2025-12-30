/**
 * Legacy API Service - Deprecated
 * This service is kept for backward compatibility but should not be used in new code.
 * Use the new hooks in src/api/hooks.ts instead.
 */

import { apiClient } from '../lib/api/client';

// Legacy API service for backward compatibility
const apiService = {
  // Auth methods
  login: async (credentials: { email: string; password: string; tenant_id?: string }) => {
    try {
      const response = await apiClient.post('/api/v1/auth/login', credentials);

      // Store tokens and tenant info with CONSISTENT KEYS
      if ((response as any).access_token) {
        // Use the NEW keys that AuthContext expects
        localStorage.setItem('auth_token', (response as any).access_token);
        localStorage.setItem('tenant_id', (response as any).tenant.id);

        // Also keep old keys for backward compatibility
        localStorage.setItem('authToken', (response as any).access_token);
        localStorage.setItem('refreshToken', (response as any).refresh_token);
        localStorage.setItem('tenantId', (response as any).tenant.id);
        localStorage.setItem('tenantSlug', (response as any).tenant.slug);

        // ✅ SET AUTH TOKEN IN API CLIENT
        apiClient.setAuthToken((response as any).access_token, (response as any).tenant.id);
        console.log('✅ Auth token set in API client after login');
        console.log('✅ Token:', (response as any).access_token.substring(0, 20) + '...');
        console.log('✅ Tenant ID:', (response as any).tenant.id);
      }

      return {
        token: (response as any).access_token,
        user: {
          id: (response as any).user.id,
          email: (response as any).user.email,
          name: `${(response as any).user.first_name} ${(response as any).user.last_name}`,
          first_name: (response as any).user.first_name,
          last_name: (response as any).user.last_name,
          role: (response as any).tenant_role.role,
          tenant_id: (response as any).tenant.id,
          tenant_name: (response as any).tenant.name,
          permissions: {
            can_manage_properties: (response as any).tenant_role.can_manage_properties,
            can_manage_documents: (response as any).tenant_role.can_manage_documents,
            can_manage_users: (response as any).tenant_role.can_manage_users,
            can_view_analytics: (response as any).tenant_role.can_view_analytics,
            can_export_data: (response as any).tenant_role.can_export_data,
          },
          available_tenants: (response as any).available_tenants || [],
        }
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (payload: any) => {
    try {
      const response = await apiClient.post('/api/v1/auth/register', payload);

      // Store tokens and tenant info with CONSISTENT KEYS
      if ((response as any).access_token) {
        // Use the NEW keys that AuthContext expects
        localStorage.setItem('auth_token', (response as any).access_token);
        localStorage.setItem('tenant_id', (response as any).tenant.id);

        // Also keep old keys for backward compatibility
        localStorage.setItem('authToken', (response as any).access_token);
        localStorage.setItem('refreshToken', (response as any).refresh_token);
        localStorage.setItem('tenantId', (response as any).tenant.id);
        localStorage.setItem('tenantSlug', (response as any).tenant.slug);

        // ✅ SET AUTH TOKEN IN API CLIENT
        apiClient.setAuthToken((response as any).access_token, (response as any).tenant.id);
        console.log('✅ Auth token set in API client after register');
        console.log('✅ Token:', (response as any).access_token.substring(0, 20) + '...');
        console.log('✅ Tenant ID:', (response as any).tenant.id);
      }

      return {
        token: (response as any).access_token,
        user: (response as any).user,
        tenant: (response as any).tenant
      };
    } catch (error: any) {
      console.error('❌ Register error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');

      // Clear all tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantSlug');

      // Clear API client
      apiClient.clearAuth();
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Clear tokens anyway
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantSlug');
      apiClient.clearAuth();
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken
      });

      if ((response as any).access_token) {
        localStorage.setItem('auth_token', (response as any).access_token);
        localStorage.setItem('authToken', (response as any).access_token);
        localStorage.setItem('refresh_token', (response as any).refresh_token);
        localStorage.setItem('refreshToken', (response as any).refresh_token);

        if ((response as any).tenant) {
          localStorage.setItem('tenant_id', (response as any).tenant.id);
          localStorage.setItem('tenantId', (response as any).tenant.id);
          localStorage.setItem('tenantSlug', (response as any).tenant.slug);
        }

        // Set in API client
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          apiClient.setAuthToken((response as any).access_token, tenantId);
        } else {
          apiClient.setAuthToken((response as any).access_token);
        }
      }

      return {
        token: (response as any).access_token,
        user: (response as any).user,
        tenant: (response as any).tenant
      };
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/v1/auth/me');
      const tenantRole = await apiClient.get('/api/v1/auth/me/tenant');

      return {
        id: (response as any).id,
        email: (response as any).email,
        name: `${(response as any).first_name} ${(response as any).last_name}`,
        first_name: (response as any).first_name,
        last_name: (response as any).last_name,
        role: (tenantRole as any).role,
        tenant_id: (tenantRole as any).tenant_id,
        tenant_name: (tenantRole as any).tenant_name,
        permissions: {
          can_manage_properties: (tenantRole as any).can_manage_properties,
          can_manage_documents: (tenantRole as any).can_manage_documents,
          can_manage_users: (tenantRole as any).can_manage_users,
          can_view_analytics: (tenantRole as any).can_view_analytics,
          can_export_data: (tenantRole as any).can_export_data,
        }
      };
    } catch (error: any) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  },

  // Property methods
  getProperties: async (params?: any) => {
    console.warn("Legacy apiService.getProperties called. Please use useProperties hook.");
    return Promise.resolve([]);
  },

  createProperty: async (property: any) => {
    console.warn("Legacy apiService.createProperty called. Please use useCreateProperty hook.");
    return Promise.resolve(null);
  },

  updateProperty: async (id: string, property: any) => {
    console.warn("Legacy apiService.updateProperty called. Please use useUpdateProperty hook.");
    return Promise.resolve(null);
  },

  deleteProperty: async (id: string) => {
    console.warn("Legacy apiService.deleteProperty called. Please use useDeleteProperty hook.");
    return Promise.resolve();
  },

  uploadPropertyImages: async (propertyId: string, images: File[], options?: { onProgress?: (progress: number) => void }) => {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const formData = new FormData();
      formData.append('files', images[i]);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/properties/${propertyId}/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload image: ${response.statusText}`);
        }

        const result = await response.json();
        uploadedImages.push(...result);

        // Update progress
        if (options?.onProgress) {
          const progress = Math.round(((i + 1) / images.length) * 100);
          options.onProgress(progress);
        }
      } catch (error) {
        console.error(`Error uploading image ${images[i].name}:`, error);
      }
    }

    return uploadedImages;
  },

  setPropertyMainImage: async (imageId: string) => {
    // Extract property ID from context or pass it explicitly
    // For now, we'll need to modify PropertyCreateWizard to pass property_id
    console.warn("setPropertyMainImage needs property_id. Call setPrimaryImage(property_id, image_id) instead.");
    return Promise.resolve();
  },

  uploadPropertyDocuments: async (propertyId: string, documents: File[], options?: { onProgress?: (progress: number) => void }) => {
    const uploadedDocs = [];

    for (let i = 0; i < documents.length; i++) {
      const formData = new FormData();
      formData.append('files', documents[i]);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/properties/${propertyId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload document: ${response.statusText}`);
        }

        const result = await response.json();
        uploadedDocs.push(...result);

        // Update progress
        if (options?.onProgress) {
          const progress = Math.round(((i + 1) / documents.length) * 100);
          options.onProgress(progress);
        }
      } catch (error) {
        console.error(`Error uploading document ${documents[i].name}:`, error);
      }
    }

    return uploadedDocs;
  },

  // Helper method for setting primary image with property_id
  setPrimaryImage: async (propertyId: string, imageId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/properties/${propertyId}/media/${imageId}/primary`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to set primary image: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      throw error;
    }
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
    try {
      const response = await apiClient.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user info:', error);
      // Fallback to mock data if API fails
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

  // Contact-related methods
  listContactDocuments: async (contactId: string) => {
    try {
      // TODO: Implement real endpoint when available
      // For now return empty array
      return [];
    } catch (error) {
      console.error('Error loading contact documents:', error);
      return [];
    }
  },

  listContactActivities: async (contactId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/contacts/${contactId}/activities`);
      return (response as any) || [];
    } catch (error) {
      console.error('Error loading contact activities:', error);
      return [];
    }
  },

  // Generic HTTP methods
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
    console.log('🔍 Current tokens:');
    console.log('auth_token:', localStorage.getItem('auth_token'));
    console.log('tenant_id:', localStorage.getItem('tenant_id'));
    console.log('authToken:', localStorage.getItem('authToken'));
    console.log('refreshToken:', localStorage.getItem('refreshToken'));
    console.log('tenantId:', localStorage.getItem('tenantId'));
    console.log('tenantSlug:', localStorage.getItem('tenantSlug'));
  }
};

export default apiService;