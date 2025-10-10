/**
 * Main Documents Page - Neue Dokumentenverwaltung
 * Ersetzt das alte DocumentManager System komplett
 */

import React from 'react';
import ModernDocumentDashboard from '../components/documents/ModernDocumentDashboard';

const DocumentsPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dokumente
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Verwalten Sie Ihre Dokumente professionell und effizient
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 sm:px-6 lg:px-8 py-6">
          <ModernDocumentDashboard 
            showAnalytics={true}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
