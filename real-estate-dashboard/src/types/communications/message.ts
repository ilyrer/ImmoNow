/**
 * Message Types
 * Defines all message-related types for the chat system
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type AttachmentType = 'image' | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'video' | 'other';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  name: string;
  size: number;
  mimeType?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export interface MessageMention {
  userId: string;
  userName: string;
  startIndex: number;
  length: number;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface MessageQuote {
  messageId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  html?: string;
  attachments: Attachment[];
  mentions: MessageMention[];
  reactions: MessageReaction[];
  quote?: MessageQuote;
  status: MessageStatus;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  readBy: string[];
  deliveredTo: string[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  startedAt: string;
}

export interface PresenceStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeenAt?: string;
  customStatus?: string;
}

export interface MessageFilter {
  conversationId: string;
  authorId?: string;
  hasAttachments?: boolean;
  attachmentType?: AttachmentType;
  isPinned?: boolean;
  searchQuery?: string;
  before?: string;
  after?: string;
}

export interface MessageComposerState {
  body: string;
  attachments: File[];
  mentions: MessageMention[];
  quote?: MessageQuote;
  editingMessageId?: string;
}
