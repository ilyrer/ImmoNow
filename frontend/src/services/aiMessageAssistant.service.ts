/**
 * AI Message Assistant Service
 * 
 * Co-Pilot für Chat-Nachrichten:
 * - Verbessert Nachrichten
 * - Schlägt Antworten vor
 * - Fasst Diskussionen zusammen
 * 
 * WICHTIG: Die KI ist KEIN Chat-Teilnehmer.
 * Alle Vorschläge müssen vom User bestätigt werden.
 */

import { apiClient } from '../lib/api/client';

export interface MessageImprovementOptions {
  style?: 'professional' | 'clear' | 'concise' | 'formal';
}

export interface ReplySuggestionOptions {
  tone?: 'neutral' | 'friendly' | 'professional' | 'brief';
}

export interface SummaryOptions {
  focus?: 'discussion' | 'decisions' | 'action_items';
}

export class AIMessageAssistant {
  /**
   * Verbessert eine Nachricht
   */
  static async improveMessage(
    message: string,
    options: MessageImprovementOptions = {}
  ): Promise<string> {
    if (!message.trim()) {
      throw new Error('Nachricht darf nicht leer sein');
    }

    const style = options.style || 'professional';
    const stylePrompts = {
      professional: 'professionell und geschäftsmäßig',
      clear: 'klar und verständlich',
      concise: 'prägnant und kurz',
      formal: 'formell und höflich',
    };

    const prompt = `Verbessere die folgende Chat-Nachricht, sodass sie ${stylePrompts[style]} ist. 
Gib NUR die verbesserte Version zurück, ohne Erklärungen oder Kommentare.

Original: "${message}"

Verbesserte Version:`;

    try {
      const response = await apiClient.post('/api/v1/ai/chat', {
        message: prompt,
        skip_rag: true,
        context: {
          task: 'message_improvement',
          original_message: message,
        },
      });

      // API gibt ChatResponse zurück mit message-Feld (apiClient gibt bereits data zurück)
      const improvedMessage = response?.message || message;
      return improvedMessage;
    } catch (error: any) {
      console.error('Message improvement failed:', error);
      throw new Error(error?.response?.data?.detail || 'Fehler beim Verbessern der Nachricht');
    }
  }

  /**
   * Schlägt eine Antwort auf eine Nachricht vor
   */
  static async suggestReply(
    originalMessage: string,
    channelContext: {
      name: string;
      topic?: string;
      recentMessages?: Array<{ content: string; user_id: string }>;
    },
    options: ReplySuggestionOptions = {}
  ): Promise<string> {
    if (!originalMessage.trim()) {
      throw new Error('Nachricht darf nicht leer sein');
    }

    const tone = options.tone || 'neutral';
    const tonePrompts = {
      neutral: 'neutral und sachlich',
      friendly: 'freundlich und zuvorkommend',
      professional: 'professionell und geschäftsmäßig',
      brief: 'kurz und prägnant',
    };

    const contextInfo = channelContext.topic
      ? `\nChannel-Thema: ${channelContext.topic}`
      : '';
    
    const recentContext = channelContext.recentMessages && channelContext.recentMessages.length > 0
      ? `\n\nLetzte Nachrichten im Channel:\n${channelContext.recentMessages.slice(-3).map(m => `- ${m.content}`).join('\n')}`
      : '';

    const prompt = `Schreibe eine ${tonePrompts[tone]} Antwort auf die folgende Nachricht im Channel "${channelContext.name}".${contextInfo}${recentContext}

Original-Nachricht: "${originalMessage}"

Antwort (NUR Text, keine Erklärungen):`;

    try {
      const response = await apiClient.post('/api/v1/ai/chat', {
        message: prompt,
        skip_rag: true,
        context: {
          task: 'reply_suggestion',
          original_message: originalMessage,
          channel_name: channelContext.name,
        },
      });

      // API gibt ChatResponse zurück mit message-Feld (apiClient gibt bereits data zurück)
      const suggestion = response?.message || '';
      return suggestion;
    } catch (error: any) {
      console.error('Reply suggestion failed:', error);
      throw new Error(error?.response?.data?.detail || 'Fehler beim Generieren der Antwort');
    }
  }

  /**
   * Fasst eine Diskussion zusammen
   */
  static async summarizeDiscussion(
    messages: Array<{ content: string; user_id: string; created_at: string }>,
    channelContext: {
      name: string;
      topic?: string;
    },
    options: SummaryOptions = {}
  ): Promise<{
    summary: string;
    decisions?: string[];
    actionItems?: string[];
  }> {
    if (!messages || messages.length === 0) {
      throw new Error('Keine Nachrichten zum Zusammenfassen');
    }

    const focus = options.focus || 'discussion';
    const focusPrompts = {
      discussion: 'Fasse die Diskussion zusammen',
      decisions: 'Extrahiere alle Entscheidungen',
      action_items: 'Liste alle nächsten Schritte auf',
    };

    const messagesText = messages
      .map((m, i) => `${i + 1}. ${m.content}`)
      .join('\n');

    const contextInfo = channelContext.topic
      ? `\nChannel-Thema: ${channelContext.topic}`
      : '';

    const prompt = `${focusPrompts[focus]} für den Channel "${channelContext.name}".${contextInfo}

Nachrichten:
${messagesText}

Gib eine strukturierte Zusammenfassung zurück. Wenn Entscheidungen oder Aktionen vorhanden sind, liste diese auf.`;

    try {
      const response = await apiClient.post('/api/v1/ai/chat', {
        message: prompt,
        skip_rag: true,
        context: {
          task: 'discussion_summary',
          channel_name: channelContext.name,
          message_count: messages.length,
        },
      });

      // API gibt ChatResponse zurück mit message-Feld (apiClient gibt bereits data zurück)
      const summaryText = response?.message || '';

      // Versuche Entscheidungen und Aktionen zu extrahieren
      const decisions: string[] = [];
      const actionItems: string[] = [];

      // Einfache Heuristik zum Extrahieren
      const decisionPattern = /(?:Entscheidung|Beschlossen|Festgelegt)[:]\s*(.+)/gi;
      const actionPattern = /(?:Aktion|Aufgabe|Nächster Schritt|Todo)[:]\s*(.+)/gi;

      let match;
      while ((match = decisionPattern.exec(summaryText)) !== null) {
        decisions.push(match[1].trim());
      }
      while ((match = actionPattern.exec(summaryText)) !== null) {
        actionItems.push(match[1].trim());
      }

      return {
        summary: summaryText,
        decisions: decisions.length > 0 ? decisions : undefined,
        actionItems: actionItems.length > 0 ? actionItems : undefined,
      };
    } catch (error: any) {
      console.error('Summary generation failed:', error);
      throw new Error(error?.response?.data?.detail || 'Fehler beim Zusammenfassen');
    }
  }
}

