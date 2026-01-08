/**
 * Workflows Hooks
 * React Query Hooks für Workflows Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsService, Workflow, CreateWorkflowRequest, UpdateWorkflowRequest, WorkflowInstance } from '../services/workflows';

// Query Keys
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  detail: (id: string) => [...workflowKeys.all, 'detail', id] as const,
  instance: (taskId: string) => [...workflowKeys.all, 'instance', taskId] as const,
  transitions: (taskId: string) => [...workflowKeys.all, 'transitions', taskId] as const,
};

/**
 * Hook für Workflow-Liste
 */
export const useWorkflows = () => {
  return useQuery({
    queryKey: workflowKeys.lists(),
    queryFn: () => workflowsService.listWorkflows(),
    staleTime: 60_000, // 1 Minute Cache
  });
};

/**
 * Hook für einzelnen Workflow
 */
export const useWorkflow = (id: string) => {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => workflowsService.getWorkflow(id),
    enabled: !!id,
    staleTime: 60_000,
  });
};

/**
 * Hook für Workflow erstellen
 */
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowsService.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
};

/**
 * Hook für Workflow aktualisieren
 */
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkflowRequest }) =>
      workflowsService.updateWorkflow(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(data.id) });
    },
  });
};

/**
 * Hook für Workflow löschen
 */
export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowsService.deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
};

/**
 * Hook für Workflow starten
 */
export const useStartWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, workflowId }: { taskId: string; workflowId: string }) =>
      workflowsService.startWorkflow(taskId, workflowId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(data.task_id) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Hook für Workflow-Transition
 */
export const useAdvanceWorkflow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, nextStageId }: { taskId: string; nextStageId: string }) =>
      workflowsService.advanceWorkflow(taskId, nextStageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(data.task_id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.transitions(data.task_id) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Hook für WorkflowInstance
 */
export const useWorkflowInstance = (taskId: string) => {
  return useQuery({
    queryKey: workflowKeys.instance(taskId),
    queryFn: () => workflowsService.getWorkflowInstance(taskId),
    enabled: !!taskId,
    staleTime: 30_000, // 30 Sekunden Cache
  });
};

/**
 * Hook für Workflow-Transitions
 */
export const useWorkflowTransitions = (taskId: string) => {
  return useQuery({
    queryKey: workflowKeys.transitions(taskId),
    queryFn: () => workflowsService.getWorkflowTransitions(taskId),
    enabled: !!taskId,
    staleTime: 30_000,
  });
};

