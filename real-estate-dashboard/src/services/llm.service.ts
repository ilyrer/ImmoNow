/**
 * Zentraler LLM Service
 * ALLE LLM-Anfragen gehen durch diesen Service
 * Zum Ändern des Modells: nur Backend .env anpassen!
 */

import { apiClient } from '../api/config';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequestOptions {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  response: string;
  tokens_used: number;
  model: string;
  timestamp: string;
}

export interface DashboardQARequest {
  question: string;
  contextType?: 'dashboard' | 'cim' | 'investor' | 'properties';
  includeData?: boolean;
}

export interface DashboardQAResponse {
  answer: string;
  context_used: string;
  related_kpis: string[];
  tokens_used: number;
  timestamp: string;
}

/**
 * Zentraler LLM Service
 * Alle Chatbot-Anfragen gehen durch diesen Service
 */
export class LLMService {
  private static BASE_URL = '/api/v1/llm';

  /**
   * Stelle eine allgemeine Frage an das LLM
   * Verwendet automatisch den konfigurierten LLM-Provider (DeepSeek V3.1)
   */
  static async askQuestion(options: LLMRequestOptions): Promise<LLMResponse> {
    try {
      const response = await apiClient.post<LLMResponse>(`${this.BASE_URL}/test`, {
        prompt: options.prompt,
        context: options.context,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      });

      return response.data;
    } catch (error: any) {
      console.error('LLM Error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Senden der Anfrage');
    }
  }

  /**
   * Stelle eine Dashboard-spezifische Frage
   * Beinhaltet vordefinierte KPI-Kontexte
   */
  static async askDashboardQuestion(request: DashboardQARequest): Promise<DashboardQAResponse> {
    try {
      const response = await apiClient.post<DashboardQAResponse>(
        `${this.BASE_URL}/test_dashboard`,
        {
          question: request.question,
          context_type: request.contextType || 'dashboard',
          include_data: request.includeData !== false,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Dashboard LLM Error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Senden der Dashboard-Anfrage');
    }
  }

  /**
   * Chat-Konversation mit Kontext
   * Für fortlaufende Dialoge
   */
  static async chat(
    message: string,
    context?: {
      previousMessages?: LLMMessage[];
      userInfo?: any;
      pageContext?: string;
    }
  ): Promise<LLMResponse> {
    // Baue Kontext auf
    let contextString = '';
    
    if (context?.previousMessages && context.previousMessages.length > 0) {
      const lastMessages = context.previousMessages.slice(-5); // Letzte 5 Nachrichten
      contextString += 'Vorherige Nachrichten:\n';
      lastMessages.forEach(msg => {
        contextString += `${msg.role === 'user' ? 'Benutzer' : 'Assistent'}: ${msg.content}\n`;
      });
      contextString += '\n';
    }

    if (context?.userInfo) {
      contextString += `Benutzer: ${context.userInfo.email || 'Unbekannt'}\n`;
    }

    if (context?.pageContext) {
      contextString += `Aktuelle Seite: ${context.pageContext}\n`;
    }

    return this.askQuestion({
      prompt: message,
      context: contextString || undefined,
      temperature: 0.7,
    });
  }

  /**
   * Strukturierte Aufgabenanalyse
   * Analysiert Aufgaben und gibt Empfehlungen
   */
  static async analyzeTask(taskDescription: string): Promise<{
    priority: 'hoch' | 'mittel' | 'niedrig';
    estimatedTime: string;
    suggestedDeadline: string;
    title: string;
    description: string;
  }> {
    const systemPrompt = `Du bist ein Projektmanager für Immobilienverwaltung. 
Analysiere die folgende Aufgabe und gib strukturierte Empfehlungen.
Antworte NUR mit einem JSON-Objekt ohne zusätzlichen Text:
{
  "priority": "hoch|mittel|niedrig",
  "estimatedTime": "geschätzter Zeitaufwand",
  "suggestedDeadline": "YYYY-MM-DD",
  "title": "optimierter Titel",
  "description": "optimierte Beschreibung"
}`;

    const response = await this.askQuestion({
      prompt: `Aufgabe: ${taskDescription}\n\n${systemPrompt}`,
      temperature: 0.3, // Niedriger für strukturierte Ausgaben
      maxTokens: 500,
    });

    try {
      // Extrahiere JSON aus der Antwort
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          priority: parsed.priority || 'mittel',
          estimatedTime: parsed.estimatedTime || '2-3 Stunden',
          suggestedDeadline: parsed.suggestedDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: parsed.title || taskDescription,
          description: parsed.description || taskDescription,
        };
      }
    } catch (error) {
      console.error('Failed to parse task analysis:', error);
    }

    // Fallback
    return {
      priority: 'mittel',
      estimatedTime: '2-3 Stunden',
      suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: taskDescription,
      description: taskDescription,
    };
  }

  /**
   * Generiere Immobilienbeschreibung
   */
  static async generatePropertyDescription(propertyDetails: {
    type: string;
    size: number;
    rooms: number;
    location: string;
    features: string[];
    condition: string;
    price: number;
  }): Promise<{
    title: string;
    description: string;
    highlights: string[];
    marketingPoints: string[];
  }> {
    const prompt = `Erstelle eine professionelle Immobilienbeschreibung für:
- Typ: ${propertyDetails.type}
- Größe: ${propertyDetails.size}m²
- Zimmer: ${propertyDetails.rooms}
- Lage: ${propertyDetails.location}
- Ausstattung: ${propertyDetails.features.join(', ')}
- Zustand: ${propertyDetails.condition}
- Preis: ${propertyDetails.price}€

Erstelle:
1. Einen aufmerksamkeitsstarken Titel
2. Eine überzeugende Beschreibung (2-3 Absätze)
3. Die 5 wichtigsten Highlights
4. Die 3 besten Verkaufsargumente`;

    const response = await this.askQuestion({
      prompt,
      temperature: 0.8, // Höher für kreative Texte
      maxTokens: 1500,
    });

    // Parse die Antwort
    const text = response.response;
    const lines = text.split('\n').filter(l => l.trim());

    return {
      title: lines[0] || `${propertyDetails.type} in ${propertyDetails.location}`,
      description: text,
      highlights: lines.slice(1, 6),
      marketingPoints: lines.slice(6, 9),
    };
  }

  /**
   * Marktanalyse durchführen
   */
  static async analyzeMarket(location: string, propertyType: string): Promise<{
    priceRecommendation: string;
    marketTrend: string;
    sellingPoints: string[];
    risks: string[];
  }> {
    const prompt = `Führe eine Marktanalyse durch für:
- Standort: ${location}
- Immobilientyp: ${propertyType}

Analysiere:
1. Preisempfehlung
2. Aktuelle Markttrends
3. Top 5 Verkaufsargumente
4. Top 3 Risiken`;

    const response = await this.askQuestion({
      prompt,
      temperature: 0.5,
      maxTokens: 1000,
    });

    const text = response.response;
    const lines = text.split('\n').filter(l => l.trim());

    return {
      priceRecommendation: lines[0] || 'Marktgerechte Preisgestaltung empfohlen',
      marketTrend: lines[1] || 'Stabile Marktlage',
      sellingPoints: lines.slice(2, 7),
      risks: lines.slice(7, 10),
    };
  }

  /**
   * Generiere Marketing-Content
   */
  static async generateMarketingContent(
    propertyType: string,
    targetAudience: string,
    channel: string
  ): Promise<{
    headline: string;
    description: string;
    callToAction: string;
    hashtags: string[];
  }> {
    const prompt = `Erstelle Marketing-Content für:
- Immobilie: ${propertyType}
- Zielgruppe: ${targetAudience}
- Kanal: ${channel}

Erstelle:
1. Aufmerksamkeitsstarke Überschrift
2. Überzeugende Beschreibung (2-3 Sätze)
3. Starker Call-to-Action
4. 5 relevante Hashtags`;

    const response = await this.askQuestion({
      prompt,
      temperature: 0.9, // Sehr kreativ
      maxTokens: 800,
    });

    const text = response.response;
    const lines = text.split('\n').filter(l => l.trim());

    return {
      headline: lines[0] || 'Traumimmobilie gefunden!',
      description: lines[1] || 'Entdecken Sie diese einzigartige Immobilie.',
      callToAction: lines[2] || 'Jetzt Besichtigung vereinbaren!',
      hashtags: lines.slice(3, 8).map(l => l.startsWith('#') ? l : `#${l}`),
    };
  }

  /**
   * Health Check
   * Überprüfe ob der LLM-Service verfügbar ist
   */
  static async healthCheck(): Promise<{
    status: string;
    model: string;
    available: boolean;
  }> {
    try {
      // Verwende den health Endpunkt nicht, da er Auth benötigt
      // Stattdessen mache eine einfache Test-Anfrage
      const response = await this.askQuestion({
        prompt: 'Hallo',
        maxTokens: 10,
        temperature: 0.1,
      });

      return {
        status: 'healthy',
        model: response.model,
        available: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        model: 'unknown',
        available: false,
      };
    }
  }

  // ========================================
  // AVM & MARKTINTELLIGENZ FUNKTIONEN
  // ========================================

  /**
   * Analysiere AVM-Ergebnis und generiere KI-Insights
   */
  static async analyzeAVMResult(avmData: {
    estimated_value: number;
    confidence_level: string;
    price_range_min: number;
    price_range_max: number;
    property_type: string;
    location: string;
    size: number;
    rooms: number;
  }): Promise<{
    summary: string;
    keyInsights: string[];
    priceAnalysis: string;
    marketPosition: string;
    recommendation: string;
  }> {
    const prompt = `Analysiere diese Immobilienbewertung:

Immobilie:
- Typ: ${avmData.property_type}
- Lage: ${avmData.location}
- Größe: ${avmData.size}m²
- Zimmer: ${avmData.rooms}

Bewertung:
- Geschätzter Wert: ${avmData.estimated_value.toLocaleString('de-DE')}€
- Preisspanne: ${avmData.price_range_min.toLocaleString('de-DE')}€ - ${avmData.price_range_max.toLocaleString('de-DE')}€
- Konfidenz: ${avmData.confidence_level}

Erstelle eine prägnante Analyse mit:
1. Zusammenfassung (2-3 Sätze)
2. 5 wichtigste Insights
3. Preisanalyse
4. Marktposition
5. Handlungsempfehlung`;

    try {
      const response = await this.askQuestion({
        prompt,
        temperature: 0.6,
        maxTokens: 1200,
      });

      const lines = response.response.split('\n').filter(l => l.trim());
      
      return {
        summary: lines.slice(0, 2).join(' '),
        keyInsights: lines.slice(2, 7),
        priceAnalysis: lines.slice(7, 9).join(' '),
        marketPosition: lines.slice(9, 11).join(' '),
        recommendation: lines.slice(11).join(' '),
      };
    } catch (error) {
      console.error('AVM Analysis Error:', error);
      return {
        summary: 'Die Bewertung wurde erfolgreich durchgeführt.',
        keyInsights: [
          'Immobilie liegt im mittleren Preissegment',
          'Gute Marktlage',
          'Moderate Preisentwicklung erwartet'
        ],
        priceAnalysis: 'Der Preis entspricht den Markterwartungen.',
        marketPosition: 'Solide Marktposition.',
        recommendation: 'Bewertung erscheint realistisch.',
      };
    }
  }

  /**
   * Generiere Investment-Empfehlung basierend auf AVM
   */
  static async generateInvestmentAdvice(avmData: {
    estimated_value: number;
    property_type: string;
    location: string;
    size: number;
    expected_roi?: number;
  }): Promise<{
    investmentScore: number;
    pros: string[];
    cons: string[];
    riskAssessment: string;
    timeframe: string;
    conclusion: string;
  }> {
    const prompt = `Bewerte diese Immobilie als Investment:

Immobilie:
- Typ: ${avmData.property_type}
- Lage: ${avmData.location}
- Größe: ${avmData.size}m²
- Wert: ${avmData.estimated_value.toLocaleString('de-DE')}€

Erstelle eine Investment-Analyse:
1. Investment-Score (1-10)
2. 3-4 Vorteile
3. 3-4 Risiken
4. Risikobewertung
5. Empfohlener Zeithorizont
6. Fazit`;

    try {
      const response = await this.askQuestion({
        prompt,
        temperature: 0.5,
        maxTokens: 800,
      });

      const lines = response.response.split('\n').filter(l => l.trim());
      
      // Extrahiere Score aus erster Zeile
      const scoreMatch = lines[0]?.match(/(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      
      return {
        investmentScore: Math.min(10, Math.max(1, score)),
        pros: lines.slice(1, 5),
        cons: lines.slice(5, 9),
        riskAssessment: lines.slice(9, 11).join(' '),
        timeframe: lines.slice(11, 13).join(' '),
        conclusion: lines.slice(13).join(' '),
      };
    } catch (error) {
      console.error('Investment Advice Error:', error);
      return {
        investmentScore: 7,
        pros: ['Solide Lage', 'Marktgerechter Preis', 'Gute Ausstattung'],
        cons: ['Marktrisiken beachten', 'Finanzierung prüfen'],
        riskAssessment: 'Moderates Risiko',
        timeframe: 'Mittelfristig (3-5 Jahre)',
        conclusion: 'Interessantes Investment mit solidem Potenzial.',
      };
    }
  }

  /**
   * Erkläre Markttrends für einen Standort
   */
  static async explainMarketTrends(location: string, propertyType: string): Promise<{
    trendSummary: string;
    priceEvolution: string;
    demandAnalysis: string;
    forecast12Months: string;
    keyFactors: string[];
  }> {
    const prompt = `Analysiere den Immobilienmarkt in ${location} für ${propertyType}:

1. Aktueller Markttrend (2-3 Sätze)
2. Preisentwicklung letzte 12 Monate
3. Nachfrageanalyse
4. Prognose nächste 12 Monate
5. 5 wichtigste Einflussfaktoren`;

    try {
      const response = await this.askQuestion({
        prompt,
        temperature: 0.6,
        maxTokens: 1000,
      });

      const lines = response.response.split('\n').filter(l => l.trim());
      
      return {
        trendSummary: lines.slice(0, 2).join(' '),
        priceEvolution: lines.slice(2, 4).join(' '),
        demandAnalysis: lines.slice(4, 6).join(' '),
        forecast12Months: lines.slice(6, 8).join(' '),
        keyFactors: lines.slice(8, 13),
      };
    } catch (error) {
      console.error('Market Trends Error:', error);
      return {
        trendSummary: 'Stabiler Markt mit moderatem Wachstum.',
        priceEvolution: 'Preise sind leicht gestiegen.',
        demandAnalysis: 'Nachfrage bleibt konstant hoch.',
        forecast12Months: 'Fortsetzung des positiven Trends erwartet.',
        keyFactors: [
          'Wirtschaftliche Entwicklung',
          'Zinsniveau',
          'Bevölkerungswachstum'
        ],
      };
    }
  }

  /**
   * Generiere Preisprognose
   */
  static async predictPriceEvolution(
    currentPrice: number,
    location: string,
    propertyType: string,
    timeframeMonths: number = 12
  ): Promise<{
    predictedPrice: number;
    priceChange: number;
    priceChangePercent: number;
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
    factors: string[];
  }> {
    const prompt = `Prognostiziere die Preisentwicklung:

Immobilie:
- Aktueller Preis: ${currentPrice.toLocaleString('de-DE')}€
- Lage: ${location}
- Typ: ${propertyType}
- Zeitraum: ${timeframeMonths} Monate

Erstelle eine Preisprognose:
1. Erwarteter Preis in ${timeframeMonths} Monaten
2. Prozentuale Veränderung
3. Konfidenz (high/medium/low)
4. Begründung (2-3 Sätze)
5. 3 wichtigste Einflussfaktoren`;

    try {
      const response = await this.askQuestion({
        prompt,
        temperature: 0.4,
        maxTokens: 600,
      });

      const text = response.response;
      const lines = text.split('\n').filter(l => l.trim());
      
      // Versuche Preis und Prozent zu extrahieren
      const priceMatch = text.match(/(\d+(?:\.\d+)?)\s*€/);
      const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
      
      const changePercent = percentMatch ? parseFloat(percentMatch[1]) : 3.5;
      const predictedPrice = priceMatch 
        ? parseFloat(priceMatch[1])
        : currentPrice * (1 + changePercent / 100);
      
      const priceChange = predictedPrice - currentPrice;
      
      return {
        predictedPrice: Math.round(predictedPrice),
        priceChange: Math.round(priceChange),
        priceChangePercent: parseFloat(changePercent.toFixed(2)),
        confidence: changePercent < 5 ? 'high' : changePercent < 10 ? 'medium' : 'low',
        explanation: lines.slice(3, 6).join(' ') || 'Moderate Preisentwicklung erwartet.',
        factors: lines.slice(6, 9) || ['Marktnachfrage', 'Zinsentwicklung', 'Standortfaktoren'],
      };
    } catch (error) {
      console.error('Price Prediction Error:', error);
      const changePercent = 3.5;
      const predictedPrice = currentPrice * (1 + changePercent / 100);
      
      return {
        predictedPrice: Math.round(predictedPrice),
        priceChange: Math.round(predictedPrice - currentPrice),
        priceChangePercent: changePercent,
        confidence: 'medium',
        explanation: 'Basierend auf aktuellen Markttrends wird eine moderate Preissteigerung erwartet.',
        factors: ['Marktnachfrage', 'Zinsentwicklung', 'Wirtschaftslage'],
      };
    }
  }

  /**
   * Vergleiche Immobilie mit Markt
   */
  static async compareWithMarket(
    propertyValue: number,
    averageMarketPrice: number,
    location: string
  ): Promise<{
    comparison: string;
    competitive: 'above' | 'at' | 'below';
    percentageDiff: number;
    insight: string;
    recommendation: string;
  }> {
    const diff = propertyValue - averageMarketPrice;
    const percentDiff = (diff / averageMarketPrice) * 100;
    
    const prompt = `Vergleiche diese Immobilie mit dem Markt:

Immobilienwert: ${propertyValue.toLocaleString('de-DE')}€
Marktdurchschnitt: ${averageMarketPrice.toLocaleString('de-DE')}€
Differenz: ${Math.abs(percentDiff).toFixed(1)}% ${percentDiff >= 0 ? 'über' : 'unter'} Durchschnitt
Lage: ${location}

Erkläre:
1. Was bedeutet diese Positionierung?
2. Ist der Preis gerechtfertigt?
3. Handlungsempfehlung`;

    try {
      const response = await this.askQuestion({
        prompt,
        temperature: 0.6,
        maxTokens: 400,
      });

      const lines = response.response.split('\n').filter(l => l.trim());
      
      return {
        comparison: lines[0] || 'Immobilie liegt im Marktdurchschnitt.',
        competitive: Math.abs(percentDiff) < 5 ? 'at' : percentDiff > 0 ? 'above' : 'below',
        percentageDiff: parseFloat(percentDiff.toFixed(2)),
        insight: lines.slice(1, 3).join(' ') || 'Marktgerechte Bewertung.',
        recommendation: lines.slice(3).join(' ') || 'Preis erscheint angemessen.',
      };
    } catch (error) {
      console.error('Market Comparison Error:', error);
      return {
        comparison: 'Immobilie liegt im Marktdurchschnitt.',
        competitive: 'at',
        percentageDiff: parseFloat(percentDiff.toFixed(2)),
        insight: 'Die Bewertung entspricht den Marktpreisen.',
        recommendation: 'Der Preis ist marktgerecht.',
      };
    }
  }

  /**
   * Preisstrategie generieren (strukturierte JSON-Antwort)
   */
  static async generatePricingStrategy(input: {
    location: string;
    propertyType: string;
    estimatedValue: number;
    rangeMin: number;
    rangeMax: number;
    pricePerSqm: number;
    size: number;
    demandLevel?: string;
    competitionIndex?: number;
  }): Promise<{
    recommendedListingPrice: number;
    positioning: 'aggressiv' | 'marktgerecht' | 'defensiv';
    strategyNotes: string[];
    priceBand: { softFloor: number; optimal: number; softCeil: number };
    urgencyTips: string[];
  }> {
    const prompt = `Erstelle eine PREISSTRATEGIE als JSON.
Kontext:
- Standort: ${input.location}
- Typ: ${input.propertyType}
- Wert: ${input.estimatedValue}
- Spanne: ${input.rangeMin} - ${input.rangeMax}
- €/m²: ${input.pricePerSqm}
- Größe: ${input.size} m²
- Nachfrage: ${input.demandLevel || 'unbekannt'}
- Wettbewerb: ${input.competitionIndex ?? 'unbekannt'}

Antwort-JSON mit Feldern:
{
  "recommendedListingPrice": number,
  "positioning": "aggressiv"|"marktgerecht"|"defensiv",
  "strategyNotes": string[],
  "priceBand": { "softFloor": number, "optimal": number, "softCeil": number },
  "urgencyTips": string[]
}`;

    try {
      const res = await this.askQuestion({ prompt, temperature: 0.4, maxTokens: 900 });
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error('Pricing Strategy Error:', e);
    }
    const opt = Math.round(input.estimatedValue);
    return {
      recommendedListingPrice: opt,
      positioning: 'marktgerecht',
      strategyNotes: ['Marktgerechte Preisansetzung empfohlen.'],
      priceBand: { softFloor: Math.round(input.rangeMin), optimal: opt, softCeil: Math.round(input.rangeMax) },
      urgencyTips: ['Frühe Besichtigungsslots anbieten', 'Hochwertiges Exposé nutzen'],
    };
  }

  /**
   * Renovierungs-ROI und Maßnahmenplan
   */
  static async generateRenovationPlan(input: {
    condition: string;
    propertyType: string;
    location: string;
    size: number;
  }): Promise<{
    quickWins: Array<{ measure: string; cost: number; uplift: number }>;
    majorUpgrades: Array<{ measure: string; cost: number; uplift: number }>;
    totalPotentialUplift: number;
    remarks: string;
  }> {
    const prompt = `Erstelle einen Renovierungs-ROI-Plan als JSON.
Kontext: Typ ${input.propertyType}, Zustand ${input.condition}, Lage ${input.location}, Größe ${input.size} m².
JSON Felder:
{
  "quickWins": [{"measure": string, "cost": number, "uplift": number}],
  "majorUpgrades": [{"measure": string, "cost": number, "uplift": number}],
  "totalPotentialUplift": number,
  "remarks": string
}`;
    try {
      const res = await this.askQuestion({ prompt, temperature: 0.5, maxTokens: 900 });
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error('Renovation Plan Error:', e);
    }
    return {
      quickWins: [{ measure: 'Wände streichen', cost: 1500, uplift: 4000 }],
      majorUpgrades: [{ measure: 'Bad modernisieren', cost: 12000, uplift: 18000 }],
      totalPotentialUplift: 22000,
      remarks: 'Maßnahmen priorisieren nach Budget und Zeithorizont.',
    };
  }

  /**
   * Buyer Persona & Kanäle
   */
  static async generateBuyerPersona(input: {
    location: string;
    propertyType: string;
    size: number;
    price: number;
  }): Promise<{
    personas: Array<{ name: string; description: string; keyNeeds: string[] }>;
    channels: string[];
    messaging: string[];
  }> {
    const prompt = `Erstelle Buyer-Personas als JSON für ${input.propertyType} in ${input.location}, ${input.size} m², Preis ${input.price}.
JSON:
{
  "personas": [{"name": string, "description": string, "keyNeeds": string[]}],
  "channels": string[],
  "messaging": string[]
}`;
    try {
      const res = await this.askQuestion({ prompt, temperature: 0.6, maxTokens: 800 });
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error('Buyer Persona Error:', e);
    }
    return {
      personas: [{ name: 'Junges Paar', description: 'Erstkäufer mit Fokus Lage/ÖPNV', keyNeeds: ['Gute Anbindung', 'Niedrige Nebenkosten'] }],
      channels: ['Portale', 'Social Ads', 'Bestandskunden'],
      messaging: ['Zentrale Lage', 'Effizienter Grundriss'],
    };
  }

  /**
   * Sales-Playbook / Nächste Schritte
   */
  static async generateSalesPlaybook(input: {
    location: string;
    type: string;
    demandLevel?: string;
    competitionIndex?: number;
  }): Promise<{
    nextSteps: string[];
    checklist: string[];
    kpis: Array<{ name: string; target: string }>;
  }> {
    const prompt = `Erstelle ein kurzes Sales-Playbook als JSON.
Kontext: ${input.type} in ${input.location}, Nachfrage ${input.demandLevel || 'n/a'}, Wettbewerb ${input.competitionIndex ?? 'n/a'}.
JSON:
{
  "nextSteps": string[],
  "checklist": string[],
  "kpis": [{"name": string, "target": string}]
}`;
    try {
      const res = await this.askQuestion({ prompt, temperature: 0.4, maxTokens: 700 });
      const match = res.response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error('Sales Playbook Error:', e);
    }
    return {
      nextSteps: ['Exposé finalisieren', 'Besichtigungsslots planen', 'Preisband intern abstimmen'],
      checklist: ['Energieausweis prüfen', 'Grundriss bereitstellen', 'Finanzierungsbestätigungsvorlage'],
      kpis: [{ name: 'Leads/Woche', target: '≥10' }, { name: 'Zeit bis Erstbesichtigung', target: '<=5 Tage' }],
    };
  }
}

export default LLMService;

