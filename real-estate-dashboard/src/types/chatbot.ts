// ============================================================================
// CHATBOT TYPES - Enhanced In-App Assistant
// ============================================================================

export type BotContext = 
  | 'properties' 
  | 'contacts' 
  | 'kanban' 
  | 'investor' 
  | 'social' 
  | 'comms'
  | 'finance'
  | 'documents'
  | 'general';

export type BotActionType = 
  | 'createTask'
  | 'scheduleViewing'
  | 'generateExpose'
  | 'draftCampaign'
  | 'createContact'
  | 'uploadDocument'
  | 'calculateFinancing'
  | 'exportData';

export interface BotSuggestion {
  id: string;
  label: string;
  context: BotContext;
  description?: string;
  icon?: string;
}

export interface BotAction {
  id: string;
  type: BotActionType;
  label: string;
  description: string;
  payload?: any;
  targetModule?: string;
}

export interface BotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: BotContext;
  suggestions?: BotSuggestion[];
  actions?: BotAction[];
  metadata?: {
    processingTime?: number;
    confidence?: number;
  };
}

export interface BotConversation {
  id: string;
  title: string;
  messages: BotMessage[];
  context: BotContext;
  createdAt: string;
  updatedAt: string;
}

export interface BotResponse {
  reply: string;
  suggestions: BotSuggestion[];
  possibleActions: BotAction[];
  confidence?: number;
}

export const CONTEXT_SUGGESTIONS: Record<BotContext, BotSuggestion[]> = {
  properties: [
    { id: 'prop-1', label: 'Neue Immobilie anlegen', context: 'properties' },
    { id: 'prop-2', label: 'Exposé generieren', context: 'properties' },
    { id: 'prop-3', label: 'Besichtigung planen', context: 'properties' },
  ],
  contacts: [
    { id: 'cont-1', label: 'Neuen Kontakt hinzufügen', context: 'contacts' },
    { id: 'cont-2', label: 'E-Mail senden', context: 'contacts' },
    { id: 'cont-3', label: 'Follow-up erstellen', context: 'contacts' },
  ],
  kanban: [
    { id: 'kan-1', label: 'Aufgabe erstellen', context: 'kanban' },
    { id: 'kan-2', label: 'Sprint planen', context: 'kanban' },
    { id: 'kan-3', label: 'Team zuweisen', context: 'kanban' },
  ],
  investor: [
    { id: 'inv-1', label: 'Investor-Profil anlegen', context: 'investor' },
    { id: 'inv-2', label: 'Portfolio analysieren', context: 'investor' },
    { id: 'inv-3', label: 'Reporting erstellen', context: 'investor' },
  ],
  social: [
    { id: 'soc-1', label: 'Kampagne entwerfen', context: 'social' },
    { id: 'soc-2', label: 'Post planen', context: 'social' },
    { id: 'soc-3', label: 'Analyse anzeigen', context: 'social' },
  ],
  comms: [
    { id: 'com-1', label: 'Nachricht senden', context: 'comms' },
    { id: 'com-2', label: 'Meeting vereinbaren', context: 'comms' },
    { id: 'com-3', label: 'E-Mail-Template erstellen', context: 'comms' },
  ],
  finance: [
    { id: 'fin-1', label: 'Finanzierung berechnen', context: 'finance' },
    { id: 'fin-2', label: 'Tilgungsplan anzeigen', context: 'finance' },
    { id: 'fin-3', label: 'Vergleich erstellen', context: 'finance' },
  ],
  documents: [
    { id: 'doc-1', label: 'Dokument hochladen', context: 'documents' },
    { id: 'doc-2', label: 'Vertrag erstellen', context: 'documents' },
    { id: 'doc-3', label: 'Signatur anfordern', context: 'documents' },
  ],
  general: [
    { id: 'gen-1', label: 'Dashboard öffnen', context: 'general' },
    { id: 'gen-2', label: 'Einstellungen', context: 'general' },
    { id: 'gen-3', label: 'Hilfe & Support', context: 'general' },
  ],
};
