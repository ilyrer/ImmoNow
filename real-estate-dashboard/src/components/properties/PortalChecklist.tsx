import React from 'react';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Portal {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface PortalChecklistProps {
  portals: Portal[];
  selectedPortals: string[];
  onToggle: (portalId: string) => void;
}

const PortalChecklist: React.FC<PortalChecklistProps> = ({ portals, selectedPortals, onToggle }) => {
  const getPortalColor = (portalId: string) => {
    switch (portalId) {
      case 'immoscout24': return 'from-orange-500 to-red-500';
      case 'immowelt': return 'from-blue-500 to-cyan-500';
      case 'wg-gesucht': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
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
        {portals.map((portal, index) => {
          const isSelected = selectedPortals.includes(portal.id);
          const isDisabled = !portal.enabled;
          
          return (
            <motion.button
              key={portal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!isDisabled ? { scale: 1.02, x: 4 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              onClick={() => !isDisabled && onToggle(portal.id)}
              disabled={isDisabled}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 group ${
                isSelected
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg'
                  : isDisabled
                  ? 'border-gray-200 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-700/30 opacity-60 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${getPortalColor(portal.id)} p-0.5 shadow-md`}>
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[10px] flex items-center justify-center">
                  {portal.icon}
                </div>
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900 dark:text-white text-base">{portal.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  {portal.enabled ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Verfügbar</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      <span>Bald verfügbar</span>
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
