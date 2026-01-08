/**
 * Portfolio View - Investor Module
 * Overview of all investor assets with KPIs and detailed table
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  BarChart3,
  AlertCircle,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { useInvestorPortfolio } from '../../hooks/useInvestor';
import { InvestorAsset } from '../../types/investor';

const PortfolioView: React.FC = () => {
  const { data: portfolioData, isLoading: loading, error } = useInvestorPortfolio();
  
  // Mappe API-Response zu legacy Format
  const assets = portfolioData?.assets || [];
  const kpis = portfolioData?.kpis || {
    total_value: 0,
    average_roi: 0,
    total_cashflow: 0,
    vacancy_rate: 0,
    asset_count: 0,
    monthly_income: 0,
    annual_return: 0,
    portfolio_growth: 0
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof InvestorAsset>('roi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and Sort
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        asset =>
          asset.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filters
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }
    if (filterLocation !== 'all') {
      filtered = filtered.filter(asset => asset.city === filterLocation);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return filtered;
  }, [assets, searchTerm, filterType, filterStatus, filterLocation, sortBy, sortOrder]);

  const locations = useMemo(() => {
    return Array.from(new Set(assets.map(a => a.city)));
  }, [assets]);

  const handleSort = (field: keyof InvestorAsset) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      vermietet: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      leer: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      renovierung: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      verkauf: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return badges[status as keyof typeof badges] || '';
  };

  const getTypeName = (type: string) => {
    const names = {
      wohnung: 'Wohnung',
      haus: 'Haus',
      gewerbe: 'Gewerbe',
      grundstück: 'Grundstück'
    };
    return names[type as keyof typeof names] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Portfolio-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error?.message || 'Ein Fehler ist aufgetreten'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(kpis?.total_value || 0)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {kpis?.asset_count || 0} Immobilien
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Ø ROI</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {kpis?.average_roi?.toFixed(2) || 0}%
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +0.8% vs. Vormonat
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Cashflow</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(kpis?.total_cashflow || 0)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pro Monat
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-3 rounded-xl ${
              (kpis?.vacancy_rate || 0) < 5
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : (kpis?.vacancy_rate || 0) < 10
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Leerstand</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {kpis?.vacancy_rate?.toFixed(1) || 0}%
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {Math.round((kpis?.vacancy_rate || 0) / 100 * (kpis?.asset_count || 0))} Einheiten
            </p>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Adresse oder Stadt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">Alle Typen</option>
              <option value="wohnung">Wohnung</option>
              <option value="haus">Haus</option>
              <option value="gewerbe">Gewerbe</option>
              <option value="grundstück">Grundstück</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">Alle Status</option>
              <option value="vermietet">Vermietet</option>
              <option value="leer">Leer</option>
              <option value="renovierung">Renovierung</option>
            </select>

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">Alle Standorte</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          {filteredAssets.length} von {assets.length} Immobilien
        </div>
      </motion.div>

      {/* Assets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Immobilie
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Typ
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                  onClick={() => handleSort('sqm')}
                >
                  Größe {sortBy === 'sqm' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                  onClick={() => handleSort('value')}
                >
                  Wert {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                  onClick={() => handleSort('roi')}
                >
                  ROI {sortBy === 'roi' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                  onClick={() => handleSort('cashflow')}
                >
                  Cashflow {sortBy === 'cashflow' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAssets.map((asset, index) => (
                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {asset.address}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {asset.city}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {getTypeName(asset.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {asset.sqm} m²
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${
                      asset.roi >= 6 ? 'text-green-600 dark:text-green-400' :
                      asset.roi >= 4 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {asset.roi.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      asset.cashflow > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(asset.cashflow)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(asset.status)}`}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Immobilien gefunden
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PortfolioView;
