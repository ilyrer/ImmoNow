/**
 * Global Type Augmentations and Fixes
 * Erweitert bestehende Types um fehlende Properties für Backward Compatibility
 */

declare global {
  // Erweitere Window-Interface falls nötig
  interface Window {
    __MOCK_DATA__?: any;
  }
}

// Type Aliases für häufig verwendete Strukturen
export type TaskPriorityExtended = 'lowest' | 'low' | 'medium' | 'high' | 'highest' | 'critical' | 'urgent';
export type TaskStatusExtended = 'backlog' | 'todo' | 'inProgress' | 'in_progress' | 'review' | 'done' | 'blocked' | 'onHold';

// Erweiterte Property Response mit optionalen Feldern
export interface PropertyExtended {
  id: string;
  title?: string;
  location?: string;
  address?: string;
  city?: string;
  price?: number;
  status?: string;
  type?: string;
  [key: string]: any;
}

// Erweiterte Employee Response
export interface EmployeeExtended {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  position?: string;
  department?: string;
  status?: string;
  is_active?: boolean;
  performance_score?: number;
  skills?: string[];
  languages?: string[];
  phone?: string;
  [key: string]: any;
}

// Erweiterte User Response
export interface UserExtended {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  tenant_id: string;
  avatar?: string;
  [key: string]: any;
}

// Erweiterte Task Response mit flexiblen Feldern
export interface TaskExtended {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusExtended;
  priority?: TaskPriorityExtended;
  assignee?: any;
  assignee_id?: string;
  due_date?: string;
  deadline?: string;
  completed?: boolean;
  tags?: string[];
  [key: string]: any;
}

// Dashboard Analytics Types
export interface DashboardOverviewData {
  data: any;
  performance_trends?: any;
  recent_activities?: any[];
  [key: string]: any;
}

export interface PerformanceData {
  data: any;
  summary?: any;
  daily_trends?: any[];
  [key: string]: any;
}

export interface PropertyAnalyticsData {
  data: {
    monthly_trends: any[];
    price_statistics: {
      avg_price: number;
    };
    total_properties: number;
    by_type: any[];
    by_status: any[];
  };
  by_type?: any[];
  by_status?: any[];
  [key: string]: any;
}

export interface MeasuresData {
  data: any[];
  metrics?: any[];
  items?: any[];
  [key: string]: any;
}

// Portfolio KPIs mit snake_case
export interface PortfolioKPIsExtended {
  total_value?: number;
  totalValue?: number;
  asset_count?: number;
  assetCount?: number;
  average_roi?: number;
  averageROI?: number;
  total_cashflow?: number;
  totalCashflow?: number;
  vacancy_rate?: number;
  vacancyRate?: number;
  [key: string]: any;
}

export {};
