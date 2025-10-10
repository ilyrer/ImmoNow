/**
 * Tasks Service
 * Implementiert alle Task/Kanban-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
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
  due_date_from?: string;
  due_date_to?: string;
  archived?: boolean;
}

class TasksService {
  /**
   * GET /tasks - Tasks auflisten
   */
  async listTasks(params: TaskListParams): Promise<TaskResponse[]> {
    const response = await apiClient.get<TaskResponse[]>('/tasks', params);
    return response.data;
  }

  /**
   * POST /tasks - Task erstellen
   */
  async createTask(payload: CreateTaskRequest): Promise<TaskResponse> {
    const response = await apiClient.post<TaskResponse>('/tasks', payload);
    return response.data;
  }

  /**
   * PUT /tasks/{id} - Task aktualisieren
   */
  async updateTask(id: string, payload: Partial<CreateTaskRequest>): Promise<TaskResponse> {
    const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, payload);
    return response.data;
  }

  /**
   * PATCH /tasks/{id}/move - Task verschieben
   */
  async moveTask(id: string, payload: MoveTaskRequest): Promise<TaskResponse> {
    const response = await apiClient.patch<TaskResponse>(`/tasks/${id}/move`, payload);
    return response.data;
  }

  /**
   * DELETE /tasks/{id} - Task löschen
   */
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  /**
   * GET /employees - Mitarbeiter auflisten
   */
  async listEmployees(): Promise<EmployeeResponse[]> {
    const response = await apiClient.get<EmployeeResponse[]>('/employees');
    return response.data;
  }

  /**
   * GET /tasks/statistics - Task-Statistiken
   */
  async getStatistics(): Promise<TaskStatisticsResponse> {
    const response = await apiClient.get<TaskStatisticsResponse>('/tasks/statistics');
    return response.data;
  }
}

export const tasksService = new TasksService();
export default tasksService;
