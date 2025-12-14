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
  Bot,
  User as UserIcon,
  Home,
  Users,
  Briefcase,
  TrendingUp,
  Share2,
  MessageCircle,
  CreditCard,
  FileText,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// TODO: Implement real API hooks
import type { BotContext } from '../../types/chatbot';
import { GlassCard, GlassButton, Badge } from '../admin/GlassUI';

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  suggestions?: Array<{ id: string; label: string }>;
  actions?: Array<{ id: string; label: string; type: string; description: string }>;
}

const CONTEXT_CONFIG: Record<BotContext, { label: string; icon: any; description: string; color: string }> = {
  properties: {
    label: 'Immobilien',
    icon: Home,
    description: 'Objekte verwalten, Exposés erstellen, Bewertungen',
    color: 'from-emerald-500 to-teal-600'
  },
  contacts: {
    label: 'Kontakte',
    icon: Users,
    description: 'Kunden, Interessenten und Partner verwalten',
    color: 'from-blue-500 to-indigo-600'
  },
  kanban: {
    label: 'Aufgaben',
    icon: Briefcase,
    description: 'To-Dos, Workflows und Projekte organisieren',
    color: 'from-purple-500 to-pink-600'
  },
  investor: {
    label: 'Investoren',
    icon: TrendingUp,
    description: 'Kapitalanleger und Portfolios managen',
    color: 'from-orange-500 to-red-600'
  },
  social: {
    label: 'Social Media',
    icon: Share2,
    description: 'Posts planen, Analytics und Community',
    color: 'from-cyan-500 to-blue-600'
  },
  comms: {
    label: 'Kommunikation',
    icon: MessageCircle,
    description: 'E-Mails, Nachrichten und Benachrichtigungen',
    color: 'from-green-500 to-emerald-600'
  },
  finance: {
    label: 'Finanzen',
    icon: CreditCard,
    description: 'Rechnungen, Cashflow und Finanzplanung',
    color: 'from-yellow-500 to-orange-600'
  },
  documents: {
    label: 'Dokumente',
    icon: FileText,
    description: 'Verträge, PDFs und Dateiverwaltung',
    color: 'from-gray-500 to-slate-600'
  },
  general: {
    label: 'Allgemein',
    icon: Sparkles,
    description: 'Allgemeine Fragen und Unterstützung',
    color: 'from-indigo-500 to-purple-600'
  },
};

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
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
    }
  ]);
  const [currentContext, setCurrentContext] = useState<BotContext>('general');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gefilterte Kontexte basierend auf Suche
  const filteredContexts = (Object.keys(CONTEXT_CONFIG) as BotContext[]).filter(ctx => {
    const config = CONTEXT_CONFIG[ctx];
    const query = searchQuery.toLowerCase();
    return config.label.toLowerCase().includes(query) ||
      config.description.toLowerCase().includes(query);
  });

  const currentConversation = messages.length > 0 ? { id: '1', messages } : null;

  // Neue Konversation starten
  const handleNewConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hallo! Ich bin bereit für ein neues Gespräch. Wie kann ich Ihnen helfen?',
        timestamp: new Date().toISOString(),
        suggestions: [
          { id: '1', label: 'Immobilien suchen' },
          { id: '2', label: 'Kontakt aufnehmen' }
        ],
        actions: []
      }
    ]);
    setInput('');
  };

  // Alle Nachrichten löschen
  const handleClearAll = () => {
    if (window.confirm('Möchten Sie wirklich alle Nachrichten löschen?')) {
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Alle Nachrichten wurden gelöscht. Wie kann ich Ihnen helfen?',
          timestamp: new Date().toISOString(),
          suggestions: [
            { id: '1', label: 'Neue Immobilie anlegen' },
            { id: '2', label: 'Besichtigung planen' }
          ],
          actions: []
        }
      ]);
      setInput('');
    }
  };

  // Context wechseln
  const handleSwitchContext = (context: BotContext) => {
    setCurrentContext(context);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // User Message hinzufügen
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      suggestions: [],
      actions: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simuliere AI Antwort nach 1 Sekunde
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Danke für Ihre Nachricht zu "${input}". Ich habe verstanden, dass Sie Hilfe im Bereich ${CONTEXT_CONFIG[currentContext].label} benötigen. Wie kann ich Ihnen konkret weiterhelfen?`,
        timestamp: new Date().toISOString(),
        suggestions: [
          { id: '1', label: 'Mehr Informationen' },
          { id: '2', label: 'Termin vereinbaren' }
        ],
        actions: []
      };
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed right-6 bottom-6 top-6 w-full max-w-md z-[9999] flex flex-col"
    >
      {/* Glassmorphism Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/50 relative">
        {/* Gradient Accent Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 backdrop-blur-xl relative">
          {/* Background Orb Effect */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                <Bot className="w-6 h-6 text-white relative z-10" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ImmoNow Assistent
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online • Powered by AI
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewConversation}
                className="p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all backdrop-blur-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Neue Konversation"
              >
                <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearAll}
                className="p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all backdrop-blur-sm border border-transparent hover:border-red-200 dark:hover:border-red-700"
                title="Alle löschen"
              >
                <Trash2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all backdrop-blur-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>

          {/* Context Selector */}
          <div className="relative z-[10001]">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowContextMenu(!showContextMenu)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-blue-300/50 dark:border-blue-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = CONTEXT_CONFIG[currentContext].icon;
                  return <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
                })()}
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {CONTEXT_CONFIG[currentContext].label}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {CONTEXT_CONFIG[currentContext].description}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showContextMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showContextMenu && (
                <>
                  {/* Full Screen Overlay - Enterprise Modal */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl z-[10000] flex items-center justify-center p-6"
                    onClick={() => {
                      setShowContextMenu(false);
                      setSearchQuery('');
                    }}
                  >
                    {/* Modal Content */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-5xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
                    >
                      {/* Modal Header */}
                      <div className="px-8 pt-8 pb-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                              Assistent-Kontext
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              Wähle deinen Arbeitsbereich
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setShowContextMenu(false);
                              setSearchQuery('');
                            }}
                            className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </motion.button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Kontext durchsuchen..."
                            autoFocus
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-500"
                          />
                        </div>
                      </div>

                      {/* Contexts Grid */}
                      <div className="px-8 pb-8 max-h-[65vh] overflow-y-auto">
                        {filteredContexts.length === 0 ? (
                          <div className="text-center py-16">
                            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">Keine Ergebnisse</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {filteredContexts.map((ctx, idx) => {
                              const Icon = CONTEXT_CONFIG[ctx].icon;
                              const isActive = currentContext === ctx;
                              return (
                                <motion.button
                                  key={ctx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  whileHover={{ scale: 1.03, y: -2 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => {
                                    handleSwitchContext(ctx);
                                    setShowContextMenu(false);
                                    setSearchQuery('');
                                  }}
                                  className={`group relative p-5 rounded-2xl transition-all text-left overflow-hidden ${isActive
                                      ? 'bg-gradient-to-br ' + CONTEXT_CONFIG[ctx].color + ' text-white shadow-2xl ring-2 ring-white/20'
                                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-md hover:shadow-xl'
                                    }`}
                                >
                                  {/* Background Gradient Effect */}
                                  {isActive && (
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                                  )}

                                  <div className="relative z-10">
                                    {/* Icon */}
                                    <div
                                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isActive
                                          ? 'bg-white/20 backdrop-blur-sm'
                                          : 'bg-gradient-to-br ' + CONTEXT_CONFIG[ctx].color
                                        }`}
                                    >
                                      <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Title */}
                                    <h4 className={`text-base font-bold mb-1 ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                                      }`}>
                                      {CONTEXT_CONFIG[ctx].label}
                                    </h4>

                                    {/* Description */}
                                    <p className={`text-xs leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                                      }`}>
                                      {CONTEXT_CONFIG[ctx].description}
                                    </p>

                                    {/* Active Indicator */}
                                    {isActive && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute top-3 right-3 w-2.5 h-2.5 bg-white rounded-full shadow-lg"
                                      />
                                    )}
                                  </div>

                                  {/* Subtle Hover Gradient */}
                                  {!isActive && (
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                                    </div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-purple-500/[0.02]">
          {!currentConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                <MessageSquare className="w-10 h-10 text-white relative z-10" />
              </motion.div>
              <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Wie kann ich helfen?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                Stellen Sie mir Fragen zu Immobilien, Kontakten, Aufgaben und mehr.
              </p>
              <div className="flex flex-wrap gap-2 justify-center px-4">
                {['Neue Immobilie anlegen', 'Besichtigung planen', 'Exposé erstellen'].map((suggestion, idx) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 text-sm font-medium text-blue-600 dark:text-blue-400 transition-all border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {currentConversation?.messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for AI */}
              {msg.role === 'assistant' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                  <Bot className="w-4 h-4 text-white relative z-10" />
                </motion.div>
              )}

              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-2xl px-5 py-3.5 shadow-lg backdrop-blur-xl relative overflow-hidden ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white'
                    : 'bg-white/80 dark:bg-gray-800/80 border border-white/60 dark:border-gray-700/60'
                    }`}
                >
                  {msg.role === 'user' && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  )}
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap relative z-10 ${msg.role === 'assistant' ? 'text-gray-800 dark:text-gray-200' : ''
                    }`}>
                    {msg.content}
                  </div>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                      {msg.suggestions.map((suggestion) => (
                        <motion.button
                          key={suggestion.id}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuggestionClick(suggestion.label)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all backdrop-blur-sm shadow-md ${msg.role === 'user'
                            ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                            : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50'
                            }`}
                        >
                          {suggestion.label}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 space-y-2 relative z-10">
                      {msg.actions.map((action) => (
                        <motion.button
                          key={action.id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-md"
                        >
                          <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                            {action.label}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {action.description}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Avatar for User */}
              {msg.role === 'user' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <UserIcon className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                <Bot className="w-4 h-4 text-white relative z-10" />
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 backdrop-blur-xl">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nachricht eingeben..."
                rows={2}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-white/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl disabled:hover:scale-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
              <Send className="w-5 h-5 relative z-10" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatbotPanel;
