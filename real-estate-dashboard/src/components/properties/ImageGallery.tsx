import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, Download, Share2, 
  Eye, RotateCcw, Star, Heart, Share2 as ShareIcon,
  Plus, Camera, Image as ImageIcon, Trash2, Upload, GripVertical
} from 'lucide-react';
import { PropertyResponse } from '../../types/property';
import { propertiesService } from '../../services/properties';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageGalleryProps {
  property: PropertyResponse;
}

interface SortableImageProps {
  image: any;
  index: number;
  isPrimary: boolean;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onDownload: (imageId: string) => void;
}

const SortableImage: React.FC<SortableImageProps> = ({ 
  image, 
  index, 
  isPrimary, 
  onSetPrimary, 
  onDelete, 
  onDownload 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 relative group ${
        isPrimary
          ? 'border-yellow-400 shadow-lg'
          : 'border-white/40 hover:border-white/60'
      }`}
      {...attributes}
      {...listeners}
    >
      <img
        src={image.url}
        alt={`Thumbnail ${index + 1}`}
        className="w-full h-full object-cover"
      />
      
      {/* Primary indicator */}
      {isPrimary && (
        <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
          <Star className="w-2 h-2 text-yellow-900 fill-current" />
        </div>
      )}
      
      {/* Drag handle */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-black/50 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <GripVertical className="w-2 h-2" />
      </div>
    </motion.button>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ property }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState(property.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((image) => image.id === active.id);
      const newIndex = images.findIndex((image) => image.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // TODO: Send reorder request to backend
      // await propertiesService.reorderImages(property.id, newImages.map(img => img.id));
      toast.success('Bildreihenfolge aktualisiert');
    }
  };

  // Update images when property changes
  React.useEffect(() => {
    setImages(property.images || []);
  }, [property.images]);

  const hasImages = images.length > 0;

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Nur JPG, PNG und WEBP Dateien sind erlaubt');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await propertiesService.uploadMedia(property.id, files, {
        onProgress: (progress) => setUploadProgress(progress)
      });
      
      toast.success(`${files.length} Bild${files.length > 1 ? 'er' : ''} erfolgreich hochgeladen`);
      
      // Refresh property data
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Fehler beim Hochladen der Bilder');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await propertiesService.deleteMedia(property.id, imageId);
      toast.success('Bild erfolgreich gelöscht');
      
      // Refresh property data
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      
      // Adjust current index if needed
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Fehler beim Löschen des Bildes');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await propertiesService.setPrimaryMedia(property.id, imageId);
      toast.success('Hauptbild erfolgreich gesetzt');
      
      // Refresh property data
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Fehler beim Setzen des Hauptbildes');
    }
  };

  const handleDownload = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `property-image-${imageId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Bild wird heruntergeladen');
    }
  };

  if (!hasImages) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-white/60 dark:bg-gray-700/60 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm"
          >
            <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Keine Bilder verfügbar
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 dark:text-gray-400 mb-6 max-w-md"
          >
            Fügen Sie Bilder hinzu, um die Immobilie zu präsentieren
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-colors font-medium shadow-lg ${
              isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            } text-white`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Wird hochgeladen...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Bilder hinzufügen</span>
              </>
            )}
          </motion.button>
          
          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xs mt-4"
            >
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {uploadProgress}% hochgeladen
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
      </motion.div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group"
      >
        {/* Main Image */}
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={images[currentIndex]?.url}
            alt={`${property.title} - Bild ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={openFullscreen}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </>
          )}
          
          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {currentIndex + 1} / {images.length}
          </div>
          
          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={openFullscreen}
              className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg"
            >
              <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
            
            {images[currentIndex] && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSetPrimary(images[currentIndex].id)}
                  className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg"
                  title="Als Hauptbild setzen"
                >
                  <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteImage(images[currentIndex].id)}
                  disabled={isDeleting}
                  className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg disabled:opacity-50"
                  title="Bild löschen"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </motion.button>
              </>
            )}
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg"
            >
              <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 shadow-lg"
            >
              <ShareIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </motion.button>
          </div>
        </div>
        
        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                  {images.map((image, index) => (
                    <div key={image.id} onClick={() => setCurrentIndex(index)}>
                      <SortableImage
                        image={image}
                        index={index}
                        isPrimary={image.is_primary}
                        onSetPrimary={handleSetPrimary}
                        onDelete={handleDeleteImage}
                        onDownload={handleDownload}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeFullscreen}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeFullscreen}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
              
              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.button>
                </>
              )}
              
              {/* Fullscreen Image */}
              <motion.img
                key={`fullscreen-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                src={images[currentIndex]?.url}
                alt={`${property.title} - Bild ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;