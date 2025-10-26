import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2, RotateCw, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX, AlertCircle, FileText } from 'lucide-react';
import { GlassCard, GlassButton } from './GlassUI';

interface DocumentPreviewProps {
  file: File | string; // File object or URL
  fileName?: string;
  fileType?: string;
  onClose?: () => void;
  className?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  fileName,
  fileType,
  onClose,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const generatePreviewUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (typeof file === 'string') {
          // URL provided
          setPreviewUrl(file);
        } else {
          // File object provided
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      } catch (err) {
        setError('Fehler beim Laden der Vorschau');
        console.error('Preview error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreviewUrl();

    return () => {
      if (previewUrl && typeof file !== 'string') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  const getFileType = (): string => {
    if (fileType) return fileType;
    if (typeof file === 'string') {
      const extension = file.split('.').pop()?.toLowerCase();
      return extension || 'unknown';
    }
    return file.type || 'unknown';
  };

  const getFileName = (): string => {
    if (fileName) return fileName;
    if (typeof file === 'string') {
      return file.split('/').pop() || 'Unknown file';
    }
    return file.name || 'Unknown file';
  };

  const handleDownload = () => {
    if (typeof file === 'string') {
      const link = document.createElement('a');
      link.href = file;
      link.download = getFileName();
      link.click();
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    } else if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const renderPreview = () => {
    const type = getFileType();
    const name = getFileName();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vorschau für {name} nicht verfügbar
          </p>
        </div>
      );
    }

    // Image preview
    if (type.startsWith('image/')) {
      return (
        <div className="relative overflow-hidden">
          <motion.img
            src={previewUrl || ''}
            alt={name}
            className="w-full h-auto max-h-96 object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      );
    }

    // Video preview
    if (type.startsWith('video/')) {
      return (
        <div className="relative">
          <video
            ref={videoRef}
            src={previewUrl || ''}
            className="w-full h-auto max-h-96"
            controls={false}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setError('Video konnte nicht geladen werden')}
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2">
            <GlassButton
              onClick={handlePlayPause}
              size="sm"
              icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </GlassButton>
            <div className="flex items-center space-x-1">
              <button onClick={handleMuteToggle}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16"
              />
            </div>
          </div>
        </div>
      );
    }

    // Audio preview
    if (type.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
            <Volume2 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <audio
            ref={audioRef}
            src={previewUrl || ''}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setError('Audio konnte nicht geladen werden')}
          />
          <div className="flex items-center space-x-4">
            <GlassButton
              onClick={handlePlayPause}
              size="sm"
              icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </GlassButton>
            <div className="flex items-center space-x-2">
              <button onClick={handleMuteToggle}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{name}</p>
        </div>
      );
    }

    // PDF preview (iframe)
    if (type === 'pdf' || type === 'application/pdf') {
      return (
        <div className="w-full h-96">
          <iframe
            src={previewUrl || ''}
            className="w-full h-full border-0 rounded-lg"
            title={name}
            onLoad={() => setIsLoading(false)}
            onError={() => setError('PDF konnte nicht geladen werden')}
          />
        </div>
      );
    }

    // Text file preview
    if (type.startsWith('text/')) {
      return (
        <div className="w-full h-64 overflow-auto">
          <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {/* Text content would be loaded here */}
            Textvorschau wird geladen...
          </pre>
        </div>
      );
    }

    // Default file icon
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vorschau für {type} nicht verfügbar
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black/90' : ''} ${className}`}
    >
      <GlassCard className={`${isFullscreen ? 'h-full' : ''} p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getFileName()}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {getFileType()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom controls for images */}
            {getFileType().startsWith('image/') && (
              <>
                <GlassButton
                  onClick={handleZoomOut}
                  size="sm"
                  icon={<ZoomOut className="w-4 h-4" />}
                >
                  <span className="sr-only">Verkleinern</span>
                </GlassButton>
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-0">
                  {Math.round(zoom * 100)}%
                </span>
                <GlassButton
                  onClick={handleZoomIn}
                  size="sm"
                  icon={<ZoomIn className="w-4 h-4" />}
                >
                  <span className="sr-only">Vergrößern</span>
                </GlassButton>
                <GlassButton
                  onClick={handleRotate}
                  size="sm"
                  icon={<RotateCw className="w-4 h-4" />}
                >
                  <span className="sr-only">Drehen</span>
                </GlassButton>
              </>
            )}
            
            <GlassButton
              onClick={handleFullscreen}
              size="sm"
              icon={<Maximize2 className="w-4 h-4" />}
            >
              <span className="sr-only">Vollbild</span>
            </GlassButton>
            <GlassButton
              onClick={handleDownload}
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              <span className="sr-only">Herunterladen</span>
            </GlassButton>
            {onClose && (
              <GlassButton
                onClick={onClose}
                size="sm"
                icon={<X className="w-4 h-4" />}
              >
                <span className="sr-only">Schließen</span>
              </GlassButton>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className={`${isFullscreen ? 'h-full overflow-auto' : ''}`}>
          {renderPreview()}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default DocumentPreview;
