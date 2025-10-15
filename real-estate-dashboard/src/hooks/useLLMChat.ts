/**
 * Custom Hook für LLM Chat Integration
 * Verwendet die OpenRouter/DeepSeek V3.1 API
 */
import { useState, useCallback } from 'react';
import { apiClient as api } from '../api/config';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface LLMRequestOptions {
  maxTokens?: number;
  temperature?: number;
  context?: string;
}

export interface DashboardQAOptions {
  contextType?: 'dashboard' | 'cim' | 'investor' | 'properties';
  includeData?: boolean;
}

export function useLLMChat() {
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Stelle eine allgemeine Frage an das LLM
   */
  const askQuestion = useCallback(async (
    prompt: string,
    options: LLMRequestOptions = {}
  ) => {
    setLoading(true);
    setError(null);

    // Füge User-Nachricht hinzu
    const userMessage: LLMMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Verwende Test-Endpunkt für Development (ohne Auth)
      // In Production: Wechsle zu /api/v1/llm/ask mit Auth
      const response = await api.post('/llm/test', {
        prompt,
        context: options.context,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      });

      // Füge Assistant-Antwort hinzu
      const assistantMessage: LLMMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(response.data.timestamp),
        tokens: response.data.tokens_used,
      };
      setMessages(prev => [...prev, assistantMessage]);

      return assistantMessage;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Senden der Anfrage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Stelle eine Dashboard-spezifische Frage
   */
  const askDashboardQuestion = useCallback(async (
    question: string,
    options: DashboardQAOptions = {}
  ) => {
    setLoading(true);
    setError(null);

    // Füge User-Nachricht hinzu
    const userMessage: LLMMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Verwende Test-Endpunkt für Development (ohne Auth)
      // In Production: Wechsle zu /api/v1/llm/dashboard_qa mit Auth
      const response = await api.post('/llm/test_dashboard', {
        question,
        context_type: options.contextType || 'dashboard',
        include_data: options.includeData !== false,
      });

      // Füge Assistant-Antwort hinzu
      const assistantMessage: LLMMessage = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(response.data.timestamp),
        tokens: response.data.tokens_used,
      };
      setMessages(prev => [...prev, assistantMessage]);

      return {
        message: assistantMessage,
        relatedKpis: response.data.related_kpis || [],
        contextUsed: response.data.context_used,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Fehler beim Senden der Anfrage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lösche alle Nachrichten
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Lösche die letzte Nachricht
   */
  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
  }, []);

  return {
    messages,
    loading,
    error,
    askQuestion,
    askDashboardQuestion,
    clearMessages,
    removeLastMessage,
  };
}

export default useLLMChat;

