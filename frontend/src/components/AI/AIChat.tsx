import React, { useState, useRef, useEffect } from 'react';
import { useAIChat, ChatMessage, RetrievedChunk, UseAIChatOptions } from '../../hooks/useAIChat';
import { Send, X, FileText, AlertCircle, CheckCircle, Bot, User, RefreshCw } from 'lucide-react';

interface AIChatProps {
    onNavigate?: (url: string, target?: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onOpenModal?: (modalType: string, data?: any) => void;
    initialContext?: Record<string, any>;
    className?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
    onNavigate,
    onToast,
    onOpenModal,
    initialContext,
    className = '',
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showSources, setShowSources] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const options: UseAIChatOptions = {
        onNavigate,
        onToast,
        onOpenModal,
        maxHistoryLength: 10,
    };

    const {
        messages,
        retrievedChunks,
        pendingToolCall,
        confirmationMessage,
        isLoading,
        error,
        sendMessage,
        confirmToolCall,
        cancelToolCall,
        clearConversation,
    } = useAIChat(options);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const message = inputValue.trim();
        setInputValue('');
        await sendMessage(message, { context: initialContext });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatTimestamp = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                        <p className="text-xs text-gray-600">
                            {isLoading ? 'Thinking...' : 'Ready to help'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {retrievedChunks.length > 0 && (
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            <FileText className="w-3 h-3" />
                            {retrievedChunks.length} sources
                        </button>
                    )}
                    <button
                        onClick={clearConversation}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Clear conversation"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <Bot className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">How can I help you today?</p>
                        <p className="text-sm text-gray-400 max-w-md">
                            I can help you manage tasks, search for properties, analyze data, and much more.
                            Just ask me anything!
                        </p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Bot className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">
                            {(error as any).response?.data?.detail || (error as any).message || 'An error occurred'}
                        </span>
                    </div>
                )}

                {/* Confirmation Dialog */}
                {pendingToolCall && confirmationMessage && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3 mb-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-yellow-900 mb-1">Confirmation Required</p>
                                <p className="text-sm text-yellow-800">{confirmationMessage}</p>
                                {pendingToolCall && (
                                    <div className="mt-2 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-900">
                                        <span className="font-semibold">{pendingToolCall.name}</span>
                                        {Object.keys(pendingToolCall.args).length > 0 && (
                                            <span> with {Object.keys(pendingToolCall.args).length} parameters</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={confirmToolCall}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Confirm
                            </button>
                            <button
                                onClick={cancelToolCall}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Sources Sidebar */}
            {showSources && retrievedChunks.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm">Retrieved Sources</h4>
                        <button
                            onClick={() => setShowSources(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {retrievedChunks.map((chunk, index) => (
                            <SourceCard key={index} chunk={chunk} />
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message... (Shift+Enter for new line)"
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    Powered by local AI with RAG • Your data stays private
                </p>
            </div>
        </div>
    );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-lg ${isUser ? 'bg-blue-500' : 'bg-gray-100'}`}>
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : (
                    <Bot className="w-5 h-5 text-gray-600" />
                )}
            </div>
            <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
                <div
                    className={`inline-block p-3 rounded-lg ${isUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                    style={{ maxWidth: '80%' }}
                >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
                {message.timestamp && (
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                )}
            </div>
        </div>
    );
};

// Source Card Component
const SourceCard: React.FC<{ chunk: RetrievedChunk }> = ({ chunk }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                            {chunk.source}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                            {chunk.source_type}
                        </span>
                        <span>Score: {(chunk.score * 100).toFixed(0)}%</span>
                        {chunk.section && <span>• {chunk.section}</span>}
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                    {expanded ? 'Hide' : 'Show'}
                </button>
            </div>
            {expanded && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                    {chunk.content}
                </div>
            )}
        </div>
    );
};

export default AIChat;
