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
  SortParams,
  // New Kanban types
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
  CreateLabelRequest,
  UpdateLabelRequest,
  UploadAttachmentRequest,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintResponse,
  TaskLabel,
  TaskSubtask,
  TaskAttachment
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
   * GET /api/v1/tasks - Tasks auflisten
   */
  async listTasks(params: TaskListParams): Promise<TaskResponse[]> {
    const response = await apiClient.get<TaskResponse[]>('/api/v1/tasks', { params });
    return response;
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
   * GET /api/v1/admin/employees - Mitarbeiter auflisten
   */
  async listEmployees(): Promise<EmployeeResponse[]> {
    const response = await apiClient.get<any>('/api/v1/admin/employees');
    // Handle both array and paginated response
    return Array.isArray(response) ? response : response.items || [];
  }

  /**
   * GET /api/v1/tasks/statistics - Task-Statistiken
   */
  async getStatistics(): Promise<TaskStatisticsResponse> {
    const response = await apiClient.get<TaskStatisticsResponse>('/api/v1/tasks/statistics');
    return response;
  }

  // =============================================
  // New Kanban API Methods
  // =============================================

  /**
   * POST /api/v1/tasks/labels - Label erstellen
   */
  async createLabel(payload: CreateLabelRequest): Promise<TaskLabel> {
    const response = await apiClient.post<TaskLabel>('/api/v1/tasks/labels', payload);
    return response;
  }

  /**
   * GET /api/v1/tasks/labels - Labels auflisten
   */
  async getLabels(): Promise<TaskLabel[]> {
    const response = await apiClient.get<TaskLabel[]>('/api/v1/tasks/labels');
    return response;
  }

  /**
   * PUT /api/v1/tasks/labels/{id} - Label aktualisieren
   */
  async updateLabel(id: string, payload: UpdateLabelRequest): Promise<TaskLabel> {
    const response = await apiClient.put<TaskLabel>(`/api/v1/tasks/labels/${id}`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/tasks/labels/{id} - Label löschen
   */
  async deleteLabel(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/labels/${id}`);
  }

  /**
   * POST /api/v1/tasks/{task_id}/subtasks - Subtask erstellen
   */
  async createSubtask(taskId: string, payload: CreateSubtaskRequest): Promise<TaskSubtask> {
    const response = await apiClient.post<TaskSubtask>(`/api/v1/tasks/${taskId}/subtasks`, payload);
    return response;
  }

  /**
   * PUT /api/v1/tasks/subtasks/{id} - Subtask aktualisieren
   */
  async updateSubtask(id: string, payload: UpdateSubtaskRequest): Promise<TaskSubtask> {
    const response = await apiClient.put<TaskSubtask>(`/api/v1/tasks/subtasks/${id}`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/tasks/subtasks/{id} - Subtask löschen
   */
  async deleteSubtask(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/subtasks/${id}`);
  }

  /**
   * POST /api/v1/tasks/{task_id}/attachments - Attachment hochladen
   */
  async uploadAttachment(taskId: string, payload: UploadAttachmentRequest): Promise<TaskAttachment> {
    const response = await apiClient.post<TaskAttachment>(`/api/v1/tasks/${taskId}/attachments`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/tasks/attachments/{id} - Attachment löschen
   */
  async deleteAttachment(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/attachments/${id}`);
  }

  /**
   * GET /api/v1/tasks/{task_id}/attachments - Anhänge listen
   */
  async getAttachments(taskId: string): Promise<TaskAttachment[]> {
    const response = await apiClient.get<TaskAttachment[]>(`/api/v1/tasks/${taskId}/attachments`);
    return response;
  }

  /**
   * GET /api/v1/tasks/{task_id}/comments - Kommentare auflisten
   */
  async getComments(taskId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/api/v1/tasks/${taskId}/comments`);
    return response;
  }

  /**
   * POST /api/v1/tasks/{task_id}/comments - Kommentar erstellen
   */
  async addComment(taskId: string, payload: { text: string; parentId?: string }): Promise<any> {
    const response = await apiClient.post<any>(`/api/v1/tasks/${taskId}/comments`, payload);
    return response;
  }

  /**
   * GET /api/v1/tasks/{task_id}/activity - Aktivität laden
   */
  async getActivity(taskId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/api/v1/tasks/${taskId}/activity`);
    return response;
  }

  /**
   * POST /api/v1/tasks/{task_id}/watchers/{user_id} - Watcher hinzufügen
   */
  async addWatcher(taskId: string, userId: string): Promise<void> {
    await apiClient.post(`/api/v1/tasks/${taskId}/watchers/${userId}`);
  }

  /**
   * DELETE /api/v1/tasks/{task_id}/watchers/{user_id} - Watcher entfernen
   */
  async removeWatcher(taskId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}/watchers/${userId}`);
  }

  /**
   * POST /api/v1/tasks/sprints - Sprint erstellen
   */
  async createSprint(payload: CreateSprintRequest): Promise<SprintResponse> {
    const response = await apiClient.post<SprintResponse>('/api/v1/tasks/sprints', payload);
    return response;
  }

  /**
   * GET /api/v1/tasks/sprints - Sprints auflisten
   */
  async getSprints(status?: string): Promise<SprintResponse[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<SprintResponse[]>('/api/v1/tasks/sprints', { params });
    return response;
  }

  /**
   * PUT /api/v1/tasks/sprints/{id} - Sprint aktualisieren
   */
  async updateSprint(id: string, payload: UpdateSprintRequest): Promise<SprintResponse> {
    const response = await apiClient.put<SprintResponse>(`/api/v1/tasks/sprints/${id}`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/tasks/sprints/{id} - Sprint löschen
   */
  async deleteSprint(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/sprints/${id}`);
  }
}

export const tasksService = new TasksService();
export default tasksService;
