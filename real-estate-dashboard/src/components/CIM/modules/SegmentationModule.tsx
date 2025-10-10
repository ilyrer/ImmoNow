import React, { useState, useEffect } from 'react';
import {
  Filter,
  Sliders,
  Search,
  Grid3X3,
  List,
  BarChart3,
  PieChart,
  Users,
  Building2,
  Euro,
  MapPin,
  Calendar,
  Target,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  X,
  Plus,
  ChevronDown,
  ChevronUp
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface FilterCriteria {
  propertyTypes: string[];
  priceRange: { min: number; max: number };
  regions: string[];
  customerSegments: string[];
  dateRange: { start: string; end: string };
  additionalFilters: { [key: string]: any };
}

interface SegmentData {
  id: string;
  name: string;
  count: number;
  value: number;
  avgPrice: number;
  conversion: number;
  growth: number;
  marketShare: number;
}

interface PropertySegment {
  type: string;
  count: number;
  totalValue: number;
  avgPrice: number;
  region: string;
  status: string;
}

interface CustomerSegment {
  segment: string;
  customers: number;
  revenue: number;
  avgDeal: number;
  conversionRate: number;
  lifetimeValue: number;
}

const SegmentationModule: React.FC = () => {
  const [filters, setFilters] = useState<FilterCriteria>({
    propertyTypes: [],
    priceRange: { min: 0, max: 5000000 },
    regions: [],
    customerSegments: [],
    dateRange: { start: '2024-01-01', end: '2024-12-31' },
    additionalFilters: {}
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'charts'>('grid');
  const [expandedSections, setExpandedSections] = useState<string[]>(['properties', 'customers']);

  // Available filter options
  const propertyTypes = ['Wohnungen', 'Häuser', 'Gewerbe', 'Büros', 'Grundstücke', 'Garagen'];
  const regions = ['Hamburg', 'Berlin', 'München', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Hannover'];
  const customerSegments = ['Erstinvestoren', 'Erfahrene Investoren', 'Eigennutzer', 'Gewerbemieter', 'Private Vermieter', 'Institutionelle Investoren'];

  // Mock segmented data
  const propertySegments: PropertySegment[] = [
    { type: 'Luxus-Wohnungen', count: 45, totalValue: 9000000, avgPrice: 200000, region: 'München', status: 'available' },
    { type: 'Mittelklasse-Wohnungen', count: 128, totalValue: 15360000, avgPrice: 120000, region: 'Hamburg', status: 'available' },
    { type: 'Einfamilienhäuser', count: 67, totalValue: 16750000, avgPrice: 250000, region: 'Berlin', status: 'available' },
    { type: 'Gewerbeimmobilien', count: 23, totalValue: 11500000, avgPrice: 500000, region: 'Frankfurt', status: 'available' },
    { type: 'Büroflächen', count: 34, totalValue: 17000000, avgPrice: 500000, region: 'Düsseldorf', status: 'available' },
    { type: 'Studentenwohnungen', count: 89, totalValue: 6675000, avgPrice: 75000, region: 'Köln', status: 'available' }
  ];

  const customerSegments_data: CustomerSegment[] = [
    { segment: 'Erstinvestoren', customers: 156, revenue: 12400000, avgDeal: 79487, conversionRate: 18.5, lifetimeValue: 145000 },
    { segment: 'Erfahrene Investoren', customers: 89, revenue: 22300000, avgDeal: 250562, conversionRate: 42.3, lifetimeValue: 380000 },
    { segment: 'Eigennutzer', customers: 234, revenue: 28600000, avgDeal: 122222, conversionRate: 28.7, lifetimeValue: 125000 },
    { segment: 'Gewerbemieter', customers: 67, revenue: 18900000, avgDeal: 282090, conversionRate: 35.8, lifetimeValue: 420000 },
    { segment: 'Private Vermieter', customers: 123, revenue: 15700000, avgDeal: 127642, conversionRate: 31.2, lifetimeValue: 180000 },
    { segment: 'Institutionelle Investoren', customers: 12, revenue: 45600000, avgDeal: 3800000, conversionRate: 67.8, lifetimeValue: 2500000 }
  ];

  const priceRanges = [
    { range: '< 100k', count: 89, percentage: 24.3 },
    { range: '100k - 250k', count: 156, percentage: 42.6 },
    { range: '250k - 500k', count: 78, percentage: 21.3 },
    { range: '500k - 1M', count: 32, percentage: 8.7 },
    { range: '> 1M', count: 11, percentage: 3.0 }
  ];

  const regionalData = [
    { region: 'Hamburg', properties: 89, customers: 167, revenue: 18500000, growth: 12.4 },
    { region: 'Berlin', properties: 134, customers: 234, revenue: 24800000, growth: 15.7 },
    { region: 'München', properties: 67, customers: 145, revenue: 28900000, growth: 8.3 },
    { region: 'Frankfurt', properties: 45, customers: 89, revenue: 19200000, growth: 18.9 },
    { region: 'Köln', properties: 78, customers: 123, revenue: 14600000, growth: 10.2 },
    { region: 'Stuttgart', properties: 56, customers: 98, revenue: 16700000, growth: 14.1 }
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

  const handleFilterChange = (filterType: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));

    // Add to active filters if not present
    if (!activeFilters.includes(filterType)) {
      setActiveFilters(prev => [...prev, filterType]);
    }
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filterType));
    // Reset filter to default
    switch (filterType) {
      case 'propertyTypes':
        setFilters(prev => ({ ...prev, propertyTypes: [] }));
        break;
      case 'regions':
        setFilters(prev => ({ ...prev, regions: [] }));
        break;
      case 'customerSegments':
        setFilters(prev => ({ ...prev, customerSegments: [] }));
        break;
      case 'priceRange':
        setFilters(prev => ({ ...prev, priceRange: { min: 0, max: 5000000 } }));
        break;
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilters({
      propertyTypes: [],
      priceRange: { min: 0, max: 5000000 },
      regions: [],
      customerSegments: [],
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      additionalFilters: {}
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Apply filters to data
  const filteredPropertySegments = propertySegments.filter(property => {
    const typeMatch = filters.propertyTypes.length === 0 || filters.propertyTypes.some(type => property.type.includes(type));
    const regionMatch = filters.regions.length === 0 || filters.regions.includes(property.region);
    const priceMatch = property.avgPrice >= filters.priceRange.min && property.avgPrice <= filters.priceRange.max;
    
    return typeMatch && regionMatch && priceMatch;
  });

  const filteredCustomerSegments = customerSegments_data.filter(segment => {
    return filters.customerSegments.length === 0 || filters.customerSegments.includes(segment.segment);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <span>Segmentierung & Filter</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Erweiterte Filter nach Immobilientyp, Preisrange, Region und Kundensegment
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'charts'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Aktive Filter ({activeFilters.length})</h3>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Alle löschen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filterType) => (
              <div key={filterType} className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                <span>
                  {filterType === 'propertyTypes' && `Immobilientyp (${filters.propertyTypes.length})`}
                  {filterType === 'regions' && `Region (${filters.regions.length})`}
                  {filterType === 'customerSegments' && `Kundensegment (${filters.customerSegments.length})`}
                  {filterType === 'priceRange' && `Preis: ${formatCurrency(filters.priceRange.min)} - ${formatCurrency(filters.priceRange.max)}`}
                </span>
                <button
                  onClick={() => removeFilter(filterType)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Property Types Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Immobilientyp
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {propertyTypes.map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...filters.propertyTypes, type]
                        : filters.propertyTypes.filter(t => t !== type);
                      handleFilterChange('propertyTypes', newTypes);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Preisbereich
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Minimum</label>
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700"
                  placeholder="Min Preis"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Maximum</label>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: parseInt(e.target.value) || 5000000
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700"
                  placeholder="Max Preis"
                />
              </div>
            </div>
          </div>

          {/* Regions Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Region
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {regions.map((region) => (
                <label key={region} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(region)}
                    onChange={(e) => {
                      const newRegions = e.target.checked
                        ? [...filters.regions, region]
                        : filters.regions.filter(r => r !== region);
                      handleFilterChange('regions', newRegions);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Segments Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Kundensegment
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {customerSegments.map((segment) => (
                <label key={segment} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.customerSegments.includes(segment)}
                    onChange={(e) => {
                      const newSegments = e.target.checked
                        ? [...filters.customerSegments, segment]
                        : filters.customerSegments.filter(s => s !== segment);
                      handleFilterChange('customerSegments', newSegments);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{segment}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gefilterte Immobilien</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredPropertySegments.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtwert</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(filteredPropertySegments.reduce((sum, p) => sum + p.totalValue, 0))}
              </p>
            </div>
            <Euro className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kundensegmente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredCustomerSegments.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Durchschnittspreis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredPropertySegments.length > 0 
                  ? formatCurrency(filteredPropertySegments.reduce((sum, p) => sum + p.avgPrice, 0) / filteredPropertySegments.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <Target className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Property Segments Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Immobilien-Segmente</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPropertySegments.length} von {propertySegments.length} Segmenten
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPropertySegments.map((segment, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{segment.type}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{segment.region}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                        {segment.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Anzahl:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{segment.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gesamtwert:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(segment.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ø Preis:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(segment.avgPrice)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Details anzeigen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Segments Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kunden-Segmente</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredCustomerSegments.length} von {customerSegments_data.length} Segmenten
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCustomerSegments.map((segment, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{segment.segment}</h4>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      segment.conversionRate > 40 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      segment.conversionRate > 25 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formatPercentage(segment.conversionRate)} Conversion
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Kunden:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{segment.customers}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Umsatz:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(segment.revenue)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Ø Deal:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(segment.avgDeal)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Lifetime Value:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(segment.lifetimeValue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Property Segments Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Immobilien-Segmente (Listenansicht)</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Typ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Region</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Anzahl</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Gesamtwert</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Ø Preis</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPropertySegments.map((segment, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{segment.type}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{segment.region}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{segment.count}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(segment.totalValue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {formatCurrency(segment.avgPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                          {segment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'charts' && (
        <div className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Range Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Preisverteilung</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={priceRanges}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="range"
                      label={({ range, percentage }) => `${range}: ${percentage}%`}
                    >
                      {priceRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Performance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Regionale Performance</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="region" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : 
                        name === 'growth' ? formatPercentage(value) : value,
                        name === 'revenue' ? 'Umsatz' : 
                        name === 'properties' ? 'Immobilien' : 
                        name === 'customers' ? 'Kunden' : 'Wachstum'
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="properties" fill={COLORS.primary} name="Immobilien" />
                    <Bar dataKey="customers" fill={COLORS.secondary} name="Kunden" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Segment Revenue */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Kundensegment Umsatz</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredCustomerSegments} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="segment" type="category" className="text-xs" width={120} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Umsatz']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="revenue" fill={COLORS.accent} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Wachstumstrends</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={regionalData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="region" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value: number) => [formatPercentage(value), 'Wachstum']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="growth" 
                      stroke={COLORS.success} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.success, strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentationModule;
