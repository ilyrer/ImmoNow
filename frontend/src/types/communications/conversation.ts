/**
 * Conversation Types
 * Defines all conversation-related types for the communications module
 */

export type ConversationKind = 'dm' | 'group' | 'object' | 'customer';

export type ConversationStatus = 'active' | 'archived' | 'muted';

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface ConversationMetadata {
  propertyId?: string;
  propertyTitle?: string;
  customerId?: string;
  customerName?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title: string;
  description?: string;
  participants: Participant[];
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  status: ConversationStatus;
  lastMessageAt: string;
  lastMessage?: {
    id: string;
    body: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  };
  metadata?: ConversationMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  conversationId: string;
  body: string;
  attachments?: string[];
  updatedAt: string;
}

export interface ConversationFilter {
  kind?: ConversationKind[];
  status?: ConversationStatus[];
  hasUnread?: boolean;
  isPinned?: boolean;
  searchQuery?: string;
  participantId?: string;
  propertyId?: string;
  customerId?: string;
}
