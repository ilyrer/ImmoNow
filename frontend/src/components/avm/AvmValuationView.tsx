/**
 * AVM Valuation View
 * Automatische Immobilienbewertung mit Formular, Ergebnis und Vergleichsobjekten
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Home,
  Calendar,
  Maximize,
  DollarSign,
  BarChart3,
  Sparkles,
  Target,
  TrendingDown,
  Brain
} from 'lucide-react';
import { useAvmValuation } from '../../hooks/useAVM';
import { PropertyType } from '../../lib/api/types';
import { 
  AvmRequest, 
  AvmResult, 
  ComparableListing, 
  MarketIntelligence 
} from '../../lib/api/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAVMIntelligence } from '../../hooks/useAVMIntelligence';

const AvmValuationView: React.FC = () => {
  const avmValuationMutation = useAvmValuation();
  const [formData, setFormData] = useState<AvmRequest>({
    address: '',
    city: 'München',
    postal_code: '80331',
    property_type: PropertyType.APARTMENT,
    size: 85,
    rooms: 3,
    build_year: 2010,
    condition: 'good',
    features: []
  });
  
  const [result, setResult] = useState<AvmResult | null>(null);
  const [comparables, setComparables] = useState<ComparableListing[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  
  // KI-Intelligence States
  const { 
    loading: aiLoading, 
    error: aiError,
    analyzeAVMResult,
    getInvestmentAdvice,
    predictPrice,
    compareWithMarket
  } = useAVMIntelligence();
  
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [investmentAdvice, setInvestmentAdvice] = useState<any>(null);
  const [pricePrediction, setPricePrediction] = useState<any>(null);
  const [marketComparison, setMarketComparison] = useState<any>(null);

  const handleInputChange = (field: keyof AvmRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await avmValuationMutation.mutateAsync(formData);
      setResult(result);
      setComparables(result.comparables || []);
      setMarketData(result.market_intelligence || null);
      
      // Reset KI-Analysen
      setAiInsights(null);
      setInvestmentAdvice(null);
      setPricePrediction(null);
      setMarketComparison(null);
    } catch (error) {
      console.error('Error during valuation:', error);
    }
  };

  // Automatisch KI-Analysen laden wenn Bewertung verfügbar ist
  useEffect(() => {
    if (result && result.estimated_value > 0) {
      // KI-Insights laden
      analyzeAVMResult({
        estimated_value: result.estimated_value,
        confidence_level: result.confidence_level,
        price_range_min: result.valuation_range.min,
        price_range_max: result.valuation_range.max,
        property_type: formData.property_type,
        location: `${formData.city}, ${formData.postal_code}`,
        size: formData.size,
        rooms: formData.rooms || 0
      }).then(insights => setAiInsights(insights));

      // Investment-Empfehlung laden
      getInvestmentAdvice({
        estimated_value: result.estimated_value,
        property_type: formData.property_type,
        location: formData.city,
        size: formData.size
      }).then(advice => setInvestmentAdvice(advice));

      // Preisprognose laden
      predictPrice(
        result.estimated_value,
        formData.city,
        formData.property_type,
        12
      ).then(prediction => setPricePrediction(prediction));

      // Marktvergleich laden (nur wenn Marktdaten vorhanden)
      if (marketData && marketData.trends && marketData.trends.length > 0) {
        // Verwende den aktuellsten Trend (letzter Eintrag)
        const latestTrend = marketData.trends[marketData.trends.length - 1];
        const averageMarketPrice = latestTrend.average_price_per_sqm * formData.size;
        
        compareWithMarket(
          result.estimated_value,
          averageMarketPrice,
          formData.city
        ).then(comparison => setMarketComparison(comparison));
      }
    }
  }, [result, marketData]);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      'new': 'Neubau/Erstbezug',
      'renovated': 'Vollständig saniert',
      'good': 'Guter Zustand',
      'needs_renovation': 'Renovierungsbedürftig',
      'poor': 'Sanierungsbedürftig'
    };
    return labels[condition] || condition;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            AVM & Marktintelligenz
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automatische Immobilienbewertung und Marktanalyse
          </p>
        </div>
      </div>

      {/* Bewertungsformular */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Immobiliendaten
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Standort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stadt
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option>München</option>
                <option>Berlin</option>
                <option>Hamburg</option>
                <option>Frankfurt</option>
                <option>Köln</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PLZ
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="80331"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Immobilientyp
              </label>
              <select
                value={formData.property_type}
                onChange={(e) => handleInputChange('property_type', e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="apartment">Wohnung</option>
                <option value="house">Haus</option>
                <option value="commercial">Gewerbe</option>
                <option value="land">Grundstück</option>
              </select>
            </div>
          </div>

          {/* Objektdaten */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Maximize className="w-4 h-4 inline mr-1" />
                Wohnfläche (m²)
              </label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => handleInputChange('size', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                Zimmer
              </label>
              <input
                type="number"
                value={formData.rooms || ''}
                onChange={(e) => handleInputChange('rooms', parseInt(e.target.value) || undefined)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Baujahr
              </label>
              <input
                type="number"
                value={formData.build_year || ''}
                onChange={(e) => handleInputChange('build_year', parseInt(e.target.value) || undefined)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zustand
              </label>
              <select
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">Neubau</option>
                <option value="renovated">Saniert</option>
                <option value="good">Gut</option>
                <option value="needs_renovation">Renovierungsbedarf</option>
                <option value="poor">Sanierungsbedarf</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={avmValuationMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {avmValuationMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Bewertung läuft...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Immobilie bewerten
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ergebnis-Panel */}
      {result && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bewertungsergebnis
            </h2>
            <span className={`flex items-center gap-2 text-sm font-medium ${getConfidenceColor(result.confidence_level)}`}>
              {result.confidence_level === 'high' && <CheckCircle className="w-4 h-4" />}
              {result.confidence_level !== 'high' && <AlertCircle className="w-4 h-4" />}
              {result.confidence_level === 'high' && 'Hohe Konfidenz'}
              {result.confidence_level === 'medium' && 'Mittlere Konfidenz'}
              {result.confidence_level === 'low' && 'Niedrige Konfidenz'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Hauptwert */}
            <div className="glass p-6 rounded-xl text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <DollarSign className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Geschätzter Marktwert</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {result.estimated_value.toLocaleString('de-DE')} €
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {result.price_per_sqm.toLocaleString('de-DE')} € / m²
              </p>
            </div>

            {/* Wertebereich */}
            <div className="glass p-6 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wertebereich</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {result.valuation_range.min.toLocaleString('de-DE')} € -
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {result.valuation_range.max.toLocaleString('de-DE')} €
              </p>
            </div>

            {/* Methode */}
            <div className="glass p-6 rounded-xl">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bewertungsmethode</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {result.methodology}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {result.comparables_used} Vergleichsobjekte
              </p>
            </div>
          </div>

          {/* Bewertungsfaktoren */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bewertungsfaktoren</h3>
            {result.factors?.map((factor, idx) => (
              <div key={idx} className="glass p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {factor.name}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    factor.impact === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    factor.impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {factor.impact === 'positive' ? '+ Positiv' : factor.impact === 'negative' ? '- Negativ' : 'Neutral'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${factor.weight}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                    {factor.weight}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vergleichsobjekte Tabelle */}
      {comparables.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vergleichsobjekte
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Adresse</th>
                  <th className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Größe</th>
                  <th className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Zustand</th>
                  <th className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Preis</th>
                  <th className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">€/m²</th>
                  <th className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Distanz</th>
                  <th className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">Match</th>
                </tr>
              </thead>
              <tbody>
                {comparables.map((comp, idx) => (
                  <tr key={comp.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{comp.address}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{comp.postal_code} {comp.city}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {comp.size} m²
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {getConditionLabel(comp.condition)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                      {comp.price.toLocaleString('de-DE')} €
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {comp.price_per_sqm.toLocaleString('de-DE')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {comp.distance} km
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        comp.match_score >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        comp.match_score >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {comp.match_score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Markt-Trend Chart (Optional) */}
      {marketData && marketData.trends.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Marktentwicklung - {marketData.region}
          </h2>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketData.trends.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('de-DE', { month: 'short' })}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('de-DE')} €`, 'Ø Preis/m²']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('de-DE')}
                />
                <Line 
                  type="monotone" 
                  dataKey="average_price_per_sqm" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">Preiswachstum 12M</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                +{marketData.price_growth_12m}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">Ø Verweildauer</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {marketData.average_days_on_market} Tage
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">Nachfrage</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {marketData.demand_level === 'very_high' ? 'Sehr hoch' : 
                 marketData.demand_level === 'high' ? 'Hoch' : 'Mittel'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">Wettbewerb</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {marketData.competition_index}/100
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KI-INSIGHTS SEKTION - Neue Features ohne Styling-Änderungen */}
      {aiInsights && result && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              KI-Marktanalyse
            </h2>
            {aiLoading && (
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="space-y-4">
            {/* Zusammenfassung */}
            <div className="glass p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {aiInsights.summary}
              </p>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Wichtigste Erkenntnisse
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.keyInsights.map((insight: string, idx: number) => (
                  <div key={idx} className="glass p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preisanalyse & Marktposition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Preisanalyse
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {aiInsights.priceAnalysis}
                </p>
              </div>
              <div className="glass p-4 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Marktposition
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {aiInsights.marketPosition}
                </p>
              </div>
            </div>

            {/* Empfehlung */}
            <div className="glass p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Handlungsempfehlung
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {aiInsights.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INVESTMENT-EMPFEHLUNG SEKTION */}
      {investmentAdvice && result && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Investment-Empfehlung
            </h2>
          </div>

          {/* Investment Score */}
          <div className="glass p-6 rounded-xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Investment-Score</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {investmentAdvice.investmentScore}/10
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{investmentAdvice.timeframe}</p>
              </div>
              <div className="w-24 h-24">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${investmentAdvice.investmentScore * 25.13} 251.3`}
                    className="text-green-600 dark:text-green-400"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vorteile */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Vorteile
              </h3>
              <div className="space-y-2">
                {investmentAdvice.pros.map((pro: string, idx: number) => (
                  <div key={idx} className="glass p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{pro}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risiken */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Risiken
              </h3>
              <div className="space-y-2">
                {investmentAdvice.cons.map((con: string, idx: number) => (
                  <div key={idx} className="glass p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{con}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risikobewertung & Fazit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="glass p-4 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Risikobewertung
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {investmentAdvice.riskAssessment}
              </p>
            </div>
            <div className="glass p-4 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Fazit
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {investmentAdvice.conclusion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PREISPROGNOSE SEKTION */}
      {pricePrediction && result && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preisprognose (12 Monate)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Aktueller Preis */}
            <div className="glass p-6 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Aktuell</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.estimated_value.toLocaleString('de-DE')} €
              </p>
            </div>

            {/* Prognostizierter Preis */}
            <div className="glass p-6 rounded-xl text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Prognose 12M</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pricePrediction.predictedPrice.toLocaleString('de-DE')} €
              </p>
            </div>

            {/* Veränderung */}
            <div className="glass p-6 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Veränderung</p>
              <p className={`text-2xl font-bold ${pricePrediction.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {pricePrediction.priceChange >= 0 ? '+' : ''}{pricePrediction.priceChangePercent}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {pricePrediction.priceChange >= 0 ? '+' : ''}{pricePrediction.priceChange.toLocaleString('de-DE')} €
              </p>
            </div>
          </div>

          {/* Konfidenz */}
          <div className="glass p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Konfidenz der Prognose
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                pricePrediction.confidence === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                pricePrediction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {pricePrediction.confidence === 'high' ? 'Hoch' : pricePrediction.confidence === 'medium' ? 'Mittel' : 'Niedrig'}
              </span>
            </div>
          </div>

          {/* Erklärung */}
          <div className="glass p-4 rounded-lg mb-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Begründung
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {pricePrediction.explanation}
            </p>
          </div>

          {/* Einflussfaktoren */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Wichtigste Einflussfaktoren
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pricePrediction.factors.map((factor: string, idx: number) => (
                <div key={idx} className="glass p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MARKTVERGLEICH SEKTION */}
      {marketComparison && result && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Marktvergleich
            </h2>
          </div>

          <div className="glass p-6 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {marketComparison.competitive === 'above' && <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />}
                {marketComparison.competitive === 'below' && <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />}
                {marketComparison.competitive === 'at' && <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Position am Markt</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.abs(marketComparison.percentageDiff).toFixed(1)}% {
                      marketComparison.competitive === 'above' ? 'über' : 
                      marketComparison.competitive === 'below' ? 'unter' : 'am'
                    } Durchschnitt
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {marketComparison.comparison}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Marktanalyse
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {marketComparison.insight}
              </p>
            </div>
            <div className="glass p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Empfehlung
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {marketComparison.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvmValuationView;
