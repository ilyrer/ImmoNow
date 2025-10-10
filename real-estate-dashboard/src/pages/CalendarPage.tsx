import React from 'react';
import CalendarDashboard from '../components/Calendar/CalendarDashboard';

export const CalendarPage: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Kalender</h1>
          <p className="text-gray-600 dark:text-gray-400">Verwalten Sie Ihre Termine, Besichtigungen und wichtige Fristen</p>
        </div>
      </div>
      
      <div className="p-6">
        <CalendarDashboard />
      </div>
    </div>
  );
};

export default CalendarPage;
