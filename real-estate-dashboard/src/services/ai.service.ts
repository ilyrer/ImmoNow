/**
 * AI Service - Wrapper für LLM Service
 * ALLE AI-Anfragen gehen jetzt über den Backend LLM-Endpunkt
 * Kein direktes OpenAI mehr - alles läuft über DeepSeek V3.1 via OpenRouter
 */
import { LLMService } from './llm.service';

export interface AITaskSuggestion {
  priority: 'hoch' | 'mittel' | 'niedrig';
  estimatedTime: string;
  suggestedDeadline: string;
  assigneeRecommendation?: string;
  title?: string;
  description?: string;
}

export interface AIPropertyDescription {
  title: string;
  description: string;
  highlights: string[];
  marketingPoints: string[];
  suggestedPrice: string;
}

export interface AIMeetingSuggestion {
  title: string;
  agenda: string[];
  participants: string[];
  duration: number;
  preparationTasks: string[];
  followUpActions: string[];
}

export interface AIChatResponse {
  message: string;
  suggestions: string[];
  actionType?: 'task' | 'property' | 'meeting' | 'analysis' | 'general';
  actionData?: any;
}

export class AIService {
  static async suggestTaskPriority(
    taskTitle: string,
    taskDescription: string,
    teamContext: string
  ): Promise<AITaskSuggestion> {
    try {
      // Nutze den zentralen LLM Service
      const result = await LLMService.analyzeTask(`${taskTitle}: ${taskDescription}\nTeam: ${teamContext}`);
      
      return {
        priority: result.priority,
        estimatedTime: result.estimatedTime,
        suggestedDeadline: result.suggestedDeadline,
        assigneeRecommendation: 'Team-Mitglied', // TODO: Intelligente Zuweisung
        title: result.title,
        description: result.description
      };
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      // Fallback-Werte bei Fehler
      return {
        priority: 'mittel',
        estimatedTime: '2-3 Stunden',
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigneeRecommendation: 'Nicht spezifiziert',
        title: taskTitle,
        description: taskDescription
      };
    }
  }

  static async generatePropertyDescription(
    propertyDetails: {
      type: string;
      size: number;
      rooms: number;
      location: string;
      features: string[];
      condition: string;
      price: number;
    }
  ): Promise<AIPropertyDescription> {
    try {
      // Nutze den zentralen LLM Service
      const result = await LLMService.generatePropertyDescription(propertyDetails);
      
      return {
        title: result.title,
        description: result.description,
        highlights: result.highlights,
        marketingPoints: result.marketingPoints,
        suggestedPrice: `${propertyDetails.price}€`,
      };
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      throw error;
    }
  }

  static async processChatMessage(
    message: string,
    context: {
      user?: any;
      previousMessages?: any[];
      currentPage?: string;
    }
  ): Promise<AIChatResponse> {
    try {
      // Nutze den zentralen LLM Service
      const response = await LLMService.chat(message, {
        userInfo: context.user,
        pageContext: context.currentPage,
        previousMessages: context.previousMessages?.map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }))
      });
      
      // Erkenne Intent aus der Nachricht
      const intent = this.detectIntent(message);
      
      // Generiere Vorschläge basierend auf Intent
      let suggestions: string[] = [];
      switch (intent.intent) {
        case 'create_task':
          suggestions = ['Weitere Aufgabe erstellen', 'Prioritäten setzen', 'Team benachrichtigen'];
          break;
        case 'property_help':
          suggestions = ['Beschreibung generieren', 'Marktpreis analysieren', 'Marketing-Content erstellen'];
          break;
        case 'create_meeting':
          suggestions = ['Agenda erstellen', 'Teilnehmer hinzufügen', 'Notizen vorbereiten'];
          break;
        case 'market_analysis':
          suggestions = ['Detaillierte Analyse', 'Preisempfehlung', 'Wettbewerbsvergleich'];
          break;
        case 'marketing_help':
          suggestions = ['Social Media Post', 'E-Mail-Kampagne', 'Exposé erstellen'];
          break;
        default:
          suggestions = ['Aufgabe erstellen', 'Immobilie analysieren', 'Besprechung planen'];
      }
      
      return {
        message: response.response,
        suggestions,
        actionType: intent.intent.replace('create_', '').replace('_help', '') as any,
        actionData: null
      };
    } catch (error) {
      console.error('Fehler bei der Chat-Verarbeitung:', error);
      return {
        message: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.',
        suggestions: [
          'Aufgabe erstellen',
          'Immobilie analysieren',
          'Besprechung planen'
        ],
        actionType: 'general'
      };
    }
  }

  static async suggestMeeting(
    topic: string,
    participants: string[],
    context: string
  ): Promise<AIMeetingSuggestion> {
    try {
      // Nutze den zentralen LLM Service
      const prompt = `Erstelle einen Besprechungsvorschlag für:
Thema: ${topic}
Teilnehmer: ${participants.join(', ')}
Kontext: ${context}

Erstelle:
1. Einen präzisen Besprechungstitel
2. Eine strukturierte Agenda (4-6 Punkte)
3. Dauer in Minuten
4. 3 Vorbereitungsaufgaben
5. 3 Follow-up Aktionen`;

      const response = await LLMService.askQuestion({
        prompt,
        temperature: 0.5,
        maxTokens: 800,
      });

      const lines = response.response.split('\n').filter(l => l.trim());
      
      return {
        title: lines[0] || `Besprechung: ${topic}`,
        agenda: lines.slice(1, 7),
        participants: participants,
        duration: 60,
        preparationTasks: lines.slice(7, 10),
        followUpActions: lines.slice(10, 13)
      };
    } catch (error) {
      console.error('Fehler bei der Besprechungsplanung:', error);
      return {
        title: `Besprechung: ${topic}`,
        agenda: ['Begrüßung und Agenda-Review', 'Hauptthema besprechen', 'Nächste Schritte definieren'],
        participants: participants,
        duration: 60,
        preparationTasks: ['Agenda vorbereiten', 'Unterlagen sammeln'],
        followUpActions: ['Protokoll erstellen', 'Aufgaben verteilen']
      };
    }
  }

  static async analyzeMarketTrends(
    location: string,
    propertyType: string,
    historicalData: any[]
  ): Promise<{
    priceRecommendation: string;
    marketTrend: string;
    sellingPoints: string[];
    risks: string[];
    forecast: string;
    competitiveAnalysis: string;
  }> {
    try {
      // Nutze den zentralen LLM Service
      const result = await LLMService.analyzeMarket(location, propertyType);
      
      return {
        priceRecommendation: result.priceRecommendation,
        marketTrend: result.marketTrend,
        sellingPoints: result.sellingPoints,
        risks: result.risks,
        forecast: "Positive Entwicklung für die nächsten 12 Monate erwartet",
        competitiveAnalysis: "Moderate Konkurrenz im Marktsegment"
      };
    } catch (error) {
      console.error('Fehler bei der Marktanalyse:', error);
      return {
        priceRecommendation: "Marktanalyse temporär nicht verfügbar",
        marketTrend: "Stabile Marktlage",
        sellingPoints: ["Gute Lage", "Solide Bausubstanz"],
        risks: ["Marktvolatilität"],
        forecast: "Stabile Entwicklung erwartet",
        competitiveAnalysis: "Wettbewerbsanalyse wird durchgeführt"
      };
    }
  }

  static async generateMarketingContent(
    propertyDetails: any,
    targetAudience: string,
    marketingChannel: string
  ): Promise<{
    headline: string;
    description: string;
    keyPoints: string[];
    callToAction: string;
    hashtags?: string[];
    emailSubject?: string;
    socialMediaPost?: string;
  }> {
    try {
      // Nutze den zentralen LLM Service
      const result = await LLMService.generateMarketingContent(
        propertyDetails.type || 'Immobilie',
        targetAudience,
        marketingChannel
      );
      
      return {
        headline: result.headline,
        description: result.description,
        keyPoints: result.hashtags.slice(0, 3), // Verwende erste 3 Hashtags als Keypoints
        callToAction: result.callToAction,
        hashtags: result.hashtags,
        emailSubject: `${result.headline} - ${result.callToAction}`,
        socialMediaPost: `${result.headline}\n\n${result.description}\n\n${result.callToAction}\n\n${result.hashtags.join(' ')}`
      };
    } catch (error) {
      console.error('Fehler bei der Content-Generierung:', error);
      return {
        headline: "Attraktive Immobilie verfügbar",
        description: "Entdecken Sie diese interessante Immobilie in bester Lage.",
        keyPoints: [
          "Gute Lage",
          "Faire Preise",
          "Professionelle Betreuung"
        ],
        callToAction: "Kontaktieren Sie uns für weitere Informationen!"
      };
    }
  }

  static detectIntent(message: string): {
    intent: string;
    confidence: number;
    entities: any;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Aufgaben-Intent
    if (lowerMessage.includes('aufgabe') || lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return {
        intent: 'create_task',
        confidence: 0.9,
        entities: { type: 'task' }
      };
    }
    
    // Immobilien-Intent
    if (lowerMessage.includes('immobilie') || lowerMessage.includes('objekt') || lowerMessage.includes('haus') || lowerMessage.includes('wohnung')) {
      return {
        intent: 'property_help',
        confidence: 0.85,
        entities: { type: 'property' }
      };
    }
    
    // Besprechungs-Intent
    if (lowerMessage.includes('besprechung') || lowerMessage.includes('meeting') || lowerMessage.includes('termin')) {
      return {
        intent: 'create_meeting',
        confidence: 0.8,
        entities: { type: 'meeting' }
      };
    }
    
    // Marktanalyse-Intent
    if (lowerMessage.includes('markt') || lowerMessage.includes('preis') || lowerMessage.includes('analyse')) {
      return {
        intent: 'market_analysis',
        confidence: 0.75,
        entities: { type: 'analysis' }
      };
    }
    
    // Marketing-Intent
    if (lowerMessage.includes('marketing') || lowerMessage.includes('werbung') || lowerMessage.includes('content')) {
      return {
        intent: 'marketing_help',
        confidence: 0.7,
        entities: { type: 'marketing' }
      };
    }
    
    return {
      intent: 'general',
      confidence: 0.5,
      entities: { type: 'general' }
    };
  }
} 
