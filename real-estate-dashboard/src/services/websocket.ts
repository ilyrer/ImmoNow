/**
 * WebSocket Service for Real-Time Communications
 */
import { MessageResponse } from '../api/types.gen';

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'video_signal' | 'connection_established' | 'error';
  data?: MessageResponse;
  user_id?: string;
  is_typing?: boolean;
  message_ids?: string[];
  signal?: any;
  sender?: string;
  message?: string;
}

export interface WebSocketCallbacks {
  onMessage?: (message: MessageResponse) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onReadReceipt?: (userId: string, messageIds: string[]) => void;
  onVideoSignal?: (signal: any, sender: string) => void;
  onConnectionEstablished?: () => void;
  onError?: (error: string) => void;
  onDisconnect?: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: WebSocketCallbacks = {};
  private currentConversationId: string | null = null;
  private currentToken: string | null = null;

  connect(conversationId: string, token: string, callbacks: WebSocketCallbacks = {}) {
    this.currentConversationId = conversationId;
    this.currentToken = token;
    this.callbacks = callbacks;

    const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.callbacks.onConnectionEstablished?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.callbacks.onError?.('Invalid message format');
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.callbacks.onError?.('WebSocket connection error');
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.callbacks.onDisconnect?.();
        this.reconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.callbacks.onError?.('Failed to create WebSocket connection');
    }
  }

  private handleMessage(data: WebSocketMessage) {
    switch (data.type) {
      case 'message':
        if (data.data) {
          this.callbacks.onMessage?.(data.data);
        }
        break;
      
      case 'typing':
        if (data.user_id && typeof data.is_typing === 'boolean') {
          this.callbacks.onTyping?.(data.user_id, data.is_typing);
        }
        break;
      
      case 'read_receipt':
        if (data.user_id && data.message_ids) {
          this.callbacks.onReadReceipt?.(data.user_id, data.message_ids);
        }
        break;
      
      case 'video_signal':
        if (data.signal && data.sender) {
          this.callbacks.onVideoSignal?.(data.signal, data.sender);
        }
        break;
      
      case 'connection_established':
        console.log('Connection established:', data.message);
        break;
      
      case 'error':
        console.error('WebSocket error:', data.message);
        this.callbacks.onError?.(data.message || 'Unknown error');
        break;
      
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  sendMessage(content: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content
      }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  sendTypingIndicator(isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        isTyping
      }));
    }
  }

  sendReadReceipt(messageIds: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'read_receipt',
        message_ids: messageIds
      }));
    }
  }

  sendVideoSignal(signal: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'video_signal',
        signal
      }));
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentConversationId && this.currentToken) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.currentConversationId!, this.currentToken!, this.callbacks);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.callbacks.onError?.('Connection lost. Please refresh the page.');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.currentConversationId = null;
    this.currentToken = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
