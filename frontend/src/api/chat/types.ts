// Chat domain types
export type MessageType = 'text' | 'audio' | 'file' | 'system';

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'admin' | 'manager' | 'agent' | 'client';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  type: MessageType;
  content: string; // for audio/file this is URL
  createdAt: string; // ISO
  author: ChatUser;
  meta?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsResponse {
  items: Conversation[];
  total: number;
}

export interface ListMessagesResponse {
  items: ChatMessage[];
  total: number;
}

export interface SendMessageRequest {
  conversationId: string;
  type: MessageType;
  content: string | File; // audio/file uses multipart
  meta?: Record<string, any>;
}

export interface CreateConversationRequest {
  participantIds: string[];
  title?: string;
}

export interface CreateMeetingFromChatRequest {
  conversationId: string;
  title: string;
  startDatetime: string; // ISO
  endDatetime: string;   // ISO
  attendees?: { userId?: string; contactId?: number; name?: string; email?: string; role: string }[];
}
