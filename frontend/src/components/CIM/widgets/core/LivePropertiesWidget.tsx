import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';
import { useProperties } from '../../../../hooks/useApi';
import { Property } from '../../../../types/api';

const LivePropertiesWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: properties, isLoading, error } = useProperties();

  // Debug-Logging für properties-Daten
  console.log('🏠 LivePropertiesWidget - Debug Info:', {
    properties,
    isArray: Array.isArray(properties),
    type: typeof properties,
    length: Array.isArray(properties) ? properties.length : 0,
    isLoading,
    error
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Immobilien</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live Immobiliendaten</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Home className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Immobilien</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fehler beim Laden</p>
            </div>
          </div>
        </div>
        <div className="text-center text-red-600 dark:text-red-400">
          Fehler beim Laden der Immobiliendaten
        </div>
      </div>
    );
  }

  // Safely handle properties data - it's an array of Property objects
  const propertiesArray: Property[] = Array.isArray(properties) ? properties : [];

  // Debug processed array
  console.log('🏠 LivePropertiesWidget - Processed Array:', {
    propertiesArray,
    length: propertiesArray.length,
    firstItem: propertiesArray[0]
  });

  // Get display properties (limit to 5)
  const displayProperties = propertiesArray && propertiesArray.length > 0 
    ? propertiesArray
        .filter((p: Property) => p && p.id) // Only valid properties
        .slice(0, 5)
    : [];

  // Calculate stats with proper typing
  const totalProperties = propertiesArray?.length || 0;
  const activeProperties = propertiesArray?.filter((p: Property) => p.status === 'aktiv').length || 0;
  const totalValue = propertiesArray?.reduce((sum: number, property: Property) => sum + (property.price || 0), 0) || 0;
  const averagePrice = totalProperties > 0 ? totalValue / totalProperties : 0;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aktiv':
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'verkauft':
      case 'sold':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'reserviert':
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Aktiv';
      case 'sold':
        return 'Verkauft';
      case 'reserved':
        return 'Reserviert';
      case 'pending':
        return 'Ausstehend';
      default:
        return status || 'Unbekannt';
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'house':
      case 'haus':
        return <Home className="h-4 w-4" />;
      case 'apartment':
      case 'wohnung':
        return <Home className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Immobilien</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Live Immobiliendaten</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/immobilien')}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Alle anzeigen →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProperties}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeProperties}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Aktiv</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalValue > 0 ? `€${(totalValue / 1000000).toFixed(1)}M` : '€0'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtwert</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {averagePrice > 0 ? `€${(averagePrice / 1000).toFixed(0)}K` : '€0'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ø Preis</p>
        </div>
      </div>

      {/* Property List */}
      {displayProperties.length > 0 ? (
        <div className="space-y-4">
          {displayProperties.map((property: Property, index: number) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigate(`/immobilien/${property.id}`)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  {getPropertyTypeIcon(property.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white truncate max-w-48">
                    {property.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate max-w-32">{property.location}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  €{property.price?.toLocaleString('de-DE') || 'N/A'}
                </p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {getStatusText(property.status)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Immobilien derzeit
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Es sind noch keine Immobiliendaten vom Backend verfügbar.
          </p>
          <button
            onClick={() => navigate('/immobilien')}
            className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Immobilien verwalten →
          </button>
        </div>
      )}

      {/* Live Status */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live-Daten</span>
          </div>
          <span>Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};

export default LivePropertiesWidget; 
