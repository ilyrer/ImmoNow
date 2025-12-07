import React from 'react';
import { Check, Image as ImageIcon, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaPickerProps {
  propertyId: string;
  selectedMedia: string[];
  onSelect: (mediaIds: string[]) => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ propertyId, selectedMedia, onSelect }) => {
  // TODO: Implement real media API
  const mockImages: Array<{ id: string; url: string; isPrimary: boolean }> = [];

  const toggleImage = (id: string) => {
    if (selectedMedia.includes(id)) {
      onSelect(selectedMedia.filter(i => i !== id));
    } else {
      onSelect([...selectedMedia, id]);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Medienauswahl</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedMedia.length} von {mockImages.length} ausgewählt
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mockImages.map(i => i.id))}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
        >
          Alle auswählen
        </motion.button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockImages.map((img, index) => {
          const isSelected = selectedMedia.includes(img.id);
          return (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleImage(img.id)}
              className={`relative aspect-square rounded-2xl overflow-hidden border-3 transition-all duration-300 group ${
                isSelected
                  ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800 shadow-2xl'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-lg'
              }`}
            >
              <img 
                src={img.url} 
                alt="Property" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              
              {/* Overlay on hover */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${
                isSelected ? 'bg-blue-500/30' : 'bg-black/0 group-hover:bg-black/20'
              }`} />
              
              {img.isPrimary && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  <span>Haupt</span>
                </motion.div>
              )}
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Check className="h-8 w-8 text-white font-bold" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MediaPicker;
