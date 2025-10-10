/**
 * ExposeVersionList Component
 * 
 * List of saved exposé versions with actions.
 * Shows version history, quality, and allows selection, deletion, and publishing.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader
} from 'lucide-react';
import { ExposeVersion, ExposeQuality } from '../../types/expose';

interface ExposeVersionListProps {
  versions: ExposeVersion[];
  isLoading: boolean;
  onSelect: (version: ExposeVersion) => void;
  onDelete: (versionId: string) => void;
  onPublish: (versionId: string) => void;
}

const ExposeVersionList: React.FC<ExposeVersionListProps> = ({
  versions,
  isLoading,
  onSelect,
  onDelete,
  onPublish
}) => {
  const getQualityColor = (quality: ExposeQuality) => {
    switch (quality) {
      case 'high': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'med': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
  };

  const getQualityText = (quality: ExposeQuality) => {
    switch (quality) {
      case 'high': return 'Hervorragend';
      case 'med': return 'Gut';
      case 'low': return 'Verbesserungswürdig';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays < 7) return `Vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;
    
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8">
        <div className="flex items-center justify-center">
          <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Versionen vorhanden
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Generieren Sie Ihr erstes KI-Exposé, um es hier zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gespeicherte Versionen</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{versions.length} {versions.length === 1 ? 'Version' : 'Versionen'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Versions List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {version.title}
                    </h4>
                    {version.isPublished && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Veröffentlicht
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {version.body}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(version.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {version.wordCount} Wörter
                    </div>
                    {version.seoScore && (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        SEO: {version.seoScore}/100
                      </div>
                    )}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getQualityColor(version.quality)}`}>
                      {version.quality === 'high' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {getQualityText(version.quality)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(version)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                    title="Vorschau"
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                  
                  {!version.isPublished && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPublish(version.id)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                      title="Veröffentlichen"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (window.confirm('Möchten Sie diese Version wirklich löschen?')) {
                        onDelete(version.id);
                      }
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Bullets Preview */}
              {version.bullets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {version.bullets.slice(0, 4).map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="line-clamp-1">{bullet}</span>
                      </div>
                    ))}
                    {version.bullets.length > 4 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                        +{version.bullets.length - 4} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExposeVersionList;
