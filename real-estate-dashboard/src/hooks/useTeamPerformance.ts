/**
 * Team Performance Hooks
 * React Query Hooks für Team Performance mit Live-Updates
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { teamPerformanceService, TeamPerformanceResponse, MemberStatsResponse, ActivityFeedResponse, LeaderboardResponse, TeamMetricsResponse } from '../services/teamPerformance';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const teamPerformanceKeys = {
  all: ['team-performance'] as const,
  performance: (timeframe: string) => [...teamPerformanceKeys.all, 'performance', timeframe] as const,
  memberStats: (memberId: string, timeframe: string) => [...teamPerformanceKeys.all, 'member-stats', memberId, timeframe] as const,
  activityFeed: (limit: number, offset: number) => [...teamPerformanceKeys.all, 'activity-feed', limit, offset] as const,
  leaderboard: (timeframe: string, metric: string) => [...teamPerformanceKeys.all, 'leaderboard', timeframe, metric] as const,
  metrics: () => [...teamPerformanceKeys.all, 'metrics'] as const,
};

// ============================================================================
// TEAM PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook für Team-Performance-Metriken
 */
export const useTeamPerformance = (
  timeframe: 'week' | 'month' | 'quarter' = 'week',
  options?: UseQueryOptions<TeamPerformanceResponse>
) => {
  return useQuery({
    queryKey: teamPerformanceKeys.performance(timeframe),
    queryFn: () => teamPerformanceService.getTeamPerformance(timeframe),
    staleTime: 2 * 60 * 1000, // 2 Minuten
    gcTime: 5 * 60 * 1000, // 5 Minuten
    refetchInterval: 30 * 1000, // Auto-refetch alle 30 Sekunden für Live-Updates
    ...options,
  });
};

/**
 * Hook für einzelne Mitarbeiter-Statistiken
 */
export const useMemberStats = (
  memberId: string,
  timeframe: 'week' | 'month' | 'quarter' = 'week',
  options?: UseQueryOptions<MemberStatsResponse>
) => {
  return useQuery({
    queryKey: teamPerformanceKeys.memberStats(memberId, timeframe),
    queryFn: () => teamPerformanceService.getMemberStats(memberId, timeframe),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 Minuten
    gcTime: 5 * 60 * 1000, // 5 Minuten
    refetchInterval: 30 * 1000, // Auto-refetch alle 30 Sekunden
    ...options,
  });
};

/**
 * Hook für Live-Activity-Feed
 */
export const useActivityFeed = (
  limit: number = 50,
  offset: number = 0,
  options?: UseQueryOptions<ActivityFeedResponse>
) => {
  return useQuery({
    queryKey: teamPerformanceKeys.activityFeed(limit, offset),
    queryFn: () => teamPerformanceService.getActivityFeed(limit, offset),
    staleTime: 30 * 1000, // 30 Sekunden (Activity-Feed ist sehr dynamisch)
    gcTime: 2 * 60 * 1000, // 2 Minuten
    refetchInterval: 15 * 1000, // Auto-refetch alle 15 Sekunden für Live-Updates
    ...options,
  });
};

/**
 * Hook für Team-Leaderboard
 */
export const useTeamLeaderboard = (
  timeframe: 'week' | 'month' | 'quarter' = 'month',
  metric: 'performance_score' | 'tasks_completed' | 'properties_managed' = 'performance_score',
  options?: UseQueryOptions<LeaderboardResponse>
) => {
  return useQuery({
    queryKey: teamPerformanceKeys.leaderboard(timeframe, metric),
    queryFn: () => teamPerformanceService.getTeamLeaderboard(timeframe, metric),
    staleTime: 5 * 60 * 1000, // 5 Minuten (Leaderboard ändert sich weniger häufig)
    gcTime: 10 * 60 * 1000, // 10 Minuten
    refetchInterval: 2 * 60 * 1000, // Auto-refetch alle 2 Minuten
    ...options,
  });
};

/**
 * Hook für Team-Metriken und KPIs
 */
export const useTeamMetrics = (
  options?: UseQueryOptions<TeamMetricsResponse>
) => {
  return useQuery({
    queryKey: teamPerformanceKeys.metrics(),
    queryFn: () => teamPerformanceService.getTeamMetrics(),
    staleTime: 2 * 60 * 1000, // 2 Minuten
    gcTime: 5 * 60 * 1000, // 5 Minuten
    refetchInterval: 30 * 1000, // Auto-refetch alle 30 Sekunden
    ...options,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook für alle Team-Performance-Daten (für Dashboard)
 */
export const useTeamDashboard = (
  timeframe: 'week' | 'month' | 'quarter' = 'week'
) => {
  const queryClient = useQueryClient();

  const performanceQuery = useTeamPerformance(timeframe);
  const metricsQuery = useTeamMetrics();
  const activityQuery = useActivityFeed(20, 0); // Nur die letzten 20 Aktivitäten
  const leaderboardQuery = useTeamLeaderboard(timeframe, 'performance_score');

  const isLoading = performanceQuery.isLoading || metricsQuery.isLoading || activityQuery.isLoading || leaderboardQuery.isLoading;
  const isError = performanceQuery.isError || metricsQuery.isError || activityQuery.isError || leaderboardQuery.isError;
  const error = performanceQuery.error || metricsQuery.error || activityQuery.error || leaderboardQuery.error;

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.all });
  };

  return {
    performance: performanceQuery.data,
    metrics: metricsQuery.data,
    activity: activityQuery.data,
    leaderboard: leaderboardQuery.data,
    isLoading,
    isError,
    error,
    refetchAll,
  };
};

/**
 * Hook für Dashboard-Summary mit allen Daten
 */
export const useDashboardSummary = (
  timeframe: 'week' | 'month' | 'quarter' = 'month'
) => {
  return useQuery({
    queryKey: [...teamPerformanceKeys.all, 'dashboard-summary', timeframe],
    queryFn: () => teamPerformanceService.getDashboardSummary(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook für Finanzielle Übersicht
 */
export const useFinancialOverview = (
  timeframe: 'week' | 'month' | 'quarter' = 'month'
) => {
  return useQuery({
    queryKey: [...teamPerformanceKeys.all, 'financial-overview', timeframe],
    queryFn: () => teamPerformanceService.getFinancialOverview(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook für Schnellaktionen
 */
export const useQuickActions = () => {
  return useQuery({
    queryKey: [...teamPerformanceKeys.all, 'quick-actions'],
    queryFn: () => teamPerformanceService.getQuickActions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook für Member-Performance-Vergleich
 */
export const useMemberComparison = (
  memberIds: string[],
  timeframe: 'week' | 'month' | 'quarter' = 'week'
) => {
  const queries = memberIds.map(memberId => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemberStats(memberId, timeframe, { enabled: !!memberId } as any);
  });

  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const error = queries.find(query => query.error)?.error;

  const members = queries
    .map(query => query.data?.member_stats)
    .filter(Boolean);

  return {
    members,
    isLoading,
    isError,
    error,
  };
};

/**
 * Hook für Performance-Trends
 */
export const usePerformanceTrends = (
  memberId?: string,
  timeframe: 'week' | 'month' | 'quarter' = 'month'
) => {
  const queryClient = useQueryClient();

  // Hole Daten für verschiedene Zeiträume für Trend-Berechnung
  const weekQuery = useTeamPerformance('week', { enabled: !memberId } as any);
  const monthQuery = useTeamPerformance('month', { enabled: !memberId } as any);
  const quarterQuery = useTeamPerformance('quarter', { enabled: !memberId } as any);

  const memberWeekQuery = useMemberStats(memberId!, 'week', { enabled: !!memberId } as any);
  const memberMonthQuery = useMemberStats(memberId!, 'month', { enabled: !!memberId } as any);
  const memberQuarterQuery = useMemberStats(memberId!, 'quarter', { enabled: !!memberId } as any);

  const isLoading = memberId 
    ? memberWeekQuery.isLoading || memberMonthQuery.isLoading || memberQuarterQuery.isLoading
    : weekQuery.isLoading || monthQuery.isLoading || quarterQuery.isLoading;

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 'up' : 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const trends = memberId ? {
    performance: calculateTrend(
      memberMonthQuery.data?.member_stats.performance_score || 0,
      memberWeekQuery.data?.member_stats.performance_score || 0
    ),
    tasks: calculateTrend(
      memberMonthQuery.data?.member_stats.tasks_completed || 0,
      memberWeekQuery.data?.member_stats.tasks_completed || 0
    ),
    properties: calculateTrend(
      memberMonthQuery.data?.member_stats.properties_sold || 0,
      memberWeekQuery.data?.member_stats.properties_sold || 0
    ),
  } : {
    performance: calculateTrend(
      monthQuery.data?.team_performance_score || 0,
      weekQuery.data?.team_performance_score || 0
    ),
    tasks: calculateTrend(
      monthQuery.data?.total_tasks_completed || 0,
      weekQuery.data?.total_tasks_completed || 0
    ),
    properties: calculateTrend(
      monthQuery.data?.total_properties_managed || 0,
      weekQuery.data?.total_properties_managed || 0
    ),
  };

  return {
    trends,
    isLoading,
    data: memberId ? {
      week: memberWeekQuery.data,
      month: memberMonthQuery.data,
      quarter: memberQuarterQuery.data,
    } : {
      week: weekQuery.data,
      month: monthQuery.data,
      quarter: quarterQuery.data,
    },
  };
};

// ============================================================================
// CACHE MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook für Cache-Invalidierung bei Team-Performance-Updates
 */
export const useTeamPerformanceCache = () => {
  const queryClient = useQueryClient();

  const invalidatePerformance = (timeframe?: string) => {
    if (timeframe) {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.performance(timeframe) });
    } else {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.all });
    }
  };

  const invalidateMemberStats = (memberId: string, timeframe?: string) => {
    if (timeframe) {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.memberStats(memberId, timeframe) });
    } else {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.all });
    }
  };

  const invalidateActivityFeed = () => {
    queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.activityFeed(50, 0) });
  };

  const invalidateLeaderboard = (timeframe?: string, metric?: string) => {
    if (timeframe && metric) {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.leaderboard(timeframe, metric) });
    } else {
      queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.all });
    }
  };

  const invalidateMetrics = () => {
    queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.metrics() });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: teamPerformanceKeys.all });
  };

  return {
    invalidatePerformance,
    invalidateMemberStats,
    invalidateActivityFeed,
    invalidateLeaderboard,
    invalidateMetrics,
    invalidateAll,
  };
};
