import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadDocument } from '../../api/hooks';
import { toast } from 'react-hot-toast';
import { DocumentType } from '../../api/types.gen';
// import DragDropZone from './DragDropZone';
import { GlassCard, GlassButton } from './GlassUI';
import { X, Upload, CheckCircle, AlertCircle, FileText, Clock } from 'lucide-react';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  id: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (files: UploadFile[]) => void;
  folderId?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  folderId
}) => {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const uploadMutation = useUploadDocument();

  // Batch upload with max 3 concurrent uploads
  const MAX_CONCURRENT_UPLOADS = 3;
  const [activeUploads, setActiveUploads] = useState(0);

  const uploadFile = async (file: File, uploadId: string) => {
    const updateUpload = (updates: Partial<UploadFile>) => {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, ...updates } : upload
      ));
    };

    const currentUpload = uploads.find(u => u.id === uploadId);
    if (!currentUpload) return;

    updateUpload({ status: 'uploading', progress: 0 });

    try {
      // Prepare metadata for backend
      const metadata = {
        title: file.name,
        type: 'document',
        category: 'other',
        folder_id: folderId ? parseInt(folderId) : undefined,
        tags: [],
        visibility: 'private',
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateUpload({
          progress: Math.min(currentUpload.progress + Math.random() * 20, 90)
        });
      }, 200);

      const result = await uploadMutation.mutateAsync({ file, metadata });
      
      clearInterval(progressInterval);
      updateUpload({ status: 'completed', progress: 100 });
      
      toast.success(`${file.name} erfolgreich hochgeladen`);
      
    } catch (error: any) {
      updateUpload({ 
        status: 'error', 
        error: error.message || 'Upload fehlgeschlagen' 
      });
      toast.error(`Fehler beim Upload von ${file.name}`);
    }
  };

  const processUploadQueue = useCallback(async () => {
    if (uploadQueue.length === 0 || activeUploads >= MAX_CONCURRENT_UPLOADS) {
      return;
    }

    const file = uploadQueue[0];
    const uploadId = Math.random().toString(36).substr(2, 9);
    
    // Add to uploads list
    setUploads(prev => [...prev, {
      file,
      progress: 0,
      status: 'pending',
      id: uploadId
    }]);

    // Remove from queue
    setUploadQueue(prev => prev.slice(1));
    
    // Start upload
    setActiveUploads(prev => prev + 1);
    await uploadFile(file, uploadId);
    setActiveUploads(prev => prev - 1);
  }, [uploadQueue, activeUploads, uploadMutation, folderId]);

  // Process queue when it changes
  useEffect(() => {
    if (uploadQueue.length > 0 && activeUploads < MAX_CONCURRENT_UPLOADS) {
      processUploadQueue();
    }
  }, [uploadQueue, activeUploads, processUploadQueue]);

  const handleFilesAccepted = (files: File[]) => {
    setUploadQueue(prev => [...prev, ...files]);
    setIsUploading(true);
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const retryUpload = (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload) {
      setUploadQueue(prev => [upload.file, ...prev]);
    }
  };

  const handleClose = () => {
    if (isUploading) {
      if (window.confirm('Upload läuft noch. Wirklich schließen?')) {
        setIsUploading(false);
        setUploads([]);
        setUploadQueue([]);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'error');
  const pendingUploads = uploads.filter(u => u.status === 'pending' || u.status === 'uploading');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Upload className="w-6 h-6 mr-3 text-blue-500" />
                  Dokumente hochladen
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
                </p>
              </div>
              <GlassButton
                onClick={handleClose}
                size="sm"
                variant="secondary"
                icon={<X className="w-4 h-4" />}
              >
                Schließen
              </GlassButton>
            </div>

            {/* Upload Stats */}
            {uploads.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {pendingUploads.length}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Warteschlange</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {completedUploads.length}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">Erfolgreich</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {failedUploads.length}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Fehler</div>
                </div>
              </div>
            )}

            {/* Simple File Input */}
            <div className="mb-6">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesAccepted(Array.from(e.target.files));
                  }
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg"
              />
            </div>

            {/* Upload Progress */}
            <AnimatePresence>
              {uploads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload-Fortschritt
                  </h3>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploads.map((upload) => (
                      <motion.div
                        key={upload.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {upload.file.name}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {upload.progress}%
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <motion.div
                              className={`h-2 rounded-full ${
                                upload.status === 'completed' ? 'bg-green-500' :
                                upload.status === 'error' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${upload.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {upload.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {upload.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          {upload.status === 'uploading' && (
                            <Clock className="w-5 h-5 text-blue-500 animate-spin" />
                          )}
                          {upload.status === 'pending' && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex space-x-1">
                          {upload.status === 'error' && (
                            <GlassButton
                              onClick={() => retryUpload(upload.id)}
                              size="sm"
                              variant="secondary"
                            >
                              Wiederholen
                            </GlassButton>
                          )}
                          <GlassButton
                            onClick={() => removeUpload(upload.id)}
                            size="sm"
                            variant="secondary"
                            icon={<X className="w-3 h-3" />}
                          >
                            Entfernen
                          </GlassButton>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isUploading ? (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Upload läuft...
                  </span>
                ) : (
                  `${completedUploads.length} von ${uploads.length} Dateien hochgeladen`
                )}
              </div>
              
              <div className="flex space-x-3">
                <GlassButton
                  onClick={handleClose}
                  variant="secondary"
                >
                  {isUploading ? 'Schließen' : 'Fertig'}
                </GlassButton>
                
                {completedUploads.length > 0 && (
                  <GlassButton
                    onClick={() => {
                      onUploadComplete?.(completedUploads);
                      handleClose();
                    }}
                    variant="primary"
                  >
                    {completedUploads.length} Dateien verarbeiten
                  </GlassButton>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentUploadModal;