import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface HRData {
  activeEmployees: number;
  pendingLeaveRequests: number;
  weeklyOvertime: number;
  openExpenses: number;
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
    status: string;
  }>;
}

const HROverviewWidget: React.FC = () => {
  const [hrData, setHrData] = useState<HRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch HR stats
        const response = await fetch('/api/v1/hr/stats');
        const data = await response.json();

        console.log('📊 HR Stats Response:', data);

        setHrData({
          activeEmployees: data.active_employees || 0,
          pendingLeaveRequests: data.pending_leave_requests || 0,
          weeklyOvertime: data.weekly_overtime || 0,
          openExpenses: data.open_expenses || 0,
          recentActivities: (data.recent_activities || []).map((activity: any) => ({
            type: activity.type || 'unknown',
            description: activity.description || 'Unbekannte Aktivität',
            date: activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : 'Unbekannt',
            status: activity.status || 'pending'
          }))
        });

      } catch (error) {
        console.error('❌ Error fetching HR data:', error);
        // Fallback data
        setHrData({
          activeEmployees: 0,
          pendingLeaveRequests: 0,
          weeklyOvertime: 0,
          openExpenses: 0,
          recentActivities: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHRData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchHRData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt HR-Daten...</p>
        </div>
      </div>
    );
  }

  if (!hrData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine HR-Daten verfügbar</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Aktive Mitarbeiter',
      value: hrData.activeEmployees,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Offene Urlaubsanträge',
      value: hrData.pendingLeaveRequests,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Überstunden diese Woche',
      value: `${hrData.weeklyOvertime}h`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Offene Spesen',
      value: `€${hrData.openExpenses}`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          HR Übersicht
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          HR-Verwaltung
        </button>
      </div>

      {/* Metriken Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className={`p-3 rounded-lg ${metric.bgColor}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={metric.color}>
                {metric.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </span>
            </div>
            <div className={`text-lg font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
          <div className="flex items-center space-x-1">
            {hrData.pendingLeaveRequests > 0 || hrData.openExpenses > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Aufmerksamkeit erforderlich</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">Alles in Ordnung</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Neueste Aktivitäten */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Neueste Aktivitäten
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {hrData.recentActivities.slice(0, 3).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'approved' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.type} • {activity.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Calendar className="w-3 h-3" />
          <span>Urlaub</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <DollarSign className="w-3 h-3" />
          <span>Spesen</span>
        </button>
      </div>
    </div>
  );
};

export default HROverviewWidget;
