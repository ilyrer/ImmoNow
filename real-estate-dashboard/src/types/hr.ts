/**
 * HR Types
 * TypeScript types für HR-Management (Urlaub, Anwesenheit, Überstunden, Spesen, Dokumente)
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum LeaveType {
  VACATION = 'vacation',
  SICK = 'sick',
  PERSONAL = 'personal',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  STUDY = 'study',
  OTHER = 'other'
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  COMMUNICATION = 'communication',
  OFFICE_SUPPLIES = 'office_supplies',
  TRAINING = 'training',
  CLIENT_ENTERTAINMENT = 'client_entertainment',
  OTHER = 'other'
}

export enum ExpenseStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

export enum DocumentType {
  CONTRACT = 'contract',
  CERTIFICATE = 'certificate',
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  PAYSLIP = 'payslip',
  DRIVER_LICENSE = 'driver_license',
  QUALIFICATION = 'qualification',
  TRAINING_CERTIFICATE = 'training_certificate',
  MEDICAL_CERTIFICATE = 'medical_certificate',
  OTHER = 'other'
}

// ============================================================================
// LEAVE REQUEST TYPES
// ============================================================================

export interface LeaveRequestBase {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  days_count: number;
  reason?: string;
}

export interface LeaveRequestCreate extends LeaveRequestBase {}

export interface LeaveRequestUpdate {
  start_date?: string;
  end_date?: string;
  leave_type?: LeaveType;
  days_count?: number;
  reason?: string;
}

export interface LeaveRequestResponse extends LeaveRequestBase {
  id: string;
  employee_id: string;
  employee_name: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestListResponse {
  items: LeaveRequestResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LeaveApprovalRequest {
  approved: boolean;
  manager_notes?: string;
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

export interface AttendanceBase {
  date: string;
  check_in?: string;
  check_out?: string;
  location?: string;
  notes?: string;
}

export interface AttendanceCreate extends AttendanceBase {}

export interface AttendanceUpdate {
  check_in?: string;
  check_out?: string;
  location?: string;
  notes?: string;
}

export interface AttendanceResponse extends AttendanceBase {
  id: string;
  employee_id: string;
  employee_name: string;
  hours_worked?: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceListResponse {
  items: AttendanceResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// OVERTIME TYPES
// ============================================================================

export interface OvertimeBase {
  date: string;
  hours: number;
  rate: number;
  reason: string;
}

export interface OvertimeCreate extends OvertimeBase {}

export interface OvertimeUpdate {
  date?: string;
  hours?: number;
  rate?: number;
  reason?: string;
}

export interface OvertimeResponse extends OvertimeBase {
  id: string;
  employee_id: string;
  employee_name: string;
  approved: boolean;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface OvertimeListResponse {
  items: OvertimeResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface OvertimeApprovalRequest {
  approved: boolean;
  notes?: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export interface ExpenseBase {
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  receipt_url?: string;
}

export interface ExpenseCreate extends ExpenseBase {}

export interface ExpenseUpdate {
  date?: string;
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  receipt_url?: string;
}

export interface ExpenseResponse extends ExpenseBase {
  id: string;
  employee_id: string;
  employee_name: string;
  status: ExpenseStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListResponse {
  items: ExpenseResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ExpenseApprovalRequest {
  approved: boolean;
  manager_notes?: string;
}

// ============================================================================
// EMPLOYEE DOCUMENT TYPES
// ============================================================================

export interface EmployeeDocumentBase {
  title: string;
  document_type: DocumentType;
  description?: string;
  expires_at?: string;
  is_confidential: boolean;
}

export interface EmployeeDocumentCreate extends EmployeeDocumentBase {
  file_url: string;
  file_size?: number;
  mime_type?: string;
}

export interface EmployeeDocumentUpdate {
  title?: string;
  document_type?: DocumentType;
  description?: string;
  expires_at?: string;
  is_confidential?: boolean;
}

export interface EmployeeDocumentResponse extends EmployeeDocumentBase {
  id: string;
  employee_id: string;
  employee_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  file_extension?: string;
  is_expired: boolean;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  updated_at: string;
}

export interface EmployeeDocumentListResponse {
  items: EmployeeDocumentResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// EMPLOYEE DETAIL TYPES
// ============================================================================

export interface EmployeeDetailResponse {
  // Basic Info
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  employment_type: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  is_on_leave: boolean;
  leave_start?: string;
  leave_end?: string;
  
  // Contact Info
  work_email?: string;
  work_phone?: string;
  office_location?: string;
  
  // Manager Info
  manager_id?: string;
  manager_name?: string;
  
  // Statistics
  total_leave_days_used: number;
  total_leave_days_remaining: number;
  total_overtime_hours: number;
  total_expenses_amount: number;
  total_expenses_pending: number;
  attendance_rate: number;
  
  // Admin-editable fields
  annual_leave_days?: number;
  overtime_balance?: number;
  expense_limit?: number;
  
  // Recent Activity
  recent_leave_requests: LeaveRequestResponse[];
  recent_attendance: AttendanceResponse[];
  recent_overtime: OvertimeResponse[];
  recent_expenses: ExpenseResponse[];
  recent_documents: EmployeeDocumentResponse[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface HRStats {
  total_employees: number;
  active_employees: number;
  employees_on_leave: number;
  pending_leave_requests: number;
  pending_overtime_approvals: number;
  pending_expense_approvals: number;
  total_leave_days_used: number;
  total_overtime_hours: number;
  total_expenses_amount: number;
  average_attendance_rate: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LeaveRequestFormData {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  days_count: number;
  reason: string;
}

export interface AttendanceFormData {
  date: string;
  check_in?: string;
  check_out?: string;
  location?: string;
  notes?: string;
}

export interface OvertimeFormData {
  date: string;
  hours: number;
  rate: number;
  reason: string;
}

export interface ExpenseFormData {
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  receipt_url?: string;
}

export interface DocumentUploadFormData {
  title: string;
  document_type: DocumentType;
  description?: string;
  expires_at?: string;
  is_confidential: boolean;
  file: File;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface LeaveRequestFilters {
  employee_id?: string;
  status?: LeaveStatus;
  start_date?: string;
  end_date?: string;
  leave_type?: LeaveType;
}

export interface AttendanceFilters {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface OvertimeFilters {
  employee_id?: string;
  approved?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface ExpenseFilters {
  employee_id?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  start_date?: string;
  end_date?: string;
}

export interface DocumentFilters {
  employee_id?: string;
  document_type?: DocumentType;
  is_confidential?: boolean;
  is_expired?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LeaveTypeLabel = {
  [key in LeaveType]: string;
};

export type LeaveStatusLabel = {
  [key in LeaveStatus]: string;
};

export type ExpenseCategoryLabel = {
  [key in ExpenseCategory]: string;
};

export type ExpenseStatusLabel = {
  [key in ExpenseStatus]: string;
};

export type DocumentTypeLabel = {
  [key in DocumentType]: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const LEAVE_TYPE_LABELS: LeaveTypeLabel = {
  [LeaveType.VACATION]: 'Urlaub',
  [LeaveType.SICK]: 'Krankheit',
  [LeaveType.PERSONAL]: 'Persönlich',
  [LeaveType.MATERNITY]: 'Mutterschutz',
  [LeaveType.PATERNITY]: 'Vaterschaftsurlaub',
  [LeaveType.STUDY]: 'Bildungsurlaub',
  [LeaveType.OTHER]: 'Sonstiges'
};

export const LEAVE_STATUS_LABELS: LeaveStatusLabel = {
  [LeaveStatus.PENDING]: 'Ausstehend',
  [LeaveStatus.APPROVED]: 'Genehmigt',
  [LeaveStatus.REJECTED]: 'Abgelehnt',
  [LeaveStatus.CANCELLED]: 'Storniert'
};

export const EXPENSE_CATEGORY_LABELS: ExpenseCategoryLabel = {
  [ExpenseCategory.TRAVEL]: 'Reisekosten',
  [ExpenseCategory.MEALS]: 'Verpflegung',
  [ExpenseCategory.TRANSPORT]: 'Transport',
  [ExpenseCategory.ACCOMMODATION]: 'Unterkunft',
  [ExpenseCategory.COMMUNICATION]: 'Kommunikation',
  [ExpenseCategory.OFFICE_SUPPLIES]: 'Büromaterial',
  [ExpenseCategory.TRAINING]: 'Fortbildung',
  [ExpenseCategory.CLIENT_ENTERTAINMENT]: 'Kundenbetreuung',
  [ExpenseCategory.OTHER]: 'Sonstiges'
};

export const EXPENSE_STATUS_LABELS: ExpenseStatusLabel = {
  [ExpenseStatus.SUBMITTED]: 'Eingereicht',
  [ExpenseStatus.APPROVED]: 'Genehmigt',
  [ExpenseStatus.REJECTED]: 'Abgelehnt',
  [ExpenseStatus.PAID]: 'Bezahlt'
};

export const DOCUMENT_TYPE_LABELS: DocumentTypeLabel = {
  [DocumentType.CONTRACT]: 'Arbeitsvertrag',
  [DocumentType.CERTIFICATE]: 'Zeugnis',
  [DocumentType.ID_CARD]: 'Personalausweis',
  [DocumentType.PASSPORT]: 'Reisepass',
  [DocumentType.PAYSLIP]: 'Lohnzettel',
  [DocumentType.DRIVER_LICENSE]: 'Führerschein',
  [DocumentType.QUALIFICATION]: 'Qualifikation',
  [DocumentType.TRAINING_CERTIFICATE]: 'Fortbildungsnachweis',
  [DocumentType.MEDICAL_CERTIFICATE]: 'Arbeitsunfähigkeitsbescheinigung',
  [DocumentType.OTHER]: 'Sonstiges'
};

// ============================================================================
// PAYSLIP TYPES
// ============================================================================

export interface PayslipEntry {
  id: string;
  employee_id: string;
  payroll_run_id: string;
  gross_salary: number;
  net_salary: number;
  payroll_period_start: string;
  payroll_period_end: string;
  status: 'draft' | 'pending' | 'paid';
  created_at: string;
  updated_at: string;
  
  // Zusätzliche Felder für detaillierte Anzeige
  basic_salary?: number;
  overtime_pay?: number;
  bonus?: number;
  allowances?: number;
  deductions?: number;
  tax_amount?: number;
  social_insurance?: number;
  working_hours?: number;
  overtime_hours?: number;
}

export interface PayslipListResponse {
  items: PayslipEntry[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
