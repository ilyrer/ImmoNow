import { apiClient } from '../lib/api/client';

export interface BoardStatus {
  id: string;
  key: string;
  title: string;
  color: string;
  order: number;
  wip_limit?: number;
  is_terminal?: boolean;
  allow_from?: string[];
}

export interface BoardResponse {
  id: string;
  name: string;
  description?: string;
  team?: string;
  project_id?: string;
  wip_limit?: number;
  statuses: BoardStatus[];
  created_at: string;
  updated_at: string;
}

class BoardsService {
  async listBoards(projectId?: string): Promise<BoardResponse[]> {
    const response = await apiClient.get<BoardResponse[]>('/api/v1/boards', {
      params: projectId ? { project_id: projectId } : undefined,
    });
    return response;
  }
}

export const boardsService = new BoardsService();
export default boardsService;

