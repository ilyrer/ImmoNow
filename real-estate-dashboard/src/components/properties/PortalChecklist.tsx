import React from 'react';
import { Check, Zap } from 'lucide-react';
import { Portal, PortalConfig } from '../../types/publish';
import { motion } from 'framer-motion';

interface PortalChecklistProps {
  configs: PortalConfig[];
  selectedPortals: Portal[];
  onToggle: (portal: Portal) => void;
}

const PortalChecklist: React.FC<PortalChecklistProps> = ({ configs, selectedPortals, onToggle }) => {
  const getPortalIcon = (portal: Portal) => {
    switch (portal) {
      case 'scout24': return '🏠';
      case 'immowelt': return '🌍';
      case 'ebay': return '🛒';
    }
  };

  const getPortalColor = (portal: Portal) => {
    switch (portal) {
      case 'scout24': return 'from-orange-500 to-red-500';
      case 'immowelt': return 'from-blue-500 to-cyan-500';
      case 'ebay': return 'from-yellow-400 to-orange-500';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Zielportale</h3>
      </div>
      <div className="space-y-3">
        {configs.filter(c => c.isActive).map((config, index) => {
          const isSelected = selectedPortals.includes(config.portal);
          return (
            <motion.button
              key={config.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggle(config.portal)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 group ${
                isSelected
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${getPortalColor(config.portal)} p-0.5 shadow-md`}>
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[10px] flex items-center justify-center">
                  {getPortalIcon(config.portal)}
                </div>
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900 dark:text-white text-base">{config.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  {config.syncEnabled ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Sync aktiv</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      <span>Sync inaktiv</span>
                    </>
                  )}
                </div>
              </div>
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="h-5 w-5 text-white font-bold" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      {selectedPortals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            ✨ {selectedPortals.length} {selectedPortals.length === 1 ? 'Portal' : 'Portale'} ausgewählt
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PortalChecklist;
