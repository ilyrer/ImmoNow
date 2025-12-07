/**
 * Modern Document Upload Zone
 * Schöne Drag & Drop Upload-Zone mit Progress-Tracking
 */

import React, { useState, useRef, useCallback } from 'react';
import { useUploadDocument, useForceUploadDocument } from '../../hooks/useDocuments';
import { 
  DocumentType,
  DocumentCategory,
  DocumentVisibility,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_ICONS,
  DOCUMENT_VISIBILITY_LABELS,
  DOCUMENT_VISIBILITY_BG_COLORS
} from '../../types/document';

interface DocumentUploadZoneProps {
  onClose: () => void;
  onUploadComplete: () => void;
  selectedFolderId?: string | null;
}

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'duplicate';
  progress: number;
  error?: string;
  isDuplicate?: boolean;
  metadata: {
    title: string;
    description?: string;
    document_type: DocumentType;
    category_id?: number;
    access_level: 'private' | 'team' | 'company' | 'public';
    tags?: string[];
  };
}

const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  onClose,
  onUploadComplete,
  selectedFolderId,
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [defaultVisibility, setDefaultVisibility] = useState<DocumentVisibility>('team');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadDocument();
  const forceUploadMutation = useForceUploadDocument();

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newItems: UploadItem[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      status: 'pending',
      progress: 0,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ''),
        document_type: detectDocumentType(file),
        access_level: mapVisibilityToAccessLevel(defaultVisibility),
        tags: [],
      },
    }));

    setUploadItems(prev => [...prev, ...newItems]);
  };

  const detectDocumentType = (file: File): DocumentType => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    
    switch (extension) {
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'presentation';
      case 'pdf':
        return 'pdf';
      default:
        return 'other';
    }
  };

  const mapVisibilityToAccessLevel = (visibility: DocumentVisibility): 'private' | 'team' | 'company' | 'public' => {
    switch (visibility) {
      case 'private': return 'private';
      case 'team': return 'team';
      case 'shared': return 'company';
      case 'public': return 'public';
      default: return 'team';
    }
  };

  const updateUploadItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeUploadItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const startUpload = async (item: UploadItem, forceUpload = false) => {
    updateUploadItem(item.id, { status: 'uploading', progress: 0 });

    try {
      const mutation = forceUpload ? forceUploadMutation : uploadMutation;
      
      await mutation.mutateAsync({
        file: item.file,
        metadata: {
          ...item.metadata,
          folder_id: selectedFolderId ? parseInt(selectedFolderId) : undefined,
        },
        onProgress: (progress: number) => {
          updateUploadItem(item.id, { progress });
        },
      });

      updateUploadItem(item.id, { status: 'completed', progress: 100 });
    } catch (error: any) {
      // Check if it's a duplicate error
      if (error?.code === 'DUPLICATE_DOCUMENT') {
        updateUploadItem(item.id, {
          status: 'duplicate',
          isDuplicate: true,
          error: `Datei bereits vorhanden: ${error.fileName}`,
        });
      } else {
        updateUploadItem(item.id, {
          status: 'error',
          error: error.message || 'Upload fehlgeschlagen',
        });
      }
    }
  };

  const forceUpload = (item: UploadItem) => {
    startUpload(item, true);
  };

  const startAllUploads = () => {
    uploadItems
      .filter(item => item.status === 'pending')
      .forEach(item => startUpload(item));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadItem['status']): string => {
    switch (status) {
      case 'pending': return 'ri-time-line';
      case 'uploading': return 'ri-upload-line';
      case 'completed': return 'ri-check-line';
      case 'error': return 'ri-error-warning-line';
      case 'duplicate': return 'ri-file-copy-line';
      default: return 'ri-file-line';
    }
  };

  const getStatusColor = (status: UploadItem['status']): string => {
    switch (status) {
      case 'pending': return 'text-gray-400';
      case 'uploading': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'duplicate': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const completedUploads = uploadItems.filter(item => item.status === 'completed').length;
  const hasErrors = uploadItems.some(item => item.status === 'error');
  const hasDuplicates = uploadItems.some(item => item.status === 'duplicate');
  const canClose = uploadItems.every(item => 
    item.status === 'completed' || 
    item.status === 'error' || 
    item.status === 'duplicate'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dokumente hochladen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {uploadItems.length > 0 
                ? `${completedUploads}/${uploadItems.length} Dateien hochgeladen`
                : 'Dateien zum Hochladen auswählen'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-500 dark:text-gray-400"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Default Settings */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="text-lg mr-2">⚙️</span>
              Standard-Einstellungen für neue Dokumente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['private', 'team', 'shared'] as DocumentVisibility[]).map((visibility) => (
                <button
                  key={visibility}
                  onClick={() => setDefaultVisibility(visibility)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    defaultVisibility === visibility
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{DOCUMENT_VISIBILITY_ICONS[visibility]}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {DOCUMENT_VISIBILITY_LABELS[visibility]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {visibility === 'private' && 'Nur Sie können diese Dokumente sehen'}
                    {visibility === 'team' && 'Alle Team-Mitglieder können diese Dokumente sehen'}
                    {visibility === 'shared' && 'Sie können auswählen, mit wem Sie teilen möchten'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {uploadItems.length === 0 ? (
            /* Drop Zone */
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className="ri-upload-cloud-line text-2xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Dateien hier ablegen
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    oder klicken Sie, um Dateien auszuwählen
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Dateien auswählen
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Unterstützte Formate: PDF, DOC, XLS, PPT, Bilder, Videos (max. 100MB pro Datei)
                </p>
              </div>
            </div>
          ) : (
            /* Upload List */
            <div className="space-y-4">
              {/* Upload Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Weitere hinzufügen
                  </button>
                  {uploadItems.some(item => item.status === 'pending') && (
                    <button
                      onClick={startAllUploads}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                    >
                      <i className="ri-upload-line mr-2"></i>
                      Alle hochladen
                    </button>
                  )}
                </div>
                {hasErrors && (
                  <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    Einige Uploads sind fehlgeschlagen
                  </div>
                )}
              </div>

              {/* Upload Items */}
              <div className="space-y-3">
                {uploadItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      item.status === 'error'
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        : item.status === 'completed'
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* File Icon */}
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className={`${DOCUMENT_TYPE_ICONS[item.metadata.document_type]} text-xl ${DOCUMENT_TYPE_COLORS[item.metadata.document_type]}`}></i>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.file.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <i className={`${getStatusIcon(item.status)} ${getStatusColor(item.status)}`}></i>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {item.status === 'pending' && 'Wartend'}
                              {item.status === 'uploading' && 'Wird hochgeladen...'}
                              {item.status === 'completed' && 'Abgeschlossen'}
                              {item.status === 'error' && 'Fehler'}
                              {item.status === 'duplicate' && 'Bereits vorhanden'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>{formatFileSize(item.file.size)}</span>
                          {item.status === 'uploading' && (
                            <span>{Math.round(item.progress)}%</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {(item.status === 'uploading') && (
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        )}

                        {/* Error Message */}
                        {(item.status === 'error' || item.status === 'duplicate') && item.error && (
                          <div className={`text-sm mb-2 ${
                            item.status === 'duplicate' 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {item.error}
                          </div>
                        )}

                        {/* Metadata Settings */}
                        {item.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Titel
                              </label>
                              <input
                                type="text"
                                value={item.metadata.title}
                                onChange={(e) => updateUploadItem(item.id, {
                                  metadata: { ...item.metadata, title: e.target.value }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Tags (optional)
                              </label>
                              <input
                                type="text"
                                placeholder="Tags mit Komma trennen"
                                onChange={(e) => updateUploadItem(item.id, {
                                  metadata: { 
                                    ...item.metadata, 
                                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                                  }
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => startUpload(item)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Upload starten"
                          >
                            <i className="ri-upload-line"></i>
                          </button>
                        )}
                        {item.status === 'error' && (
                          <button
                            onClick={() => startUpload(item)}
                            className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            title="Erneut versuchen"
                          >
                            <i className="ri-refresh-line"></i>
                          </button>
                        )}
                        {item.status === 'duplicate' && (
                          <>
                            <button
                              onClick={() => forceUpload(item)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              title="Trotzdem hochladen"
                            >
                              <i className="ri-upload-2-line"></i>
                            </button>
                            <button
                              onClick={() => removeUploadItem(item.id)}
                              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title="Ignorieren"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                        {(item.status === 'pending' || item.status === 'error') && (
                          <button
                            onClick={() => removeUploadItem(item.id)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Entfernen"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {uploadItems.length > 0 && (
              <>
                {completedUploads === uploadItems.length ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center">
                    <i className="ri-check-line mr-1"></i>
                    Alle Uploads abgeschlossen
                  </span>
                ) : (
                  `${completedUploads} von ${uploadItems.length} Dateien hochgeladen`
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {canClose ? 'Schließen' : 'Abbrechen'}
            </button>
            {canClose && completedUploads > 0 && (
              <button
                onClick={() => {
                  onUploadComplete();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Fertig
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
        />
      </div>
    </div>
  );
};

export default DocumentUploadZone;
