/**
 * Typdefinitionen für die AI Assistant API
 */

/**
 * Vorschlag für Aufgabenprioritäten und -details
 */
export interface AITaskSuggestion {
  priority: 'hoch' | 'mittel' | 'niedrig';
  estimatedTime: string;
  suggestedDeadline: string;
  assigneeRecommendation?: string;
  title?: string;
  description?: string;
}

/**
 * Parameter für die Aufgabenanalyse
 */
export interface TaskAnalysisParams {
  taskTitle: string;
  taskDescription: string;
  teamContext: string;
}

/**
 * Generierte Immobilienbeschreibung mit Marketing-Details
 */
export interface AIPropertyDescription {
  title: string;
  description: string;
  highlights: string[];
  marketingPoints: string[];
  suggestedPrice: string;
}

/**
 * Parameter für die Erstellung einer Immobilienbeschreibung
 */
export interface PropertyDescriptionParams {
  type: string;
  size: number;
  rooms: number;
  location: string;
  features: string[];
  condition: string;
  price: number;
}

/**
 * Marktanalyse für Immobilien
 */
export interface MarketAnalysis {
  priceRecommendation: string;
  marketTrend: string;
  sellingPoints: string[];
  risks: string[];
}

/**
 * Parameter für die Marktanalyse
 */
export interface MarketAnalysisParams {
  location: string;
  propertyType: string;
  historicalData: any[]; // Preisdaten der letzten Monate/Jahre
}

/**
 * Marketing-Content für Immobilien
 */
export interface MarketingContent {
  headline: string;
  description: string;
  keyPoints: string[];
  callToAction: string;
}

/**
 * Parameter für die Erstellung von Marketing-Content
 */
export interface MarketingContentParams {
  propertyDetails: any;
  targetAudience: string;
  marketingChannel: string;
} 
