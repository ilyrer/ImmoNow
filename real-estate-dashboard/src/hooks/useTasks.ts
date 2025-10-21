/**
 * Tasks Hooks
 * React Query Hooks für Tasks Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, TaskListParams } from '../services/tasks';
import { 
  TaskResponse, EmployeeResponse, TaskStatisticsResponse, CreateTaskRequest, MoveTaskRequest,
  // New Kanban types
  CreateSubtaskRequest, UpdateSubtaskRequest, CreateLabelRequest, UpdateLabelRequest,
  UploadAttachmentRequest, CreateSprintRequest, UpdateSprintRequest, SprintResponse,
  TaskLabel, TaskSubtask, TaskAttachment
} from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskListParams) => [...taskKeys.lists(), params] as const,
  statistics: () => [...taskKeys.all, 'statistics'] as const,
  employees: () => ['employees', 'list'] as const,
  // New Kanban keys
  labels: () => [...taskKeys.all, 'labels'] as const,
  sprints: () => [...taskKeys.all, 'sprints'] as const,
  sprintsByStatus: (status?: string) => [...taskKeys.sprints(), status] as const,
};

/**
 * Hook für Task-Liste
 */
export const useTasks = (params: TaskListParams) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksService.listTasks(params),
    staleTime: 60_000, // 1 Minute Cache
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskRequest> }) =>
      tasksService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
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

// =============================================
// New Kanban Hooks
// =============================================

/**
 * Hook für Labels auflisten
 */
export const useLabels = () => {
  return useQuery({
    queryKey: taskKeys.labels(),
    queryFn: () => tasksService.getLabels(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Label erstellen
 */
export const useCreateLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.createLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels() });
    },
  });
};

/**
 * Hook für Label aktualisieren
 */
export const useUpdateLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLabelRequest }) =>
      tasksService.updateLabel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Label löschen
 */
export const useDeleteLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Subtask erstellen
 */
export const useCreateSubtask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CreateSubtaskRequest }) =>
      tasksService.createSubtask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Subtask aktualisieren
 */
export const useUpdateSubtask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubtaskRequest }) =>
      tasksService.updateSubtask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Subtask löschen
 */
export const useDeleteSubtask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Attachment hochladen
 */
export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UploadAttachmentRequest }) =>
      tasksService.uploadAttachment(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Attachment löschen
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Watcher hinzufügen
 */
export const useAddWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      tasksService.addWatcher(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Watcher entfernen
 */
export const useRemoveWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      tasksService.removeWatcher(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Sprints auflisten
 */
export const useSprints = (status?: string) => {
  return useQuery({
    queryKey: taskKeys.sprintsByStatus(status),
    queryFn: () => tasksService.getSprints(status),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Sprint erstellen
 */
export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.createSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.sprints() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Sprint aktualisieren
 */
export const useUpdateSprint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSprintRequest }) =>
      tasksService.updateSprint(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.sprints() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/**
 * Hook für Sprint löschen
 */
export const useDeleteSprint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksService.deleteSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.sprints() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};
