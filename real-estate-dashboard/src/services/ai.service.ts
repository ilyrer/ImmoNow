import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du bist ein erfahrener Immobilienmakler und Projektmanager. Analysiere Aufgaben und gib Empfehlungen für Priorität, Zeitaufwand und Deadline. Antworte im JSON-Format."
          },
          {
            role: "user",
            content: `Analysiere folgende Aufgabe im Immobilienvertrieb:
              Titel: ${taskTitle}
              Beschreibung: ${taskDescription}
              Team-Kontext: ${teamContext}
              
              Gib eine strukturierte Empfehlung im folgenden JSON-Format zurück:
              {
                "priority": "hoch|mittel|niedrig",
                "estimatedTime": "geschätzter Zeitaufwand",
                "suggestedDeadline": "YYYY-MM-DD",
                "assigneeRecommendation": "Empfohlener Bearbeiter basierend auf der Aufgabe",
                "title": "optimierter Aufgabentitel",
                "description": "optimierte Beschreibung"
              }`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response) as {
        priority?: string;
        estimatedTime?: string;
        suggestedDeadline?: string;
        assigneeRecommendation?: string;
        title?: string;
        description?: string;
      };
      
      // Validiere die Antwort
      if (!parsedResponse.priority || !parsedResponse.estimatedTime || !parsedResponse.suggestedDeadline) {
        throw new Error('Unvollständige KI-Antwort');
      }

      // Normalisiere die Priorität
      const priority = parsedResponse.priority.toLowerCase();
      if (!['hoch', 'mittel', 'niedrig'].includes(priority)) {
        throw new Error('Ungültige Priorität in KI-Antwort');
      }

      // Formatiere das Datum
      const deadline = new Date(parsedResponse.suggestedDeadline);
      if (isNaN(deadline.getTime())) {
        throw new Error('Ungültiges Datum in KI-Antwort');
      }

      return {
        priority: priority as 'hoch' | 'mittel' | 'niedrig',
        estimatedTime: parsedResponse.estimatedTime,
        suggestedDeadline: parsedResponse.suggestedDeadline,
        assigneeRecommendation: parsedResponse.assigneeRecommendation || undefined,
        title: parsedResponse.title || taskTitle,
        description: parsedResponse.description || taskDescription
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du bist ein erfahrener Immobilienmakler mit Expertise in der Erstellung überzeugender Immobilienbeschreibungen. Antworte im JSON-Format."
          },
          {
            role: "user",
            content: `Erstelle eine professionelle Immobilienbeschreibung für:
              Typ: ${propertyDetails.type}
              Größe: ${propertyDetails.size}m²
              Zimmer: ${propertyDetails.rooms}
              Lage: ${propertyDetails.location}
              Ausstattung: ${propertyDetails.features.join(', ')}
              Zustand: ${propertyDetails.condition}
              Preis: ${propertyDetails.price}€
              
              Erstelle eine Antwort im folgenden JSON-Format:
              {
                "title": "aufmerksamkeitsstarker Titel",
                "description": "überzeugende Beschreibung",
                "highlights": ["wichtigste Merkmale"],
                "marketingPoints": ["besondere Verkaufsargumente"],
                "suggestedPrice": "optimierter Preis"
              }`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response) as {
        title: string;
        description: string;
        highlights: string[];
        marketingPoints: string[];
        suggestedPrice: string;
      };
      
      return {
        title: parsedResponse.title,
        description: parsedResponse.description,
        highlights: parsedResponse.highlights,
        marketingPoints: parsedResponse.marketingPoints,
        suggestedPrice: parsedResponse.suggestedPrice
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Du bist ein intelligenter KI-Assistent für eine Immobilien-Dashboard-Anwendung. 
            Du hilfst bei Aufgaben, Immobilienverwaltung, Marktanalysen, Besprechungen und allgemeinen Fragen.
            
            Antworte immer auf Deutsch und sei hilfreich, professionell und präzise.
            
            Verfügbare Aktionen:
            - Aufgaben erstellen und verwalten
            - Immobilienbeschreibungen generieren
            - Marktanalysen durchführen
            - Besprechungen planen
            - Marketing-Content erstellen
            - Allgemeine Beratung
            
            Antworte im JSON-Format mit:
            {
              "message": "deine Antwort",
              "suggestions": ["vorschläge für weitere aktionen"],
              "actionType": "task|property|meeting|analysis|general",
              "actionData": {} // optional, zusätzliche Daten für Aktionen
            }`
          },
          {
            role: "user",
            content: `Benutzeranfrage: ${message}
            
            Kontext:
            - Benutzer: ${context.user?.email || 'Unbekannt'}
            - Aktuelle Seite: ${context.currentPage || 'Dashboard'}
            - Vorherige Nachrichten: ${context.previousMessages?.length || 0}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response) as AIChatResponse;
      
      return {
        message: parsedResponse.message || 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten.',
        suggestions: parsedResponse.suggestions || [],
        actionType: parsedResponse.actionType || 'general',
        actionData: parsedResponse.actionData || null
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für Besprechungsplanung im Immobilienbereich. Erstelle strukturierte Besprechungsvorschläge."
          },
          {
            role: "user",
            content: `Erstelle einen Besprechungsvorschlag für:
              Thema: ${topic}
              Teilnehmer: ${participants.join(', ')}
              Kontext: ${context}
              
              Antworte im JSON-Format:
              {
                "title": "Besprechungstitel",
                "agenda": ["Agenda-Punkte"],
                "participants": ["empfohlene Teilnehmer"],
                "duration": 60,
                "preparationTasks": ["Vorbereitungsaufgaben"],
                "followUpActions": ["Follow-up Aktionen"]
              }`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response) as AIMeetingSuggestion;
      
      return {
        title: parsedResponse.title || `Besprechung: ${topic}`,
        agenda: parsedResponse.agenda || ['Begrüßung', 'Hauptthema besprechen', 'Nächste Schritte'],
        participants: parsedResponse.participants || participants,
        duration: parsedResponse.duration || 60,
        preparationTasks: parsedResponse.preparationTasks || [],
        followUpActions: parsedResponse.followUpActions || []
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für Immobilienmarktanalysen und Preisentwicklungen mit jahrelanger Erfahrung."
          },
          {
            role: "user",
            content: `Führe eine umfassende Marktanalyse durch für:
              Standort: ${location}
              Immobilientyp: ${propertyType}
              Historische Daten: ${JSON.stringify(historicalData)}
              
              Erstelle eine detaillierte Analyse mit:
              1. Konkrete Preisempfehlung
              2. Aktuelle Markttrends
              3. Besondere Verkaufsargumente
              4. Mögliche Risiken
              5. Marktprognose für die nächsten 12 Monate
              6. Wettbewerbsanalyse
              
              Antworte im JSON-Format.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response);
      
      return {
        priceRecommendation: parsedResponse.priceRecommendation || "Marktgerechte Preisempfehlung wird analysiert...",
        marketTrend: parsedResponse.marketTrend || "Stabile Marktentwicklung mit leichtem Aufwärtstrend",
        sellingPoints: parsedResponse.sellingPoints || [
          "Attraktive Lage",
          "Gute Infrastruktur",
          "Wertstabile Investition"
        ],
        risks: parsedResponse.risks || [
          "Allgemeine Marktvolatilität",
          "Zinsentwicklung beobachten"
        ],
        forecast: parsedResponse.forecast || "Positive Entwicklung für die nächsten 12 Monate erwartet",
        competitiveAnalysis: parsedResponse.competitiveAnalysis || "Moderate Konkurrenz im Marktsegment"
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du bist ein erfahrener Marketing-Experte für Immobilien mit Spezialisierung auf verschiedene Kanäle und Zielgruppen."
          },
          {
            role: "user",
            content: `Erstelle professionellen Marketing-Content für:
              Immobilie: ${JSON.stringify(propertyDetails)}
              Zielgruppe: ${targetAudience}
              Marketing-Kanal: ${marketingChannel}
              
              Erstelle umfassenden Content mit:
              1. Aufmerksamkeitsstarke Überschrift
              2. Überzeugende Beschreibung
              3. Wichtigste Verkaufsargumente
              4. Starker Call-to-Action
              5. Relevante Hashtags (für Social Media)
              6. E-Mail Betreffzeile
              7. Social Media Post
              
              Antworte im JSON-Format.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(response);
      
      return {
        headline: parsedResponse.headline || "Traumimmobilie gefunden!",
        description: parsedResponse.description || "Entdecken Sie diese einzigartige Immobilie...",
        keyPoints: parsedResponse.keyPoints || [
          "Moderne Ausstattung",
          "Perfekte Lage",
          "Faire Preisgestaltung"
        ],
        callToAction: parsedResponse.callToAction || "Vereinbaren Sie jetzt Ihre Besichtigung!",
        hashtags: parsedResponse.hashtags || ["#Immobilien", "#Traumhaus", "#Verkauf"],
        emailSubject: parsedResponse.emailSubject || "Ihre neue Traumimmobilie wartet auf Sie!",
        socialMediaPost: parsedResponse.socialMediaPost || "🏠 Neue Traumimmobilie verfügbar! Jetzt besichtigen!"
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
