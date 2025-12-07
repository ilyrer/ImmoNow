/**
 * Legacy API Services - Deprecated
 * These services are kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

export const dashboardAnalyticsService = {
  getAnalytics: async () => {
    console.warn("Legacy dashboardAnalyticsService.getAnalytics called. Please use specific dashboard hooks.");
    return { data: null };
  },
  getKPIs: async () => {
    console.warn("Legacy dashboardAnalyticsService.getKPIs called. Please use specific dashboard hooks.");
    return { data: null };
  },
  getOverview: async () => {
    console.warn("Legacy dashboardAnalyticsService.getOverview called. Please use specific dashboard hooks.");
    return { 
      data: {
        recent_activities: [] as any[],
        performance_trends: {} as any
      } 
    };
  },
  getPerformance: async (params: any) => {
    console.warn("Legacy dashboardAnalyticsService.getPerformance called. Please use specific dashboard hooks.");
    return { 
      data: {
        daily_trends: [] as any[],
        summary: {} as any
      } 
    };
  },
  getPropertyAnalytics: async () => {
    console.warn("Legacy dashboardAnalyticsService.getPropertyAnalytics called. Please use specific dashboard hooks.");
    return {
      data: {
        monthly_trends: [],
        price_statistics: {
          avg_price: 0
        },
        total_properties: 0,
        by_type: [],
        by_status: []
      }
    };
  },
  getLatestPropertiesSimple: async (limit: number) => {
    console.warn("Legacy dashboardAnalyticsService.getLatestPropertiesSimple called. Please use specific dashboard hooks.");
    return { data: [] };
  },
  mapPropertyTypesToChart: (data: any[]) => {
    console.warn("Legacy dashboardAnalyticsService.mapPropertyTypesToChart called. Please use specific dashboard hooks.");
    return [];
  },
  mapStatusToChart: (data: any[]) => {
    console.warn("Legacy dashboardAnalyticsService.mapStatusToChart called. Please use specific dashboard hooks.");
    return [];
  },
  buildStatusOptions: (data: any[]) => {
    console.warn("Legacy dashboardAnalyticsService.buildStatusOptions called. Please use specific dashboard hooks.");
    return [];
  },
};

export const propertyService = {
  getProperties: async (params?: any) => {
    console.warn("Legacy propertyService.getProperties called. Please use specific property hooks.");
    return { data: [] };
  },
  createProperty: async (data: any) => {
    console.warn("Legacy propertyService.createProperty called. Please use specific property hooks.");
    return { data: null };
  },
  updateProperty: async (id: string, data: any) => {
    console.warn("Legacy propertyService.updateProperty called. Please use specific property hooks.");
    return { data: null };
  },
  updateStatus: async (id: string, status: string) => {
    console.warn("Legacy propertyService.updateStatus called. Please use specific property hooks.");
    return { data: null };
  },
  deleteProperty: async (id: string) => {
    console.warn("Legacy propertyService.deleteProperty called. Please use specific property hooks.");
    return { data: null };
  },
};

export const measuresService = {
  getMeasures: async (params?: any) => {
    console.warn("Legacy measuresService.getMeasures called. Please use specific measures hooks.");
    return { data: [] };
  },
  list: async (params?: any) => {
    console.warn("Legacy measuresService.list called. Please use specific measures hooks.");
    return { 
      items: [] as any[],
      metrics: [] as any[],
      total: 0,
      page: 1,
      size: params?.size || 10,
      pages: 0
    };
  },
  createMeasure: async (data: any) => {
    console.warn("Legacy measuresService.createMeasure called. Please use specific measures hooks.");
    return { data: null };
  },
  updateMeasure: async (id: string, data: any) => {
    console.warn("Legacy measuresService.updateMeasure called. Please use specific measures hooks.");
    return { data: null };
  },
  deleteMeasure: async (id: string) => {
    console.warn("Legacy measuresService.deleteMeasure called. Please use specific measures hooks.");
    return { data: null };
  },
};

export const authService = {
  register: async (data: any) => {
    console.warn("Legacy authService.register called. Please use src/contexts/AuthContext.tsx");
    console.log("Legacy register called with:", data);
    return { access_token: "mock-token", refresh_token: "mock-refresh", user: { tenant_id: "mock-tenant" } };
  },
  login: async (data: any) => {
    console.warn("Legacy authService.login called. Please use src/contexts/AuthContext.tsx");
    console.log("Legacy login called with:", data);
    return { access_token: "mock-token", refresh_token: "mock-refresh", user: { tenant_id: "mock-tenant" } };
  },
  logout: async () => {
    console.warn("Legacy authService.logout called. Please use src/contexts/AuthContext.tsx");
    return { success: true };
  },
  refreshToken: async () => {
    console.warn("Legacy authService.refreshToken called. Please use src/contexts/AuthContext.tsx");
    return { access_token: "mock-token", refresh_token: "mock-refresh" };
  },
};

// Mock API services for backward compatibility
export const apiServices = {
  get: async (url: string) => {
    console.warn(`Legacy API service call to ${url} - please update to new services`);
    return { data: null };
  },
  post: async (url: string, data: any) => {
    console.warn(`Legacy API service call to ${url} - please update to new services`);
    return { data: null };
  },
  put: async (url: string, data: any) => {
    console.warn(`Legacy API service call to ${url} - please update to new services`);
    return { data: null };
  },
  delete: async (url: string) => {
    console.warn(`Legacy API service call to ${url} - please update to new services`);
    return { data: null };
  },
};

export default apiServices;
