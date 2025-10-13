/**
 * Properties Page - Vollständig Backend-integriert
 * KEINE MOCKDATEN!
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Plus, Grid, List, Filter, Search, X, 
  Bed, Bath, Square, MapPin, Euro, Calendar,
  TrendingUp, Eye, Heart, ChevronDown, Loader2,
  Clock, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks & Services
import { 
  useProperties, 
  useDeleteProperty, 
  useTogglePropertyFavorite,
  usePrefetchProperty 
} from '../../hooks/useProperties';
import { PropertyListParams } from '../../services/properties';

// Types & Utils
import { 
  Property, 
  PropertyStatus, 
  PropertyType,
  propertyToCardData,
  getPropertyStatusColor,
  calculateDaysOnMarket,
} from '../../types/property';

interface PropertiesPageProps {
  user?: any;
}

const PropertiesPage: React.FC<PropertiesPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const prefetchProperty = usePrefetchProperty();
  
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  // Filter State
  const [filters, setFilters] = useState<PropertyListParams>({
    page: 1,
    size: 20,
    search: '',
    property_type: undefined,
    status: undefined,
    price_min: undefined,
    price_max: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // API Query
  const { data: propertiesData, isLoading, error, refetch } = useProperties(filters);
  const deleteMutation = useDeleteProperty();
  const toggleFavoriteMutation = useTogglePropertyFavorite();

  // Memoized Properties
  const properties = useMemo(() => {
    return propertiesData?.items || [];
  }, [propertiesData]);

  const pagination = useMemo(() => {
    if (!propertiesData) return null;
    return {
      total: propertiesData.total,
      page: propertiesData.page,
      size: propertiesData.size,
      pages: propertiesData.pages,
      hasNext: propertiesData.hasNext,
      hasPrev: propertiesData.hasPrev,
    };
  }, [propertiesData]);

  // Handlers
  const handleFilterChange = (key: keyof PropertyListParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        // Error handling in mutation
      }
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await toggleFavoriteMutation.mutateAsync({ id, isFavorite: !isFavorite });
    } catch (error) {
      toast.error('Fehler beim Favorisieren');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      size: 20,
      search: '',
      property_type: undefined,
      status: undefined,
      price_min: undefined,
      price_max: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.property_type ||
      filters.status ||
      filters.price_min ||
      filters.price_max
    );
  }, [filters]);

  // Loading State
  if (isLoading && !properties.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Immobilien werden geladen...</p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fehler beim Laden</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {(error as any)?.message || 'Die Immobilien konnten nicht geladen werden.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
          >
            Erneut versuchen
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Immobilien
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {pagination ? `${pagination.total} Immobilien gefunden` : 'Laden...'}
              </p>
            </div>
            
            <button
              onClick={() => navigate('/properties/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Neue Immobilie</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Immobilien durchsuchen..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                {/* Type Filter */}
                <select
                  value={filters.property_type || ''}
                  onChange={(e) => handleFilterChange('property_type', e.target.value || undefined)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Alle Typen</option>
                  <option value="apartment">Wohnung</option>
                  <option value="house">Haus</option>
                  <option value="commercial">Gewerbe</option>
                  <option value="land">Grundstück</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Alle Status</option>
                  <option value="vorbereitung">Vorbereitung</option>
                  <option value="aktiv">Aktiv</option>
                  <option value="reserviert">Reserviert</option>
                  <option value="verkauft">Verkauft</option>
                </select>

                {/* Sort */}
                <select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onChange={(e) => {
                    const [sort_by, sort_order] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sort_by, sort_order: sort_order as 'asc' | 'desc' }));
                  }}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="created_at-desc">Neueste zuerst</option>
                  <option value="created_at-asc">Älteste zuerst</option>
                  <option value="price-asc">Preis aufsteigend</option>
                  <option value="price-desc">Preis absteigend</option>
                  <option value="living_area-desc">Größte zuerst</option>
                </select>

                {/* View Toggle */}
                <div className="flex bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-all ${
                      viewMode === 'list'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-3 rounded-xl transition-all ${
                    showFilters
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Price Min */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preis von
                      </label>
                      <input
                        type="number"
                        placeholder="Min. Preis"
                        value={filters.price_min || ''}
                        onChange={(e) => handleFilterChange('price_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Price Max */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preis bis
                      </label>
                      <input
                        type="number"
                        placeholder="Max. Preis"
                        value={filters.price_max || ''}
                        onChange={(e) => handleFilterChange('price_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Rooms Min */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min. Zimmer
                      </label>
                      <input
                        type="number"
                        placeholder="Min. Zimmer"
                        value={filters.rooms_min || ''}
                        onChange={(e) => handleFilterChange('rooms_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Area Min */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min. Fläche (m²)
                      </label>
                      <input
                        type="number"
                        placeholder="Min. Fläche"
                        value={filters.living_area_min || ''}
                        onChange={(e) => handleFilterChange('living_area_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktive Filter:</span>
                {filters.search && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                    Suche: "{filters.search}"
                  </span>
                )}
                {filters.property_type && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
                    Typ: {filters.property_type}
                  </span>
                )}
                {filters.status && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                    Status: {filters.status}
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Alle zurücksetzen
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Properties Grid/List */}
        {properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Keine Immobilien gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Versuchen Sie, Ihre Filterkriterien anzupassen.'
                : 'Erstellen Sie Ihre erste Immobilie, um loszulegen.'}
            </p>
            <button
              onClick={() => navigate('/properties/new')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
            >
              Neue Immobilie erstellen
            </button>
          </motion.div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
              >
                {properties.map((property, index) => {
                  const cardData = propertyToCardData(property);
                  const daysOnMarket = calculateDaysOnMarket(property.created_at);
                  
                  return (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onMouseEnter={() => prefetchProperty(property.id)}
                      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                      {/* Image Container with Overlay */}
                      <div 
                        className="relative h-56 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        {cardData.primaryImage ? (
                          <>
                            <img
                              src={cardData.primaryImage}
                              alt={property.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Dark Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                            <Home className="w-20 h-20 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        
                        {/* Favorite Button - Glassmorphism */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(property.id, property.isFavorite || false);
                          }}
                          className={`absolute top-4 right-4 w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                            property.isFavorite
                              ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white scale-110'
                              : 'bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:scale-110 hover:bg-white dark:hover:bg-gray-800'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${property.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        {/* Status Badge - Modern Pills */}
                        <div className="absolute top-4 left-4">
                          <span className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl shadow-lg ${getPropertyStatusColor(property.status)}`}>
                            {cardData.statusLabel}
                          </span>
                        </div>

                        {/* Days on Market - Floating Badge */}
                        {daysOnMarket > 0 && (
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-xl rounded-full text-white text-xs font-semibold shadow-lg">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {daysOnMarket} Tage
                          </div>
                        )}
                      </div>

                      {/* Content - Enhanced Spacing */}
                      <div className="p-6">
                        {/* Title & Location */}
                        <div className="mb-4">
                          <h3 
                            className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            {property.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{property.location}</span>
                          </div>
                        </div>

                        {/* Price & Type - Enhanced */}
                        <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-gray-100 dark:border-gray-700">
                          <div>
                            <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                              {cardData.priceFormatted}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                              {cardData.typeLabel}
                            </span>
                          </div>
                        </div>

                        {/* Features - Icon Pills */}
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                          {property.rooms && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium">
                              <Bed className="w-4 h-4" />
                              <span>{property.rooms}</span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium">
                              <Bath className="w-4 h-4" />
                              <span>{property.bathrooms}</span>
                            </div>
                          )}
                          {property.living_area && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium">
                              <Square className="w-4 h-4" />
                              <span>{property.living_area} m²</span>
                            </div>
                          )}
                        </div>

                        {/* Actions - Modern Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => navigate(`/properties/${property.id}`)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                          >
                            Details ansehen
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            disabled={deleteMutation.isPending}
                            className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* List View - Enhanced Design */}
            {viewMode === 'list' && (
              <div className="space-y-5">
                {properties.map((property, index) => {
                  const cardData = propertyToCardData(property);
                  const daysOnMarket = calculateDaysOnMarket(property.created_at);
                  
                  return (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onMouseEnter={() => prefetchProperty(property.id)}
                      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                    >
                      <div className="flex gap-6">
                        {/* Image - Larger & Better */}
                        <div 
                          className="w-64 h-40 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden cursor-pointer relative"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          {cardData.primaryImage ? (
                            <>
                              <img
                                src={cardData.primaryImage}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                          
                          {/* Days Badge on Image */}
                          {daysOnMarket > 0 && (
                            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-xl rounded-full text-white text-xs font-semibold">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {daysOnMarket} Tage
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="text-2xl font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                                onClick={() => navigate(`/properties/${property.id}`)}
                              >
                                {property.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>{property.location}</span>
                              </div>
                            </div>
                            
                            {/* Status & Favorite */}
                            <div className="flex items-center gap-3 ml-4">
                              <span className={`px-4 py-2 rounded-full text-xs font-bold ${getPropertyStatusColor(property.status)}`}>
                                {cardData.statusLabel}
                              </span>
                              <button
                                onClick={() => handleToggleFavorite(property.id, property.isFavorite || false)}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                                  property.isFavorite
                                    ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white scale-110'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${property.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Price & Type */}
                          <div className="flex items-baseline gap-4 mb-4">
                            <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                              {cardData.priceFormatted}
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {cardData.typeLabel}
                            </span>
                          </div>

                          {/* Features - Colorful Pills */}
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            {property.rooms && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium">
                                <Bed className="w-4 h-4" />
                                <span>{property.rooms} Zimmer</span>
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium">
                                <Bath className="w-4 h-4" />
                                <span>{property.bathrooms} Bäder</span>
                              </div>
                            )}
                            {property.living_area && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium">
                                <Square className="w-4 h-4" />
                                <span>{property.living_area} m²</span>
                              </div>
                            )}
                          </div>

                          {/* Actions - Bottom Right */}
                          <div className="flex items-center gap-3 mt-auto">
                            <button
                              onClick={() => navigate(`/properties/${property.id}`)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                            >
                              Details ansehen
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              disabled={deleteMutation.isPending}
                              className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center justify-center gap-2"
              >
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Zurück
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          pagination.page === page
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Weiter
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Loading Overlay */}
        {isLoading && properties.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
