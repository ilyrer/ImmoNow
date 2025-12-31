import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Types matching backend schemas
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    metadata?: Record<string, any>;
}

export interface RetrievedChunk {
    content: string;
    source: string;
    source_type: string;
    score: number;
    section?: string;
    metadata?: Record<string, any>;
}

export interface UICommand {
    type: 'NAVIGATE' | 'TOAST' | 'OPEN_MODAL';
    payload: Record<string, any>;
}

export interface ToolCall {
    name: string;
    args: Record<string, any>;
}

export interface ChatResponse {
    message: string;
    retrieved_chunks?: RetrievedChunk[];
    tool_call?: ToolCall;
    requires_confirmation?: boolean;
    confirmation_message?: string;
    ui_commands?: UICommand[];
    metadata?: Record<string, any>;
}

export interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    context?: Record<string, any>;
    skip_rag?: boolean;
    skip_confirmation?: boolean;
}

export interface ConfirmRequest {
    tool_call: ToolCall;
}

export interface AIHealthStatus {
    qdrant: boolean;
    ollama: boolean;
    collection_exists: boolean;
    tenant_chunk_count: number;
}

export interface IngestionRequest {
    source: string;
    content: string;
    source_type?: 'docs' | 'schema' | 'entity';
    metadata?: Record<string, any>;
}

export interface IngestionResult {
    source: string;
    chunk_count: number;
    success: boolean;
    message?: string;
}

export interface AISource {
    source: string;
    source_type: string;
    chunk_count: number;
    created_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000';

// API functions
const chatAPI = {
    sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
        const response = await axios.post(`${API_BASE}/api/v1/ai/chat`, data);
        return response.data;
    },

    confirmToolCall: async (data: ConfirmRequest): Promise<ChatResponse> => {
        const response = await axios.post(`${API_BASE}/api/v1/ai/chat/confirm`, data);
        return response.data;
    },

    healthCheck: async (): Promise<AIHealthStatus> => {
        const response = await axios.get(`${API_BASE}/api/v1/ai/health`);
        return response.data;
    },

    ingestDocument: async (data: IngestionRequest): Promise<IngestionResult> => {
        const response = await axios.post(`${API_BASE}/api/v1/ai/ingest`, data);
        return response.data;
    },

    uploadFile: async (file: File, sourceType?: string): Promise<IngestionResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (sourceType) {
            formData.append('source_type', sourceType);
        }
        const response = await axios.post(`${API_BASE}/api/v1/ai/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    listSources: async (): Promise<AISource[]> => {
        const response = await axios.get(`${API_BASE}/api/v1/ai/sources`);
        return response.data;
    },

    deleteSource: async (source: string): Promise<{ deleted_count: number }> => {
        const response = await axios.delete(`${API_BASE}/api/v1/ai/sources/${encodeURIComponent(source)}`);
        return response.data;
    },
};

export interface UseAIChatOptions {
    onNavigate?: (url: string, target?: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onOpenModal?: (modalType: string, data?: any) => void;
    maxHistoryLength?: number;
}

export function useAIChat(options: UseAIChatOptions = {}) {
    const {
        onNavigate,
        onToast,
        onOpenModal,
        maxHistoryLength = 10,
    } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([]);
    const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const conversationIdRef = useRef<string>(Math.random().toString(36).substring(7));

    // Execute UI commands
    const executeUICommands = useCallback((commands: UICommand[]) => {
        commands.forEach((cmd) => {
            switch (cmd.type) {
                case 'NAVIGATE':
                    onNavigate?.(cmd.payload.url, cmd.payload.target);
                    break;
                case 'TOAST':
                    onToast?.(cmd.payload.message, cmd.payload.type || 'info');
                    break;
                case 'OPEN_MODAL':
                    onOpenModal?.(cmd.payload.modal_type, cmd.payload.data);
                    break;
                default:
                    console.warn('Unknown UI command type:', cmd.type);
            }
        });
    }, [onNavigate, onToast, onOpenModal]);

    // Send chat message mutation
    const chatMutation = useMutation({
        mutationFn: chatAPI.sendMessage,
        onSuccess: (data: ChatResponse, variables) => {
            // Add user message to history
            const userMessage: ChatMessage = {
                role: 'user',
                content: variables.message,
                timestamp: new Date().toISOString(),
            };

            // Add assistant response to history
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString(),
                metadata: data.metadata,
            };

            setMessages((prev) => {
                const updated = [...prev, userMessage, assistantMessage];
                // Keep only last N messages
                return updated.slice(-maxHistoryLength * 2);
            });

            // Store retrieved chunks if any
            if (data.retrieved_chunks && data.retrieved_chunks.length > 0) {
                setRetrievedChunks(data.retrieved_chunks);
            }

            // Handle tool confirmation flow
            if (data.requires_confirmation && data.tool_call) {
                setPendingToolCall(data.tool_call);
                setConfirmationMessage(data.confirmation_message || 'Confirm this action?');
            } else {
                setPendingToolCall(null);
                setConfirmationMessage(null);
            }

            // Execute UI commands
            if (data.ui_commands && data.ui_commands.length > 0) {
                executeUICommands(data.ui_commands);
            }
        },
        onError: (error: any) => {
            console.error('Chat error:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to send message';
            onToast?.(errorMessage, 'error');
        },
    });

    // Confirm tool call mutation
    const confirmMutation = useMutation({
        mutationFn: chatAPI.confirmToolCall,
        onSuccess: (data: ChatResponse) => {
            // Add confirmation result to history
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString(),
                metadata: data.metadata,
            };

            setMessages((prev) => [...prev, assistantMessage].slice(-maxHistoryLength * 2));

            // Clear pending confirmation
            setPendingToolCall(null);
            setConfirmationMessage(null);

            // Execute UI commands
            if (data.ui_commands && data.ui_commands.length > 0) {
                executeUICommands(data.ui_commands);
            }

            onToast?.('Action completed successfully', 'success');

            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
        onError: (error: any) => {
            console.error('Confirmation error:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to execute action';
            onToast?.(errorMessage, 'error');
            setPendingToolCall(null);
            setConfirmationMessage(null);
        },
    });

    // Send message
    const sendMessage = useCallback(
        async (
            message: string,
            options?: {
                context?: Record<string, any>;
                skipRAG?: boolean;
            }
        ) => {
            if (!message.trim()) return;

            const historyForAPI: ChatMessage[] = messages
                .filter((msg) => msg.role !== 'system')
                .slice(-maxHistoryLength);

            await chatMutation.mutateAsync({
                message: message.trim(),
                history: historyForAPI,
                context: options?.context,
                skip_rag: options?.skipRAG,
            });
        },
        [messages, maxHistoryLength, chatMutation]
    );

    // Confirm pending tool call
    const confirmToolCall = useCallback(async () => {
        if (!pendingToolCall) {
            console.warn('No pending tool call to confirm');
            return;
        }

        await confirmMutation.mutateAsync({ tool_call: pendingToolCall });
    }, [pendingToolCall, confirmMutation]);

    // Cancel pending tool call
    const cancelToolCall = useCallback(() => {
        setPendingToolCall(null);
        setConfirmationMessage(null);
        onToast?.('Action cancelled', 'info');
    }, [onToast]);

    // Clear conversation
    const clearConversation = useCallback(() => {
        setMessages([]);
        setRetrievedChunks([]);
        setPendingToolCall(null);
        setConfirmationMessage(null);
        conversationIdRef.current = Math.random().toString(36).substring(7);
    }, []);

    // Remove last message (undo)
    const removeLastMessage = useCallback(() => {
        setMessages((prev) => prev.slice(0, -1));
    }, []);

    return {
        // State
        messages,
        retrievedChunks,
        pendingToolCall,
        confirmationMessage,
        isLoading: chatMutation.isPending || confirmMutation.isPending,
        error: chatMutation.error || confirmMutation.error,
        conversationId: conversationIdRef.current,

        // Actions
        sendMessage,
        confirmToolCall,
        cancelToolCall,
        clearConversation,
        removeLastMessage,
    };
}

// Additional hooks for AI management

export function useAIHealth() {
    return useMutation({
        mutationFn: chatAPI.healthCheck,
    });
}

export function useIngestDocument() {
    return useMutation({
        mutationFn: chatAPI.ingestDocument,
        onSuccess: () => {
            // Invalidate any cached data that might be affected
        },
    });
}

export function useUploadFile() {
    return useMutation({
        mutationFn: ({ file, sourceType }: { file: File; sourceType?: string }) =>
            chatAPI.uploadFile(file, sourceType),
    });
}

export function useAISources() {
    return useMutation({
        mutationFn: chatAPI.listSources,
    });
}

export function useDeleteSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: chatAPI.deleteSource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-sources'] });
        },
    });
}
