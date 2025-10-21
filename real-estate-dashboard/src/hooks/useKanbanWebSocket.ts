/**
 * Kanban WebSocket Hook
 * Real-time updates for task management with collaboration features
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Task } from '../types/kanban';

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface TaskUpdateEvent {
  type: 'task.created' | 'task.updated' | 'task.moved' | 'task.deleted';
  task_id?: string;
  task?: Task;
  old_status?: string;
  new_status?: string;
  position?: number;
  user_id: string;
  timestamp: string;
}

export interface CommentEvent {
  type: 'task.comment.added';
  task_id: string;
  comment: any;
  user_id: string;
  timestamp: string;
}

export interface UserPresenceEvent {
  type: 'user.typing' | 'user.viewing';
  task_id: string;
  user_id: string;
  is_typing?: boolean;
  is_viewing?: boolean;
  timestamp: string;
}

export interface ConnectionEvent {
  type: 'connection.established' | 'connection.error';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  message?: string;
  timestamp: string;
}

export type KanbanWebSocketEvent = TaskUpdateEvent | CommentEvent | UserPresenceEvent | ConnectionEvent | { type: 'pong' };

export interface UseKanbanWebSocketOptions {
  tenantId: string;
  token: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseKanbanWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // taskId -> userIds
  viewingUsers: Record<string, string[]>; // taskId -> userIds
}

// ============================================================================
// WEBSOCKET HOOK
// ============================================================================

export const useKanbanWebSocket = (options: UseKanbanWebSocketOptions): UseKanbanWebSocketReturn => {
  const {
    tenantId,
    token,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [viewingUsers, setViewingUsers] = useState<Record<string, string[]>>({});

  // ============================================================================
  // WEBSOCKET CONNECTION MANAGEMENT
  // ============================================================================

  const connect = useCallback(() => {
    if (!enabled || !tenantId || !token) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/kanban/${tenantId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Kanban WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onclose = (event) => {
        console.log('🔌 Kanban WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Kanban WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: KanbanWebSocketEvent = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [enabled, tenantId, token, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const handleMessage = useCallback((message: KanbanWebSocketEvent) => {
    console.log('📨 Kanban WebSocket message:', message);

    switch (message.type) {
      case 'connection.established':
        if (message.user) {
          setOnlineUsers(prev => [...prev.filter(id => id !== message.user!.id), message.user!.id]);
        }
        break;

      case 'connection.error':
        setError(message.message || 'Connection error');
        break;

      case 'task.created':
      case 'task.updated':
      case 'task.moved':
      case 'task.deleted':
        handleTaskUpdate(message as TaskUpdateEvent);
        break;

      case 'task.comment.added':
        handleCommentAdded(message as CommentEvent);
        break;

      case 'user.typing':
        handleUserTyping(message as UserPresenceEvent);
        break;

      case 'user.viewing':
        handleUserViewing(message as UserPresenceEvent);
        break;

      case 'pong':
        // Handle pong response
        break;

      default:
        console.warn('Unknown WebSocket message type:', (message as any).type);
    }
  }, []);

  const handleTaskUpdate = useCallback((event: TaskUpdateEvent) => {
    // Invalidate task queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['task-statistics'] });

    // Optimistic update for better UX
    if (event.type === 'task.moved' && event.task_id && event.new_status) {
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: any) => {
        if (!oldData) return oldData;

        return oldData.map((task: Task) =>
          task.id === event.task_id
            ? { ...task, status: event.new_status, updatedAt: event.timestamp }
            : task
        );
      });
    }
  }, [queryClient]);

  const handleCommentAdded = useCallback((event: CommentEvent) => {
    // Invalidate task comments
    queryClient.invalidateQueries({ queryKey: ['tasks', event.task_id, 'comments'] });
  }, [queryClient]);

  const handleUserTyping = useCallback((event: UserPresenceEvent) => {
    if (!event.task_id) return;

    setTypingUsers(prev => {
      const currentTyping = prev[event.task_id] || [];
      
      if (event.is_typing) {
        return {
          ...prev,
          [event.task_id]: [...currentTyping.filter(id => id !== event.user_id), event.user_id]
        };
      } else {
        return {
          ...prev,
          [event.task_id]: currentTyping.filter(id => id !== event.user_id)
        };
      }
    });
  }, []);

  const handleUserViewing = useCallback((event: UserPresenceEvent) => {
    if (!event.task_id) return;

    setViewingUsers(prev => {
      const currentViewing = prev[event.task_id] || [];
      
      if (event.is_viewing) {
        return {
          ...prev,
          [event.task_id]: [...currentViewing.filter(id => id !== event.user_id), event.user_id]
        };
      } else {
        return {
          ...prev,
          [event.task_id]: currentViewing.filter(id => id !== event.user_id)
        };
      }
    });
  }, []);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    onlineUsers,
    typingUsers,
    viewingUsers,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for sending task updates via WebSocket
 */
export const useTaskWebSocketActions = (websocket: UseKanbanWebSocketReturn) => {
  const sendTaskCreated = useCallback((task: Task) => {
    websocket.sendMessage({
      type: 'task.created',
      task: task,
    });
  }, [websocket]);

  const sendTaskUpdated = useCallback((taskId: string, task: Task) => {
    websocket.sendMessage({
      type: 'task.updated',
      task_id: taskId,
      task: task,
    });
  }, [websocket]);

  const sendTaskMoved = useCallback((taskId: string, oldStatus: string, newStatus: string, position?: number) => {
    websocket.sendMessage({
      type: 'task.moved',
      task_id: taskId,
      old_status: oldStatus,
      new_status: newStatus,
      position: position,
    });
  }, [websocket]);

  const sendTaskDeleted = useCallback((taskId: string) => {
    websocket.sendMessage({
      type: 'task.deleted',
      task_id: taskId,
    });
  }, [websocket]);

  const sendCommentAdded = useCallback((taskId: string, comment: any) => {
    websocket.sendMessage({
      type: 'task.comment.added',
      task_id: taskId,
      comment: comment,
    });
  }, [websocket]);

  const sendUserTyping = useCallback((taskId: string, isTyping: boolean) => {
    websocket.sendMessage({
      type: 'user.typing',
      task_id: taskId,
      is_typing: isTyping,
    });
  }, [websocket]);

  const sendUserViewing = useCallback((taskId: string, isViewing: boolean) => {
    websocket.sendMessage({
      type: 'user.viewing',
      task_id: taskId,
      is_viewing: isViewing,
    });
  }, [websocket]);

  return {
    sendTaskCreated,
    sendTaskUpdated,
    sendTaskMoved,
    sendTaskDeleted,
    sendCommentAdded,
    sendUserTyping,
    sendUserViewing,
  };
};
