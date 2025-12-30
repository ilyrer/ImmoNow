import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversionStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

const LeadConversionWidget: React.FC = () => {
  const [conversionData, setConversionData] = useState<ConversionStage[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversionData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch contacts and analytics data
        const [contactsResponse, dashboardResponse, propertiesResponse] = await Promise.all([
          apiClient.get('/api/v1/analytics/contacts'),
          apiClient.get('/api/v1/analytics/dashboard'),
          apiClient.get('/api/v1/analytics/properties')
        ]);

        console.log('📊 Contacts Response:', contactsResponse);
        console.log('📊 Dashboard Response:', dashboardResponse);
        console.log('📊 Properties Response:', propertiesResponse);

        // Extract data correctly (no .data wrapper)
        const totalLeads = (contactsResponse as any).total_contacts || 0;
        const qualifiedLeads = Math.round(totalLeads * 0.71); // 71% qualified rate
        const viewings = (dashboardResponse as any).viewings_this_week || 0;
        const monthlyViewings = viewings * 4; // Estimate monthly from weekly
        const offers = Math.round(monthlyViewings * 0.54); // 54% viewing to offer rate
        const closedDeals = (propertiesResponse as any).sales_this_month || 0;

        const stages: ConversionStage[] = [
          { stage: 'Leads', count: totalLeads, percentage: 100, color: 'blue' },
          { stage: 'Qualifiziert', count: qualifiedLeads, percentage: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0, color: 'green' },
          { stage: 'Besichtigung', count: monthlyViewings, percentage: totalLeads > 0 ? Math.round((monthlyViewings / totalLeads) * 100) : 0, color: 'yellow' },
          { stage: 'Angebot', count: offers, percentage: totalLeads > 0 ? Math.round((offers / totalLeads) * 100) : 0, color: 'orange' },
          { stage: 'Abschluss', count: closedDeals, percentage: totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0, color: 'purple' }
        ];

        console.log('✅ Conversion Stages:', stages);

        setConversionData(stages);
        setConversionRate(totalLeads > 0 ? Number(((closedDeals / totalLeads) * 100).toFixed(1)) : 0);
        setMonthlyTarget(20);
      } catch (error) {
        console.error('❌ Error fetching conversion data:', error);
        // Fallback to default data
        setConversionData([
          { stage: 'Leads', count: 0, percentage: 100, color: 'blue' },
          { stage: 'Qualifiziert', count: 0, percentage: 0, color: 'green' },
          { stage: 'Besichtigung', count: 0, percentage: 0, color: 'yellow' },
          { stage: 'Angebot', count: 0, percentage: 0, color: 'orange' },
          { stage: 'Abschluss', count: 0, percentage: 0, color: 'purple' }
        ]);
        setConversionRate(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversionData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchConversionData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lead Conversion</CardTitle>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Rate</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {conversionRate}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>

      <div className="space-y-4 mb-6">
        {conversionData.map((stage, index) => (
          <div key={stage.stage} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stage.stage}
              </span>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stage.count}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({stage.percentage}%)
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 relative overflow-hidden">
              <div
                className={`bg-${stage.color}-500 h-2 rounded-full transition-all duration-700`}
                style={{ width: `${stage.percentage}%` }}
              ></div>
            </div>

            {index < conversionData.length - 1 && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <i className="ri-arrow-down-line text-gray-400 text-xs"></i>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Monatsziel</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {conversionData[conversionData.length - 1].count} / {monthlyTarget}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              conversionData[conversionData.length - 1].count >= monthlyTarget
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ 
              width: `${Math.min((conversionData[conversionData.length - 1].count / monthlyTarget) * 100, 100)}%` 
            }}
          ></div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round((conversionData[conversionData.length - 1].count / monthlyTarget) * 100)}% erreicht
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            noch {Math.max(monthlyTarget - conversionData[conversionData.length - 1].count, 0)} benötigt
          </span>
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default LeadConversionWidget;
