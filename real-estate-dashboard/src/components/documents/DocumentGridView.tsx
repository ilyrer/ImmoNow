/**
 * Modern Document Grid View with Glass Morphism
 * Schöne Raster-Ansicht für Dokumente mit Hover-Effekten und Quick-Actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Document,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_ICONS
} from '../../types/document';
import { GlassCard, GlassBadge } from './GlassUI';
import DocumentContextMenu from './DocumentContextMenu';
import { 
  Eye, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  Star, 
  MoreVertical,
  Copy,
  Move,
  Tag,
  Archive,
  Lock,
  Unlock
} from 'lucide-react';
import { DocumentResponse } from '../../api/types.gen';

interface DocumentGridViewProps {
  documents: DocumentResponse[];
  selectedDocuments: string[];
  onDocumentSelect: (documentId: string) => void;
  onDocumentOpen: (document: DocumentResponse) => void;
  onToggleFavorite: (documentId: string, event: React.MouseEvent) => void;
  onDeleteDocument?: (documentId: string) => void;
  onMoveDocument?: (documentId: string, folderId: string) => void;
  isLoading: boolean;
  formatFileSize: (bytes: number) => string;
  isExpired: (document: DocumentResponse) => boolean;
}

const DocumentGridView: React.FC<DocumentGridViewProps> = ({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onDocumentOpen,
  onToggleFavorite,
  onDeleteDocument,
  onMoveDocument,
  isLoading,
  formatFileSize,
  isExpired,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    document?: DocumentResponse;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  });

  const [draggedDocument, setDraggedDocument] = useState<DocumentResponse | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleContextMenu = (e: React.MouseEvent, document: DocumentResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      document
    });
  };

  const handleDragStart = (e: React.DragEvent, document: DocumentResponse) => {
    e.dataTransfer.setData('text/plain', document.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDocument(document);
  };

  const handleDragEnd = () => {
    setDraggedDocument(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const documentId = e.dataTransfer.getData('text/plain');
    
    if (documentId && onMoveDocument) {
      onMoveDocument(documentId, targetFolderId);
    }
    
    setDraggedDocument(null);
    setDragOverFolder(null);
  };

  const handleContextAction = (action: string, doc?: DocumentResponse) => {
    console.log('Context action:', action, doc);
    // Handle different actions
    switch (action) {
      case 'preview':
        if (doc) onDocumentOpen(doc);
        break;
      case 'download':
        if (doc) window.open(doc.file_url, '_blank');
        break;
      case 'toggle-favorite':
        if (doc) onToggleFavorite(doc.id.toString(), {} as React.MouseEvent);
        break;
      case 'delete':
        if (doc) onDeleteDocument?.(doc.id.toString());
        break;
      case 'move':
        if (doc) {
          // This would open a folder selection modal
          console.log('Move document:', doc.id);
        }
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card p-6 animate-pulse"
          >
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2"></div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-20"
      >
        <div className="glass-card p-12 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <i className="ri-file-list-3-line text-3xl text-blue-500 dark:text-blue-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Keine Dokumente vorhanden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Laden Sie Ihre ersten Dokumente hoch oder wählen Sie einen anderen Ordner.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <i className="ri-upload-line mr-2"></i>
              Dokument hochladen
            </button>
            <button className="px-4 py-2 glass-button">
              <i className="ri-folder-add-line mr-2"></i>
              Ordner erstellen
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {documents.map((document, index) => (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative"
          >
            <div
              className={`glass-card p-0 overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedDocuments.includes(document.id.toString()) 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : ''
              } ${
                isExpired(document) 
                  ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20' 
                  : ''
              } ${
                draggedDocument?.id === document.id
                  ? 'opacity-50 scale-95'
                  : ''
              }`}
              onClick={() => onDocumentOpen(document)}
              onContextMenu={(e) => handleContextMenu(e, document)}
              draggable
              onDragStart={(e) => handleDragStart(e, document)}
              onDragEnd={handleDragEnd}
            >
              {/* Selection Checkbox */}
              <motion.div 
                className="absolute top-3 left-3 z-10"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(document.id.toString())}
                  onChange={() => onDocumentSelect(document.id.toString())}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </motion.div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 z-10 flex space-x-1">
                <motion.button
                  onClick={(e) => onToggleFavorite(document.id.toString(), e)}
                  className={`p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${
                    document.is_favorite
                      ? 'bg-red-100/90 text-red-600 hover:bg-red-200/90'
                      : 'bg-white/80 text-gray-400 hover:bg-white/90 hover:text-red-500'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star className={`w-4 h-4 ${document.is_favorite ? 'fill-current' : ''}`} />
                </motion.button>
                
                <motion.button
                  onClick={(e) => handleContextMenu(e, document)}
                  className="p-1.5 rounded-full bg-white/80 text-gray-400 hover:bg-white/90 hover:text-gray-600 transition-all duration-200 backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MoreVertical className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Document Preview/Icon */}
              <div className="p-6">
                <div className="w-full h-40 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                  {false ? (
                    <img
                      src=""
                      alt={document.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <i className={`${DOCUMENT_TYPE_ICONS[document.document_type as keyof typeof DOCUMENT_TYPE_ICONS] || 'ri-file-line'} text-5xl ${DOCUMENT_TYPE_COLORS[document.document_type as keyof typeof DOCUMENT_TYPE_COLORS] || 'text-gray-500'} mb-2`}></i>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {document.document_type.toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with Quick Actions */}
                  <motion.div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentOpen(document);
                        }}
                        className="p-2 bg-white/90 text-gray-700 rounded-lg hover:bg-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(document.file_url, '_blank');
                        }}
                        className="p-2 bg-white/90 text-gray-700 rounded-lg hover:bg-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <GlassBadge 
                      variant="default" 
                      size="sm"
                    >
                      {document.status}
                    </GlassBadge>
                  </div>
                </div>

                {/* Document Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2 leading-tight">
                    {document.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm">
                    <GlassBadge variant="info" size="sm">
                      {document.document_type}
                    </GlassBadge>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {formatFileSize(document.file_size)}
                    </span>
                  </div>

                  {/* Upload Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <i className="ri-user-line mr-1"></i>
                      {document.uploaded_by || 'Unbekannt'}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-calendar-line mr-1"></i>
                      {new Date(document.uploaded_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>

                  {/* Expiry Warning */}
                  {isExpired(document) && (
                    <motion.div 
                      className="flex items-center text-xs text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 px-2 py-1 rounded-lg"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <i className="ri-error-warning-line mr-1"></i>
                      Abgelaufen
                    </motion.div>
                  )}

                  {/* Property Info */}
                  {document.property_id && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-50/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg">
                      <i className="ri-link-line mr-1"></i>
                      <span className="truncate">
                        Immobilie: {document.property_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Context Menu */}
      <DocumentContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 } })}
        document={contextMenu.document}
        onAction={handleContextAction}
      />
    </>
  );
};

export default DocumentGridView;