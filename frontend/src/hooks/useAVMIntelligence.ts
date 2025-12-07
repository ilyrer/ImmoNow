/**
 * Custom Hook für AVM KI-Intelligenz
 * Verwendet LLM Service für erweiterte Marktanalysen
 */

import { useState } from 'react';
import { LLMService } from '../services/llm.service';

export interface AVMIntelligenceResult {
  summary: string;
  keyInsights: string[];
  priceAnalysis: string;
  marketPosition: string;
  recommendation: string;
}

export interface InvestmentAdvice {
  investmentScore: number;
  pros: string[];
  cons: string[];
  riskAssessment: string;
  timeframe: string;
  conclusion: string;
}

export interface MarketTrends {
  trendSummary: string;
  priceEvolution: string;
  demandAnalysis: string;
  forecast12Months: string;
  keyFactors: string[];
}

export interface PricePrediction {
  predictedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  factors: string[];
}

export interface MarketComparison {
  comparison: string;
  competitive: 'above' | 'at' | 'below';
  percentageDiff: number;
  insight: string;
  recommendation: string;
}

export function useAVMIntelligence() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analysiere AVM-Ergebnis
   */
  const analyzeAVMResult = async (avmData: {
    estimated_value: number;
    confidence_level: string;
    price_range_min: number;
    price_range_max: number;
    property_type: string;
    location: string;
    size: number;
    rooms: number;
  }): Promise<AVMIntelligenceResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LLMService.analyzeAVMResult(avmData);
      return result;
    } catch (err: any) {
      setError(err.message || 'Fehler bei der AVM-Analyse');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generiere Investment-Empfehlung
   */
  const getInvestmentAdvice = async (avmData: {
    estimated_value: number;
    property_type: string;
    location: string;
    size: number;
  }): Promise<InvestmentAdvice | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LLMService.generateInvestmentAdvice(avmData);
      return result;
    } catch (err: any) {
      setError(err.message || 'Fehler bei Investment-Analyse');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Erkläre Markttrends
   */
  const getMarketTrends = async (
    location: string,
    propertyType: string
  ): Promise<MarketTrends | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LLMService.explainMarketTrends(location, propertyType);
      return result;
    } catch (err: any) {
      setError(err.message || 'Fehler bei Markttrend-Analyse');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Prognostiziere Preisentwicklung
   */
  const predictPrice = async (
    currentPrice: number,
    location: string,
    propertyType: string,
    timeframeMonths: number = 12
  ): Promise<PricePrediction | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LLMService.predictPriceEvolution(
        currentPrice,
        location,
        propertyType,
        timeframeMonths
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Fehler bei Preisprognose');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vergleiche mit Markt
   */
  const compareWithMarket = async (
    propertyValue: number,
    averageMarketPrice: number,
    location: string
  ): Promise<MarketComparison | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LLMService.compareWithMarket(
        propertyValue,
        averageMarketPrice,
        location
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Fehler bei Marktvergleich');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    analyzeAVMResult,
    getInvestmentAdvice,
    getMarketTrends,
    predictPrice,
    compareWithMarket,
  };
}

export default useAVMIntelligence;

