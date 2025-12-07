import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Map,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Euro,
  Target,
  Layers,
  Filter,
  Search,
  Eye,
  Navigation,
  Maximize,
  RotateCcw,
  Sparkles,
  Globe,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

interface LocationData {
  id: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  properties: number;
  totalValue: number;
  avgPrice: number;
  contacts: number;
  dealsClosed: number;
  marketShare: number;
  growth: number;
}

interface HeatmapData {
  region: string;
  value: number;
  color: string;
  properties: number;
  deals: number;
}

interface RegionPerformance {
  region: string;
  revenue: number;
  properties: number;
  avgDealTime: number;
  conversionRate: number;
  marketPenetration: number;
}

const GeographicalModule: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'map' | 'heatmap' | 'performance'>('map');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock geographical data - in real app this would come from API
  const locationData: LocationData[] = [
    {
      id: '1',
      region: 'Hamburg',
      city: 'Hamburg-Mitte',
      lat: 53.5511,
      lng: 9.9937,
      properties: 45,
      totalValue: 6750000,
      avgPrice: 150000,
      contacts: 123,
      dealsClosed: 28,
      marketShare: 12.5,
      growth: 8.2
    },
    {
      id: '2',
      region: 'Hamburg',
      city: 'Altona',
      lat: 53.5438,
      lng: 9.9327,
      properties: 32,
      totalValue: 4960000,
      avgPrice: 155000,
      contacts: 89,
      dealsClosed: 21,
      marketShare: 9.8,
      growth: 15.3
    },
    {
      id: '3',
      region: 'Berlin',
      city: 'Mitte',
      lat: 52.5200,
      lng: 13.4050,
      properties: 67,
      totalValue: 10050000,
      avgPrice: 150000,
      contacts: 178,
      dealsClosed: 42,
      marketShare: 18.7,
      growth: 12.1
    },
    {
      id: '4',
      region: 'Berlin',
      city: 'Charlottenberg',
      lat: 52.5170,
      lng: 13.2913,
      properties: 38,
      totalValue: 6080000,
      avgPrice: 160000,
      contacts: 95,
      dealsClosed: 24,
      marketShare: 11.2,
      growth: 6.8
    },
    {
      id: '5',
      region: 'München',
      city: 'Schwabing',
      lat: 48.1549,
      lng: 11.5418,
      properties: 29,
      totalValue: 5220000,
      avgPrice: 180000,
      contacts: 74,
      dealsClosed: 18,
      marketShare: 8.9,
      growth: 22.4
    },
    {
      id: '6',
      region: 'München',
      city: 'Maxvorstadt',
      lat: 48.1486,
      lng: 11.5669,
      properties: 34,
      totalValue: 6460000,
      avgPrice: 190000,
      contacts: 87,
      dealsClosed: 22,
      marketShare: 10.3,
      growth: 18.7
    }
  ];

  const heatmapData: HeatmapData[] = [
    { region: 'Hamburg', value: 85, color: '#059669', properties: 77, deals: 49 },
    { region: 'Berlin', value: 92, color: '#0891B2', properties: 105, deals: 66 },
    { region: 'München', value: 78, color: '#7C3AED', properties: 63, deals: 40 },
    { region: 'Frankfurt', value: 71, color: '#DC2626', properties: 42, deals: 28 },
    { region: 'Köln', value: 68, color: '#EA580C', properties: 38, deals: 24 },
    { region: 'Stuttgart', value: 74, color: '#059669', properties: 51, deals: 32 }
  ];

  const regionPerformance: RegionPerformance[] = [
    { region: 'Hamburg', revenue: 11710000, properties: 77, avgDealTime: 35, conversionRate: 63.6, marketPenetration: 22.3 },
    { region: 'Berlin', revenue: 16130000, properties: 105, avgDealTime: 42, conversionRate: 59.8, marketPenetration: 29.9 },
    { region: 'München', revenue: 11680000, properties: 63, avgDealTime: 28, conversionRate: 71.4, marketPenetration: 19.2 },
    { region: 'Frankfurt', revenue: 8540000, properties: 42, avgDealTime: 38, conversionRate: 66.7, marketPenetration: 15.8 },
    { region: 'Köln', revenue: 7320000, properties: 38, avgDealTime: 45, conversionRate: 63.2, marketPenetration: 12.7 },
    { region: 'Stuttgart', revenue: 9870000, properties: 51, avgDealTime: 33, conversionRate: 62.7, marketPenetration: 17.4 }
  ];

  const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#8B5CF6',
    teal: '#0D9488'
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.teal, COLORS.warning];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 15) return 'text-emerald-600 dark:text-emerald-400';
    if (growth > 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredLocations = locationData.filter(location => 
    selectedRegion === 'all' || location.region === selectedRegion
  ).filter(location =>
    location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProperties = locationData.reduce((sum, location) => sum + location.properties, 0);
  const totalValue = locationData.reduce((sum, location) => sum + location.totalValue, 0);
  const totalDeals = locationData.reduce((sum, location) => sum + location.dealsClosed, 0);
  const avgGrowth = locationData.reduce((sum, location) => sum + location.growth, 0) / locationData.length;

  return (
    <div className="space-y-6">
      {/* Glasmorphism Header */}
      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-glass">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                  Geografische Verteilung
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Kartenansicht, Heatmaps und Standortperformance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Glasmorphism View Toggle */}
            <div className="flex bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-1.5 shadow-glass-sm">
              <button
                onClick={() => setSelectedView('map')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  selectedView === 'map'
                    ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Karte</span>
              </button>
              <button
                onClick={() => setSelectedView('heatmap')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  selectedView === 'heatmap'
                    ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Heatmap</span>
              </button>
              <button
                onClick={() => setSelectedView('performance')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  selectedView === 'performance'
                    ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Performance</span>
              </button>
            </div>

            {/* Glasmorphism Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Stadt oder Region suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 focus:bg-white/50 dark:focus:bg-white/15 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Glasmorphism Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Alle Regionen</option>
              <option value="Hamburg">Hamburg</option>
              <option value="Berlin">Berlin</option>
              <option value="München">München</option>
              <option value="Frankfurt">Frankfurt</option>
              <option value="Köln">Köln</option>
              <option value="Stuttgart">Stuttgart</option>
            </select>
          </div>
        </div>
      </div>

      {/* Glasmorphism Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Gesamt-Immobilien</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                {totalProperties}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                In {locationData.length} Standorten
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Portfolio-Wert</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Ø {formatCurrency(totalValue / totalProperties)}
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <Euro className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Abgeschlossene Deals</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                {totalDeals}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {formatPercentage((totalDeals / totalProperties) * 100)} Erfolgsquote
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Durchschn. Wachstum</p>
              <p className={`text-3xl font-bold ${getGrowthColor(avgGrowth)}`}>
                +{formatPercentage(avgGrowth)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Jährliches Marktwachstum
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {selectedView === 'map' && (
        <div className="space-y-6">
          {/* Glasmorphism Interactive Map Placeholder */}
          <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-blue-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-glass">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                    Interaktive Karte
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200">
                    <Maximize className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200">
                    <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative h-96 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-900/20 dark:via-teal-800/20 dark:to-blue-900/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glass">
                  <MapPin className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interaktive Karte</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                  Hier würde eine interaktive Karte mit allen Standorten, Immobilien und Performance-Daten angezeigt werden.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Integration mit Google Maps, Mapbox oder OpenStreetMap
                </div>
              </div>
            </div>
          </div>

          {/* Glasmorphism Location List */}
          <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-teal-400/10 to-emerald-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                  Standort-Details
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLocations.map((location, index) => (
                  <div key={location.id} className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-glass-sm group-hover:from-emerald-500/40 group-hover:to-teal-600/40 transition-all duration-200">
                          <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{location.city}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{location.region}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium backdrop-blur-sm border border-white/20 ${getGrowthColor(location.growth)} bg-white/20 dark:bg-white/5`}>
                        +{formatPercentage(location.growth)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg p-2 shadow-glass-sm">
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Immobilien</div>
                        <div className="font-bold text-gray-900 dark:text-white">{location.properties}</div>
                      </div>
                      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg p-2 shadow-glass-sm">
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Deals</div>
                        <div className="font-bold text-gray-900 dark:text-white">{location.dealsClosed}</div>
                      </div>
                      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg p-2 shadow-glass-sm">
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Ø Preis</div>
                        <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(location.avgPrice)}</div>
                      </div>
                      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg p-2 shadow-glass-sm">
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Marktanteil</div>
                        <div className="font-bold text-gray-900 dark:text-white">{formatPercentage(location.marketShare)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Portfolio-Wert</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(location.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'heatmap' && (
        <div className="space-y-6">
          {/* Glasmorphism Regional Heatmap */}
          <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 via-pink-400/10 to-red-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-red-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                  Regionale Heatmap
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Heatmap Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={heatmapData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="region" type="category" className="text-xs" width={80} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, 'Performance Score']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="value" fill={COLORS.accent} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Heatmap Legend & Details */}
                <div className="space-y-4">
                  {heatmapData.map((region, index) => (
                    <div key={region.region} className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-glass"
                            style={{ backgroundColor: region.color }}
                          >
                            <span className="text-white font-bold text-sm">{region.value}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{region.region}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Performance Score</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{region.value}/100</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Immobilien:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{region.properties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Deals:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{region.deals}</span>
                        </div>
                      </div>
                      
                      {/* Performance Bar */}
                      <div className="mt-3 w-full bg-white/20 dark:bg-white/5 rounded-full h-2 shadow-glass-sm">
                        <div 
                          className="h-2 rounded-full transition-all duration-500 shadow-glass-sm"
                          style={{ 
                            width: `${region.value}%`,
                            backgroundColor: region.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Glasmorphism Performance Distribution */}
          <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-teal-500/20 via-cyan-400/10 to-blue-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glass">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-teal-800 dark:from-white dark:to-teal-200 bg-clip-text text-transparent">
                  Performance-Verteilung
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={heatmapData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({region, value}) => `${region} (${value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Performance Score']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'performance' && (
        <div className="space-y-6">
          {/* Glasmorphism Regional Performance Chart */}
          <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-400/10 to-emerald-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                  Regionale Performance
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="region" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Umsatz' : name
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill={COLORS.primary} name="Umsatz" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Glasmorphism Performance Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {regionPerformance.map((region, index) => (
              <div key={region.region} className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-400/10 to-emerald-600/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                      {region.region}
                    </h4>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Umsatz</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(region.revenue)}</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Immobilien</span>
                      <span className="font-bold text-gray-900 dark:text-white">{region.properties}</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Ø Deal-Zeit</span>
                      <span className="font-bold text-gray-900 dark:text-white">{region.avgDealTime} Tage</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Conversion Rate</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPercentage(region.conversionRate)}</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Marktdurchdringung</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatPercentage(region.marketPenetration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicalModule;
