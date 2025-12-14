/**
 * Modern Document Grid View
 * Schöne Raster-Ansicht für Dokumente
 */

import React from 'react';
import {
  Document,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_ICONS
} from '../../types/document';

interface DocumentGridViewProps {
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

const DocumentGridView: React.FC<DocumentGridViewProps> = ({
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {documents.map((document) => (
        <div
          key={document.id}
          className={`group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ${selectedDocuments.includes(document.id)
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'hover:border-gray-300 dark:hover:border-gray-600'
            } ${isExpired(document)
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
              : ''
            }`}
          onClick={() => onDocumentOpen(document)}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={selectedDocuments.includes(document.id)}
              onChange={() => onDocumentSelect(document.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>

          {/* Favorite Button */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={(e) => onToggleFavorite(document.id, e)}
              className={`p-1.5 rounded-full transition-colors ${document.isFavorite
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
                }`}
            >
              <i className={document.isFavorite ? 'ri-heart-fill' : 'ri-heart-line'}></i>
            </button>
          </div>

          {/* Document Preview/Icon */}
          <div className="p-4">
            <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
              {document.thumbnailUrl ? (
                <img
                  src={document.thumbnailUrl}
                  alt={document.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : document.mimeType?.startsWith('image/') ? (
                <img
                  src={document.url}
                  alt={document.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <i className={`${DOCUMENT_TYPE_ICONS[document.type]} text-4xl ${DOCUMENT_TYPE_COLORS[document.type]}`}></i>
              )}

              {/* Visibility Indicator */}
              <div className="absolute bottom-2 left-2">
                <span className="text-xs bg-white/90 dark:bg-gray-800/90 px-1.5 py-0.5 rounded-full">
                  {DOCUMENT_VISIBILITY_ICONS[document.visibility]}
                </span>
              </div>

              {/* Status Badge */}
              <div className="absolute bottom-2 right-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${DOCUMENT_STATUS_COLORS[document.status]}`}>
                  {DOCUMENT_STATUS_LABELS[document.status]}
                </span>
              </div>
            </div>

            {/* Document Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                {document.name}
              </h3>

              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{DOCUMENT_CATEGORY_LABELS[document.category]}</span>
                <span>{formatFileSize(document.size)}</span>
              </div>

              {/* Tags */}
              {document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                      +{document.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Upload Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate">von {document.uploadedBy || 'Unbekannt'}</span>
                <span>
                  {document.uploadedAt && !document.uploadedAt.includes('Invalid')
                    ? new Date(document.uploadedAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                    : 'Datum unbekannt'
                  }
                </span>
              </div>

              {/* Expiry Warning */}
              {isExpired(document) && (
                <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                  <i className="ri-error-warning-line mr-1"></i>
                  Abgelaufen
                </div>
              )}

              {/* Property/Contact Info */}
              {(document.propertyTitle || document.contactName) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <i className="ri-link-line mr-1"></i>
                  {document.propertyTitle && (
                    <span className="truncate">{document.propertyTitle}</span>
                  )}
                  {document.contactName && (
                    <span className="truncate">{document.contactName}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(document.url, '_blank');
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Herunterladen"
              >
                <i className="ri-download-line"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement share functionality
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Teilen"
              >
                <i className="ri-share-line"></i>
              </button>
              {onDeleteDocument && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(document.id);
                  }}
                  className="p-2 bg-white/20 hover:bg-red-500/80 rounded-lg text-white transition-colors"
                  title="Löschen"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              )}
            </div>
          </div>

          {/* Version Indicator */}
          {document.versions.length > 1 && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                v{document.version}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DocumentGridView;
