/**
 * Marketplace View - Investor Module
 * Internal marketplace for property packages and investment opportunities
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  TrendingUp,
  DollarSign,
  Building2,
  X,
  Filter,
  Search,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
// TODO: Implement real investor marketplace API hooks
import { MarketplacePackage } from '../../types/investor';

const MarketplaceView: React.FC = () => {
  // TODO: Implement real investor marketplace API hooks
  const packages = [];
  const loading = false;
  const error = null;
  const reservePackage = (id: string) => {
    console.log('Reserving package:', id);
    return Promise.resolve();
  };
  const createListing = () => Promise.resolve();
  const [selectedPackage, setSelectedPackage] = useState<MarketplacePackage | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [roiRange, setRoiRange] = useState<[number, number]>([0, 15]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      // Search
      if (searchTerm && !pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !pkg.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status
      if (filterStatus !== 'all' && pkg.status !== filterStatus) {
        return false;
      }
      
      // Location
      if (filterLocation !== 'all' && pkg.city !== filterLocation) {
        return false;
      }
      
      // Price range
      if (pkg.price < priceRange[0] || pkg.price > priceRange[1]) {
        return false;
      }
      
      // ROI range
      if (pkg.roi < roiRange[0] || pkg.roi > roiRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [packages, searchTerm, filterStatus, filterLocation, priceRange, roiRange]);

  const locations = useMemo(() => {
    return Array.from(new Set(packages.map(p => p.city)));
  }, [packages]);

  const handleViewDetails = (pkg: MarketplacePackage) => {
    setSelectedPackage(pkg);
    setShowDrawer(true);
  };

  const handleReserve = async (id: string) => {
    await reservePackage(id);
    if (selectedPackage?.id === id) {
      setSelectedPackage({ ...selectedPackage, status: 'reserved' });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      sold: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return badges[status as keyof typeof badges] || '';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Verfügbar',
      reserved: 'Reserviert',
      sold: 'Verkauft'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Marktplatz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interner Marktplatz
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Investmentpakete und Immobilienportfolios
          </p>
        </div>
        <button
          onClick={() => alert('Anbieten-Dialog (Mock)')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          Paket anbieten
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Titel oder Standort..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">Alle Status</option>
            <option value="available">Verfügbar</option>
            <option value="reserved">Reserviert</option>
            <option value="sold">Verkauft</option>
          </select>

          {/* Location Filter */}
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
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          {filteredPackages.length} von {packages.length} Paketen
        </div>
      </motion.div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
            onClick={() => handleViewDetails(pkg)}
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={pkg.images[0]}
                alt={pkg.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pkg.status)}`}>
                  {getStatusLabel(pkg.status)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {pkg.title}
              </h3>
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                {pkg.location}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Objekte</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {pkg.objects}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {pkg.roi.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Preis</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(pkg.price)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(pkg);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPackages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-gray-700/50 shadow-lg text-center"
        >
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Keine Pakete gefunden
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Passen Sie die Filter an oder durchsuchen Sie alle Angebote
          </p>
        </motion.div>
      )}

      {/* Details Drawer */}
      <AnimatePresence>
        {showDrawer && selectedPackage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowDrawer(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Paket-Details
                </h2>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Images Gallery */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedPackage.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${selectedPackage.title} ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ))}
                </div>

                {/* Title and Status */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedPackage.title}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(selectedPackage.status)}`}>
                    {getStatusLabel(selectedPackage.status)}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Beschreibung
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedPackage.description}
                  </p>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Preis</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedPackage.price)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">ROI</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedPackage.roi.toFixed(2)}%
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                      <Building2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Objekte</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedPackage.objects}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium">Gesamt-Fläche</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(selectedPackage.totalSqm)} m²
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Weitere Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Standort:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedPackage.location}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Verkäufer:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedPackage.seller}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Durchschn. Miete:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(selectedPackage.details.avgRent)}/Monat
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Auslastung:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedPackage.details.occupancyRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Baujahr:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedPackage.details.yearBuilt}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Zustand:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedPackage.details.condition}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Inseriert am:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedPackage.listedDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {selectedPackage.status === 'available' && (
                  <button
                    onClick={() => handleReserve(selectedPackage.id)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Paket reservieren
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketplaceView;
