/**
 * AI-Exposé Feature Types
 * 
 * These types define the structure for AI-generated property exposés,
 * including drafts, versions, and quality metrics.
 */

export type ExposeAudience = 'kauf' | 'miete' | 'investor';
export type ExposeTone = 'neutral' | 'elegant' | 'kurz';
export type ExposeLanguage = 'de' | 'en';
export type ExposeLength = 'short' | 'standard' | 'long';
export type ExposeQuality = 'low' | 'med' | 'high';

/**
 * Draft configuration for generating an AI exposé
 */
export interface ExposeDraft {
  id: string;
  propertyId: string;
  audience: ExposeAudience;
  tone: ExposeTone;
  lang: ExposeLanguage;
  length: ExposeLength;
  keywords: string[];
  createdAt: string;
}

/**
 * Generated exposé version with content and metadata
 */
export interface ExposeVersion {
  id: string;
  propertyId: string;
  draftId: string;
  title: string;
  body: string;
  bullets: string[];
  wordCount: number;
  quality: ExposeQuality;
  seoScore?: number;
  readabilityScore?: number;
  createdAt: string;
  updatedAt?: string;
  isPublished?: boolean;
}

/**
 * Statistics for exposé generation
 */
export interface ExposeStats {
  totalVersions: number;
  publishedVersions: number;
  averageQuality: ExposeQuality;
  averageWordCount: number;
  mostUsedTone: ExposeTone;
  mostUsedAudience: ExposeAudience;
}

/**
 * Request params for generating an exposé
 */
export interface GenerateExposeRequest {
  propertyId: string;
  audience: ExposeAudience;
  tone: ExposeTone;
  lang: ExposeLanguage;
  length: ExposeLength;
  keywords?: string[];
  includeFinancials?: boolean;
  includeLocation?: boolean;
  includeFeatures?: boolean;
}

/**
 * Response from exposé generation
 */
export interface GenerateExposeResponse {
  version: ExposeVersion;
  suggestions?: string[];
  warnings?: string[];
  processingTime?: number;
}
