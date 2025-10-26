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
import { marketService } from '../../services/market.service';
import LLMService from '../../services/llm.service';

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
    features: [],
    // Neue optionale Felder initialisieren
    balcony: false,
    terrace: false,
    garden: false,
    garden_size: undefined,
    garage: false,
    parking_spaces: undefined,
    basement: false,
    elevator: false,
    floor: undefined,
    total_floors: undefined,
    bathrooms: undefined,
    guest_toilet: false,
    fitted_kitchen: false,
    fireplace: false,
    air_conditioning: false,
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
  const [llmTrends, setLlmTrends] = useState<any>(null);
  const [poiLat, setPoiLat] = useState<string>('');
  const [poiLng, setPoiLng] = useState<string>('');
  const [poiSummary, setPoiSummary] = useState<any>(null);
  const [pricingStrategy, setPricingStrategy] = useState<any>(null);
  const [renovationPlan, setRenovationPlan] = useState<any>(null);
  const [buyerPersona, setBuyerPersona] = useState<any>(null);
  const [salesPlaybook, setSalesPlaybook] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (field: keyof AvmRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Client-Validierung gegen Backend-Schema: address (>=5), postal_code (5 Ziffern)
      const postalOk = /^\d{5}$/.test(formData.postal_code || '');
      const addressOk = (formData.address || '').trim().length >= 5;
      if (!postalOk || !addressOk) {
        setFormError(!addressOk ? 'Bitte eine gültige Adresse (min. 5 Zeichen) eingeben.' : 'Bitte eine gültige PLZ (5 Ziffern) eingeben.');
        return;
      }
      setFormError(null);

      const response = await avmValuationMutation.mutateAsync(formData as any);
      // response hat Struktur AvmResponse
      setResult(response.result as any);
      setComparables(response.comparables || []);
      setMarketData(response.market_intelligence || null);
      // Fallback: Falls Backend (vorübergehend) keine MarketIntelligence liefert, lade Trends live
      if (!result.market_intelligence) {
        try {
          const live = await marketService.getTrends(formData.city, formData.postal_code);
          setMarketData({
            region: live.city,
            postal_code: live.postal_code,
            demand_level: 'medium',
            supply_level: 'medium',
            price_growth_12m: 0,
            price_growth_36m: 0,
            average_days_on_market: 60,
            competition_index: 5,
            trends: (live.trends || []).map((t: any) => ({
              date: t.date,
              average_price: t.average_price,
              average_price_per_sqm: t.average_price_per_sqm,
              transaction_count: t.transaction_count,
              median_price: t.median_price,
              region: t.region,
            }))
          } as any);
        } catch (e) {
          console.error('Fehler beim Laden der Live-Marktdaten:', e);
        }
      }
      
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
    if (result && typeof result.estimated_value === 'number' && result.estimated_value > 0) {
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

      // LLM Markttrend-Erklärung
      LLMService.explainMarketTrends(`${formData.city} ${formData.postal_code}`, String(formData.property_type))
        .then(expl => setLlmTrends(expl))
        .catch(() => setLlmTrends(null));

      // Preisstrategie
      LLMService.generatePricingStrategy({
        location: `${formData.city} ${formData.postal_code}`,
        propertyType: String(formData.property_type),
        estimatedValue: result.estimated_value,
        rangeMin: result.valuation_range.min,
        rangeMax: result.valuation_range.max,
        pricePerSqm: result.price_per_sqm,
        size: formData.size,
        demandLevel: marketData?.demand_level,
        competitionIndex: marketData?.competition_index,
      }).then(setPricingStrategy).catch(() => setPricingStrategy(null));

      // Renovierungsplan
      LLMService.generateRenovationPlan({
        condition: formData.condition,
        propertyType: String(formData.property_type),
        location: formData.city,
        size: formData.size,
      }).then(setRenovationPlan).catch(() => setRenovationPlan(null));

      // Buyer Personas & Playbook
      LLMService.generateBuyerPersona({
        location: formData.city,
        propertyType: String(formData.property_type),
        size: formData.size,
        price: result.estimated_value,
      }).then(setBuyerPersona).catch(() => setBuyerPersona(null));
      LLMService.generateSalesPlaybook({
        location: formData.city,
        type: String(formData.property_type),
        demandLevel: marketData?.demand_level,
        competitionIndex: marketData?.competition_index,
      }).then(setSalesPlaybook).catch(() => setSalesPlaybook(null));
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
    <div className="space-y-6 max-w-[1400px] mx-auto">
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
              <input
                type="text"
                list="city-suggestions"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Stadt eingeben (z. B. München, Berlin, ...)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="city-suggestions">
                <option value="München" />
                <option value="Berlin" />
                <option value="Hamburg" />
                <option value="Frankfurt" />
                <option value="Köln" />
                <option value="Stuttgart" />
                <option value="Düsseldorf" />
                <option value="Leipzig" />
              </datalist>
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
            {/* POI optional: Koordinaten */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitude (optional)</label>
              <input
                type="text"
                value={poiLat}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === '' || /^-?\d{1,2}(?:\.\d+)?$/.test(v)) setPoiLat(v);
                }}
                placeholder="z.B. 48.137"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitude (optional)</label>
              <input
                type="text"
                value={poiLng}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === '' || /^-?\d{1,3}(?:\.\d+)?$/.test(v)) setPoiLng(v);
                }}
                placeholder="z.B. 11.575"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Straße und Hausnummer (min. 5 Zeichen)"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
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

          {/* Optionale Ausstattungsmerkmale */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Ausstattungsmerkmale (optional - verbessert die Bewertungsgenauigkeit)
            </h3>
            
            {/* Checkboxen für boolean Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.balcony || false}
                  onChange={(e) => handleInputChange('balcony', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Balkon</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terrace || false}
                  onChange={(e) => handleInputChange('terrace', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Terrasse</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.garden || false}
                  onChange={(e) => handleInputChange('garden', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Garten</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.garage || false}
                  onChange={(e) => handleInputChange('garage', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Garage</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.basement || false}
                  onChange={(e) => handleInputChange('basement', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Keller</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.elevator || false}
                  onChange={(e) => handleInputChange('elevator', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aufzug</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.guest_toilet || false}
                  onChange={(e) => handleInputChange('guest_toilet', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Gäste-WC</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fitted_kitchen || false}
                  onChange={(e) => handleInputChange('fitted_kitchen', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Einbauküche</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fireplace || false}
                  onChange={(e) => handleInputChange('fireplace', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Kamin</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.air_conditioning || false}
                  onChange={(e) => handleInputChange('air_conditioning', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Klimaanlage</span>
              </label>
            </div>
            
            {/* Numerische Felder */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {formData.garden && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gartengröße (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.garden_size || ''}
                    onChange={(e) => handleInputChange('garden_size', parseInt(e.target.value) || undefined)}
                    placeholder="z.B. 50"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stellplätze
                </label>
                <input
                  type="number"
                  value={formData.parking_spaces || ''}
                  onChange={(e) => handleInputChange('parking_spaces', parseInt(e.target.value) || undefined)}
                  placeholder="Anzahl"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etage
                </label>
                <input
                  type="number"
                  value={formData.floor || ''}
                  onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || undefined)}
                  placeholder="z.B. 3"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gesamt-Etagen
                </label>
                <input
                  type="number"
                  value={formData.total_floors || ''}
                  onChange={(e) => handleInputChange('total_floors', parseInt(e.target.value) || undefined)}
                  placeholder="z.B. 5"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badezimmer
                </label>
                <input
                  type="number"
                  value={formData.bathrooms || ''}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || undefined)}
                  placeholder="Anzahl"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
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
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                PDF Export (Druck)
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = document.documentElement.outerHTML;
                  const blob = new Blob([html], { type: 'application/msword' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AVM_Report_${formData.city}_${formData.postal_code}.doc`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                Word Export
              </button>
            </div>
          </div>
          {formError && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}
        </form>
      </div>

      {/* Sticky KPI-Bar */}
      {result && (
        <div className="sticky top-16 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/80 dark:bg-gray-800/80 shadow-sm border border-white/20 dark:border-gray-700/50 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Marktwert</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {typeof result.estimated_value === 'number' ? result.estimated_value.toLocaleString('de-DE') : '-'} €
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">€/m²</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {typeof result.price_per_sqm === 'number' ? result.price_per_sqm.toLocaleString('de-DE') : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Konfidenz</div>
              <div className={`text-sm font-semibold ${getConfidenceColor(result.confidence_level)}`}>
                {result.confidence_level === 'high' ? 'Hoch' : result.confidence_level === 'medium' ? 'Mittel' : 'Niedrig'}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">Preisband</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {typeof result.valuation_range?.min === 'number' ? result.valuation_range.min.toLocaleString('de-DE') : '-'} € – {typeof result.valuation_range?.max === 'number' ? result.valuation_range.max.toLocaleString('de-DE') : '-'} €
              </div>
            </div>
          </div>
        </div>
      )}

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
                {typeof result.estimated_value === 'number' ? result.estimated_value.toLocaleString('de-DE') : '-'} €
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {typeof result.price_per_sqm === 'number' ? result.price_per_sqm.toLocaleString('de-DE') : '-'} € / m²
              </p>
            </div>

            {/* Wertebereich */}
            <div className="glass p-6 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wertebereich</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {typeof result.valuation_range?.min === 'number' ? result.valuation_range.min.toLocaleString('de-DE') : '-'} € -
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {typeof result.valuation_range?.max === 'number' ? result.valuation_range.max.toLocaleString('de-DE') : '-'} €
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
                      {typeof comp.price === 'number' ? comp.price.toLocaleString('de-DE') : '-'} €
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {typeof comp.price_per_sqm === 'number' ? comp.price_per_sqm.toLocaleString('de-DE') : '-'}
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

      {/* POI-Indikatoren */}
      {poiSummary && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Umfeld-Indikatoren (Radius {poiSummary.radius} m)
            </h2>
            <button
              type="button"
              onClick={async () => {
                if (!poiLat || !poiLng) return;
                try {
                  const poi = await marketService.getPoi(parseFloat(poiLat), parseFloat(poiLng), 1200);
                  setPoiSummary(poi);
                } catch (e) {
                  console.error('Fehler beim Laden der POI-Daten:', e);
                }
              }}
              className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Aktualisieren
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">Schulen</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{poiSummary.schools}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Dichte: {poiSummary.schools_density}</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">ÖPNV-Haltestellen</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">{poiSummary.stops}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Dichte: {poiSummary.stops_density}</div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">Parks</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{poiSummary.parks}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Dichte: {poiSummary.parks_density}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Komposit-Score: <span className="font-semibold">{poiSummary.composite_score}</span>
          </div>
          {/* Einfache Karten-Vorschau mit OSM */}
          {poiLat && poiLng && (
            <div className="mt-4">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Karte (OpenStreetMap)</div>
              <iframe
                title="map"
                width="100%"
                height="300"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(poiLng)-0.01}%2C${parseFloat(poiLat)-0.01}%2C${parseFloat(poiLng)+0.01}%2C${parseFloat(poiLat)+0.01}&layer=mapnik&marker=${poiLat}%2C${poiLng}`}
              />
              <div className="text-xs mt-1">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${poiLat}&mlon=${poiLng}#map=14/${poiLat}/${poiLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  In OSM öffnen
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LLM Trend-Erklärung */}
      {llmTrends && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">KI-Erklärung der Markttrends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Zusammenfassung</div>
              <p className="text-gray-700 dark:text-gray-300">{llmTrends.trendSummary}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Preisentwicklung</div>
              <p className="text-gray-700 dark:text-gray-300">{llmTrends.priceEvolution}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Nachfrage</div>
              <p className="text-gray-700 dark:text-gray-300">{llmTrends.demandAnalysis}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Prognose 12M</div>
              <p className="text-gray-700 dark:text-gray-300">{llmTrends.forecast12Months}</p>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Schlüsselfaktoren</div>
              <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300">
                {(llmTrends.keyFactors || []).map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
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
                {typeof result.estimated_value === 'number' ? result.estimated_value.toLocaleString('de-DE') : '-'} €
              </p>
            </div>

            {/* Prognostizierter Preis */}
            <div className="glass p-6 rounded-xl text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Prognose 12M</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pricePrediction && typeof pricePrediction.predictedPrice === 'number' ? pricePrediction.predictedPrice.toLocaleString('de-DE') : '-'} €
              </p>
            </div>

            {/* Veränderung */}
            <div className="glass p-6 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">Veränderung</p>
              <p className={`text-2xl font-bold ${pricePrediction.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {pricePrediction.priceChange >= 0 ? '+' : ''}{pricePrediction.priceChangePercent}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {pricePrediction ? (pricePrediction.priceChange >= 0 ? '+' : '') : ''}{pricePrediction && typeof pricePrediction.priceChange === 'number' ? pricePrediction.priceChange.toLocaleString('de-DE') : '-'} €
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

      {/* PREISSTRATEGIE */}
      {pricingStrategy && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preisstrategie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="glass p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-500">Empfohlener Angebotspreis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof pricingStrategy.recommendedListingPrice === 'number' ? pricingStrategy.recommendedListingPrice.toLocaleString('de-DE') : '-'} €
              </p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-500">Positionierung</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{pricingStrategy.positioning}</p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-500">Preisband</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {typeof pricingStrategy.priceBand?.softFloor === 'number' ? pricingStrategy.priceBand.softFloor.toLocaleString('de-DE') : '-'} €
                {' '}–{' '}
                {typeof pricingStrategy.priceBand?.softCeil === 'number' ? pricingStrategy.priceBand.softCeil.toLocaleString('de-DE') : '-'} €
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Strategie-Notizen</h4>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
                {(pricingStrategy.strategyNotes || []).map((n: string, i: number) => <li key={i}>{n}</li>)}
              </ul>
            </div>
            <div className="glass p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Dringlichkeit – Tipps</h4>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
                {(pricingStrategy.urgencyTips || []).map((n: string, i: number) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* RENOVIERUNG / ROI */}
      {renovationPlan && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Renovierungs-ROI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Quick Wins</h4>
              <div className="space-y-2">
                {(renovationPlan.quickWins || []).map((q: any, i: number) => (
                  <div key={i} className="glass p-3 rounded-lg flex items-center justify-between">
                    <span className="text-sm">{q.measure}</span>
                    <span className="text-sm font-medium">
                      {typeof q.cost === 'number' ? q.cost.toLocaleString('de-DE') : '-'} € → +{typeof q.uplift === 'number' ? q.uplift.toLocaleString('de-DE') : '-'} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Größere Upgrades</h4>
              <div className="space-y-2">
                {(renovationPlan.majorUpgrades || []).map((q: any, i: number) => (
                  <div key={i} className="glass p-3 rounded-lg flex items-center justify-between">
                    <span className="text-sm">{q.measure}</span>
                    <span className="text-sm font-medium">
                      {typeof q.cost === 'number' ? q.cost.toLocaleString('de-DE') : '-'} € → +{typeof q.uplift === 'number' ? q.uplift.toLocaleString('de-DE') : '-'} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            Gesamtpotenzial: <span className="font-semibold">{typeof renovationPlan.totalPotentialUplift === 'number' ? renovationPlan.totalPotentialUplift.toLocaleString('de-DE') : '-'} €</span>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{renovationPlan.remarks}</p>
        </div>
      )}

      {/* BUYER PERSONAS & PLAYBOOK */}
      {(buyerPersona || salesPlaybook) && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vermarktung – Personas & Playbook</h2>
          {buyerPersona && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Buyer Personas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(buyerPersona.personas || []).map((p: any, i: number) => (
                  <div key={i} className="glass p-3 rounded-lg">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{p.description}</div>
                    <ul className="list-disc ml-5 mt-2 text-xs">
                      {(p.keyNeeds || []).map((k: string, j: number) => <li key={j}>{k}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                Kanäle: {(buyerPersona.channels || []).join(', ')}
              </div>
              <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                Messages: {(buyerPersona.messaging || []).join(' • ')}
              </div>
            </div>
          )}
          {salesPlaybook && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Playbook</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="glass p-3 rounded-lg">
                  <div className="text-xs font-semibold mb-1">Nächste Schritte</div>
                  <ul className="list-disc ml-5 text-xs">
                    {(salesPlaybook.nextSteps || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="glass p-3 rounded-lg">
                  <div className="text-xs font-semibold mb-1">Checklist</div>
                  <ul className="list-disc ml-5 text-xs">
                    {(salesPlaybook.checklist || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="glass p-3 rounded-lg">
                  <div className="text-xs font-semibold mb-1">KPIs</div>
                  <ul className="list-disc ml-5 text-xs">
                    {(salesPlaybook.kpis || []).map((k: any, i: number) => <li key={i}>{k.name}: {k.target}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvmValuationView;
