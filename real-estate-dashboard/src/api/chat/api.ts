import { apiClient } from '../config';
import {
  Conversation,
  ListConversationsResponse,
  ChatMessage,
  ListMessagesResponse,
  SendMessageRequest,
  CreateConversationRequest,
  CreateMeetingFromChatRequest
} from './types';

// API base paths (backend TODO: create /chat routes)
const base = '/chat';

export async function listConversations(): Promise<ListConversationsResponse> {
  const { data } = await apiClient.get(`${base}/conversations`);
  return data;
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  const { data } = await apiClient.get(`${base}/conversations/${conversationId}`);
  return data;
}

export async function listMessages(conversationId: string, page = 1, size = 50): Promise<ListMessagesResponse> {
  const { data } = await apiClient.get(`${base}/conversations/${conversationId}/messages`, {
    params: { page, size }
  });
  return data;
}

export async function createConversation(payload: CreateConversationRequest): Promise<Conversation> {
  const { data } = await apiClient.post(`${base}/conversations`, payload);
  return data;
}

export async function sendMessage(payload: SendMessageRequest): Promise<ChatMessage> {
  if (payload.type === 'audio' || payload.type === 'file') {
    const form = new FormData();
    form.append('conversationId', payload.conversationId);
    form.append('type', payload.type);
    form.append('file', payload.content as File);
    if (payload.meta) form.append('meta', JSON.stringify(payload.meta));
    const { data } = await apiClient.post(`${base}/messages/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
  const { data } = await apiClient.post(`${base}/messages`, {
    conversationId: payload.conversationId,
    type: payload.type,
    content: payload.content,
    meta: payload.meta || {}
  });
  return data;
}

export async function createMeetingFromChat(payload: CreateMeetingFromChatRequest) {
  // bridges to calendar service on backend
  const { data } = await apiClient.post(`${base}/conversations/${payload.conversationId}/create-meeting`, payload);
  return data;
}

export async function markConversationRead(conversationId: string) {
  const { data } = await apiClient.post(`${base}/conversations/${conversationId}/read`);
  return data;
}

export async function listCoworkers(search?: string) {
  const { data } = await apiClient.get(`${base}/coworkers`, { params: { search } });
  return data as { items: { id: string; name: string; role?: string; avatarUrl?: string }[] };
}
