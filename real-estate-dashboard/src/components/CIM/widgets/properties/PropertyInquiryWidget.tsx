import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, TrendingUp, Clock, Eye } from 'lucide-react';

interface PropertyInquiryData {
  weeklyInquiries: number;
  topProperties: Array<{
    id: string;
    title: string;
    inquiries: number;
    views: number;
    price: number;
  }>;
  responseRate: number;
  avgResponseTime: number;
  recentInquiries: Array<{
    id: string;
    propertyTitle: string;
    customerName: string;
    createdAt: string;
    status: string;
  }>;
}

const PropertyInquiryWidget: React.FC = () => {
  const [inquiryData, setInquiryData] = useState<PropertyInquiryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInquiryData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch property analytics
        const response = await fetch('/api/v1/analytics/properties');
        const data = await response.json();

        console.log('📊 Property Inquiry Response:', data);

        setInquiryData({
          weeklyInquiries: data.weekly_inquiries || 0,
          topProperties: (data.top_properties || []).map((property: any) => ({
            id: property.id || '',
            title: property.title || 'Unbekannte Immobilie',
            inquiries: property.inquiries || 0,
            views: property.views || 0,
            price: property.price || 0
          })),
          responseRate: data.response_rate || 0,
          avgResponseTime: data.avg_response_time || 0,
          recentInquiries: (data.recent_inquiries || []).map((inquiry: any) => ({
            id: inquiry.id || '',
            propertyTitle: inquiry.property_title || 'Unbekannte Immobilie',
            customerName: inquiry.customer_name || 'Unbekannter Kunde',
            createdAt: inquiry.created_at || new Date().toISOString(),
            status: inquiry.status || 'new'
          }))
        });

      } catch (error) {
        console.error('❌ Error fetching inquiry data:', error);
        // Fallback data
        setInquiryData({
          weeklyInquiries: 0,
          topProperties: [],
          responseRate: 0,
          avgResponseTime: 0,
          recentInquiries: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiryData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchInquiryData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Anfrage-Daten...</p>
        </div>
      </div>
    );
  }

  if (!inquiryData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Home className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Anfrage-Daten verfügbar</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'responded':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'follow_up':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Immobilien-Anfragen
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {inquiryData.weeklyInquiries}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Diese Woche
          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Response Rate
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {inquiryData.responseRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Ø Response Zeit
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {inquiryData.avgResponseTime}h
          </div>
        </div>
      </div>

      {/* Top Properties */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Top Properties
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {inquiryData.topProperties.length > 0 ? (
            inquiryData.topProperties.slice(0, 3).map((property, index) => (
              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Home className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {property.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    €{property.price.toLocaleString('de-DE')}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{property.inquiries} Anfragen</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{property.views} Views</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine Top Properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Neueste Anfragen */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Neueste Anfragen
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {inquiryData.recentInquiries.length > 0 ? (
            inquiryData.recentInquiries.slice(0, 3).map((inquiry, index) => (
              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {inquiry.customerName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(inquiry.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {inquiry.propertyTitle}
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine neuen Anfragen</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <MessageSquare className="w-3 h-3" />
          <span>Anfragen</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Home className="w-3 h-3" />
          <span>Properties</span>
        </button>
      </div>
    </div>
  );
};

export default PropertyInquiryWidget;
