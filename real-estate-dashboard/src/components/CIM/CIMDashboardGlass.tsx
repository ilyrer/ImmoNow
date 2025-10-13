import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCIMOverview } from '../../hooks/useCIM';
import { 
  RecentPropertySummary, 
  RecentContactSummary, 
  CIMSummary, 
  PerfectMatch
} from '../../lib/api/types';
import Sidebar from '../common/Sidebar';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Zap, 
  Target, 
  Calendar,
  MapPin,
  Star,
  Activity,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Home,
  UserCheck,
  BarChart3,
  AlertCircle,
  Grid3X3
} from 'lucide-react';

const CIMDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Verwende den React Query Hook
  const { data: cimData, isLoading, error: queryError, refetch } = useCIMOverview({
    limit: 10,
    days_back: 30
  });

  // Mappe die Daten zu lokalen Variablen
  const properties = cimData?.recent_properties || [];
  const contacts = cimData?.recent_contacts || [];
  const perfectMatches = cimData?.perfect_matches || [];
  const summary = cimData?.summary || null;
  
  const [filters, setFilters] = useState({
    limit: 10,
    days_back: 30
  });
  const [viewMode, setViewMode] = useState<'cards' | 'charts'>('cards');
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'geographical' | 'kpi' | 'segmentation' | 'financial' | 'alerts'>('overview');

  // Helper functions for styling
  const getLeadQualityColor = (quality?: string) => {
    switch (quality) {
      case 'high': return 'text-emerald-600 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-900/30';
      case 'low': return 'text-red-600 bg-red-100/70 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'text-emerald-600 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'sold': return 'text-blue-600 bg-blue-100/70 dark:text-blue-400 dark:bg-blue-900/30';
      case 'reserved': return 'text-amber-600 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-900/30';
      case 'inactive': return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
      default: return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
    }
  };

  const getContactStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'lead': return 'text-blue-600 bg-blue-100/70 dark:text-blue-400 dark:bg-blue-900/30';
      case 'prospect': return 'text-amber-600 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-900/30';
      case 'customer': return 'text-emerald-600 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'inactive': return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
      default: return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleContactClick = (contactId: string) => {
    navigate(`/kontakte/${contactId}`);
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/immobilien/${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-2">
            Lade CIM Dashboard...
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sammle die neuesten Daten</div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-red-300/30 dark:border-red-700/30 rounded-2xl shadow-glass p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100/70 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fehler beim Laden</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{String(queryError)}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white rounded-xl font-medium shadow-glass transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderModulePlaceholder = (moduleName: string) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glass">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-4">
          {moduleName}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Dieses Modul wird in das neue Glasmorphism-Design überarbeitet.
        </p>
        <button
          onClick={() => setActiveTab('overview')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white rounded-xl font-medium shadow-glass transition-all duration-200 backdrop-blur-sm border border-white/20"
        >
          Zurück zur Übersicht
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Glasmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as typeof activeTab)} />

      <div className="ml-64 min-h-screen relative">
        <div className="px-8 py-6">
          {/* Render content based on active tab */}
          {activeTab === 'overview' && (
            <>
              {/* Glasmorphism Header */}
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-6 lg:mb-0">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-glass">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                          CIM Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Central Information Model - Premium Analytics</p>
                      </div>
                    </div>
                  </div>
                
                  <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-1.5 shadow-glass-sm">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          viewMode === 'cards'
                            ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        <span>Karten</span>
                      </button>
                      <button
                        onClick={() => setViewMode('charts')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          viewMode === 'charts'
                            ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Diagramme</span>
                      </button>
                    </div>

                    {/* Filter */}
                    <select
                      value={filters.days_back}
                      onChange={(e) => setFilters({...filters, days_back: parseInt(e.target.value)})}
                      className="px-4 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value={7}>Diese Woche (7 Tage)</option>
                      <option value={14}>Letzte 2 Wochen (14 Tage)</option>
                      <option value={30}>Letzter Monat (30 Tage)</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                      onClick={() => refetch()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white rounded-xl font-medium shadow-glass hover:shadow-glass-lg transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm border border-white/20"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Aktualisieren</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Perfect Matches Section */}
              {perfectMatches.length > 0 && (
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-emerald-400/20 via-green-300/10 to-emerald-500/20 dark:from-emerald-900/20 dark:via-green-800/10 dark:to-emerald-900/30 backdrop-blur-xl border border-emerald-300/30 dark:border-emerald-700/30 rounded-2xl shadow-glass p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800 dark:from-emerald-300 dark:via-green-200 dark:to-emerald-400 bg-clip-text text-transparent">
                          🎯 Perfekte Matches
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {perfectMatches.length} perfekte Übereinstimmungen zwischen Kontakten und Immobilien
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {perfectMatches.slice(0, 6).map((match, index) => (
                        <div 
                          key={`${match.contact_id}-${match.property_id}`}
                          className="bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer group"
                          onClick={() => navigate(`/kontakte/${match.contact_id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-glass-sm">
                                <span className="text-white font-bold text-sm">
                                  {Math.round(match.match_score)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {match.contact_name}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {match.contact_budget}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Match-Score</div>
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {Math.round(match.match_score)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-white/10 pt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {match.property_title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {match.property_price}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium backdrop-blur-sm border border-white/20 ${
                                  match.lead_quality === 'high' 
                                    ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : match.lead_quality === 'medium'
                                    ? 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-red-100/70 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {match.lead_quality}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Lead-Score: {match.contact_lead_score}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {perfectMatches.length > 6 && (
                      <div className="mt-4 text-center">
                        <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium">
                          Alle {perfectMatches.length} Matches anzeigen →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Glasmorphism Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">{summary.total_properties}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Immobilien</div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>+{summary.new_properties_last_30_days} neu ({filters.days_back} Tage)</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">{summary.total_contacts}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Kontakte</div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>+{summary.new_leads_last_30_days} neue Leads ({filters.days_back} Tage)</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 dark:from-white dark:to-amber-200 bg-clip-text text-transparent">{summary.high_priority_contacts}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hochwertige Leads</div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 font-medium">
                      <Star className="w-4 h-4 mr-2" />
                      <span>Top Qualität</span>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">{summary.matched_contacts_properties}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Matches</div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                      <Activity className="w-4 h-4 mr-2" />
                      <span>Perfekte Matches</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Properties - Glasmorphism Style */}
                <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-400/10 to-blue-600/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glass">
                        <Home className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                          Neueste Immobilien
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sortiert nach Erstellungsdatum</p>
                      </div>
                    </div>
                  </div>
                
                  <div className="divide-y divide-white/10">
                    {properties.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-white/20 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glass">
                          <Home className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Immobilien gefunden</h3>
                        <p className="text-gray-600 dark:text-gray-400">Erstellen Sie Ihre erste Immobilie, um sie hier zu sehen.</p>
                      </div>
                    ) : (
                      properties.map((property) => (
                        <div 
                          key={property.id} 
                          className="px-6 py-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                          onClick={() => handlePropertyClick(property.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-purple-500/30 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/40 group-hover:to-purple-600/40 transition-all duration-200 shadow-glass-sm">
                                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {property.title}
                                  </h3>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{property.address}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      {formatPrice(property.price || 0)}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium backdrop-blur-sm border border-white/20 ${getStatusColor(property.status)}`}>
                                      {property.status}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium backdrop-blur-sm border border-white/20 ${getLeadQualityColor(property.lead_quality || 'low')}`}>
                                      {property.lead_quality || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 ml-4">
                              <div className="flex items-center space-x-1 mb-1">
                                <Users className="w-3 h-3" />
                                <span>{property.contact_count} Kontakte</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(property.created_at)}</span>
                              </div>
                              <div className="mt-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Contacts - Glasmorphism Style */}
                <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-400/10 to-emerald-600/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                          Neueste Kontakte
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sortiert nach Erstellungsdatum</p>
                      </div>
                    </div>
                  </div>
                
                  <div className="divide-y divide-white/10">
                    {contacts.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-white/20 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glass">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Kontakte gefunden</h3>
                        <p className="text-gray-600 dark:text-gray-400">Erstellen Sie Ihren ersten Kontakt, um ihn hier zu sehen.</p>
                      </div>
                    ) : (
                      contacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          className="px-6 py-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                          onClick={() => handleContactClick(contact.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-emerald-500/40 group-hover:to-blue-600/40 transition-all duration-200 shadow-glass-sm">
                                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {contact.name}
                                  </h3>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{contact.email}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {contact.budget_formatted || 'Kein Budget angegeben'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium backdrop-blur-sm border border-white/20 ${getContactStatusColor(contact.status || 'lead')}`}>
                                      {contact.status || 'Lead'}
                                    </span>
                                    {(contact.matching_count || 0) > 0 && (
                                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100/70 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 backdrop-blur-sm border border-white/20">
                                        {contact.matching_count} Matches
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 ml-4">
                              <div className="flex items-center space-x-1 mb-1">
                                <Star className="w-3 h-3" />
                                <span>Score: {contact.lead_score}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(contact.created_at)}</span>
                              </div>
                              <div className="mt-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Render the selected modules as placeholders */}
          {activeTab === 'sales' && renderModulePlaceholder('Sales & Provisionen')}
          {activeTab === 'geographical' && renderModulePlaceholder('Geografische Verteilung')}
          {activeTab === 'kpi' && renderModulePlaceholder('KPI Dashboard')}
          {activeTab === 'segmentation' && renderModulePlaceholder('Segmentierung')}
          {activeTab === 'financial' && renderModulePlaceholder('Finanzdaten')}
          {activeTab === 'alerts' && renderModulePlaceholder('Automatische Alerts')}
        </div>
      </div>
    </div>
  );
};

export default CIMDashboard;
