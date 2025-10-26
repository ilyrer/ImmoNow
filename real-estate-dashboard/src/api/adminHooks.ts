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
  status: 'active' | 'inactive' | 'invited' | 'pending';
  roles: AdminRole[];
  tenant_name: string;
  last_login?: string;
  created_at: string;
  employee_number?: string;
  department?: string;
  position?: string;
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

export interface TenantSettings {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  timezone: string;
  date_format: string;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  template_content: string;
  document_type: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface CreateDocumentTemplateRequest {
  name: string;
  description?: string;
  template_content: string;
  document_type: string;
}

export interface UpdateDocumentTemplateRequest {
  name?: string;
  description?: string;
  template_content?: string;
  document_type?: string;
  is_active?: boolean;
}

export interface AuditLogListResponse {
  items: AdminAuditLog[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// User Management Types
export interface InviteUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
  message?: string;
  permissions?: Record<string, any>;
}

export interface InviteUserResponse {
  invitation_id: string;
  email: string;
  token: string;
  expires_at: string;
  invitation_url: string;
  message: string;
}

export interface BulkUserActionRequest {
  user_ids: string[];
  action: 'activate' | 'deactivate' | 'delete' | 'resend_invitation';
  reason?: string;
}

export interface BulkUserActionResponse {
  successful: string[];
  failed: Array<{ user_id: string; error: string }>;
  total_processed: number;
  total_failed: number;
}

export interface UserActivationRequest {
  user_id: string;
  is_active: boolean;
  reason?: string;
}

export interface UserDeletionRequest {
  user_id: string;
  reason?: string;
  anonymize_data?: boolean;
}

export interface ResendInvitationRequest {
  user_id: string;
  message?: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  invited_users: number;
  users_by_role: Record<string, number>;
  users_by_department: Record<string, number>;
  recent_registrations: number;
  users_without_login: number;
}

// Employee Types
export interface Employee {
  id: string;
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  employee_number: string;
  department: string;
  position: string;
  employment_type: string;
  start_date: string;
  end_date?: string;
  work_email?: string;
  work_phone?: string;
  office_location?: string;
  manager_id?: string;
  manager_name?: string;
  is_active: boolean;
  is_on_leave: boolean;
  leave_start?: string;
  leave_end?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EmployeeCreate {
  user_id: string;
  employee_number: string;
  department: string;
  position: string;
  employment_type: string;
  start_date: string;
  end_date?: string;
  work_email?: string;
  work_phone?: string;
  office_location?: string;
  manager_id?: string;
  is_active: boolean;
  is_on_leave: boolean;
  leave_start?: string;
  leave_end?: string;
  notes?: string;
}

export interface EmployeeUpdate {
  employee_number?: string;
  department?: string;
  position?: string;
  employment_type?: string;
  start_date?: string;
  end_date?: string;
  work_email?: string;
  work_phone?: string;
  office_location?: string;
  manager_id?: string;
  is_active?: boolean;
  is_on_leave?: boolean;
  leave_start?: string;
  leave_end?: string;
  notes?: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  employees_on_leave: number;
  employees_by_department: Record<string, number>;
  employees_by_position: Record<string, number>;
  employees_by_employment_type: Record<string, number>;
  average_salary?: number;
  total_monthly_payroll?: number;
}

// Payroll Types
export interface PayrollRun {
  id: string;
  period: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  total_gross: number;
  total_net: number;
  total_taxes: number;
  total_social_security: number;
  employee_count: number;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  created_by: string;
  approved_by?: string;
  notes?: string;
}

export interface PayrollRunCreate {
  period: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface PayrollRunUpdate {
  period_start?: string;
  period_end?: string;
  notes?: string;
}

export interface PayrollListResponse {
  payroll_runs: PayrollRun[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PayrollStats {
  total_runs: number;
  draft_runs: number;
  approved_runs: number;
  paid_runs: number;
  total_gross_amount: number;
  total_net_amount: number;
  total_taxes: number;
  total_social_security: number;
  average_gross_per_employee?: number;
  average_net_per_employee?: number;
  monthly_trend: Array<{
    month: string;
    runs: number;
    total_gross: number;
    total_net: number;
  }>;
}

// Document Types
export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  requires_signature: boolean;
  requires_expiry_date: boolean;
  default_validity_days?: number;
  allowed_extensions: string[];
  max_file_size_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  employee_name: string;
  document_type_id: string;
  document_type_name: string;
  title: string;
  description?: string;
  version: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  valid_from: string;
  valid_until?: string;
  sign_status: 'pending' | 'signed' | 'expired' | 'rejected' | 'cancelled';
  signed_at?: string;
  signed_by?: string;
  signature_notes?: string;
  is_active: boolean;
  is_confidential: boolean;
  uploaded_at: string;
  updated_at: string;
  uploaded_by: string;
}

export interface DocumentListResponse {
  documents: EmployeeDocument[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DocumentStats {
  total_documents: number;
  pending_signatures: number;
  signed_documents: number;
  expired_documents: number;
  documents_by_type: Record<string, number>;
  documents_by_status: Record<string, number>;
  total_file_size_mb: number;
  average_file_size_mb: number;
  documents_expiring_soon: number;
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
    const response = await apiClient.get('/api/v1/admin/permissions');
    return response.data;
  },

  // Roles
  getRoles: async (): Promise<AdminRole[]> => {
    const response = await apiClient.get('/api/v1/admin/roles');
    return response.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<AdminRole> => {
    const response = await apiClient.post('/api/v1/admin/roles', data);
    return response.data;
  },

  updateRole: async (roleId: number, data: UpdateRoleRequest): Promise<AdminRole> => {
    const response = await apiClient.put(`/api/v1/admin/roles/${roleId}`, data);
    return response.data;
  },

  deleteRole: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/roles/${roleId}`);
  },

  // User Management
  inviteUser: async (data: InviteUserRequest): Promise<InviteUserResponse> => {
    const response = await apiClient.post('/api/v1/admin/users/invite', data);
    return response.data;
  },

  activateUser: async (userId: string, data: UserActivationRequest): Promise<void> => {
    await apiClient.post(`/api/v1/admin/users/${userId}/activate`, data);
  },

  deactivateUser: async (userId: string, data: UserActivationRequest): Promise<void> => {
    await apiClient.post(`/api/v1/admin/users/${userId}/deactivate`, data);
  },

  deleteUser: async (userId: string, data: UserDeletionRequest): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/users/${userId}`, { data });
  },

  bulkUserAction: async (data: BulkUserActionRequest): Promise<BulkUserActionResponse> => {
    const response = await apiClient.post('/api/v1/admin/users/bulk-action', data);
    return response.data;
  },

  resendInvitation: async (userId: string, data: ResendInvitationRequest): Promise<void> => {
    await apiClient.post(`/api/v1/admin/users/${userId}/resend-invitation`, data);
  },

  getUsers: async (params: {
    page?: number;
    size?: number;
    search?: string;
    is_active?: boolean;
    role?: string;
  } = {}): Promise<UserListResponse> => {
    const response = await apiClient.get('/api/v1/admin/users', { params });
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/api/v1/admin/users/stats');
    return response.data;
  },

  updateUserRoles: async (userId: string, data: AssignRoleRequest): Promise<AdminUser> => {
    const response = await apiClient.put(`/api/v1/admin/users/${userId}/roles`, data);
    return response.data;
  },

  // Employee Management
  getEmployees: async (params: {
    page?: number;
    size?: number;
    search?: string;
    department?: string;
    position?: string;
    is_active?: boolean;
  } = {}): Promise<EmployeeListResponse> => {
    const response = await apiClient.get('/api/v1/admin/employees', { params });
    return response.data;
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get(`/api/v1/admin/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post('/api/v1/admin/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: EmployeeUpdate): Promise<Employee> => {
    const response = await apiClient.put(`/api/v1/admin/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/employees/${id}`);
  },

  getEmployeeStats: async (): Promise<EmployeeStats> => {
    const response = await apiClient.get('/api/v1/admin/employees/stats');
    return response.data;
  },

  // Payroll Management
  getPayrollRuns: async (params: {
    page?: number;
    size?: number;
    status?: string;
    period?: string;
  } = {}): Promise<PayrollListResponse> => {
    const response = await apiClient.get('/api/v1/admin/runs', { params });
    return response.data;
  },

  getPayrollRun: async (id: string): Promise<PayrollRun> => {
    const response = await apiClient.get(`/api/v1/admin/runs/${id}`);
    return response.data;
  },

  createPayrollRun: async (data: PayrollRunCreate): Promise<PayrollRun> => {
    const response = await apiClient.post('/api/v1/admin/runs', data);
    return response.data;
  },

  updatePayrollRun: async (id: string, data: PayrollRunUpdate): Promise<PayrollRun> => {
    const response = await apiClient.put(`/api/v1/admin/runs/${id}`, data);
    return response.data;
  },

  approvePayrollRun: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/runs/${id}/approve`);
  },

  markPayrollRunPaid: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/runs/${id}/mark-paid`);
  },

  deletePayrollRun: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/runs/${id}`);
  },

  getPayrollStats: async (): Promise<PayrollStats> => {
    const response = await apiClient.get('/api/v1/admin/runs/stats');
    return response.data;
  },

  // Document Management
  getDocumentTypes: async (): Promise<DocumentType[]> => {
    const response = await apiClient.get('/api/v1/admin/document-types');
    return response.data;
  },

  getEmployeeDocuments: async (params: {
    page?: number;
    size?: number;
    employee_id?: string;
    document_type_id?: string;
    sign_status?: string;
  } = {}): Promise<DocumentListResponse> => {
    const response = await apiClient.get('/api/v1/admin/employee-documents', { params });
    return response.data;
  },

  getEmployeeDocument: async (id: string): Promise<EmployeeDocument> => {
    const response = await apiClient.get(`/api/v1/admin/employee-documents/${id}`);
    return response.data;
  },

  uploadEmployeeDocument: async (data: FormData): Promise<EmployeeDocument> => {
    const response = await apiClient.post('/api/v1/admin/employee-documents/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateEmployeeDocument: async (id: string, data: Partial<EmployeeDocument>): Promise<EmployeeDocument> => {
    const response = await apiClient.put(`/api/v1/admin/employee-documents/${id}`, data);
    return response.data;
  },

  deleteEmployeeDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/employee-documents/${id}`);
  },

  downloadEmployeeDocument: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/admin/employee-documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  signEmployeeDocument: async (id: string, signatureData: any): Promise<void> => {
    await apiClient.put(`/api/v1/admin/employee-documents/${id}/sign`, signatureData);
  },

  getDocumentStats: async (): Promise<DocumentStats> => {
    const response = await apiClient.get('/api/v1/admin/employee-documents/stats');
    return response.data;
  },

  // System Stats
  getSystemStats: async (): Promise<AdminSystemStats> => {
    const response = await apiClient.get('/api/v1/admin/stats');
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params: {
    page?: number;
    size?: number;
    user_id?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<AuditLogListResponse> => {
    const response = await apiClient.get('/api/v1/admin/audit-logs', { params });
    return response.data;
  },

  // Tenant Settings
  getTenantSettings: async (): Promise<TenantSettings> => {
    const response = await apiClient.get('/api/v1/tenant/settings');
    return response.data;
  },

  updateTenantSettings: async (data: Partial<TenantSettings>): Promise<TenantSettings> => {
    const response = await apiClient.put('/api/v1/tenant/settings', data);
    return response.data;
  },

  // Document Templates
  getDocumentTemplates: async (): Promise<DocumentTemplate[]> => {
    const response = await apiClient.get('/api/v1/admin/document-templates');
    return response.data;
  },

  createDocumentTemplate: async (data: CreateDocumentTemplateRequest): Promise<DocumentTemplate> => {
    const response = await apiClient.post('/api/v1/admin/document-templates', data);
    return response.data;
  },

  updateDocumentTemplate: async (id: string, data: UpdateDocumentTemplateRequest): Promise<DocumentTemplate> => {
    const response = await apiClient.put(`/api/v1/admin/document-templates/${id}`, data);
    return response.data;
  },

  deleteDocumentTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/document-templates/${id}`);
  },

  // Feature Flags
  getFeatureFlags: async (): Promise<AdminFeatureFlag[]> => {
    const response = await apiClient.get('/api/v1/admin/feature-flags');
    return response.data;
  },

  createFeatureFlag: async (data: CreateFeatureFlagRequest): Promise<AdminFeatureFlag> => {
    const response = await apiClient.post('/api/v1/admin/feature-flags', data);
    return response.data;
  },

  updateFeatureFlag: async (flagId: number, data: UpdateFeatureFlagRequest): Promise<AdminFeatureFlag> => {
    const response = await apiClient.put(`/api/v1/admin/feature-flags/${flagId}`, data);
    return response.data;
  },

  // Tenants
  getTenants: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/tenants');
    return response.data;
  },
};

// React Query Hooks

// User Management Hooks
export const useInviteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userStats'] });
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserActivationRequest }) =>
      adminApi.activateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userStats'] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserActivationRequest }) =>
      adminApi.deactivateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userStats'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserDeletionRequest }) =>
      adminApi.deleteUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userStats'] });
    },
  });
};

export const useBulkUserAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.bulkUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userStats'] });
    },
  });
};

export const useResendInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ResendInvitationRequest }) =>
      adminApi.resendInvitation(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useUsers = (params: {
  page?: number;
  size?: number;
  search?: string;
  is_active?: boolean;
  role?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['admin', 'userStats'],
    queryFn: adminApi.getUserStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Employee Management Hooks
export const useEmployees = (params: {
  page?: number;
  size?: number;
  search?: string;
  department?: string;
  position?: string;
  is_active?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'employees', params],
    queryFn: () => adminApi.getEmployees(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'employees', id],
    queryFn: () => adminApi.getEmployee(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeStats'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdate }) =>
      adminApi.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeStats'] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeStats'] });
    },
  });
};

export const useEmployeeStats = () => {
  return useQuery({
    queryKey: ['admin', 'employeeStats'],
    queryFn: adminApi.getEmployeeStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Payroll Management Hooks
export const usePayrollRuns = (params: {
  page?: number;
  size?: number;
  status?: string;
  period?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'payroll', params],
    queryFn: () => adminApi.getPayrollRuns(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const usePayrollRun = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'payroll', id],
    queryFn: () => adminApi.getPayrollRun(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreatePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createPayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payrollStats'] });
    },
  });
};

export const useUpdatePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayrollRunUpdate }) =>
      adminApi.updatePayrollRun(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payrollStats'] });
    },
  });
};

export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.approvePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payrollStats'] });
    },
  });
};

export const useMarkPayrollRunPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.markPayrollRunPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payrollStats'] });
    },
  });
};

export const useDeletePayrollRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deletePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payrollStats'] });
    },
  });
};

export const usePayrollStats = () => {
  return useQuery({
    queryKey: ['admin', 'payrollStats'],
    queryFn: adminApi.getPayrollStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Document Management Hooks
export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['admin', 'documentTypes'],
    queryFn: adminApi.getDocumentTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployeeDocuments = (params: {
  page?: number;
  size?: number;
  employee_id?: string;
  document_type_id?: string;
  sign_status?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'employeeDocuments', params],
    queryFn: () => adminApi.getEmployeeDocuments(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useEmployeeDocument = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'employeeDocuments', id],
    queryFn: () => adminApi.getEmployeeDocument(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUploadEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.uploadEmployeeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentStats'] });
    },
  });
};

export const useUpdateEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeDocument> }) =>
      adminApi.updateEmployeeDocument(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentStats'] });
    },
  });
};

export const useDeleteEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteEmployeeDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentStats'] });
    },
  });
};

export const useSignEmployeeDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: any }) =>
      adminApi.signEmployeeDocument(id, signatureData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentStats'] });
    },
  });
};

export const useDocumentStats = () => {
  return useQuery({
    queryKey: ['admin', 'documentStats'],
    queryFn: adminApi.getDocumentStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

// System Stats Hook
export const useSystemStats = () => {
  return useQuery({
    queryKey: ['admin', 'systemStats'],
    queryFn: adminApi.getSystemStats,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Audit Logs Hook
export const useAuditLogs = (params: {
  page?: number;
  size?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'auditLogs', params],
    queryFn: () => adminApi.getAuditLogs(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Tenant Settings Hooks
export const useTenantSettings = () => {
  return useQuery({
    queryKey: ['admin', 'tenantSettings'],
    queryFn: adminApi.getTenantSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateTenantSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenantSettings'] });
    },
  });
};

// Document Templates Hooks
export const useDocumentTemplates = () => {
  return useQuery({
    queryKey: ['admin', 'documentTemplates'],
    queryFn: adminApi.getDocumentTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createDocumentTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentTemplates'] });
    },
  });
};

export const useUpdateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTemplateRequest }) =>
      adminApi.updateDocumentTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentTemplates', id] });
    },
  });
};

export const useDeleteDocumentTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteDocumentTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'documentTemplates'] });
    },
  });
};

// Legacy Hooks (for backward compatibility)
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
    queryFn: () => adminApi.getUsers(),
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

// Alias für useRoles (verwendet useAdminRoles)
export const useRoles = useAdminRoles;

// Export adminApi für direkten Zugriff
export { adminApi };
 