/**
 * Notification Hooks
 * Custom React Hooks für Notification Management
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../lib/api/notifications';
import type {
  Notification,
  NotificationListResponse,
  NotificationFilter,
  NotificationStats,
  NotificationPreference,
  NotificationUpdate,
} from '../types/notification';

const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  list: (filters: NotificationFilter) => [...NOTIFICATION_KEYS.lists(), filters] as const,
  details: () => [...NOTIFICATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...NOTIFICATION_KEYS.details(), id] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
  stats: () => [...NOTIFICATION_KEYS.all, 'stats'] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, 'preferences'] as const,
};

interface UseNotificationsOptions {
  page?: number;
  size?: number;
  filters?: NotificationFilter;
  includeStats?: boolean;
  refetchInterval?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch and manage notifications list
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    page = 1,
    size = 20,
    filters = {},
    includeStats = false,
    refetchInterval,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.list({ ...filters, page, size } as any),
    queryFn: () =>
      notificationAPI.getNotifications({
        page,
        size,
        ...filters,
        include_stats: includeStats,
      }),
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });

  return {
    notifications: query.data?.items || [],
    total: query.data?.total || 0,
    pages: query.data?.pages || 0,
    hasNext: query.data?.has_next || false,
    hasPrev: query.data?.has_prev || false,
    stats: query.data?.stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount(refetchInterval: number = 60000) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationAPI.getUnreadCount(),
    refetchInterval,
    staleTime: 30000,
  });
}

/**
 * Hook to get notification statistics
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.stats(),
    queryFn: () => notificationAPI.getStats(),
    staleTime: 60000,
  });
}

/**
 * Hook to get a single notification
 */
export function useNotification(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.detail(id),
    queryFn: () => notificationAPI.getNotification(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to mark notifications as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) => notificationAPI.markAsRead(notificationIds),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/**
 * Hook to update a notification
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotificationUpdate }) =>
      notificationAPI.updateNotification(id, data),
    onSuccess: (updatedNotification) => {
      // Update the specific notification in cache
      queryClient.setQueryData(
        NOTIFICATION_KEYS.detail(updatedNotification.id),
        updatedNotification
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationAPI.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/**
 * Hook to perform bulk actions on notifications
 */
export function useBulkNotificationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationIds,
      action,
    }: {
      notificationIds: string[];
      action: 'mark_read' | 'mark_unread' | 'archive' | 'delete';
    }) => notificationAPI.bulkAction({ notification_ids: notificationIds, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: () => notificationAPI.getPreferences(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      data,
    }: {
      category: any;
      data: any;
    }) => notificationAPI.updatePreference(category, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences() });
    },
  });
}

/**
 * Comprehensive notification manager hook
 * Provides all notification operations in one place
 */
export function useNotificationManager() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [page, setPage] = useState(1);
  const [size] = useState(20);

  const { data: unreadCount } = useUnreadCount();
  const notificationsQuery = useNotifications({ page, size, filters, includeStats: true });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const updateMutation = useUpdateNotification();
  const deleteMutation = useDeleteNotification();
  const bulkActionMutation = useBulkNotificationAction();

  const markAsRead = useCallback(
    (notificationIds: string[]) => {
      return markAsReadMutation.mutateAsync(notificationIds);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    return markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const updateNotification = useCallback(
    (id: string, data: NotificationUpdate) => {
      return updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const deleteNotification = useCallback(
    (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const bulkAction = useCallback(
    (notificationIds: string[], action: 'mark_read' | 'mark_unread' | 'archive' | 'delete') => {
      return bulkActionMutation.mutateAsync({ notificationIds, action });
    },
    [bulkActionMutation]
  );

  const refetch = useCallback(() => {
    notificationsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() });
  }, [notificationsQuery, queryClient]);

  return {
    // Data
    notifications: notificationsQuery.notifications,
    total: notificationsQuery.total,
    pages: notificationsQuery.pages,
    hasNext: notificationsQuery.hasNext,
    hasPrev: notificationsQuery.hasPrev,
    stats: notificationsQuery.stats,
    unreadCount: unreadCount?.count || 0,

    // State
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,

    // Pagination
    page,
    setPage,
    size,

    // Filters
    filters,
    setFilters,

    // Actions
    markAsRead,
    markAllAsRead,
    updateNotification,
    deleteNotification,
    bulkAction,
    refetch,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkProcessing: bulkActionMutation.isPending,
  };
}

/**
 * Hook to poll for new notifications
 */
export function useNotificationPolling(intervalMs: number = 60000) {
  const { data: unreadCountData } = useUnreadCount(intervalMs);
  const unreadCount = unreadCountData?.count;
  const [previousCount, setPreviousCount] = useState<number>(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (unreadCount !== undefined && unreadCount > previousCount) {
      setHasNewNotifications(true);
      // Auto-reset after 5 seconds
      const timeout = setTimeout(() => setHasNewNotifications(false), 5000);
      return () => clearTimeout(timeout);
    }
    if (unreadCount !== undefined) {
      setPreviousCount(unreadCount);
    }
  }, [unreadCount, previousCount]);

  const clearNewFlag = useCallback(() => {
    setHasNewNotifications(false);
  }, []);

  return {
    unreadCount: unreadCount || 0,
    hasNewNotifications,
    clearNewFlag,
  };
}
