import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Edit3,
  Trash2,
  Pin,
  Reply,
  Video
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useMessages, useSendMessage, useMarkMessagesAsRead, useCurrentUser } from '../../api/hooks';
import { wsService, WebSocketCallbacks } from '../../services/websocket';
import { VideoCall } from './VideoCall';
import type { MessageResponse } from '../../api/types.gen';

interface MessageThreadProps {
  conversationId: string;
}

const MessageItem: React.FC<{
  message: MessageResponse;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit: (message: MessageResponse) => void;
  onDelete: (message: MessageResponse) => void;
  onReply: (message: MessageResponse) => void;
  onPin: (message: MessageResponse) => void;
}> = ({ message, isOwn, showAvatar, onEdit, onDelete, onReply, onPin }) => {
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-end gap-3 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar
            name={message.sender_name}
            size="sm"
            showStatus={false}
          />
        </div>
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {message.sender_name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}
        <div className={`
          max-w-xs px-4 py-2 rounded-xl
          ${isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Read Receipt */}
        {isOwn && message.is_read && (
          <div className="flex items-center justify-end mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ✓✓ Gelesen
            </span>
          </div>
        )}
      </div>
      {isOwn && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar
            name={message.sender_name}
            size="sm"
            showStatus={false}
          />
        </div>
      )}
    </div>
  );
};

export const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showVideoCall, setShowVideoCall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: user } = useCurrentUser();
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  const messages = messagesData?.items || [];

  // WebSocket connection
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const callbacks: WebSocketCallbacks = {
      onMessage: (message: MessageResponse) => {
        // Message will be automatically updated via React Query cache invalidation
        console.log('New message received:', message);
      },
      onTyping: (userId: string, isTyping: boolean) => {
        if (userId !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (isTyping) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      },
      onReadReceipt: (userId: string, messageIds: string[]) => {
        console.log('Read receipt:', userId, messageIds);
        // Update message read status in UI
      },
      onConnectionEstablished: () => {
        console.log('WebSocket connected');
      },
      onError: (error: string) => {
        console.error('WebSocket error:', error);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        setTypingUsers(new Set());
      }
    };

    wsService.connect(conversationId, token, callbacks);

    return () => {
      wsService.disconnect();
    };
  }, [conversationId, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      const unreadMessageIds = messages
        .filter(msg => !msg.is_read && msg.sender_id !== user.id)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        markAsRead.mutate({ message_ids: unreadMessageIds });
        // Also send via WebSocket for real-time updates
        wsService.sendReadReceipt(unreadMessageIds);
      }
    }
  }, [messages, user?.id, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      // Send via WebSocket for real-time delivery
      wsService.sendMessage(newMessage);
      
      // Also send via API for persistence
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        content: newMessage,
        message_type: 'text' as any,
        metadata: {
          attachments: attachments.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          reply_to: replyingTo?.id
        }
      });
      
      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);
      
      // Stop typing indicator
      wsService.sendTypingIndicator(false);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      wsService.sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendTypingIndicator(false);
      setIsTyping(false);
    }, 2000);
  };

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`Datei ${file.name} ist zu groß. Maximum: 10MB`);
        continue;
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'video/mp4', 'video/webm',
        'audio/mp3', 'audio/wav', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Dateityp ${file.type} nicht erlaubt`);
        continue;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Get a temporary message ID for upload
        const tempMessageId = 'temp-' + Date.now();
        
        const response = await fetch(`/api/v1/communications/messages/${tempMessageId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const attachment = await response.json();
          console.log('File uploaded:', attachment);
          
          // Add attachment info to message metadata
          setAttachments(prev => [...prev, file]);
        } else {
          const error = await response.json();
          alert(`Upload fehlgeschlagen: ${error.detail}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload fehlgeschlagen: ${error}`);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];

    if (!currentMessage || !previousMessage) return true;

    // Show avatar if sender changes or if there's a significant time gap
    return (
      currentMessage.sender_id !== previousMessage.sender_id ||
      new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime() > 5 * 60 * 1000 // 5 minutes
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Video Call Overlay */}
      {showVideoCall && (
        <VideoCall
          conversationId={conversationId}
          onEndCall={() => setShowVideoCall(false)}
        />
      )}
      
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === user?.id;

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={shouldShowAvatar(index)}
              onEdit={(msg) => {
                setNewMessage(msg.content);
                textareaRef.current?.focus();
              }}
              onDelete={(msg) => {
                // TODO: Implement delete message
                console.log('Delete message:', msg.id);
              }}
              onReply={(msg) => {
                setReplyingTo(msg);
                textareaRef.current?.focus();
              }}
              onPin={(msg) => {
                // TODO: Implement pin message
                console.log('Pin message:', msg.id);
              }}
            />
          );
        })}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {typingUsers.size === 1 ? 'Jemand tippt...' : `${typingUsers.size} Personen tippen...`}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-3 mx-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Antwort auf {replyingTo.sender_name}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg border">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="text-gray-500 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-3">
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <button className="p-2 text-gray-500 hover:text-blue-600">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowVideoCall(true)}
            className="p-2 text-gray-500 hover:text-blue-600"
            title="Video-Anruf starten"
          >
            <Video className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="
              flex-1 p-3 pr-10
              bg-gray-100 dark:bg-gray-700
              border border-gray-200 dark:border-gray-600
              rounded-lg resize-none
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
            "
            rows={1}
            style={{ maxHeight: '150px' }}
          />
          <button className="p-2 text-gray-500 hover:text-blue-600">
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className="
              p-2 rounded-lg
              bg-blue-600 text-white
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};