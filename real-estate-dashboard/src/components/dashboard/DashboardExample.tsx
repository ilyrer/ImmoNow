import React, { useState } from 'react';
import { useDashboardAnalytics, useProperties, useTasks } from '../../api/hooks';

const DashboardExample: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Daten von verschiedenen Endpunkten abrufen
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isLoading = analyticsLoading || propertiesLoading || tasksLoading;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    isLoading?: boolean;
    error?: any;
  }> = ({ title, value, subtitle, isLoading, error }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">📊</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : error ? 'Fehler' : value}
                </div>
                {subtitle && (
                  <div className="ml-2 text-sm text-gray-500">{subtitle}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Example</h1>
            <p className="mt-2 text-gray-600">
              Beispiel-Komponente für API-Integration mit React Query
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Übersicht</h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Immobilien gesamt"
            value={analytics?.total_properties || 0}
            subtitle={`${analytics?.active_properties || 0} aktiv`}
            isLoading={analyticsLoading}
            error={null}
          />
          <StatCard
            title="Aufgaben gesamt"
            value={analytics?.total_tasks || 0}
            subtitle={`${analytics?.completed_tasks || 0} erledigt`}
            isLoading={analyticsLoading}
            error={null}
          />
          <StatCard
            title="Kontakte gesamt"
            value={analytics?.total_contacts || 0}
            subtitle={`${analytics?.total_contacts || 0} insgesamt`}
            isLoading={analyticsLoading}
            error={null}
          />
          <StatCard
            title="Dokumente gesamt"
            value={analytics?.total_documents || 0}
            subtitle={`${analytics?.total_documents || 0} verfügbar`}
            isLoading={analyticsLoading}
            error={null}
          />
        </dl>
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Status</h3>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">API Status</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${analyticsLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Analytics: {analyticsLoading ? 'Laden...' : 'OK'}
              </div>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${propertiesLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Properties: {propertiesLoading ? 'Laden...' : 'OK'}
              </div>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${tasksLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Tasks: {tasksLoading ? 'Laden...' : 'OK'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardExample;