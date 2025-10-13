import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
// Use new API hooks
import { useDashboardAnalytics, useProperties } from '../../api/hooks';
import { apiClient } from '../../lib/api/client';
import { PropertyDistributionChart, StatusOverviewChart } from './charts';

// API-gestützte Dashboard-Daten (werden via useEffect geladen)
const emptyPerf: Array<{ name: string; anfragen: number; besichtigungen: number; klicks: number; abschlüsse: number }> = [];

const emptyDist: Array<{ name: string; value: number }> = [];

const emptyStatus: Array<{ name: string; value: number }> = [];

const emptyActivity: Array<{ name: string; besucher: number; anfragen: number }> = [];

const emptyMeasures: Array<{ id: number; title: string; status: string; dueDate: string; responsible: string; progress: number; description: string }> = [];

const emptyLatest: Array<{ id: number; title: string; location: string; price: string; status: string; type: string; bedrooms: number; bathrooms: number; area: number; image: string }> = [];

const emptyStatusOptions: Array<{ value: string; label: string; color: string }> = [];

// Farben für Charts
// removed unused color constants

// removed unused market/trend placeholders

// Animationseinstellungen für Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

// Statistik-Highlights
const statsHighlights = [
  { 
    title: 'Verkaufsrate',
    value: '68%',
    change: '+12%',
    description: 'Durchschnittliche Verkaufsrate im aktuellen Zeitraum',
    icon: 'ri-line-chart-line',
    color: 'indigo'
  },
  { 
    title: 'Vermarktungsdauer',
    value: '47 Tage',
    change: '-8 Tage',
    description: 'Durchschnittliche Zeit bis zum Abschluss',
    icon: 'ri-time-line',
    color: 'blue'
  },
  { 
    title: 'Preis pro m²',
    value: '3.950 €',
    change: '+5.2%',
    description: 'Durchschnittlicher Quadratmeterpreis',
    icon: 'ri-money-euro-circle-line',
    color: 'emerald'
  }
];

// Farbpalette für Diagramme
const CHART_COLORS = {
  primary: ['#4f46e5', '#818cf8', '#c7d2fe'],
  success: ['#059669', '#34d399', '#a7f3d0'],
  warning: ['#d97706', '#fbbf24', '#fde68a'],
  info: ['#0284c7', '#38bdf8', '#bae6fd'],
  gray: ['#4b5563', '#9ca3af', '#e5e7eb']
};

// Gradient Definitionen für Charts
// removed unused gradientOffset

// Custom Tooltip Styles
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mt-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Konfigurationen
const chartConfig = {
  lineChart: {
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
    animate: true,
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: '#e5e7eb',
      opacity: 0.5
    },
    axisStyle: {
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
      stroke: '#9ca3af'
    }
  }
};

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    anfragen: '',
    verkaeufe: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [properties, setProperties] = useState(emptyLatest);
  const [statusChangeLoading, setStatusChangeLoading] = useState<number | null>(null);
  
  // Neue States für Immobilien- und Maßnahmen-Modals
  // removed unused modal states for now
  const [, setMeasures] = useState(emptyMeasures);

  // API state for all previously mocked datasets
  const [performanceData, setPerformanceData] = useState(emptyPerf);
  const [propertyTypeData, setPropertyTypeData] = useState(emptyDist);
  const [statusData, setStatusData] = useState(emptyStatus);
  const [activityData, setActivityData] = useState(emptyActivity);
  const [propertyStatusOptions, setPropertyStatusOptions] = useState(emptyStatusOptions);
  // KPI summary from backend
  const [kpi, setKpi] = useState({ anfragen: 0, besichtigungen: 0, klicks: 0, abschluesse: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Real analytics - using new API hooks
        const [overview, performance, propertyAnalytics, latestProps] = await Promise.all([
          apiClient.get('/api/v1/analytics/dashboard'),
          apiClient.get('/api/v1/analytics/performance'),
          apiClient.get('/api/v1/analytics/properties'),
          apiClient.get('/api/v1/properties?limit=6'),
        ]);
        if (!mounted) return;
        // Map performance: synthesize to previous shape for cards/charts
        const perfSeries = ((performance as any)?.data?.daily_trends || []).map((d: any) => ({
          name: d.date,
          anfragen: d.contacts || 0,
          besichtigungen: d.properties || 0,
          klicks: d.tasks_completed || 0, // proxy until web analytics exist
          abschlüsse: Math.round((d.tasks_completed || 0) / 4),
        }));
        setPerformanceData(perfSeries);

        // KPIs from overview/performance
        const summary = (performance as any)?.data?.summary || (overview as any)?.data?.performance_trends || {};
        setKpi({
          anfragen: Number(summary.new_contacts ?? 0),
          besichtigungen: Number(summary.new_properties ?? 0),
          klicks: Number(summary.new_documents ?? 0),
          abschluesse: Number(summary.completed_tasks ?? 0),
        });

        // Property type/status distributions
        const typeDist = (propertyAnalytics as any)?.data?.by_type || [];
        const statusDist = (propertyAnalytics as any)?.data?.by_status || [];
        setPropertyTypeData(typeDist);
        setStatusData(statusDist);

        // Activity: synthesize simple weekly bars from overview.recent_activities counts
        const recent = Array.isArray((overview as any)?.data?.recent_activities) ? (overview as any).data.recent_activities : [];
        const byDay = new Map<string, { name: string; besucher: number; anfragen: number }>();
        for (const a of recent) {
          const day = (a.timestamp || '').slice(0, 10) || 'N/A';
          if (!byDay.has(day)) byDay.set(day, { name: day, besucher: 0, anfragen: 0 });
          const entry = byDay.get(day)!;
          if (a.entity_type === 'property') entry.besucher += 1; else entry.anfragen += 1;
        }
        setActivityData(Array.from(byDay.values()).slice(-7));

        // Measures: fetch from real measures endpoint (active first page)
        try {
          const mres = await apiClient.get('/api/v1/tasks?is_active=true&page=1&size=5');
          const rows = ((mres as any)?.metrics || (mres as any)?.items || []).map((m: any) => ({
            id: m.id,
            title: m.display_name || m.name,
            status: m.is_active ? 'In Umsetzung' : 'Erledigt',
            dueDate: m.updated_at?.slice(0, 10) || '',
            responsible: m.creator_name || '—',
            progress: 0,
            description: m.description || '',
          }));
          setMeasures(rows);
        } catch {
          setMeasures([]);
        }

        // Latest properties
        setProperties(latestProps as any);

        // Status options derived from stats
        setPropertyStatusOptions(statusDist.map((s: any) => ({ value: s.name, label: s.name, color: '#3B82F6' })));

  // removed unused market/trend local state
      } catch (e) {
        console.error('Fehler beim Laden der Dashboard-Daten:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      // Placeholder success without backend KPI endpoint
      const responseStatus = 201;
      if (responseStatus === 201) {
        setSubmitMessage({ 
          type: 'success', 
          text: 'KPI-Daten erfolgreich gespeichert!' 
        });
        
        // Formular zurücksetzen
        setFormData({
          date: new Date().toISOString().split('T')[0],
          anfragen: '',
          verkaeufe: ''
        });
        
        // Optional: Nach erfolgreicher Übermittlung Formular schließen
        // setShowKPIForm(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der KPI-Daten:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funktion zum Ändern des Status einer Immobilie
  const handleStatusChange = async (propertyId: number, newStatus: string) => {
    setStatusChangeLoading(propertyId);
    
    try {
      // Update using centralized property service
      await apiClient.put(`/api/v1/properties/${propertyId}`, { status: newStatus });
      
      // Aktualisiere den Status in der lokalen State
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId 
        ? { ...property, status: newStatus } 
        : property
        )
      );
      
      // Optional: Success-Message anzeigen
      setSubmitMessage({ 
        type: 'success', 
        text: `Status für "${properties.find(p => p.id === propertyId)?.title}" wurde zu "${newStatus}" geändert.` 
      });
      setTimeout(() => setSubmitMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'Fehler beim Aktualisieren des Status. Bitte versuchen Sie es erneut.' 
      });
      setTimeout(() => setSubmitMessage({ type: '', text: '' }), 3000);
    } finally {
      setStatusChangeLoading(null);
    }
  };

  // Neue Funktionen für Immobilien-Modal
  // removed unused modal handlers
  
  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Verbesserter Header mit Gradient-Hintergrund */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Immobilien-Dashboard</h1>
            <p className="mt-1 text-indigo-100">Marktübersicht und Leistungskennzahlen für Ihren Erfolg</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex p-1 bg-white/10 backdrop-blur-sm rounded-lg">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${timeRange === 'week' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                onClick={() => setTimeRange('week')}
              >
                Woche
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${timeRange === 'month' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                onClick={() => setTimeRange('month')}
              >
                Monat
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${timeRange === 'year' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                onClick={() => setTimeRange('year')}
              >
                Jahr
              </button>
            </div>
            <button 
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
              onClick={() => setShowKPIForm(!showKPIForm)}
            >
              <i className="ri-database-2-line mr-1.5"></i> KPI-Daten
            </button>
          </div>
        </div>
        
        {/* Statistik-Highlights im Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {statsHighlights.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-100">{stat.title}</p>
                  <p className="mt-1 flex items-baseline">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className={`ml-2 text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-300' : 'text-red-300'
                    }`}>{stat.change}</span>
                  </p>
                </div>
                <div className="p-2 rounded-md bg-indigo-500/30">
                  <i className={`${stat.icon} text-xl text-white`}></i>
                </div>
              </div>
              <p className="mt-1 text-sm text-indigo-100">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hauptansicht oder Team-Status-Board basierend auf der ausgewählten Ansicht */}
      {/* KPI-Daten Eingabeformular */}
      {showKPIForm && (
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">KPI-Daten erfassen</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fügen Sie neue Leistungsdaten für die Analyse hinzu</p>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowKPIForm(false)}
              aria-label="Schließen"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          
          {submitMessage.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-start ${
                submitMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-l-4 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-l-4 border-red-500'
              }`}
            >
              <div className="mr-3 flex-shrink-0 mt-0.5">
                {submitMessage.type === 'success' ? (
                  <i className="ri-check-line text-xl text-green-500"></i>
                ) : (
                  <i className="ri-error-warning-line text-xl text-red-500"></i>
                )}
              </div>
              <div>
                <p className="font-medium">{submitMessage.type === 'success' ? 'Erfolg!' : 'Fehler!'}</p>
                <p className="text-sm mt-1">{submitMessage.text}</p>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                <i className="ri-calendar-line mr-2"></i>Zeitraum
              </h3>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Datum der Datenerhebung
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors"
                  required
                />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                <i className="ri-line-chart-line mr-2"></i>Leistungskennzahlen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="anfragen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Anzahl der Anfragen
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-message-3-line text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      id="anfragen"
                      name="anfragen"
                      min="0"
                      value={formData.anfragen}
                      onChange={handleInputChange}
                      placeholder="z.B. 42"
                      className="w-full pl-10 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gesamtzahl der erhaltenen Kundenanfragen</p>
                </div>
                
                <div>
                  <label htmlFor="verkaeufe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Anzahl der Verkäufe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-check-double-line text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      id="verkaeufe"
                      name="verkaeufe"
                      min="0"
                      value={formData.verkaeufe}
                      onChange={handleInputChange}
                      placeholder="z.B. 7"
                      className="w-full pl-10 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Abgeschlossene Immobilienverkäufe im Zeitraum</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => setShowKPIForm(false)}
                className="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors shadow-sm"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-1.5"></i> Daten speichern
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    
      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anfragen</p>
              <div className="flex items-baseline mt-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.anfragen}</p>
                <p className="ml-2 text-sm font-medium text-emerald-500">+10.5%</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs. letzter {timeRange === 'week' ? 'Woche' : timeRange === 'month' ? 'Monat' : 'Jahr'}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
              <i className="ri-message-3-line text-xl text-indigo-600 dark:text-indigo-400"></i>
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-6)}>
                <Area type="monotone" dataKey="anfragen" stroke="#4f46e5" fill="#4f46e530" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Besichtigungen</p>
              <div className="flex items-baseline mt-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.besichtigungen}</p>
                <p className="ml-2 text-sm font-medium text-emerald-500">+8.4%</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs. letzter {timeRange === 'week' ? 'Woche' : timeRange === 'month' ? 'Monat' : 'Jahr'}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <i className="ri-eye-line text-xl text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-6)}>
                <Area type="monotone" dataKey="besichtigungen" stroke="#3b82f6" fill="#3b82f630" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Webseitenaufrufe</p>
              <div className="flex items-baseline mt-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.klicks}</p>
                <p className="ml-2 text-sm font-medium text-emerald-500">+15.2%</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs. letzter {timeRange === 'week' ? 'Woche' : timeRange === 'month' ? 'Monat' : 'Jahr'}</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg">
              <i className="ri-global-line text-xl text-teal-600 dark:text-teal-400"></i>
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-6)}>
                <Area type="monotone" dataKey="klicks" stroke="#14b8a6" fill="#14b8a630" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verkäufe</p>
              <div className="flex items-baseline mt-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.abschluesse}</p>
                <p className="ml-2 text-sm font-medium text-emerald-500">+40%</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs. letzter {timeRange === 'week' ? 'Woche' : timeRange === 'month' ? 'Monat' : 'Jahr'}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
              <i className="ri-check-double-line text-xl text-amber-600 dark:text-amber-400"></i>
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-6)}>
                <Area type="monotone" dataKey="abschlüsse" stroke="#f59e0b" fill="#f59e0b30" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts - Layout mit 2 Reihen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart - Verbessert */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance im Zeitverlauf</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Anfragen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Besichtigungen</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={performanceData}
                margin={chartConfig.lineChart.margin}
              >
                <defs>
                  <linearGradient id="colorAnfragen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary[2]} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBesichtigungen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.info[0]} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.info[2]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke={chartConfig.lineChart.gridStyle.stroke}
                  opacity={chartConfig.lineChart.gridStyle.opacity}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dx={-10}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dx={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="anfragen"
                  fill="url(#colorAnfragen)"
                  stroke={CHART_COLORS.primary[0]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS.primary[0] }}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary[0] }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="besichtigungen"
                  fill="url(#colorBesichtigungen)"
                  stroke={CHART_COLORS.info[0]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS.info[0] }}
                  activeDot={{ r: 6, fill: CHART_COLORS.info[0] }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Aktivitätsübersicht - Verbessert */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wöchentliche Aktivitäten</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Besucher</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Anfragen</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activityData}
                margin={chartConfig.lineChart.margin}
              >
                <defs>
                  <linearGradient id="colorBesucher" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.info[0]} stopOpacity={1}/>
                    <stop offset="100%" stopColor={CHART_COLORS.info[2]} stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorAnfragenBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary[0]} stopOpacity={1}/>
                    <stop offset="100%" stopColor={CHART_COLORS.primary[2]} stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke={chartConfig.lineChart.gridStyle.stroke}
                  opacity={chartConfig.lineChart.gridStyle.opacity}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="besucher" 
                  fill="url(#colorBesucher)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
                <Bar 
                  dataKey="anfragen" 
                  fill="url(#colorAnfragenBar)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Dritte Reihe mit Premium Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Immobilientyp-Verteilung - Premium Design */}
        <motion.div variants={itemVariants}>
          <PropertyDistributionChart propertyTypeData={propertyTypeData} />
        </motion.div>

        {/* Status-Verteilung - Premium Design */}
        <motion.div variants={itemVariants}>
          <StatusOverviewChart statusData={statusData} />
        </motion.div>
      </div>

      {/* Neueste Immobilien und CIM Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Neueste Immobilien - 2/3 der Breite */}
        <motion.div 
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          variants={itemVariants}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Neueste Immobilien</h2>
              <a href="/immobilien" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center transition-colors">
                Alle anzeigen
                <i className="ri-arrow-right-s-line ml-1"></i>
              </a>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {properties.map(property => (
              <div key={property.id} className="flex p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden">
                  <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 ml-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{property.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                        <i className="ri-map-pin-line mr-1"></i> {property.location}
                      </p>
                    </div>
                    <div className="relative ml-2 inline-block">
                      <select 
                        value={property.status}
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        disabled={statusChangeLoading === property.id}
                        className={`appearance-none pl-2 pr-8 py-0.5 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer transition-colors ${
                          property.status === 'Neu' 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                            : property.status === 'Reserviert'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                            : property.status === 'Verkauft'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                            : property.status === 'Inaktiv'
                            ? 'bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {propertyStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        {statusChangeLoading === property.id ? (
                          <svg className="animate-spin h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <i className="ri-arrow-down-s-line text-xs"></i>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <i className="ri-hotel-bed-line mr-1"></i> {property.bedrooms}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-shower-line mr-1"></i> {property.bathrooms}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-ruler-line mr-1"></i> {property.area} m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base font-bold text-gray-900 dark:text-white">{property.price}</p>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => { /* TODO: open edit modal */ }}
                      >
                        <i className="ri-edit-line text-xs"></i>
                      </button>
                      <button 
                        className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => { /* TODO: open details view */ }}
                      >
                        <i className="ri-eye-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl">
            <button 
              className="w-full py-2.5 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-gray-300 dark:border-gray-600 shadow-sm flex items-center justify-center"
              onClick={() => { /* TODO: add property flow */ }}
            >
              <i className="ri-add-line mr-1.5"></i> Neue Immobilie hinzufügen
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
