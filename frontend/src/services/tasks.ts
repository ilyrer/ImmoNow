/**
 * Tasks Service
 * Implementiert alle Task/Kanban-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../api/config';
import {
  TaskResponse,
  TaskStatisticsResponse,
  EmployeeResponse,
  CreateTaskRequest,
  MoveTaskRequest,
  PaginationParams,
  SortParams
} from '../lib/api/types';

export interface TaskListParams extends PaginationParams, SortParams {
  status?: string;
  priority?: string;
  assignee_id?: string;
  property_id?: string;
  tags?: string[];
  label_ids?: string[];
  project_id?: string;
  board_id?: string;
  overdue_only?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  archived?: boolean;
}

class TasksService {
  /**
   * GET /api/v1/tasks - Tasks auflisten
   */
  async listTasks(params: TaskListParams): Promise<TaskResponse[]> {
    const response = await apiClient.get<any>('/api/v1/tasks', { params });
    // Backend returns PaginatedResponse with {items, total, page, ...}
    // Extract items array
    if (response && typeof response === 'object' && 'items' in response) {
      return response.items;
    }
    // Fallback if response is already an array
    return Array.isArray(response) ? response : [];
  }

  /**
   * POST /api/v1/tasks - Task erstellen
   */
  async createTask(payload: CreateTaskRequest): Promise<TaskResponse> {
    const response = await apiClient.post<TaskResponse>('/api/v1/tasks', payload);
    return response;
  }

  /**
   * PUT /api/v1/tasks/{id} - Task aktualisieren
   */
  async updateTask(id: string, payload: Partial<CreateTaskRequest>): Promise<TaskResponse> {
    const response = await apiClient.put<TaskResponse>(`/api/v1/tasks/${id}`, payload);
    return response;
  }

  /**
   * PATCH /api/v1/tasks/{id}/move - Task verschieben
   */
  async moveTask(id: string, payload: MoveTaskRequest): Promise<TaskResponse> {
    const response = await apiClient.patch<TaskResponse>(`/api/v1/tasks/${id}/move`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/tasks/{id} - Task löschen
   */
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${id}`);
  }

  /**
   * GET /api/v1/employees - Mitarbeiter auflisten
   */
  async listEmployees(): Promise<EmployeeResponse[]> {
    const response = await apiClient.get<EmployeeResponse[]>('/api/v1/employees');
    return response;
  }

  /**
   * GET /api/v1/tasks/statistics - Task-Statistiken
   */
  async getStatistics(): Promise<TaskStatisticsResponse> {
    const response = await apiClient.get<TaskStatisticsResponse>('/api/v1/tasks/statistics');
    return response;
  }

  /**
   * GET /api/v1/tasks/{id}/transitions - Erlaubte Status-Transitions
   */
  async getTaskTransitions(taskId: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/api/v1/tasks/${taskId}/transitions`);
    return response;
  }

  /**
   * POST /api/v1/tasks/bulk-update - Bulk-Update für mehrere Tasks
   */
  async bulkUpdateTasks(taskIds: string[], updates: Partial<CreateTaskRequest>): Promise<{
    updated_count: number;
    failed_count: number;
    errors: Array<{ task_id: string; error: string }>;
  }> {
    const response = await apiClient.post<{
      updated_count: number;
      failed_count: number;
      errors: Array<{ task_id: string; error: string }>;
    }>('/api/v1/tasks/bulk-update', {
      task_ids: taskIds,
      updates: updates
    });
    return response;
  }
}

export const tasksService = new TasksService();
export default tasksService;
