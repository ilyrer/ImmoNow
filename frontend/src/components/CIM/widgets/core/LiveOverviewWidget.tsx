import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface LiveAnalytics {
  totalProperties: number;
  activeListings: number;
  totalRevenue: number;
  newLeads: number;
  monthly_sales: number;
  viewings: number;
  new_inquiries: number;
  conversion_rate: number;
  revenue_current_month: number;
  revenue_target: number;
}

const LiveOverviewWidget: React.FC = () => {
  const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch data from multiple endpoints
        const [dashboardData, propertiesData, contactsData] = await Promise.all([
          apiClient.get('/api/v1/analytics/dashboard'),
          apiClient.get('/api/v1/analytics/properties'),
          apiClient.get('/api/v1/analytics/contacts'),
        ]);

        console.log('📊 Dashboard Data:', dashboardData);
        console.log('🏠 Properties Data:', propertiesData);
        console.log('👥 Contacts Data:', contactsData);

        // Map backend data to display format - use correct field names
        const liveData: LiveAnalytics = {
          totalProperties: (propertiesData as any).total_properties || 0,
          activeListings: (propertiesData as any).active_listings || 0,
          totalRevenue: (dashboardData as any).total_revenue || 0,
          newLeads: (contactsData as any).new_contacts_this_month || 0,
          monthly_sales: (propertiesData as any).sales_this_month || 0,
          viewings: (dashboardData as any).viewings_this_week || 0,
          new_inquiries: (contactsData as any).new_inquiries_this_week || 0,
          conversion_rate: Math.round((contactsData as any).conversion_rate || 0),
          revenue_current_month: (dashboardData as any).revenue_current_month || 0,
          revenue_target: (dashboardData as any).revenue_target || 120000,
        };

        console.log('✅ Mapped Live Data:', liveData);
        setAnalytics(liveData);
      } catch (err) {
        console.error('❌ Error fetching live analytics:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();

    // Refresh data every 30 seconds for live updates
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use analytics data or fallback to empty data
  const displayData = analytics || {
    totalProperties: 0,
    activeListings: 0,
    totalRevenue: 0,
    newLeads: 0,
    monthly_sales: 0,
    viewings: 0,
    new_inquiries: 0,
    conversion_rate: 0,
    revenue_current_month: 0,
    revenue_target: 0
  };

  if (error) {
    const errorMessage = (error as any)?.message || 'Unbekannter Fehler';
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Fehler beim Laden der Statistiken</p>
            <p className="text-xs mt-1">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Seite neu laden
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Übersicht</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>

      <div className="grid grid-cols-2 gap-4">
        {/* Immobilien */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Immobilien</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {displayData.totalProperties}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-home-line text-white text-sm"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {displayData.activeListings} aktiv
            </span>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Neue Leads</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {displayData.newLeads}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-user-add-line text-white text-sm"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600 dark:text-green-400">
              {displayData.new_inquiries} Anfragen
            </span>
          </div>
        </div>

        {/* Verkäufe */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Verkäufe</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {displayData.monthly_sales}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-trending-up-line text-white text-sm"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-purple-600 dark:text-purple-400">
              {displayData.conversion_rate}% Konversion
            </span>
          </div>
        </div>

        {/* Besichtigungen */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Besichtigungen</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {displayData.viewings}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-white text-sm"></i>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-orange-600 dark:text-orange-400">
              Diese Woche
            </span>
          </div>
        </div>
      </div>

      {/* Umsatz */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Umsatz</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {displayData.revenue_current_month.toLocaleString('de-DE')}€
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ziel</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {displayData.revenue_target.toLocaleString('de-DE')}€
            </p>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (displayData.revenue_current_month / displayData.revenue_target) * 100)}%` 
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((displayData.revenue_current_month / displayData.revenue_target) * 100)}% des Ziels erreicht
          </p>
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default LiveOverviewWidget;
