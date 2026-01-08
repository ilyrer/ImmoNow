import { apiClient } from '../api/config';

export interface AiGeneratedTask {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  labels: string[];
  suggested_tags: string[];
  suggested_story_points?: number;
}

export interface AiAssigneeSuggestion {
  task_id: string;
  assignee_id: string;
  reason: string;
}

export interface AiPrioritySuggestion {
  task_id: string;
  score: number;
  suggested_priority: string;
  rationale: string;
}

export interface BoardSummary {
  board_id: string;
  summary: string;
  highlights: string[];
  risks: string[];
  blockers: string[];
  suggested_actions: string[];
}

class AiService {
  async generateTaskFromText(text: string): Promise<AiGeneratedTask> {
    const response = await apiClient.post<AiGeneratedTask>('/api/v1/ai/tasks/generate', { text });
    return response;
  }

  async summarizeBoard(boardId: string): Promise<BoardSummary> {
    const response = await apiClient.post<BoardSummary>(`/api/v1/ai/boards/${boardId}/summary`);
    return response;
  }
}

export const aiService = new AiService();
export default aiService;

