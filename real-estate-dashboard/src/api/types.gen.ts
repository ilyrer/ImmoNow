/**
 * Generated API Types
 * Based on Backend Pydantic Schemas
 */

// Common Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Plans Types
export interface PlanResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_popular?: boolean;
  created_at: string;
  updated_at: string;
}

// Reset Password Types
export interface ResetPasswordRequest {
  email: string;
}

// Enums
export enum DocumentType {
  CONTRACT = "contract",
  EXPOSE = "expose",
  ENERGY_CERTIFICATE = "energy_certificate",
  FLOOR_PLAN = "floor_plan",
  PHOTO = "photo",
  VIDEO = "video",
  DOCUMENT = "document",
  PRESENTATION = "presentation",
  SPREADSHEET = "spreadsheet",
  PDF = "pdf",
  OTHER = "other"
}

export enum DocumentStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  DONE = "done",
  BLOCKED = "blocked"
}

export enum PropertyType {
  APARTMENT = "apartment",
  HOUSE = "house",
  COMMERCIAL = "commercial",
  LAND = "land",
  OFFICE = "office",
  RETAIL = "retail",
  INDUSTRIAL = "industrial"
}

export enum UserRole {
  ADMIN = "admin",
  EMPLOYEE = "employee",
  CUSTOMER = "customer"
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  tenant_id?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
  tenant: TenantResponse;
  tenant_role: TenantUserInfo;
  available_tenants?: TenantResponse[];
}

export interface RegisterRequest {
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
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
  tenant: TenantResponse;
  tenant_role: TenantUserInfo;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
  tenant: TenantResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar?: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  last_login?: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  billing_cycle: string;
  created_at: string;
}

export interface TenantUserInfo {
  tenant_id: string;
  tenant_name: string;
  role: string;
  can_manage_properties: boolean;
  can_manage_documents: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  is_active: boolean;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  metadata?: { [key: string]: any };
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
}

// Property Types
export interface PropertyResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  property_type: PropertyType;
  price?: number;
  location: string;
  living_area?: number;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  property_type: PropertyType;
  price?: number;
  location: string;
  living_area?: number;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  features?: { [key: string]: any };
}

export interface UpdatePropertyRequest {
  title?: string;
  description?: string;
  status?: string;
  property_type?: PropertyType;
  price?: number;
  location?: string;
  living_area?: number;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  features?: { [key: string]: any };
}

// Document Types
export interface DocumentResponse {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  document_type: DocumentType;
  status: DocumentStatus;
  folder_id?: number;
  property_id?: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  metadata?: { [key: string]: any };
  is_favorite: boolean;
}

export interface DocumentFolderResponse {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parent_id?: number;
}

export interface UploadMetadataRequest {
  title?: string;
  type: string;  // Backend uses 'type' not 'document_type'
  category: string;  // Required by backend
  folder_id?: number;
  property_id?: string;
  contact_id?: string;
  tags?: string[];
  visibility?: string;
  description?: string;
  expiry_date?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  folder_id?: number;
  metadata?: { [key: string]: any };
}

export interface FavoriteToggleResponse {
  is_favorite: boolean;
}

export interface DocumentAnalyticsResponse {
  total_documents: number;
  documents_by_type: { [key: string]: number };
  documents_by_status: { [key: string]: number };
  total_size: number;
  average_size: number;
  recent_uploads: DocumentResponse[];
  storage_usage: { [key: string]: number };
}

// Task Types
export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  comments_count: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  labels?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  labels?: string[];
}

// Contact Types
export interface ContactResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency: string;
  preferences: { [key: string]: any };
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  phone: string;
  company?: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency?: string;
  preferences?: { [key: string]: any };
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency?: string;
  preferences?: { [key: string]: any };
  lead_score?: number;
}

// Analytics Types
export interface DashboardAnalyticsResponse {
  total_properties: number;
  active_properties: number;
  total_contacts: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_documents: number;
  recent_activities: Array<{ [key: string]: any }>;
  property_value_trend: Array<{ [key: string]: any }>;
  contact_conversion_rate: number;
  task_completion_rate: number;
  monthly_revenue?: number;
  monthly_expenses?: number;
  properties_by_type: Record<string, number>;
  properties_by_status: Record<string, number>;
}

export interface PropertyAnalyticsResponse {
  total_properties: number;
  properties_by_type: { [key: string]: number };
  properties_by_status: { [key: string]: number };
  average_price: number;
  price_range: { min: number; max: number };
  properties_by_location: { [key: string]: number };
  monthly_listings: Array<{ [key: string]: any }>;
  conversion_rate: number;
  average_days_on_market: number;
}

export interface ContactAnalyticsResponse {
  total_contacts: number;
  contacts_by_source: { [key: string]: number };
  contacts_by_status: { [key: string]: number };
  lead_score_distribution: { [key: string]: number };
  conversion_rate: number;
  average_response_time: number;
  monthly_new_contacts: Array<{ [key: string]: any }>;
  top_performing_sources: Array<{ [key: string]: any }>;
}

export interface TaskAnalyticsResponse {
  total_tasks: number;
  tasks_by_status: { [key: string]: number };
  tasks_by_priority: { [key: string]: number };
  tasks_by_assignee: { [key: string]: number };
  completion_rate: number;
  average_completion_time: number;
  overdue_tasks: number;
  monthly_task_creation: Array<{ [key: string]: any }>;
  productivity_metrics: { [key: string]: any };
}

// Communications Types
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system"
}

export enum ConversationStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted"
}

export interface ConversationResponse {
  id: string;
  title: string;
  participants: Array<{ [key: string]: any }>;
  last_message?: MessageResponse;
  unread_count: number;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  metadata?: { [key: string]: any };
}

export interface CreateConversationRequest {
  title: string;
  participant_ids: string[];
  initial_message?: string;
  is_group?: boolean;
  metadata?: { [key: string]: any };
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type: MessageType;
  metadata?: { [key: string]: any };
}

export interface UpdateMessageRequest {
  content: string;
  metadata?: { [key: string]: any };
}

export interface MarkAsReadRequest {
  message_ids: string[];
}

// Social Hub Types
export enum SocialPlatform {
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  LINKEDIN = "linkedin",
  TWITTER = "twitter",
  YOUTUBE = "youtube",
  TIKTOK = "tiktok"
}

export enum PostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  PUBLISHED = "published",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export enum PostType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  CAROUSEL = "carousel",
  STORY = "story",
  REEL = "reel"
}

export interface SocialAccountResponse {
  id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  is_active: boolean;
  last_sync?: string;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SocialPostResponse {
  id: string;
  account_id: string;
  platform: SocialPlatform;
  content: string;
  post_type: PostType;
  media_urls: string[];
  status: PostStatus;
  scheduled_at?: string;
  published_at?: string;
  engagement_metrics?: { [key: string]: any };
  hashtags: string[];
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatePostRequest {
  account_ids: string[];
  content: string;
  post_type: PostType;
  media_urls: string[];
  scheduled_at?: string;
  hashtags: string[];
  mentions: string[];
}

export interface UpdatePostRequest {
  content?: string;
  post_type?: PostType;
  media_urls?: string[];
  scheduled_at?: string;
  hashtags?: string[];
  mentions?: string[];
}

export interface SocialAnalyticsResponse {
  total_posts: number;
  posts_by_platform: { [key: string]: number };
  posts_by_status: { [key: string]: number };
  total_engagement: number;
  average_engagement_rate: number;
  top_performing_posts: SocialPostResponse[];
  engagement_trend: Array<{ [key: string]: any }>;
  follower_growth: Array<{ [key: string]: any }>;
  best_posting_times: { [key: string]: number[] };
}

// Finance Types
export enum FinancingType {
  MORTGAGE = "mortgage",
  LEASE = "lease",
  INVESTMENT = "investment",
  REFINANCING = "refinancing"
}

export enum PaymentFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually"
}

export interface FinancingCalculationRequest {
  property_value: number;
  down_payment: number;
  interest_rate: number;
  loan_term_years: number;
  financing_type: FinancingType;
  payment_frequency: PaymentFrequency;
  additional_costs?: { [key: string]: number };
  tax_rate?: number;
  insurance_rate?: number;
}

export interface FinancingCalculationResponse {
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  loan_amount: number;
  down_payment: number;
  property_value: number;
  loan_to_value_ratio: number;
  debt_service_coverage_ratio?: number;
  amortization_schedule: Array<{ [key: string]: any }>;
  payment_breakdown: { [key: string]: number };
  total_costs: { [key: string]: number };
}

export interface InvestmentAnalysisRequest {
  property_value: number;
  purchase_price: number;
  renovation_costs: number;
  monthly_rent: number;
  operating_expenses: number;
  vacancy_rate: number;
  appreciation_rate: number;
  holding_period_years: number;
  financing_details?: FinancingCalculationRequest;
}

export interface InvestmentAnalysisResponse {
  total_investment: number;
  monthly_cash_flow: number;
  annual_cash_flow: number;
  net_operating_income: number;
  cap_rate: number;
  cash_on_cash_return: number;
  internal_rate_of_return: number;
  net_present_value: number;
  gross_rent_multiplier: number;
  debt_service_coverage_ratio?: number;
  break_even_analysis: { [key: string]: any };
  sensitivity_analysis: { [key: string]: any };
}

export interface BankOffer {
  bank_name: string;
  interest_rate: number;
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  fees: { [key: string]: number };
  conditions: string[];
  approval_probability: number;
  processing_time_days: number;
}

export interface BankComparisonRequest {
  loan_amount: number;
  loan_term_years: number;
  property_value: number;
  borrower_profile: { [key: string]: any };
}

export interface BankComparisonResponse {
  offers: BankOffer[];
  best_offer: BankOffer;
  savings_comparison: { [key: string]: number };
  recommendation: string;
  analysis_date: string;
}

export interface FinancingScenario {
  id: string;
  name: string;
  description: string;
  calculation: FinancingCalculationResponse;
  created_at: string;
  updated_at: string;
}

export interface CreateScenarioRequest {
  name: string;
  description: string;
  calculation_request: FinancingCalculationRequest;
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  calculation_request?: FinancingCalculationRequest;
}

export interface ExportRequest {
  format: string;
  include_charts: boolean;
  include_schedule: boolean;
  custom_template?: string;
}

export interface ExportResponse {
  file_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}
