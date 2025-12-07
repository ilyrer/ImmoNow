import React from 'react';
import KPIModule from './modules/KPIModule';

const CIMKPI: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Glasmorphism Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="fixed inset-0 backdrop-blur-3xl" />
      
      <div className="relative z-10 p-6">
        <KPIModule />
      </div>
    </div>
  );
};

export default CIMKPI;
