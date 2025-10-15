/**
 * Document Analytics Dashboard
 * Statistiken und Analysen für das Dokumentenmanagement
 */

import React, { useMemo } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  EyeIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import { Document, DocumentAnalytics } from '../../types/document';

interface DocumentAnalyticsDashboardProps {
  analytics: DocumentAnalytics;
  documents: Document[];
  className?: string;
}

const DocumentAnalyticsDashboard: React.FC<DocumentAnalyticsDashboardProps> = ({
  analytics,
  documents = [],
  className = '',
}) => {
  // Ensure analytics has default values
  const safeAnalytics = {
    totalDocuments: analytics?.totalDocuments ?? 0,
    totalFolders: analytics?.totalFolders ?? 0,
    totalViews: analytics?.totalViews ?? 0,
    viewsThisMonth: analytics?.viewsThisMonth ?? 0,
    favoriteDocuments: analytics?.favoriteDocuments ?? 0,
    sharedDocuments: analytics?.sharedDocuments ?? 0,
    storageUsed: analytics?.storageUsed ?? 0,
  };

  // Calculate additional metrics from documents
  const calculatedMetrics = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthDocs = documents.filter(doc => 
      new Date(doc.createdAt || doc.uploadedAt) >= thisMonth
    ).length;
    
    const lastMonthDocs = documents.filter(doc => 
      new Date(doc.createdAt || doc.uploadedAt) >= lastMonth && 
      new Date(doc.createdAt || doc.uploadedAt) < thisMonth
    ).length;

    const expiredDocs = documents.filter(doc => 
      doc.expiryDate && new Date(doc.expiryDate) < now
    ).length;

    const expiringDocs = documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow;
    }).length;

    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    
    const typeDistribution = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const growthRate = lastMonthDocs > 0 
      ? ((thisMonthDocs - lastMonthDocs) / lastMonthDocs * 100)
      : thisMonthDocs > 0 ? 100 : 0;

    return {
      thisMonthDocs,
      lastMonthDocs,
      expiredDocs,
      expiringDocs,
      totalSize,
      typeDistribution,
      growthRate,
    };
  }, [documents]);

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      contract: 'Verträge',
      expose: 'Exposés',
      energy_certificate: 'Energieausweise',
      floor_plan: 'Grundrisse',
      photo: 'Fotos',
      video: 'Videos',
      document: 'Dokumente',
      presentation: 'Präsentationen',
      spreadsheet: 'Tabellen',
      pdf: 'PDFs',
      other: 'Sonstiges',
    };
    return typeLabels[type] || type;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamte Dokumente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(safeAnalytics.totalDocuments)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                +{calculatedMetrics.thisMonthDocs} diesen Monat
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Folders */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ordner</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeAnalytics.totalFolders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organisation
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <FolderIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Speicher genutzt</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(calculatedMetrics.totalSize)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {safeAnalytics.storageUsed > 0 ? `von ${formatFileSize(safeAnalytics.storageUsed)}` : 'Unbegrenzt'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <CloudArrowUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aufrufe gesamt</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(safeAnalytics.totalViews)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {safeAnalytics.totalViews} gesamt
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <EyeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aktivität
            </h3>
            <ChartBarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Diesen Monat hochgeladen
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {calculatedMetrics.thisMonthDocs}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Wachstumsrate
              </span>
              <span className={`font-semibold ${calculatedMetrics.growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {calculatedMetrics.growthRate >= 0 ? '+' : ''}{calculatedMetrics.growthRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Favorisierte Dokumente
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {safeAnalytics.favoriteDocuments}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Geteilte Dokumente
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {safeAnalytics.sharedDocuments}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Warnungen
            </h3>
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {calculatedMetrics.expiredDocs > 0 && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {calculatedMetrics.expiredDocs} abgelaufene Dokumente
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Prüfung erforderlich
                  </p>
                </div>
              </div>
            )}

            {calculatedMetrics.expiringDocs > 0 && (
              <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <CalendarDaysIcon className="w-5 h-5 text-amber-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    {calculatedMetrics.expiringDocs} Dokumente laufen bald ab
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Innerhalb der nächsten 30 Tage
                  </p>
                </div>
              </div>
            )}

            {calculatedMetrics.expiredDocs === 0 && calculatedMetrics.expiringDocs === 0 && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <HeartIcon className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Alle Dokumente aktuell
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Keine Warnungen
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Type Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dokumenttypen
          </h3>
          <ChartBarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>

        <div className="space-y-3">
          {Object.entries(calculatedMetrics.typeDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([type, count]) => {
              const percentage = safeAnalytics.totalDocuments > 0 ? (count / safeAnalytics.totalDocuments) * 100 : 0;
              return (
                <div key={type} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getTypeLabel(type)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {count}
                  </div>
                  <div className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
        </div>

        {Object.keys(calculatedMetrics.typeDistribution).length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Keine Daten verfügbar</p>
          </div>
        )}
      </div>

      {/* Top Performers */}
      {documents && documents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Neueste Dokumente
            </h3>
            <EyeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>

          <div className="space-y-3">
            {documents.slice(0, 5).map((doc: any, index: number) => (
              <div key={doc.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getTypeLabel(doc.type)}
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {doc.views || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalyticsDashboard;
