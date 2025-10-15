/**
 * Admin API Hooks
 * React Query hooks für Admin-Funktionen
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/config';

// Types
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: AdminRole[];
  tenant_name: string;
  last_login?: string;
  created_at: string;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  permissions: AdminPermission[];
  is_system: boolean;
  created_at: string;
  created_by: string;
}

export interface AdminPermission {
  id: number;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

export interface AdminFeatureFlag {
  id: number;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  created_at: string;
  created_by: string;
}

export interface AdminAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  description?: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface AdminSystemStats {
  total_users: number;
  total_tenants: number;
  active_users: number;
  total_properties: number;
  total_contacts: number;
  total_documents: number;
  total_tasks: number;
  system_health: Record<string, any>;
  recent_activity: AdminAuditLog[];
}

export interface AdminTenant {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

// Payroll Types
export interface PayrollRun {
  id: string;
  period: string;
  status: 'draft' | 'approved' | 'paid';
  total_gross: number;
  total_net: number;
  employee_count: number;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  created_by: string;
}

export interface EmployeeCompensation {
  employee_id: string;
  employee_name: string;
  base_salary: number;
  commission_percent: number;
  bonuses: number;
  gross_amount: number;
  net_amount: number;
  currency: string;
}

export interface PayrollDetail {
  payroll_run: PayrollRun;
  employees: EmployeeCompensation[];
}

// Document Types
export interface EmployeeDocument {
  id: string;
  employee_id?: string;
  employee_name?: string;
  type: 'contract' | 'nda' | 'certificate' | 'id_document' | 'other';
  title: string;
  file_name: string;
  version: string;
  valid_until?: string;
  sign_status: 'pending' | 'signed' | 'expired' | 'rejected';
  uploaded_at: string;
  uploaded_by: string;
  file_size?: number;
  mime_type?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
}

// Request Types
export interface CreateRoleRequest {
  name: string;
  description: string;
  permission_ids: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export interface AssignRoleRequest {
  role_ids: number[];
}

export interface CreateFeatureFlagRequest {
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
}

export interface UpdateFeatureFlagRequest {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
}

// API Functions
const adminApi = {
  // Permissions
  getPermissions: async (): Promise<AdminPermission[]> => {
    const response = await apiClient.get('/admin/permissions');
    return response.data;
  },

  // Roles
  getRoles: async (): Promise<AdminRole[]> => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<AdminRole> => {
    const response = await apiClient.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (roleId: number, data: UpdateRoleRequest): Promise<AdminRole> => {
    const response = await apiClient.put(`/admin/roles/${roleId}`, data);
    return response.data;
  },

  deleteRole: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/admin/roles/${roleId}`);
  },

  // Users
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  updateUserRoles: async (userId: string, data: AssignRoleRequest): Promise<AdminUser> => {
    const response = await apiClient.put(`/admin/users/${userId}/roles`, data);
    return response.data;
  },

  // Feature Flags
  getFeatureFlags: async (): Promise<AdminFeatureFlag[]> => {
    const response = await apiClient.get('/admin/feature-flags');
    return response.data;
  },

  createFeatureFlag: async (data: CreateFeatureFlagRequest): Promise<AdminFeatureFlag> => {
    const response = await apiClient.post('/admin/feature-flags', data);
    return response.data;
  },

  updateFeatureFlag: async (flagId: number, data: UpdateFeatureFlagRequest): Promise<AdminFeatureFlag> => {
    const response = await apiClient.put(`/admin/feature-flags/${flagId}`, data);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    size?: number;
    resource_type?: string;
    user_id?: string;
  }): Promise<{ items: AdminAuditLog[]; total: number; page: number; size: number; pages: number }> => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  // System Stats
  getSystemStats: async (): Promise<AdminSystemStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Tenants
  getTenants: async (): Promise<AdminTenant[]> => {
    const response = await apiClient.get('/admin/tenants');
    return response.data;
  },

  // Payroll
  getPayrollRuns: async (): Promise<PayrollRun[]> => {
    const response = await apiClient.get('/payroll/runs');
    return response.data;
  },

  getPayrollDetail: async (runId: string): Promise<PayrollDetail> => {
    const response = await apiClient.get(`/payroll/runs/${runId}`);
    return response.data;
  },

  approvePayrollRun: async (runId: string): Promise<PayrollRun> => {
    const response = await apiClient.post(`/payroll/runs/${runId}/approve`);
    return response.data;
  },

  markPayrollPaid: async (runId: string): Promise<PayrollRun> => {
    const response = await apiClient.post(`/payroll/runs/${runId}/mark-paid`);
    return response.data;
  },

  createPayrollRun: async (period: string): Promise<PayrollRun> => {
    const response = await apiClient.post('/payroll/runs', { period });
    return response.data;
  },

  // Documents
  getEmployeeDocuments: async (params?: {
    employee_id?: string;
    document_type?: string;
    sign_status?: string;
  }): Promise<EmployeeDocument[]> => {
    const response = await apiClient.get('/admin/employee-documents', { params });
    return response.data;
  },

  getEmployeeDocument: async (documentId: string): Promise<EmployeeDocument> => {
    const response = await apiClient.get(`/admin/employee-documents/${documentId}`);
    return response.data;
  },

  uploadEmployeeDocument: async (file: File, data: {
    employee_id?: string;
    document_type: string;
    title: string;
    valid_until?: string;
  }): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.employee_id) {
      formData.append('employee_id', data.employee_id);
    }
    formData.append('document_type', data.document_type);
    formData.append('title', data.title);
    if (data.valid_until) {
      formData.append('valid_until', data.valid_until);
    }

    const response = await apiClient.post('/admin/employee-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  signDocument: async (documentId: string): Promise<EmployeeDocument> => {
    const response = await apiClient.put(`/admin/employee-documents/${documentId}/sign`);
    return response.data;
  },

  deleteEmployeeDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/admin/employee-documents/${documentId}`);
  },

  getDocumentTypes: async (): Promise<DocumentType[]> => {
    const response = await apiClient.get('/admin/document-types');
    return response.data;
  },
};

// React Query Hooks
export const useAdminPermissions = () => {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: adminApi.getPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminRoles = () => {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: UpdateRoleRequest }) =>
      adminApi.updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignRoleRequest }) =>
      adminApi.updateUserRoles(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useAdminFeatureFlags = () => {
  return useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: adminApi.getFeatureFlags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
  });
};

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ flagId, data }: { flagId: number; data: UpdateFeatureFlagRequest }) =>
      adminApi.updateFeatureFlag(flagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
    },
  });
};

export const useAdminAuditLogs = (params?: {
  page?: number;
  size?: number;
  resource_type?: string;
  user_id?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAdminSystemStats = () => {
  return useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: adminApi.getSystemStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useAdminTenants = () => {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: adminApi.getTenants,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Payroll Hooks
export const usePayrollRuns = () => {
  return useQuery({
    queryKey: ['admin', 'payroll-runs'],
    queryFn: adminApi.getPayrollRuns,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePayrollDetail = (runId: string) => {
  return useQuery({
    queryKey: ['admin', 'payroll-detail', runId],
    queryFn: () => adminApi.getPayrollDetail(runId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!runId,
  });
};

export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.approvePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll-runs'] });
    },
  });
};

export const useMarkPayrollPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.markPayrollPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll-runs'] });
    },
  });
};

export const useCreatePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createPayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll-runs'] });
    },
  });
};

// Document Hooks
export const useEmployeeDocuments = (params?: {
  employee_id?: string;
  document_type?: string;
  sign_status?: string;
}) => {
  return useQuery({
    queryKey: ['admin', 'employee-documents', params],
    queryFn: () => adminApi.getEmployeeDocuments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEmployeeDocument = (documentId: string) => {
  return useQuery({
    queryKey: ['admin', 'employee-document', documentId],
    queryFn: () => adminApi.getEmployeeDocument(documentId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!documentId,
  });
};

export const useUploadEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: {
      employee_id?: string;
      document_type: string;
      title: string;
      valid_until?: string;
    } }) => adminApi.uploadEmployeeDocument(file, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employee-documents'] });
    },
  });
};

export const useSignDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.signDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employee-documents'] });
    },
  });
};

export const useDeleteEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteEmployeeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employee-documents'] });
    },
  });
};

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['admin', 'document-types'],
    queryFn: adminApi.getDocumentTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
 