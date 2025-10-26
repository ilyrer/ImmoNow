/**
 * HR API Hooks
 * React Query Hooks für HR-Management API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './config';
import type {
  LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveRequestListResponse,
  AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceListResponse,
  OvertimeCreate, OvertimeUpdate, OvertimeResponse, OvertimeListResponse,
  ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse,
  EmployeeDocumentCreate, EmployeeDocumentUpdate, EmployeeDocumentResponse, EmployeeDocumentListResponse,
  EmployeeDetailResponse, HRStats,
  LeaveApprovalRequest, OvertimeApprovalRequest, ExpenseApprovalRequest,
  LeaveRequestFilters, AttendanceFilters, OvertimeFilters, ExpenseFilters, DocumentFilters
} from '../types/hr';

// ============================================================================
// LEAVE REQUEST HOOKS
// ============================================================================

export const useLeaveRequests = (filters: LeaveRequestFilters & { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['hr', 'leave-requests', filters],
    queryFn: async (): Promise<LeaveRequestListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.leave_type) params.append('leave_type', filters.leave_type);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      
      const response = await apiClient.get(`/api/v1/hr/leave-requests?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LeaveRequestCreate): Promise<LeaveRequestResponse> => {
      const response = await apiClient.post('/api/v1/hr/leave-requests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leaveRequestId, 
      approvalData 
    }: { 
      leaveRequestId: string; 
      approvalData: LeaveApprovalRequest 
    }): Promise<LeaveRequestResponse> => {
      const response = await apiClient.put(
        `/api/v1/hr/leave-requests/${leaveRequestId}/approve`, 
        approvalData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

// ============================================================================
// ATTENDANCE HOOKS
// ============================================================================

export const useAttendance = (filters: AttendanceFilters & { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['hr', 'attendance', filters],
    queryFn: async (): Promise<AttendanceListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      
      const response = await apiClient.get(`/api/v1/hr/attendance?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useRecordAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AttendanceCreate): Promise<AttendanceResponse> => {
      const response = await apiClient.post('/api/v1/hr/attendance', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

// ============================================================================
// OVERTIME HOOKS
// ============================================================================

export const useOvertime = (filters: OvertimeFilters & { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['hr', 'overtime', filters],
    queryFn: async (): Promise<OvertimeListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.approved !== undefined) params.append('approved', filters.approved.toString());
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      
      const response = await apiClient.get(`/api/v1/hr/overtime?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useSubmitOvertime = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: OvertimeCreate): Promise<OvertimeResponse> => {
      const response = await apiClient.post('/api/v1/hr/overtime', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'overtime'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

export const useApproveOvertime = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      overtimeId, 
      approvalData 
    }: { 
      overtimeId: string; 
      approvalData: OvertimeApprovalRequest 
    }): Promise<OvertimeResponse> => {
      const response = await apiClient.put(
        `/api/v1/hr/overtime/${overtimeId}/approve`, 
        approvalData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'overtime'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

// ============================================================================
// EXPENSE HOOKS
// ============================================================================

export const useExpenses = (filters: ExpenseFilters & { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['hr', 'expenses', filters],
    queryFn: async (): Promise<ExpenseListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      
      const response = await apiClient.get(`/api/v1/hr/expenses?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useSubmitExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ExpenseCreate): Promise<ExpenseResponse> => {
      const response = await apiClient.post('/api/v1/hr/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

export const useApproveExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      expenseId, 
      approvalData 
    }: { 
      expenseId: string; 
      approvalData: ExpenseApprovalRequest 
    }): Promise<ExpenseResponse> => {
      const response = await apiClient.put(
        `/api/v1/hr/expenses/${expenseId}/approve`, 
        approvalData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

// ============================================================================
// DOCUMENT HOOKS
// ============================================================================

export const useEmployeeDocuments = (employeeId: string, filters: DocumentFilters & { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['hr', 'documents', employeeId, filters],
    queryFn: async (): Promise<EmployeeDocumentListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.document_type) params.append('document_type', filters.document_type);
      if (filters.is_confidential !== undefined) params.append('is_confidential', filters.is_confidential.toString());
      if (filters.is_expired !== undefined) params.append('is_expired', filters.is_expired.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.size) params.append('size', filters.size.toString());
      
      const response = await apiClient.get(`/api/v1/hr/documents?employee_id=${employeeId}&${params.toString()}`);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      documentData 
    }: { 
      employeeId: string; 
      documentData: EmployeeDocumentCreate 
    }): Promise<EmployeeDocumentResponse> => {
      const response = await apiClient.post(`/api/v1/hr/documents`, documentData);
      return response.data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-detail'] });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (documentId: string): Promise<Blob> => {
      const response = await apiClient.get(`/api/v1/hr/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },
  });
};

// ============================================================================
// EMPLOYEE DETAIL HOOKS
// ============================================================================

export const useEmployeeDetail = (employeeId: string) => {
  return useQuery({
    queryKey: ['hr', 'employee-detail', employeeId],
    queryFn: async (): Promise<EmployeeDetailResponse> => {
      const response = await apiClient.get(`/api/v1/admin/employees/${employeeId}/detail`);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
};

// ============================================================================
// PAYSLIP HOOKS
// ============================================================================

export const useEmployeePayslips = (employeeId: string, page: number = 1, size: number = 20) => {
  return useQuery({
    queryKey: ['hr', 'payslips', employeeId, page, size],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/admin/employees/${employeeId}/payslips?page=${page}&size=${size}`);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
};

export const useDownloadPayslipPDF = () => {
  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      payslipId 
    }: { 
      employeeId: string; 
      payslipId: string 
    }): Promise<Blob> => {
      const response = await apiClient.get(`/api/v1/admin/employees/${employeeId}/payslips/${payslipId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    },
  });
};

// ============================================================================
// STATISTICS HOOKS
// ============================================================================

export const useHRStats = () => {
  return useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: async (): Promise<HRStats> => {
      const response = await apiClient.get('/api/v1/hr/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update Employee Detail
export const useUpdateEmployeeDetail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const response = await apiClient.put(`/api/v1/admin/employees/${employeeId}/detail`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate employee detail query
      queryClient.invalidateQueries({ queryKey: ['employeeDetail'] });
    },
  });
};

// Kalender-Hook
export const useLeaveCalendar = (employeeId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['leaveCalendar', employeeId, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/hr/leave-requests/calendar', {
        params: { employee_id: employeeId, start_date: startDate, end_date: endDate }
      });
      return response.data;
    },
    enabled: !!employeeId && !!startDate && !!endDate,
  });
};

// Lohnzettel-Erstellung Hooks
export const useCreateManualPayslip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const response = await apiClient.post(`/api/v1/admin/employees/${employeeId}/payslips/manual`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate payslips query
      queryClient.invalidateQueries({ queryKey: ['employeePayslips'] });
    },
  });
};

export const useCreateAutoPayslip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const response = await apiClient.post(`/api/v1/admin/employees/${employeeId}/payslips/auto`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate payslips query
      queryClient.invalidateQueries({ queryKey: ['employeePayslips'] });
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useHRDataRefresh = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['hr'] });
  };
};

export const useHRCacheClear = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.removeQueries({ queryKey: ['hr'] });
  };
};
