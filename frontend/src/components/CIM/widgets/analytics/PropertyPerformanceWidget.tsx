import React, { useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';

interface PropertyMetrics {
  views: number;
  inquiries: number;
  visits: number;
  favorites: number;
  daysOnMarket: number;
  conversionRate: number;
  averageViewDuration: number;
}

interface PropertyPerformance {
  id: number;
  title: string;
  location: string;
  price: number;
  views: number;
  inquiries: number;
  status: string;
  type?: string;
  daysOnMarket?: number;
  conversionRate?: number;
}

interface PropertyAnalytics {
  total_properties: number;
  avg_views: number;
  avg_inquiries: number;
  conversion_rate: number;
  top_performing?: PropertyPerformance[];
}

const PropertyPerformanceWidget: React.FC = () => {
  const [properties, setProperties] = useState<PropertyPerformance[]>([]);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch properties list
        const propertiesRes = await apiClient.get('/api/v1/properties?page=1&size=10');
        console.log('🏠 Properties List:', propertiesRes);

        const propertiesData = (propertiesRes as any)?.items || (propertiesRes as any)?.properties || [];

        if (propertiesData.length === 0) {
          setProperties([]);
          setAnalytics({
            total_properties: 0,
            avg_views: 0,
            avg_inquiries: 0,
            conversion_rate: 0,
            top_performing: []
          });
          return;
        }

        // Fetch metrics for each property (max 5 for performance)
        const propertiesToFetch = propertiesData.slice(0, 5);
        const metricsPromises = propertiesToFetch.map(async (prop: any) => {
          try {
            const metrics = await apiClient.get(`/api/v1/properties/${prop.id}/metrics`) as PropertyMetrics;
            return {
              id: prop.id,
              title: prop.title || 'Immobilie',
              location: prop.location || prop.city || 'Unbekannt',
              price: prop.price || 0,
              views: metrics.views || 0,
              inquiries: metrics.inquiries || 0,
              status: prop.status || 'active',
              type: prop.property_type,
              daysOnMarket: metrics.daysOnMarket || 0,
              conversionRate: metrics.conversionRate || 0
            };
          } catch (err) {
            console.warn(`Failed to fetch metrics for property ${prop.id}:`, err);
            return {
              id: prop.id,
              title: prop.title || 'Immobilie',
              location: prop.location || prop.city || 'Unbekannt',
              price: prop.price || 0,
              views: 0,
              inquiries: 0,
              status: prop.status || 'active',
              type: prop.property_type,
              daysOnMarket: 0,
              conversionRate: 0
            };
          }
        });

        const propertiesWithMetrics = await Promise.all(metricsPromises);

        // Sort by views (highest first) and take top 3
        const sortedProperties = propertiesWithMetrics
          .sort((a, b) => (b.views + b.inquiries * 5) - (a.views + a.inquiries * 5))
          .slice(0, 3);

        console.log('✅ Top Properties with Live Metrics:', sortedProperties);

        // Calculate averages from actual data
        const totalViews = propertiesWithMetrics.reduce((sum, p) => sum + p.views, 0);
        const totalInquiries = propertiesWithMetrics.reduce((sum, p) => sum + p.inquiries, 0);
        const avgConversion = propertiesWithMetrics.length > 0
          ? propertiesWithMetrics.reduce((sum, p) => sum + (p.conversionRate || 0), 0) / propertiesWithMetrics.length
          : 0;

        setProperties(sortedProperties);
        setAnalytics({
          total_properties: propertiesData.length,
          avg_views: propertiesWithMetrics.length > 0 ? Math.round(totalViews / propertiesWithMetrics.length) : 0,
          avg_inquiries: propertiesWithMetrics.length > 0 ? Math.round(totalInquiries / propertiesWithMetrics.length) : 0,
          conversion_rate: avgConversion,
          top_performing: sortedProperties
        });
        setLastUpdated(new Date());
      } catch (err) {
        console.error('❌ Error fetching property performance:', err);

        if (err instanceof Error && (err.message.includes('401') || err.message.includes('Invalid token') || err.message.includes('Unauthorized'))) {
          setError('Session abgelaufen - Bitte neu anmelden');
        } else {
          setError('Fehler beim Laden der Immobilien-Performance');
        }
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 2 minutes for live data
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'aktiv': return 'green';
      case 'sold':
      case 'verkauft': return 'blue';
      case 'pending':
      case 'reserviert': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Aktiv';
      case 'aktiv': return 'Aktiv';
      case 'sold': return 'Verkauft';
      case 'verkauft': return 'Verkauft';
      case 'pending': return 'Reserviert';
      case 'reserviert': return 'Reserviert';
      default: return status || 'Unbekannt';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <i className="ri-building-line mr-2 text-blue-600 dark:text-blue-400"></i>
            Top Immobilien
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <i className="ri-building-line mr-2 text-blue-600 dark:text-blue-400"></i>
            Top Immobilien
          </h3>
        </div>
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-building-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Top Immobilien
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Alle anzeigen
        </button>
      </div>

      {properties.length > 0 ? (
        <>
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-home-4-line text-gray-500 dark:text-gray-400"></i>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {property.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {property.location}
                        </p>
                      </div>

                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        bg-${getStatusColor(property.status)}-100 
                        dark:bg-${getStatusColor(property.status)}-900/30
                        text-${getStatusColor(property.status)}-600 
                        dark:text-${getStatusColor(property.status)}-400
                      `}>
                        {getStatusText(property.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(property.price)}
                      </span>

                      <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <i className="ri-eye-line"></i>
                          <span>{property.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <i className="ri-mail-line"></i>
                          <span>{property.inquiries}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Durchschnittliche Performance
              </span>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">
                {analytics?.avg_views || 0} Aufrufe • {analytics?.avg_inquiries || 0} Anfragen
              </div>
            </div>

            <div className="flex items-center mt-2">
              <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2 mr-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                  style={{ width: `${Math.min((analytics?.conversion_rate || 0) * 10, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {(analytics?.conversion_rate || 0).toFixed(1)}% Conversion
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <i className="ri-building-line text-4xl text-gray-400 mb-4"></i>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Immobilien
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Es sind noch keine Immobilien-Daten verfügbar.
          </p>
        </div>
      )}

      {/* Live Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live-Daten</span>
          </div>
          <span>Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyPerformanceWidget;
