import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  DollarSign,
  Calendar,
  Star,
  Zap,
  ArrowRight
} from 'lucide-react';

interface LocationData {
  id: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  properties: number;
  sales: number;
  revenue: number;
  growth: number;
  avgPrice: number;
  marketShare: number;
  performance: 'high' | 'medium' | 'low';
}

const GeographicalModule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<'map' | 'heatmap' | 'performance'>('map');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Implement real geographical data API
  const locationData: LocationData[] = [];

  // Calculate totals
  const totalProperties = locationData.reduce((sum, item) => sum + item.properties, 0);
  const totalSales = locationData.reduce((sum, item) => sum + item.sales, 0);
  const totalRevenue = locationData.reduce((sum, item) => sum + item.revenue, 0);
  const avgGrowth = locationData.length > 0 
    ? locationData.reduce((sum, item) => sum + item.growth, 0) / locationData.length 
    : 0;

  // Filter data based on search and region
  const filteredData = locationData.filter(item => {
    const matchesSearch = item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Geografische Analyse</h2>
          <p className="text-gray-600 dark:text-gray-400">Standort-basierte Verkaufsanalyse und Marktperformance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Stadt oder Region suchen..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Regionen</option>
            {Array.from(new Set(locationData.map(item => item.region))).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* View Selector */}
        <div className="flex items-center space-x-2">
          {(['map', 'heatmap', 'performance'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {view === 'map' ? 'Karte' : view === 'heatmap' ? 'Heatmap' : 'Performance'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Standorte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {locationData.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredData.length} gefiltert
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Immobilien</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalProperties.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredData.reduce((sum, item) => sum + item.properties, 0).toLocaleString('de-DE')} gefiltert
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verkäufe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSales.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredData.reduce((sum, item) => sum + item.sales, 0).toLocaleString('de-DE')} gefiltert
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Umsatz</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRevenue.toLocaleString('de-DE')}€
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('de-DE')}€ gefiltert
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {selectedView === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kartenansicht</h3>
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Kartenansicht wird implementiert</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Interaktive Karte mit Standortdaten und Performance-Indikatoren
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedView === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Heatmap</h3>
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Heatmap wird implementiert</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Wärmekarte basierend auf Verkaufsperformance und Marktaktivität
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedView === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standort-Performance</h3>
            {filteredData.length > 0 ? (
              <div className="space-y-4">
                {filteredData.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        location.performance === 'high' ? 'bg-green-100 dark:bg-green-900/30' :
                        location.performance === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <MapPin className={`h-4 w-4 ${
                          location.performance === 'high' ? 'text-green-600 dark:text-green-400' :
                          location.performance === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{location.city}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {location.region} • {location.properties} Immobilien • {location.sales} Verkäufe
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {location.revenue.toLocaleString('de-DE')}€
                      </p>
                      <p className={`text-xs ${
                        location.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {location.growth >= 0 ? '+' : ''}{location.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Keine Standortdaten verfügbar</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Standortdaten werden über die API geladen
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeographicalModule;
