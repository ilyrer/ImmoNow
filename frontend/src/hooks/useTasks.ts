/**
 * Tasks Hooks
 * React Query Hooks für Tasks Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, TaskListParams } from '../services/tasks';
import { TaskResponse, EmployeeResponse, TaskStatisticsResponse, CreateTaskRequest, MoveTaskRequest } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskListParams) => [...taskKeys.lists(), params] as const,
  statistics: () => [...taskKeys.all, 'statistics'] as const,
  employees: () => ['employees', 'list'] as const,
};

/**
 * Hook für Task-Liste
 */
export const useTasks = (params: TaskListParams) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksService.listTasks(params),
    staleTime: 0, // Always fresh - refetch on changes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

/**
 * Hook für Task erstellen
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
};

/**
 * Hook für Task aktualisieren
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTaskRequest> }) =>
      tasksService.updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      
      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: taskKeys.all });
      
      // Optimistically update ALL matching queries
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((task: any) =>
            task.id === id ? { ...task, ...payload, updated_at: new Date().toISOString() } : task
          );
        }
        return old;
      });
      
      return { previousData };
    },
    onSuccess: () => {
      // Immediately refetch to show updated data
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error('[useUpdateTask] Error:', err);
    },
  });
};

/**
 * Hook für Task verschieben (Drag & Drop)
 */
export const useMoveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MoveTaskRequest }) =>
      tasksService.moveTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
    // Optimistic Update für bessere UX
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      
      const previousData = queryClient.getQueriesData({ queryKey: taskKeys.all });
      
      // Optimistic Update
      queryClient.setQueriesData({ queryKey: taskKeys.all }, (old: any) => {
        if (!old) return old;
        
        return old.map((task: TaskResponse) =>
          task.id === id
            ? {
                ...task,
                status: payload.new_status || task.status,
                updated_at: new Date().toISOString(),
              }
            : task
        );
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback bei Fehler
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

/**
 * Hook für Task löschen
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
};

/**
 * Hook für Mitarbeiter-Liste
 */
export const useEmployees = () => {
  return useQuery({
    queryKey: taskKeys.employees(),
    queryFn: () => tasksService.listEmployees(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Task-Statistiken
 */
export const useTaskStatistics = () => {
  return useQuery({
    queryKey: taskKeys.statistics(),
    queryFn: () => tasksService.getStatistics(),
    staleTime: 120_000, // 2 Minuten Cache
  });
};

/**
 * Hook für erlaubte Task-Transitions
 */
export const useTaskTransitions = (taskId: string) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'transitions'],
    queryFn: () => tasksService.getTaskTransitions(taskId),
    enabled: !!taskId,
    staleTime: 60_000, // 1 Minute Cache
  });
};

/**
 * Hook für Bulk-Update von Tasks
 */
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskIds, updates }: { taskIds: string[]; updates: Partial<CreateTaskRequest> }) =>
      tasksService.bulkUpdateTasks(taskIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
};
