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

export interface WipStatus {
  current: number;
  limit: number;
  is_over_limit: boolean;
}

export interface BoardWipStatus {
  [statusKey: string]: WipStatus;
}

class BoardsService {
  async listBoards(projectId?: string): Promise<BoardResponse[]> {
    const response = await apiClient.get<BoardResponse[]>('/api/v1/boards', {
      params: projectId ? { project_id: projectId } : undefined,
    });
    return response;
  }

  async getBoardWipStatus(boardId: string): Promise<BoardWipStatus> {
    const response = await apiClient.get<BoardWipStatus>(`/api/v1/boards/${boardId}/wip-status`);
    return response;
  }
}

export const boardsService = new BoardsService();
export default boardsService;

