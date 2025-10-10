import React, { useState } from 'react';
import {
  useProjectOverview,
  useTaskOverview,
  useTeamOverview,
  usePropertyOverview,
  useDeadlineOverview,
  useActivityStats,
  usePerformanceOverview,
} from '../../api/hooks';

const DashboardExample: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Daten von verschiedenen Endpunkten abrufen
  const { data: projectOverview, isLoading: projectsLoading, error: projectsError } = useProjectOverview();
  const { data: taskOverview, isLoading: tasksLoading, error: tasksError } = useTaskOverview();
  const { data: teamOverview, isLoading: teamsLoading, error: teamsError } = useTeamOverview();
  const { data: propertyOverview, isLoading: propertiesLoading, error: propertiesError } = usePropertyOverview();
  const { data: deadlineOverview, isLoading: deadlinesLoading, error: deadlinesError } = useDeadlineOverview();
  const { data: activityStats, isLoading: activitiesLoading, error: activitiesError } = useActivityStats();
  const { data: performanceOverview, isLoading: performanceLoading, error: performanceError } = usePerformanceOverview();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isLoading = projectsLoading || tasksLoading || teamsLoading || propertiesLoading || deadlinesLoading || activitiesLoading || performanceLoading;

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
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            {isLoading ? (
              <div className="mt-1 text-3xl font-semibold text-gray-400">Laden...</div>
            ) : error ? (
              <div className="mt-1 text-sm text-red-600">Fehler beim Laden</div>
            ) : (
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
            )}
            {subtitle && !isLoading && !error && (
              <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Real Estate Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Verbunden mit Backend auf localhost:8000
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Übersicht</h3>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Projekte gesamt"
              value={projectOverview?.total_projects || 0}
              subtitle={`${projectOverview?.active_projects || 0} aktiv`}
              isLoading={projectsLoading}
              error={projectsError}
            />
            <StatCard
              title="Aufgaben gesamt"
              value={taskOverview?.total_tasks || 0}
              subtitle={`${taskOverview?.overdue_tasks || 0} überfällig`}
              isLoading={tasksLoading}
              error={tasksError}
            />
            <StatCard
              title="Teams"
              value={Array.isArray(teamOverview) ? teamOverview.length : 0}
              isLoading={teamsLoading}
              error={teamsError}
            />
            <StatCard
              title="Immobilien"
              value={propertyOverview?.total_properties || 0}
              subtitle={`Ø ${propertyOverview?.average_price?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}`}
              isLoading={propertiesLoading}
              error={propertiesError}
            />
          </dl>
        </div>

        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Termine & Performance</h3>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Anstehende Termine"
              value={deadlineOverview?.upcoming_deadlines || 0}
              subtitle={`${deadlineOverview?.overdue_deadlines || 0} überfällig`}
              isLoading={deadlinesLoading}
              error={deadlinesError}
            />
            <StatCard
              title="Aktivitäten heute"
              value={activityStats?.activities_today || 0}
              subtitle={`${activityStats?.activities_this_week || 0} diese Woche`}
              isLoading={activitiesLoading}
              error={activitiesError}
            />
            <StatCard
              title="Performance-Metriken"
              value={performanceOverview?.total_metrics || 0}
              subtitle={`${performanceOverview?.metrics_above_target || 0} über Ziel`}
              isLoading={performanceLoading}
              error={performanceError}
            />
          </dl>
        </div>

        {/* Debug-Bereich */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Debug-Informationen</h3>
          <div className="mt-5 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">API-Endpunkt Status:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${projectsError ? 'bg-red-500' : projectsLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Projekte: {projectsError ? 'Fehler' : projectsLoading ? 'Laden...' : 'OK'}
              </div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${tasksError ? 'bg-red-500' : tasksLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Aufgaben: {tasksError ? 'Fehler' : tasksLoading ? 'Laden...' : 'OK'}
              </div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${teamsError ? 'bg-red-500' : teamsLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Teams: {teamsError ? 'Fehler' : teamsLoading ? 'Laden...' : 'OK'}
              </div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${propertiesError ? 'bg-red-500' : propertiesLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Immobilien: {propertiesError ? 'Fehler' : propertiesLoading ? 'Laden...' : 'OK'}
              </div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${deadlinesError ? 'bg-red-500' : deadlinesLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Termine: {deadlinesError ? 'Fehler' : deadlinesLoading ? 'Laden...' : 'OK'}
              </div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${activitiesError ? 'bg-red-500' : activitiesLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                Aktivitäten: {activitiesError ? 'Fehler' : activitiesLoading ? 'Laden...' : 'OK'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardExample; 
