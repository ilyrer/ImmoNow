import { apiClient } from '../api/config';

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  transitions: string[];
  is_terminal: boolean;
  status_mapping?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  board_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  workflow_name: string;
  task_id: string;
  current_stage_id: string;
  current_stage_name?: string;
  history: Array<{
    from: string | null;
    to: string;
    timestamp: string;
    user_id: string;
  }>;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  stages: WorkflowStage[];
  board_id?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  stages?: WorkflowStage[];
  is_active?: boolean;
}

class WorkflowsService {
  /**
   * GET /api/v1/workflows - Liste aller Workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    const response = await apiClient.get<Workflow[]>('/api/v1/workflows');
    return response;
  }

  /**
   * POST /api/v1/workflows - Neuen Workflow erstellen
   */
  async createWorkflow(payload: CreateWorkflowRequest): Promise<Workflow> {
    const response = await apiClient.post<Workflow>('/api/v1/workflows', payload);
    return response;
  }

  /**
   * GET /api/v1/workflows/{id} - Einzelnen Workflow
   */
  async getWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.get<Workflow>(`/api/v1/workflows/${id}`);
    return response;
  }

  /**
   * PUT /api/v1/workflows/{id} - Workflow aktualisieren
   */
  async updateWorkflow(id: string, payload: UpdateWorkflowRequest): Promise<Workflow> {
    const response = await apiClient.put<Workflow>(`/api/v1/workflows/${id}`, payload);
    return response;
  }

  /**
   * DELETE /api/v1/workflows/{id} - Workflow löschen
   */
  async deleteWorkflow(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/workflows/${id}`);
  }

  /**
   * POST /api/v1/workflows/tasks/{id}/start - Workflow für Task starten
   */
  async startWorkflow(taskId: string, workflowId: string): Promise<WorkflowInstance> {
    const response = await apiClient.post<WorkflowInstance>(
      `/api/v1/workflows/tasks/${taskId}/start`,
      { workflow_id: workflowId }
    );
    return response;
  }

  /**
   * POST /api/v1/workflows/tasks/{id}/advance - Workflow-Transition ausführen
   */
  async advanceWorkflow(taskId: string, nextStageId: string): Promise<WorkflowInstance> {
    const response = await apiClient.post<WorkflowInstance>(
      `/api/v1/workflows/tasks/${taskId}/advance`,
      { next_stage_id: nextStageId }
    );
    return response;
  }

  /**
   * GET /api/v1/workflows/tasks/{id}/instance - WorkflowInstance für Task
   */
  async getWorkflowInstance(taskId: string): Promise<WorkflowInstance | null> {
    const response = await apiClient.get<WorkflowInstance | null>(
      `/api/v1/workflows/tasks/${taskId}/instance`
    );
    return response;
  }

  /**
   * GET /api/v1/workflows/tasks/{id}/transitions - Erlaubte nächste Stages
   */
  async getWorkflowTransitions(taskId: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(
      `/api/v1/workflows/tasks/${taskId}/transitions`
    );
    return response;
  }
}

export const workflowsService = new WorkflowsService();
export default workflowsService;

