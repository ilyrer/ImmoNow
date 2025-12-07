import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Trash2,
  Sparkles,
  Plus,
  ChevronDown,
} from 'lucide-react';
// TODO: Implement real API hooks
import type { BotContext } from '../../types/chatbot';
import { GlassCard, GlassButton, Badge } from '../admin/GlassUI';

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTEXT_ICONS: Record<BotContext, string> = {
  properties: '🏠',
  contacts: '👥',
  kanban: '📋',
  investor: '💰',
  social: '📱',
  comms: '💬',
  finance: '💳',
  documents: '📄',
  general: '✨',
};

const CONTEXT_LABELS: Record<BotContext, string> = {
  properties: 'Immobilien',
  contacts: 'Kontakte',
  kanban: 'Aufgaben',
  investor: 'Investoren',
  social: 'Social Media',
  comms: 'Kommunikation',
  finance: 'Finanzen',
  documents: 'Dokumente',
  general: 'Allgemein',
};

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ isOpen, onClose }) => {
  // TODO: Implement real chatbot API hooks
  const send = (message: string, context: any) => Promise.resolve();
  const conversations = [];
  const currentConversation = {
    id: '1',
    messages: [
      {
        id: '1',
        role: 'assistant' as const,
        content: 'Hallo! Wie kann ich Ihnen heute helfen?',
        timestamp: new Date().toISOString(),
        suggestions: [
          {
            id: '1',
            label: 'Immobilien suchen'
          },
          {
            id: '2',
            label: 'Kontakt aufnehmen'
          }
        ],
        actions: [
          {
            id: '1',
            label: 'Termin vereinbaren',
            type: 'button',
            description: 'Einen Termin für eine Besichtigung vereinbaren'
          }
        ]
      },
      {
        id: '2',
        role: 'user' as const,
        content: 'Ich brauche Hilfe bei Immobilien',
        timestamp: new Date().toISOString(),
        suggestions: [
          {
            id: '1',
            label: 'Immobilien suchen'
          },
          {
            id: '2',
            label: 'Kontakt aufnehmen'
          }
        ],
        actions: [
          {
            id: '1',
            label: 'Termin vereinbaren',
            type: 'button',
            description: 'Einen Termin für eine Besichtigung vereinbaren'
          }
        ]
      }
    ]
  };
  const currentContext = 'general' as BotContext;
  const loading = false;
  const newConversation = () => Promise.resolve();
  const switchContext = (context: BotContext) => Promise.resolve();
  const clearAll = () => Promise.resolve();

  const [input, setInput] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input, currentContext);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-6 top-6 w-full max-w-md z-50 flex flex-col">
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">ImmoNow Assistent</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={newConversation}
                className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                title="Neue Konversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                title="Alle löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Selector */}
          <div className="relative">
            <button
              onClick={() => setShowContextMenu(!showContextMenu)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-600 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{CONTEXT_ICONS[currentContext]}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {CONTEXT_LABELS[currentContext]}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {showContextMenu && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                {(Object.keys(CONTEXT_LABELS) as BotContext[]).map((ctx) => (
                  <button
                    key={ctx}
                    onClick={() => {
                      switchContext(ctx);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      currentContext === ctx ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className="text-lg">{CONTEXT_ICONS[ctx]}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {CONTEXT_LABELS[ctx]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Wie kann ich helfen?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Stellen Sie mir Fragen zu Immobilien, Kontakten, Aufgaben und mehr.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Neue Immobilie anlegen', 'Besichtigung planen', 'Exposé erstellen'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-sm text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentConversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion.label)}
                        className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.actions.map((action) => (
                      <button
                        key={action.id}
                        className="w-full text-left px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-sm text-blue-600 dark:text-blue-400 transition-colors"
                      >
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs opacity-75">{action.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht eingeben..."
              rows={2}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ChatbotPanel;
