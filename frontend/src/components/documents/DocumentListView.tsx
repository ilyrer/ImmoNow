/**
 * Modern Document List View
 * Detaillierte Tabellen-Ansicht für Dokumente
 */

import React from 'react';
import { 
  Document,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_ICONS,
  DOCUMENT_VISIBILITY_LABELS
} from '../../types/document';

interface DocumentListViewProps {
  documents: Document[];
  selectedDocuments: string[];
  onDocumentSelect: (documentId: string) => void;
  onDocumentOpen: (document: Document) => void;
  onToggleFavorite: (documentId: string, event: React.MouseEvent) => void;
  onDeleteDocument?: (documentId: string) => void;
  isLoading: boolean;
  formatFileSize: (bytes: number) => string;
  isExpired: (document: Document) => boolean;
}

const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onDocumentOpen,
  onToggleFavorite,
  onDeleteDocument,
  isLoading,
  formatFileSize,
  isExpired,
}) => {
  if (isLoading && documents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <i className="ri-file-list-3-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Dokumente vorhanden
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Laden Sie Ihre ersten Dokumente hoch oder wählen Sie einen anderen Ordner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedDocuments.length === documents.length && documents.length > 0}
                  onChange={() => {
                    // TODO: Implement select all functionality
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dokument
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Typ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Kategorie
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Größe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hochgeladen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Zuletzt geändert
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((document) => (
              <tr
                key={document.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  selectedDocuments.includes(document.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : ''
                } ${
                  isExpired(document) 
                    ? 'bg-red-50 dark:bg-red-900/10' 
                    : ''
                }`}
                onClick={() => onDocumentOpen(document)}
              >
                {/* Selection */}
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={() => onDocumentSelect(document.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </td>

                {/* Document Info */}
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${DOCUMENT_TYPE_ICONS[document.type]} text-lg ${DOCUMENT_TYPE_COLORS[document.type]}`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {document.name}
                        </p>
                        {/* Visibility */}
                        <span title={DOCUMENT_VISIBILITY_LABELS[document.visibility]}>
                          {DOCUMENT_VISIBILITY_ICONS[document.visibility]}
                        </span>
                        {/* Favorite */}
                        <button
                          onClick={(e) => onToggleFavorite(document.id, e)}
                          className={`transition-colors ${
                            document.isFavorite
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <i className={document.isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}></i>
                        </button>
                        {/* Version */}
                        {document.versions.length > 1 && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                            v{document.version}
                          </span>
                        )}
                        {/* Expired */}
                        {isExpired(document) && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                            Abgelaufen
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {document.description || 'Keine Beschreibung'}
                        </p>
                        {/* Tags */}
                        {document.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {document.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{document.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Property/Contact */}
                      {(document.propertyTitle || document.contactName) && (
                        <div className="flex items-center space-x-2 mt-1">
                          <i className="ri-link-line text-xs text-gray-400"></i>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {document.propertyTitle || document.contactName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <i className={`${DOCUMENT_TYPE_ICONS[document.type]} mr-2 ${DOCUMENT_TYPE_COLORS[document.type]}`}></i>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {document.type.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {DOCUMENT_CATEGORY_LABELS[document.category]}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${DOCUMENT_STATUS_COLORS[document.status]}`}>
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </span>
                </td>

                {/* Size */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(document.size)}
                  </span>
                </td>

                {/* Uploaded */}
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">
                      {new Date(document.uploadedAt).toLocaleDateString('de-DE')}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      von {document.uploadedBy}
                    </div>
                  </div>
                </td>

                {/* Last Modified */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(document.lastModified).toLocaleDateString('de-DE')}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(document.url, '_blank');
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Herunterladen"
                    >
                      <i className="ri-download-line text-sm"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement share functionality
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title="Teilen"
                    >
                      <i className="ri-share-line text-sm"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentOpen(document);
                      }}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                      title="Details"
                    >
                      <i className="ri-eye-line text-sm"></i>
                    </button>
                    {onDeleteDocument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(document.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show context menu
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Mehr Optionen"
                    >
                      <i className="ri-more-2-line text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentListView;
