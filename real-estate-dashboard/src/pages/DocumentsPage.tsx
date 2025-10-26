/**
 * Main Documents Page - Enterprise Document Management
 * Modernisiertes Dokumentenmanagement mit Glasmorphismus-Design
 */

import React from 'react';
import { motion } from 'framer-motion';
import ModernDocumentDashboard from '../components/documents/ModernDocumentDashboard';
import { useDocumentAnalytics } from '../api/hooks';
import '../styles/glass-morphism.css';

const DocumentsPage: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useDocumentAnalytics();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section with Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Glass Header */}
        <div className="relative glass-sidebar border-b border-white/20 dark:border-gray-700/30">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Dokumente
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Verwalten Sie Ihre Dokumente professionell und effizient
                </p>
              </motion.div>
              
                      {/* Quick Stats */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hidden md:flex items-center space-x-6"
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analyticsLoading ? '...' : analytics?.total_documents || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Dokumente</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {analyticsLoading ? '...' : analytics ? formatFileSize(analytics.total_size) : '0 MB'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Speicher</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {analyticsLoading ? '...' : analytics ? Math.round((analytics.total_size || 0) / 1024 / 1024 / 1024 * 100) : 0}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Verfügbar</div>
                        </div>
                      </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content with Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex-1 overflow-hidden"
      >
        <div className="h-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card p-6 h-full">
            <ModernDocumentDashboard 
              showAnalytics={true}
              className="h-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentsPage;
