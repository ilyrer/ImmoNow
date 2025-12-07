import { apiClient } from '../config';
import type {
  AITaskSuggestion,
  TaskAnalysisParams,
  AIPropertyDescription,
  PropertyDescriptionParams,
  MarketAnalysis,
  MarketAnalysisParams,
  MarketingContent,
  MarketingContentParams,
} from './types';

export async function suggestTaskPriority(params: TaskAnalysisParams): Promise<AITaskSuggestion> {
  const { data } = await apiClient.post(`/ai/task-analysis`, params);
  return data;
}

export async function generatePropertyDescription(params: PropertyDescriptionParams): Promise<AIPropertyDescription> {
  const { data } = await apiClient.post(`/ai/property-description`, params);
  return data;
}

export async function analyzeMarketTrends(params: MarketAnalysisParams): Promise<MarketAnalysis> {
  const { data } = await apiClient.post(`/ai/market-analysis`, params);
  return data;
}

export async function generateMarketingContent(params: MarketingContentParams): Promise<MarketingContent> {
  const { data } = await apiClient.post(`/ai/marketing-content`, params);
  return data;
}

export async function checkAIServiceAvailability(): Promise<{ available: boolean; message?: string }> {
  try {
    const { data } = await apiClient.get(`/ai/status`);
    return data;
  } catch (e) {
    return { available: false, message: 'AI-Service ist nicht erreichbar' };
  }
}
