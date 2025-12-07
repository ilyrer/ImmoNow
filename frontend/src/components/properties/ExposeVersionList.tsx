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
import { ExposeVersionData } from '../../services/expose';

interface ExposeVersionListProps {
  versions: ExposeVersionData[];
  isLoading: boolean;
  onSelect: (version: ExposeVersionData) => void;
  onDelete: (versionId: string) => void;
  onPublish: (versionId: string) => void;
  onDownloadPDF?: (versionId: string) => void;
  isDeleting?: boolean;
  isPublishing?: boolean;
  isDownloadingPDF?: boolean;
}

const ExposeVersionList: React.FC<ExposeVersionListProps> = ({
  versions,
  isLoading,
  onSelect,
  onDelete,
  onPublish,
  onDownloadPDF,
  isDeleting = false,
  isPublishing = false,
  isDownloadingPDF = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'draft': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'archived': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Veröffentlicht';
      case 'draft': return 'Entwurf';
      case 'archived': return 'Archiviert';
      default: return 'Unbekannt';
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
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(version.status)}`}>
                      {version.status === 'published' && <CheckCircle className="h-3 w-3" />}
                      {version.status === 'draft' && <Clock className="h-3 w-3" />}
                      {version.status === 'archived' && <AlertCircle className="h-3 w-3" />}
                      {getStatusText(version.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {version.content}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(version.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Version {version.version_number}
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {version.audience} • {version.tone} • {version.language}
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
                  
                  {version.status !== 'published' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPublish(version.id)}
                      disabled={isPublishing}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all disabled:opacity-50"
                      title="Veröffentlichen"
                    >
                      {isPublishing ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    </motion.button>
                  )}
                  
                  {onDownloadPDF && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDownloadPDF(version.id)}
                      disabled={isDownloadingPDF}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all disabled:opacity-50"
                      title="PDF herunterladen"
                    >
                      {isDownloadingPDF ? <Loader className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
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
                    disabled={isDeleting}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                    title="Löschen"
                  >
                    {isDeleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </motion.button>
                </div>
              </div>

              {/* Keywords Preview */}
              {version.keywords && version.keywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {version.keywords.slice(0, 6).map((keyword, keywordIndex) => (
                      <span key={keywordIndex} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {keyword}
                      </span>
                    ))}
                    {version.keywords.length > 6 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                        +{version.keywords.length - 6} weitere
                      </span>
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
