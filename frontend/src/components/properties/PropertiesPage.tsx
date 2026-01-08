/**
 * Properties Page - Vollständig Backend-integriert
 * KEINE MOCKDATEN!
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Home, Plus, Grid, List, Filter, Search, X, 
  Bed, Bath, Square, MapPin, Euro, Calendar,
  TrendingUp, Eye, Heart, ChevronDown, Loader2,
  Clock, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Hooks & Services
import { 
  useProperties, 
  useDeleteProperty, 
  useTogglePropertyFavorite,
  usePrefetchProperty,
  useBulkPropertyAction
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  // Initialize filters from URL params
  const getInitialFilters = (): PropertyListParams => {
    return {
      page: parseInt(searchParams.get('page') || '1'),
      size: parseInt(searchParams.get('size') || '20'),
      search: searchParams.get('search') || '',
      property_type: searchParams.get('property_type') || undefined,
      status: searchParams.get('status') || undefined,
      price_min: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined,
      price_max: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined,
      rooms_min: searchParams.get('rooms_min') ? Number(searchParams.get('rooms_min')) : undefined,
      rooms_max: searchParams.get('rooms_max') ? Number(searchParams.get('rooms_max')) : undefined,
      bedrooms_min: searchParams.get('bedrooms_min') ? Number(searchParams.get('bedrooms_min')) : undefined,
      bedrooms_max: searchParams.get('bedrooms_max') ? Number(searchParams.get('bedrooms_max')) : undefined,
      bathrooms_min: searchParams.get('bathrooms_min') ? Number(searchParams.get('bathrooms_min')) : undefined,
      bathrooms_max: searchParams.get('bathrooms_max') ? Number(searchParams.get('bathrooms_max')) : undefined,
      living_area_min: searchParams.get('living_area_min') ? Number(searchParams.get('living_area_min')) : undefined,
      living_area_max: searchParams.get('living_area_max') ? Number(searchParams.get('living_area_max')) : undefined,
      plot_area_min: searchParams.get('plot_area_min') ? Number(searchParams.get('plot_area_min')) : undefined,
      plot_area_max: searchParams.get('plot_area_max') ? Number(searchParams.get('plot_area_max')) : undefined,
      year_built_min: searchParams.get('year_built_min') ? Number(searchParams.get('year_built_min')) : undefined,
      year_built_max: searchParams.get('year_built_max') ? Number(searchParams.get('year_built_max')) : undefined,
      energy_class: searchParams.get('energy_class') || undefined,
      heating_type: searchParams.get('heating_type') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
    };
  };
  
  // Filter State
  const [filters, setFilters] = useState<PropertyListParams>(getInitialFilters());

  // API Query
  const { data: propertiesData, isLoading, error, refetch } = useProperties(filters);
  const deleteMutation = useDeleteProperty();
  const toggleFavoriteMutation = useTogglePropertyFavorite();
  const bulkActionMutation = useBulkPropertyAction();

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Memoized Properties
  const properties = useMemo(() => {
    if (!propertiesData) return [];
    // Handle different response formats
    if (Array.isArray(propertiesData)) {
      return propertiesData;
    }
    // Check if it's a paginated response
    if (propertiesData.items) {
      return Array.isArray(propertiesData.items) ? propertiesData.items : [];
    }
    if (propertiesData.data) {
      return Array.isArray(propertiesData.data) ? propertiesData.data : [];
    }
    return [];
  }, [propertiesData]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 PropertiesPage Debug:', {
      isLoading,
      hasError: !!error,
      propertiesData,
      propertiesCount: properties.length,
      filters
    });
    if (error) {
      console.error('❌ Properties Error:', error);
    }
  }, [isLoading, error, propertiesData, properties.length, filters]);

  const pagination = useMemo(() => {
    if (!propertiesData) return null;
    // Handle different response formats
    if (Array.isArray(propertiesData)) {
      return {
        total: propertiesData.length,
        page: filters.page || 1,
        size: filters.size || 20,
        pages: Math.ceil(propertiesData.length / (filters.size || 20)),
        hasNext: false,
        hasPrev: false,
      };
    }
    const total = propertiesData.total || 0;
    const page = propertiesData.page || filters.page || 1;
    const size = propertiesData.size || filters.size || 20;
    const pages = propertiesData.pages || Math.ceil(total / size);
    return {
      total,
      page,
      size,
      pages,
      hasNext: propertiesData.hasNext ?? (page < pages),
      hasPrev: propertiesData.hasPrev ?? (page > 1),
    };
  }, [propertiesData, filters.page, filters.size]);

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
      rooms_min: undefined,
      rooms_max: undefined,
      bedrooms_min: undefined,
      bedrooms_max: undefined,
      bathrooms_min: undefined,
      bathrooms_max: undefined,
      living_area_min: undefined,
      living_area_max: undefined,
      plot_area_min: undefined,
      plot_area_max: undefined,
      year_built_min: undefined,
      year_built_max: undefined,
      energy_class: undefined,
      heating_type: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  };

  // Bulk Operations
  const handleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProperties(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Möchten Sie ${selectedProperties.length} Immobilien wirklich löschen?`)) return;
    
    try {
      await bulkActionMutation.mutateAsync({ action: 'delete', propertyIds: selectedProperties });
      setSelectedProperties([]);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleBulkPublish = async () => {
    if (!window.confirm(`Möchten Sie ${selectedProperties.length} Immobilien veröffentlichen?`)) return;
    
    try {
      await bulkActionMutation.mutateAsync({ action: 'publish', propertyIds: selectedProperties });
      setSelectedProperties([]);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Veröffentlichen');
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Möchten Sie ${selectedProperties.length} Immobilien archivieren?`)) return;
    
    try {
      await bulkActionMutation.mutateAsync({ action: 'archive', propertyIds: selectedProperties });
      setSelectedProperties([]);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Archivieren');
    }
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.property_type ||
      filters.status ||
      filters.price_min ||
      filters.price_max ||
      filters.rooms_min ||
      filters.rooms_max ||
      filters.bedrooms_min ||
      filters.bedrooms_max ||
      filters.bathrooms_min ||
      filters.bathrooms_max ||
      filters.living_area_min ||
      filters.living_area_max ||
      filters.plot_area_min ||
      filters.plot_area_max ||
      filters.year_built_min ||
      filters.year_built_max ||
      filters.energy_class ||
      filters.heating_type
    );
  }, [filters]);

  // Error State - Zeige immer die Seite, auch bei Fehlern
  if (error && !propertiesData) {
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
          <Button
            onClick={() => refetch()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
          >
            Erneut versuchen
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Loading Overlay */}
      {isLoading && !properties.length && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8 shadow-2xl">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Immobilien werden geladen...</p>
            </div>
          </Card>
        </div>
      )}
      
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
                {selectedProperties.length > 0 && ` • ${selectedProperties.length} ausgewählt`}
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/properties/create')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Neue Immobilie</span>
            </Button>
          </div>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {selectedProperties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedProperties.length} Immobilie(n) ausgewählt
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedProperties.length === properties.length ? 'Keine auswählen' : 'Alle auswählen'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleBulkPublish}
                      disabled={bulkActionMutation.isPending}
                      variant="default"
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Veröffentlichen
                    </Button>
                    <Button
                      onClick={handleBulkArchive}
                      disabled={bulkActionMutation.isPending}
                      variant="default"
                      size="sm"
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Archivieren
                    </Button>
                    <Button
                      onClick={handleBulkDelete}
                      disabled={bulkActionMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      {bulkActionMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
                    </Button>
                    <Button
                      onClick={() => setSelectedProperties([])}
                      variant="ghost"
                      size="icon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filters */}
          <div className="bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-800 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Immobilien durchsuchen..."
                      value={filters.search || ''}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                {/* Type Filter */}
                <Select
                  value={filters.property_type || 'all'}
                  onValueChange={(value) => handleFilterChange('property_type', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <SelectValue placeholder="Alle Typen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="apartment">Wohnung</SelectItem>
                    <SelectItem value="house">Haus</SelectItem>
                    <SelectItem value="commercial">Gewerbe</SelectItem>
                    <SelectItem value="land">Grundstück</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="vorbereitung">Vorbereitung</SelectItem>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="reserviert">Reserviert</SelectItem>
                    <SelectItem value="verkauft">Verkauft</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onValueChange={(value) => {
                    const [sort_by, sort_order] = value.split('-');
                    setFilters(prev => ({ ...prev, sort_by, sort_order: sort_order as 'asc' | 'desc' }));
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <SelectValue placeholder="Sortieren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Neueste zuerst</SelectItem>
                    <SelectItem value="created_at-asc">Älteste zuerst</SelectItem>
                    <SelectItem value="price-asc">Preis aufsteigend</SelectItem>
                    <SelectItem value="price-desc">Preis absteigend</SelectItem>
                    <SelectItem value="living_area-desc">Größte zuerst</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <Button
                    onClick={() => setViewMode('grid')}
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      viewMode === 'grid' && 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    <Grid className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      viewMode === 'list' && 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    <List className="w-5 h-5" />
                  </Button>
                </div>

                {/* Advanced Filters Toggle */}
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    showFilters && 'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                >
                  <Filter className="w-5 h-5" />
                </Button>
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
                      <Label className="mb-2">Preis von</Label>
                      <Input
                        type="number"
                        placeholder="Min. Preis"
                        value={filters.price_min || ''}
                        onChange={(e) => handleFilterChange('price_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Price Max */}
                    <div>
                      <Label className="mb-2">Preis bis</Label>
                      <Input
                        type="number"
                        placeholder="Max. Preis"
                        value={filters.price_max || ''}
                        onChange={(e) => handleFilterChange('price_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Rooms Min */}
                    <div>
                      <Label className="mb-2">Min. Zimmer</Label>
                      <Input
                        type="number"
                        placeholder="Min. Zimmer"
                        value={filters.rooms_min || ''}
                        onChange={(e) => handleFilterChange('rooms_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Rooms Max */}
                    <div>
                      <Label className="mb-2">Max. Zimmer</Label>
                      <Input
                        type="number"
                        placeholder="Max. Zimmer"
                        value={filters.rooms_max || ''}
                        onChange={(e) => handleFilterChange('rooms_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Living Area Min */}
                    <div>
                      <Label className="mb-2">Min. Wohnfläche (m²)</Label>
                      <Input
                        type="number"
                        placeholder="Min. Wohnfläche"
                        value={filters.living_area_min || ''}
                        onChange={(e) => handleFilterChange('living_area_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Living Area Max */}
                    <div>
                      <Label className="mb-2">Max. Wohnfläche (m²)</Label>
                      <Input
                        type="number"
                        placeholder="Max. Wohnfläche"
                        value={filters.living_area_max || ''}
                        onChange={(e) => handleFilterChange('living_area_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Bedrooms Min */}
                    <div>
                      <Label className="mb-2">Min. Schlafzimmer</Label>
                      <Input
                        type="number"
                        placeholder="Min. Schlafzimmer"
                        value={filters.bedrooms_min || ''}
                        onChange={(e) => handleFilterChange('bedrooms_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Bedrooms Max */}
                    <div>
                      <Label className="mb-2">Max. Schlafzimmer</Label>
                      <Input
                        type="number"
                        placeholder="Max. Schlafzimmer"
                        value={filters.bedrooms_max || ''}
                        onChange={(e) => handleFilterChange('bedrooms_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Bathrooms Min */}
                    <div>
                      <Label className="mb-2">Min. Badezimmer</Label>
                      <Input
                        type="number"
                        placeholder="Min. Badezimmer"
                        value={filters.bathrooms_min || ''}
                        onChange={(e) => handleFilterChange('bathrooms_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Bathrooms Max */}
                    <div>
                      <Label className="mb-2">Max. Badezimmer</Label>
                      <Input
                        type="number"
                        placeholder="Max. Badezimmer"
                        value={filters.bathrooms_max || ''}
                        onChange={(e) => handleFilterChange('bathrooms_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Year Built Min */}
                    <div>
                      <Label className="mb-2">Baujahr von</Label>
                      <Input
                        type="number"
                        placeholder="Min. Baujahr"
                        value={filters.year_built_min || ''}
                        onChange={(e) => handleFilterChange('year_built_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Year Built Max */}
                    <div>
                      <Label className="mb-2">Baujahr bis</Label>
                      <Input
                        type="number"
                        placeholder="Max. Baujahr"
                        value={filters.year_built_max || ''}
                        onChange={(e) => handleFilterChange('year_built_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Plot Area Min */}
                    <div>
                      <Label className="mb-2">Min. Grundstücksfläche (m²)</Label>
                      <Input
                        type="number"
                        placeholder="Min. Grundstück"
                        value={filters.plot_area_min || ''}
                        onChange={(e) => handleFilterChange('plot_area_min', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Plot Area Max */}
                    <div>
                      <Label className="mb-2">Max. Grundstücksfläche (m²)</Label>
                      <Input
                        type="number"
                        placeholder="Max. Grundstück"
                        value={filters.plot_area_max || ''}
                        onChange={(e) => handleFilterChange('plot_area_max', e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    {/* Energy Class */}
                    <div>
                      <Label className="mb-2">Energieklasse</Label>
                      <Select
                        value={filters.energy_class || 'all'}
                        onValueChange={(value) => handleFilterChange('energy_class', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                          <SelectValue placeholder="Alle Klassen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Klassen</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                          <SelectItem value="G">G</SelectItem>
                          <SelectItem value="H">H</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Heating Type */}
                    <div>
                      <Label className="mb-2">Heizungsart</Label>
                      <Input
                        type="text"
                        placeholder="z.B. Gas, Öl, Wärmepumpe"
                        value={filters.heating_type || ''}
                        onChange={(e) => handleFilterChange('heating_type', e.target.value || undefined)}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
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
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                >
                  Alle zurücksetzen
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Properties Grid/List */}
        {properties.length === 0 && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-800 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error ? 'Fehler beim Laden' : 'Keine Immobilien gefunden'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error ? (
                <span className="text-red-600 dark:text-red-400">
                  {(error as any)?.message || 'Die Immobilien konnten nicht geladen werden.'}
                </span>
              ) : hasActiveFilters ? (
                'Versuchen Sie, Ihre Filterkriterien anzupassen.'
              ) : (
                'Erstellen Sie Ihre erste Immobilie, um loszulegen.'
              )}
            </p>
            <div className="flex gap-3 justify-center">
              {error && (
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600"
                >
                  Erneut versuchen
                </Button>
              )}
              <Button
                onClick={() => navigate('/properties/create')}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg"
              >
                Neue Immobilie erstellen
              </Button>
            </div>
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
                      className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
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
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(property.id, property.isFavorite || false);
                          }}
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute top-4 right-4 w-11 h-11 rounded-2xl backdrop-blur-xl shadow-lg",
                            property.isFavorite
                              ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white scale-110'
                              : 'bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:scale-110'
                          )}
                        >
                          <Heart className={cn("w-5 h-5", property.isFavorite && "fill-current")} />
                        </Button>

                        {/* Status Badge - Modern Pills */}
                        <div className="absolute top-4 left-4">
                          <Badge className={cn("px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl shadow-lg", getPropertyStatusColor(property.status))}>
                            {cardData.statusLabel}
                          </Badge>
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
                          <Button
                            onClick={() => navigate(`/properties/${property.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                          >
                            Details ansehen
                          </Button>
                          <Button
                            onClick={() => handleDelete(property.id)}
                            disabled={deleteMutation.isPending}
                            variant="ghost"
                            size="icon"
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                      className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
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
                  className="px-4 py-2 bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
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
                  className="px-4 py-2 bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
