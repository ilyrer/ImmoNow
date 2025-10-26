import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Image, Video, FileText, Archive, X } from 'lucide-react';
import { GlassCard } from './GlassUI';

interface DragDropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  acceptedTypes?: string[];
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesAccepted,
  maxFiles = 20,
  maxSize = 100,
  className = '',
  acceptedTypes = ['image/*', 'application/pdf', 'video/*', 'audio/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragActive(false);
    setRejectedFiles(rejectedFiles.map(rejection => rejection.file));
    
    if (acceptedFiles.length > 0) {
      onFilesAccepted(acceptedFiles);
    }
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Archive className="w-8 h-8 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive || dragActive 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <motion.div
              animate={isDragActive ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full"
            >
              <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isDragActive ? 'Dateien hier ablegen' : 'Dateien hierher ziehen oder klicken'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unterstützte Formate: Bilder, PDF, Videos, Audio, Office-Dokumente
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Max. {maxFiles} Dateien, je {maxSize}MB
            </p>
          </div>

          {/* File Type Icons */}
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Image className="w-4 h-4" />
              <span>Bilder</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Video className="w-4 h-4" />
              <span>Videos</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Archive className="w-4 h-4" />
              <span>Audio</span>
            </div>
          </div>
        </motion.div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="p-6 bg-blue-500 rounded-full mb-4 mx-auto w-fit"
                >
                  <Upload className="w-12 h-12 text-white" />
                </motion.div>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  Dateien ablegen...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rejected Files */}
      <AnimatePresence>
        {rejectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <GlassCard className="p-4 border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Abgelehnte Dateien
                </h4>
                <button
                  onClick={() => setRejectedFiles([])}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {rejectedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {formatFileSize(file.size)} - Dateigröße oder Format nicht unterstützt
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DragDropZone;
