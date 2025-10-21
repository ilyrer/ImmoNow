/**
 * Team Performance API Service
 * TypeScript interfaces and API calls for team performance data
 */

import apiClient from '../api/config';

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface MemberBasicInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  is_active: boolean;
}

export interface MemberStats {
  member: MemberBasicInfo;
  
  // Task metrics
  tasks_total: number;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_overdue: number;
  completion_rate: number;
  
  // Property metrics
  properties_managed: number;
  properties_active: number;
  properties_sold: number;
  
  // Appointment metrics
  appointments_total: number;
  appointments_upcoming: number;
  appointments_completed: number;
  
  // Contact metrics
  contacts_managed: number;
  contacts_new_this_month: number;
  
  // Performance metrics
  performance_score: number;
  avg_task_completion_time_hours: number;
  monthly_target_achievement: number;
  
  // Time-based metrics
  last_activity?: string;
  work_hours_this_week: number;
  work_hours_this_month: number;
}

export interface TeamPerformanceResponse {
  timeframe: string;
  total_members: number;
  active_members: number;
  
  // Team metrics
  team_performance_score: number;
  total_tasks_completed: number;
  total_properties_managed: number;
  total_appointments_scheduled: number;
  total_contacts_managed: number;
  
  // Performance trends
  performance_trend: 'up' | 'down' | 'stable';
  completion_rate_trend: number;
  
  // Member stats
  members: MemberStats[];
  
  // Time-based aggregations
  generated_at: string;
}

export interface MemberStatsResponse {
  member_stats: MemberStats;
  timeframe: string;
  generated_at: string;
}

export interface ActivityItem {
  id: string;
  type: string; // task_created, task_completed, property_added, appointment_scheduled, etc.
  title: string;
  description: string;
  member_id: string;
  member_name: string;
  member_avatar?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityFeedResponse {
  activities: ActivityItem[];
  total_count: number;
  has_more: boolean;
  generated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  member: MemberBasicInfo;
  score: number;
  metric_value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface LeaderboardResponse {
  timeframe: string;
  metric: string;
  entries: LeaderboardEntry[];
  generated_at: string;
}

export interface TeamMetricsResponse {
  // Team size metrics
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  
  // Performance metrics
  team_performance_score: number;
  avg_completion_rate: number;
  avg_task_completion_time_hours: number;
  
  // Business metrics
  total_properties_managed: number;
  total_properties_sold: number;
  total_appointments_scheduled: number;
  total_contacts_managed: number;
  
  // Time-based metrics
  tasks_completed_today: number;
  tasks_completed_this_week: number;
  tasks_completed_this_month: number;
  
  // Trends
  performance_trend: 'up' | 'down' | 'stable';
  completion_rate_trend: number;
  productivity_trend: 'up' | 'down' | 'stable';
  
  generated_at: string;
}

export interface FinancialOverviewResponse {
  total_value: number;
  revenue: number;
  active_properties: number;
  sold_properties: number;
  growth_percentage: number;
  timeframe: string;
  currency: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  available: boolean;
  badge?: number;
}

export interface DashboardSummaryResponse {
  performance: TeamPerformanceResponse;
  metrics: TeamMetricsResponse;
  financial: FinancialOverviewResponse;
  quick_actions: QuickAction[];
  last_updated: string;
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

export class TeamPerformanceService {
  private baseUrl = '/api/v1/team';

  /**
   * Get team performance metrics with aggregations
   */
  async getTeamPerformance(timeframe: 'week' | 'month' | 'quarter' = 'week'): Promise<TeamPerformanceResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/performance`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching team performance:', error);
      throw error;
    }
  }

  /**
   * Get detailed member statistics
   */
  async getMemberStats(memberId: string, timeframe: 'week' | 'month' | 'quarter' = 'week'): Promise<MemberStatsResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/members/${memberId}/stats`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }
  }

  /**
   * Get live activity feed for team
   */
  async getActivityFeed(limit: number = 50, offset: number = 0): Promise<ActivityFeedResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/activity-feed`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  }

  /**
   * Get team leaderboard with rankings
   */
  async getTeamLeaderboard(
    timeframe: 'week' | 'month' | 'quarter' = 'month',
    metric: 'performance_score' | 'tasks_completed' | 'properties_managed' = 'performance_score'
  ): Promise<LeaderboardResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/leaderboard`, {
        params: { timeframe, metric }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get overall team metrics and KPIs
   */
  async getTeamMetrics(): Promise<TeamMetricsResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard summary with all data
   */
  async getDashboardSummary(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<DashboardSummaryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard-summary`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get financial overview including total value and revenue metrics
   */
  async getFinancialOverview(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<FinancialOverviewResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/financial-overview`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      throw error;
    }
  }

  /**
   * Get available quick actions for the dashboard
   */
  async getQuickActions(): Promise<QuickAction[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/quick-actions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      throw error;
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const teamPerformanceService = new TeamPerformanceService();
