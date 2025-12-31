import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCIMOverview } from '../../hooks/useCIM';
import { 
  RecentPropertySummary, 
  RecentContactSummary, 
  CIMSummary, 
  PerfectMatch
} from '../../lib/api/types';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CIMOverview: React.FC = () => {
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

  // Helper functions for styling
  const getLeadQualityColor = (quality: string) => {
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
      case 'off_market': return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
      default: return 'text-gray-600 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-800/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-8">
          <div className="flex items-center space-x-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xl font-medium text-gray-900 dark:text-white">CIM wird geladen...</span>
          </div>
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
            <Button
              onClick={() => refetch()}
            >
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Glasmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="min-h-screen relative">
        <div className="px-8 py-6">
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
                
                {/* Quick Access Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => navigate('/cim/sales')}
                    className="flex items-center px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 shadow-glass"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Umsatz & Provision
                  </button>
                  <button 
                    onClick={() => navigate('/cim/geographical')}
                    className="flex items-center px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 shadow-glass"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Geografische Verteilung
                  </button>
                  <button 
                    onClick={() => navigate('/cim/kpi')}
                    className="flex items-center px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 shadow-glass"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    KPI Dashboard
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setViewMode(viewMode === 'cards' ? 'charts' : 'cards')}
                    className="flex items-center px-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/20 transition-all duration-300 shadow-glass"
                  >
                    {viewMode === 'cards' ? <BarChart3 className="w-4 h-4 mr-2" /> : <Grid3X3 className="w-4 h-4 mr-2" />}
                    {viewMode === 'cards' ? 'Charts' : 'Cards'}
                  </button>
                  
                  <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-glass hover:shadow-lg transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <select
                  value={filters.days_back}
                  onChange={(e) => setFilters(prev => ({ ...prev, days_back: parseInt(e.target.value) }))}
                  className="px-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-glass"
                >
                  <option value={7}>Letzte 7 Tage</option>
                  <option value={30}>Letzte 30 Tage</option>
                  <option value={90}>Letzte 90 Tage</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Properties */}
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    Immobilien
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_properties}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gesamte Objekte</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+{properties.length} diese Woche</p>
                </div>
              </div>

              {/* Total Contacts */}
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glass">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    Kontakte
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_contacts}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Leads</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+{contacts.length} diese Woche</p>
                </div>
              </div>

              {/* Perfect Matches */}
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                    Matches
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{perfectMatches.length}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perfect Matches</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Hochwertige Leads</p>
                </div>
              </div>

              {/* Activity Score */}
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glass">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-amber-100/70 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                    Aktivität
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">8.4/10</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Activity Score</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Sehr aktiv</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Recent Properties */}
            <div className="xl:col-span-2">
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    Neueste Immobilien
                  </h2>
                  <button 
                    onClick={() => navigate('/immobilien')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                  >
                    Alle anzeigen
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl flex items-center justify-center">
                          <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{property.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{property.address}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">€{property.price?.toLocaleString()}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Contacts */}
            <div>
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Neue Leads
                  </h2>
                  <button 
                    onClick={() => navigate('/kontakte')}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium flex items-center"
                  >
                    Alle anzeigen
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {contacts.slice(0, 4).map((contact) => (
                    <div key={contact.id} className="p-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Neu
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Mail className="w-4 h-4 mr-2" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Perfect Matches Section */}
          {perfectMatches.length > 0 && (
            <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-emerald-600" />
                  Perfect Matches
                  <span className="ml-2 bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2 py-1 rounded-full">
                    Neu
                  </span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perfectMatches.map((match) => (
                  <div key={`${match.property_id}-${match.contact_id}`} className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <Star className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                        {(match.match_score * 100).toFixed(0)}% Match
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{match.property_title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">für {match.contact_name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Perfekte Übereinstimmung</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CIMOverview;
