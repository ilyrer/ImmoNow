/**
 * Enhanced API Client with Schema Compatibility
 * Handles payload transformation and error handling
 */

import api from '../api/base';
import { 
  transformPayloadForBackend, 
  transformResponseFromBackend, 
  createFormData, 
  createMultiFileFormData,
  createValidatedPayload 
} from '../utils/apiTransform';

// API Response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error response interface
interface ApiError {
  detail: string | Array<{ 
    field?: string; 
    message?: string; 
    loc?: string[]; 
    msg?: string; 
    type?: string; 
    input?: any; 
    ctx?: any; 
    url?: string; 
  }>;
  code?: string;
  timestamp?: string;
}

/**
 * Enhanced API Client with automatic payload transformation
 */
class EnhancedApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method with payload transformation
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    options?: {
      transformPayload?: boolean;
      transformResponse?: boolean;
      requiredFields?: string[];
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    try {
      const config: any = {
        method,
        url: `${this.baseURL}${url}`,
        ...options
      };

      // Transform payload for backend
      if (data && options?.transformPayload !== false) {
        if (options.requiredFields) {
          const validation = createValidatedPayload(
            data, 
            options.requiredFields, 
            options.schema || 'default'
          );
          
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
          
          config.data = validation.payload;
        } else {
          config.data = transformPayloadForBackend(data, options.schema || 'default');
        }
      } else if (data) {
        config.data = data;
      }

      const response = await api(config);
      
      // Transform response from backend
      const transformedData = options?.transformResponse !== false 
        ? transformResponseFromBackend(response.data)
        : response.data;

      return {
        data: transformedData,
        status: response.status
      };
    } catch (error: any) {
      console.error(`API ${method} ${url} failed:`, error);
      
      if (error.response?.data) {
        const apiError: ApiError = error.response.data;
        throw new Error(
          typeof apiError.detail === 'string' 
            ? apiError.detail 
            : apiError.detail.map(d => `${d.loc?.join('.') || 'unknown'}: ${d.msg || d.message || 'validation error'}`).join(', ')
        );
      }
      
      throw error;
    }
  }

  // GET request
  async get<T>(url: string, options?: { transformResponse?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  // POST request
  async post<T>(
    url: string, 
    data: any, 
    options?: {
      transformPayload?: boolean;
      transformResponse?: boolean;
      requiredFields?: string[];
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  // PUT request
  async put<T>(
    url: string, 
    data: any, 
    options?: {
      transformPayload?: boolean;
      transformResponse?: boolean;
      requiredFields?: string[];
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  // PATCH request
  async patch<T>(
    url: string, 
    data: any, 
    options?: {
      transformPayload?: boolean;
      transformResponse?: boolean;
      requiredFields?: string[];
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, options);
  }

  // DELETE request
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url);
  }

  // File upload methods
  async uploadFile<T>(
    url: string,
    file: File,
    metadata?: any,
    options?: {
      onProgress?: (progress: number) => void;
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    try {
      const formData = createFormData(file, metadata);
      
      const config: any = {
        method: 'POST',
        url: `${this.baseURL}${url}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: options?.onProgress ? (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress!(progress);
        } : undefined
      };

      const response = await api(config);
      
      return {
        data: transformResponseFromBackend(response.data),
        status: response.status
      };
    } catch (error: any) {
      console.error(`File upload to ${url} failed:`, error);
      throw error;
    }
  }

  async uploadMultipleFiles<T>(
    url: string,
    files: File[],
    metadata?: any,
    options?: {
      onProgress?: (progress: number) => void;
      schema?: string;
    }
  ): Promise<ApiResponse<T>> {
    try {
      const formData = createMultiFileFormData(files, metadata);
      
      const config: any = {
        method: 'POST',
        url: `${this.baseURL}${url}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: options?.onProgress ? (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress!(progress);
        } : undefined
      };

      const response = await api(config);
      
      return {
        data: transformResponseFromBackend(response.data),
        status: response.status
      };
    } catch (error: any) {
      console.error(`Multiple file upload to ${url} failed:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const enhancedApiClient = new EnhancedApiClient();

// Specific API methods for different endpoints
export const apiClient = {
  // Properties
  async createProperty(data: any) {
    return enhancedApiClient.post('/properties', data, {
      requiredFields: ['title', 'property_type', 'location'],
      schema: 'property'
    });
  },

  async updateProperty(id: string, data: any) {
    return enhancedApiClient.put(`/properties/${id}`, data, {
      schema: 'property'
    });
  },

  async uploadPropertyImages(propertyId: string, files: File[], options?: { onProgress?: (progress: number) => void }) {
    return enhancedApiClient.uploadMultipleFiles(
      `/properties/${propertyId}/media`,
      files,
      undefined,
      options
    );
  },

  async uploadPropertyDocuments(propertyId: string, files: File[], options?: { onProgress?: (progress: number) => void }) {
    return enhancedApiClient.uploadMultipleFiles(
      `/properties/${propertyId}/documents`,
      files,
      undefined,
      options
    );
  },

  async setPrimaryImage(propertyId: string, imageId: string) {
    return enhancedApiClient.patch(`/properties/${propertyId}/media/${imageId}/primary`, {});
  },


  // Authentication
  async register(data: any) {
    return enhancedApiClient.post('/auth/register', data, {
      requiredFields: ['email', 'password', 'first_name', 'last_name', 'tenant_name'],
      schema: 'auth'
    });
  },

  async login(data: any) {
    return enhancedApiClient.post('/auth/login', data, {
      requiredFields: ['email', 'password'],
      schema: 'auth'
    });
  },

  async refreshToken(data: any) {
    return enhancedApiClient.post('/auth/refresh', data, {
      requiredFields: ['refresh_token'],
      schema: 'auth'
    });
  },

  // Tasks
  async createTask(data: any) {
    return enhancedApiClient.post('/tasks', data, {
      requiredFields: ['title', 'priority', 'status', 'due_date'],
      schema: 'task'
    });
  },

  async updateTask(id: string, data: any) {
    return enhancedApiClient.put(`/tasks/${id}`, data, {
      schema: 'task'
    });
  },

  async moveTask(id: string, data: any) {
    return enhancedApiClient.patch(`/tasks/${id}/move`, data, {
      schema: 'task'
    });
  },

  // Appointments
  async getAppointments(params?: any) {
    const url = params ? `/appointments?${new URLSearchParams(params).toString()}` : '/appointments';
    return enhancedApiClient.get(url);
  },

  async createAppointment(data: any) {
    return enhancedApiClient.post('/appointments', data, {
      requiredFields: ['title', 'type', 'start_datetime', 'end_datetime'],
      schema: 'appointment'
    });
  },

  async updateAppointment(id: string, data: any) {
    return enhancedApiClient.put(`/appointments/${id}`, data, {
      schema: 'appointment'
    });
  },

  async deleteAppointment(id: string) {
    return enhancedApiClient.delete(`/appointments/${id}`);
  },

  // Contacts
  async getContacts(params?: any) {
    const url = params ? `/contacts?${new URLSearchParams(params).toString()}` : '/contacts';
    return enhancedApiClient.get(url);
  },

  async getContact(id: string) {
    return enhancedApiClient.get(`/contacts/${id}`);
  },

  async createContact(data: any) {
    return enhancedApiClient.post('/contacts', data, {
      requiredFields: ['first_name', 'last_name', 'email'],
      schema: 'contact'
    });
  },

  async updateContact(id: string, data: any) {
    return enhancedApiClient.put(`/contacts/${id}`, data, {
      schema: 'contact'
    });
  },

  async deleteContact(id: string) {
    return enhancedApiClient.delete(`/contacts/${id}`);
  },

  async getMatchingProperties(contactId: string, limit: number = 10) {
    const url = `/contacts/${contactId}/matching-properties?limit=${limit}`;
    return enhancedApiClient.get(url);
  },

  // Documents
  async uploadDocument(file: File, metadata: any, options?: { onProgress?: (progress: number) => void }) {
    return enhancedApiClient.uploadFile('/documents/upload', file, metadata, options);
  },

  async updateDocument(id: string, data: any) {
    return enhancedApiClient.put(`/documents/${id}`, data, {
      schema: 'document'
    });
  },

  async toggleDocumentFavorite(id: string) {
    return enhancedApiClient.put(`/documents/${id}/favorite`, {});
  },

  // Communications
  async createConversation(data: any) {
    return enhancedApiClient.post('/communications/conversations', data, {
      requiredFields: ['title', 'participant_ids'],
      schema: 'communication'
    });
  },

  async sendMessage(conversationId: string, data: any) {
    return enhancedApiClient.post(`/communications/conversations/${conversationId}/messages`, data, {
      requiredFields: ['content'],
      schema: 'communication'
    });
  },

  // Users
  async inviteUser(data: any) {
    return enhancedApiClient.post('/users/invite', data, {
      requiredFields: ['email', 'first_name', 'last_name'],
      schema: 'user'
    });
  },

  async updateUserRole(userId: string, role: string) {
    return enhancedApiClient.put(`/users/${userId}/role`, { role }, {
      schema: 'user'
    });
  },

  // Generic methods
  async get<T>(url: string) {
    return enhancedApiClient.get<T>(url);
  },

  async post<T>(url: string, data: any, options?: any) {
    return enhancedApiClient.post<T>(url, data, options);
  },

  async put<T>(url: string, data: any, options?: any) {
    return enhancedApiClient.put<T>(url, data, options);
  },

  async patch<T>(url: string, data: any, options?: any) {
    return enhancedApiClient.patch<T>(url, data, options);
  },

  async delete<T>(url: string) {
    return enhancedApiClient.delete<T>(url);
  }
};

export default apiClient;
