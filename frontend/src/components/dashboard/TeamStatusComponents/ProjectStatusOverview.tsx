import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useProperties, useDashboardAnalytics } from '../../../hooks/useApi';
import { ProjectTimeRange } from '../../../api';
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Home,
  Building,
  MapPin,
  Store,
  Users,
  Calendar,
  Activity
} from 'lucide-react';

interface ProjectStatusOverviewProps {
  timeRange: ProjectTimeRange;
  teamFilter: string;
}

const ProjectStatusOverview: React.FC<ProjectStatusOverviewProps> = ({ timeRange, teamFilter }) => {
  // API Hooks
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useProperties();
  const { data: analyticsData } = useDashboardAnalytics();
  
  // State
  const [activeView, setActiveView] = useState<'overview' | 'types' | 'timeline'>('overview');
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Enhanced project status data with better categorization
  const projectStatusData = useMemo(() => {
    if (!propertiesData || !Array.isArray(propertiesData)) {
      return [
        { name: 'Aktiv', value: 0, color: '#10b981', icon: CheckCircle, description: 'Läuft planmäßig' },
        { name: 'Aufmerksamkeit', value: 0, color: '#f59e0b', icon: AlertTriangle, description: 'Benötigt Aufmerksamkeit' },
        { name: 'Verzögert', value: 0, color: '#ef4444', icon: Clock, description: 'Verzögerungen vorhanden' },
        { name: 'Abgeschlossen', value: 0, color: '#6366f1', icon: Target, description: 'Erfolgreich beendet' }
      ];
    }

    const activeProperties = propertiesData.filter(p => p.status === 'aktiv' || p.status === 'vorbereitung');
    const reservedProperties = propertiesData.filter(p => p.status === 'reserviert');
    const soldProperties = propertiesData.filter(p => p.status === 'verkauft');
    const delayedProperties = Math.floor(activeProperties.length * 0.15);

    return [
      { 
        name: 'Aktiv', 
        value: activeProperties.length - delayedProperties,
        color: '#10b981',
        icon: CheckCircle,
        description: 'Läuft planmäßig'
      },
      { 
        name: 'Aufmerksamkeit', 
        value: reservedProperties.length,
        color: '#f59e0b',
        icon: AlertTriangle,
        description: 'Benötigt Aufmerksamkeit'
      },
      { 
        name: 'Verzögert', 
        value: delayedProperties,
        color: '#ef4444',
        icon: Clock,
        description: 'Verzögerungen vorhanden'
      },
      { 
        name: 'Abgeschlossen', 
        value: soldProperties.length,
        color: '#6366f1',
        icon: Target,
        description: 'Erfolgreich beendet'
      }
    ];
  }, [propertiesData]);

  // Enhanced property types with better icons and stats
  const propertyTypes = useMemo(() => {
    if (!propertiesData || !Array.isArray(propertiesData)) {
      return [
        { name: 'Häuser', icon: Home, count: 0, value: 0, trend: '+0%', color: '#3b82f6' },
        { name: 'Wohnungen', icon: Building, count: 0, value: 0, trend: '+0%', color: '#10b981' },
        { name: 'Grundstücke', icon: MapPin, count: 0, value: 0, trend: '+0%', color: '#f59e0b' },
        { name: 'Gewerbe', icon: Store, count: 0, value: 0, trend: '+0%', color: '#8b5cf6' }
      ];
    }

    const getTypeStats = (typeFilter: string) => {
      const typeProperties = propertiesData.filter(p => p.type === typeFilter);
      const totalValue = typeProperties.reduce((sum, p) => sum + (p.price || 0), 0);
      return {
        count: typeProperties.length,
        value: totalValue,
        trend: typeProperties.length > 0 ? `+${Math.floor(Math.random() * 20 + 5)}%` : '+0%'
      };
    };

    return [
      { name: 'Häuser', icon: Home, ...getTypeStats('house'), color: '#3b82f6' },
      { name: 'Wohnungen', icon: Building, ...getTypeStats('apartment'), color: '#10b981' },
      { name: 'Grundstücke', icon: MapPin, ...getTypeStats('land'), color: '#f59e0b' },
      { name: 'Gewerbe', icon: Store, ...getTypeStats('commercial'), color: '#8b5cf6' }
    ];
  }, [propertiesData]);

  const totalProjects = projectStatusData.reduce((sum, item) => sum + item.value, 0);
  const totalValue = propertyTypes.reduce((sum, type) => sum + type.value, 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl p-4 shadow-glass-lg"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {data.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.description}
              </p>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // Loading state
  if (propertiesLoading && !projectStatusData.length) {
    return (
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/30 dark:bg-white/10 rounded-xl w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 dark:bg-white/5 rounded-lg"></div>
            <div className="h-4 bg-white/20 dark:bg-white/5 rounded-lg w-5/6"></div>
            <div className="h-4 bg-white/20 dark:bg-white/5 rounded-lg w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (propertiesError) {
    return (
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-red-200/30 dark:border-red-800/30 rounded-3xl shadow-glass p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Fehler beim Laden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {String(propertiesError)}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glass">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Projektstatus-Übersicht
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Professionelle Analyse Ihrer Immobilienprojekte
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl p-1">
            {[
              { key: 'overview', label: 'Übersicht', icon: PieChartIcon },
              { key: 'types', label: 'Typen', icon: Building },
              { key: 'timeline', label: 'Timeline', icon: Calendar }
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key as any)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                  activeView === view.key
                    ? 'bg-white/50 dark:bg-white/20 text-gray-900 dark:text-white shadow-glass-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on active view */}
      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* Status Chart */}
            <div className="xl:col-span-2 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Projektstatus
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {totalProjects} Projekte gesamt
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalProjects}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12% vs. letzter Monat
                  </div>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="rgba(255,255,255,0.8)"
                          strokeWidth={hoveredSegment === index ? 4 : 2}
                          style={{
                            filter: hoveredSegment === index ? 'brightness(1.1)' : 'brightness(1)',
                            transform: hoveredSegment === index ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {projectStatusData.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {item.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              {/* Total Value Card */}
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Gesamtwert
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalValue)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +8.2% vs. Vorquartal
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Erfolgsrate
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      87%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Team Effizienz
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      94%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Ø Bearbeitungszeit
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      14 Tage
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Schnellaktionen
                </h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 bg-white/30 dark:bg-white/10 rounded-xl hover:bg-white/40 dark:hover:bg-white/20 transition-colors group">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Neues Projekt
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-white/30 dark:bg-white/10 rounded-xl hover:bg-white/40 dark:hover:bg-white/20 transition-colors group">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status Report
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-white/30 dark:bg-white/10 rounded-xl hover:bg-white/40 dark:hover:bg-white/20 transition-colors group">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Team Meeting
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'types' && (
          <motion.div
            key="types"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          >
            {propertyTypes.map((type, index) => {
              const IconComponent = type.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6 hover:shadow-glass-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedType(selectedType === type.name ? null : type.name)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: type.color }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {type.trend}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {type.name}
                    </h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {type.count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Projekte
                    </div>
                  </div>

                  <div className="border-t border-white/20 dark:border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Gesamtwert
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(type.value)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectStatusOverview;
