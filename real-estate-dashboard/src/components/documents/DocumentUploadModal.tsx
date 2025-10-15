import React, { useState, useRef, useCallback } from 'react';
import { useUploadDocument } from '../../api/hooks';
import { toast } from 'react-hot-toast';
import { DocumentType } from '../../api/types.gen';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();

  const uploadFile = async (upload: UploadFile, index: number) => {
    const updateUpload = (updates: Partial<UploadFile>) => {
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, ...updates } : u
      ));
    };

    updateUpload({ status: 'uploading' });

    try {
      // Prepare metadata for backend
      const metadata = {
        title: upload.file.name,
        type: 'document',  // Backend expects 'type' not 'document_type'
        category: 'other',  // Required field - valid values: legal, marketing, technical, financial, administrative, other
        folder_id: folderId ? parseInt(folderId) : undefined,
        tags: [],
        visibility: 'private',  // Valid values: public, private, restricted
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map((u, i) => {
          if (i === index && u.progress < 90) {
            return { ...u, progress: u.progress + 10 };
          }
          return u;
        }));
      }, 200);

      // Upload file
      await uploadMutation.mutateAsync({ 
        file: upload.file, 
        metadata 
      });

      clearInterval(progressInterval);

      updateUpload({ 
        status: 'completed', 
        progress: 100 
      });

      toast.success(`${upload.file.name} erfolgreich hochgeladen!`);
    } catch (error) {
      updateUpload({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
      });
      toast.error(`Fehler beim Hochladen von ${upload.file.name}`);
    }
  };

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploads: UploadFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    
    // Start uploading files
    newUploads.forEach((upload, index) => {
      uploadFile(upload, uploads.length + index);
    });
  }, [uploads.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (uploads.some(u => u.status === 'uploading')) {
      if (window.confirm('Es laufen noch Uploads. Möchten Sie wirklich schließen?')) {
        setUploads([]);
        onClose();
      }
    } else {
      setUploads([]);
      onClose();
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return 'ri-image-line';
    if (type.startsWith('video/')) return 'ri-video-line';
    if (type.startsWith('audio/')) return 'ri-music-line';
    if (type.includes('pdf')) return 'ri-file-pdf-line';
    if (type.includes('word')) return 'ri-file-word-line';
    if (type.includes('excel')) return 'ri-file-excel-line';
    if (type.includes('powerpoint')) return 'ri-file-ppt-line';
    if (type.includes('zip') || type.includes('rar')) return 'ri-file-zip-line';
    return 'ri-file-line';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dokumente hochladen
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <i className="ri-upload-cloud-2-line text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Dateien hier ablegen oder
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Dateien auswählen
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Unterstützte Formate: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Bilder, Videos
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar"
          />

          {/* Upload List */}
          {uploads.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Upload-Status
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {uploads.map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <i className={`${getFileIcon(upload.file)} text-xl text-gray-400`}></i>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatFileSize(upload.file.size)}
                      </p>
                      
                      {upload.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {upload.progress}% hochgeladen
                          </p>
                        </div>
                      )}
                      
                      {upload.status === 'completed' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Erfolgreich hochgeladen
                          </span>
                        </div>
                      )}
                      
                      {upload.status === 'error' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <i className="ri-error-warning-line text-red-600 dark:text-red-400"></i>
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {upload.error || 'Upload fehlgeschlagen'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {upload.status !== 'uploading' && (
                      <button
                        onClick={() => removeUpload(index)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Schließen
          </button>
          {uploads.length > 0 && (
            <button
              onClick={() => {
                onUploadComplete?.(uploads);
                handleClose();
              }}
              disabled={uploads.some(u => u.status === 'uploading')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fertig
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;