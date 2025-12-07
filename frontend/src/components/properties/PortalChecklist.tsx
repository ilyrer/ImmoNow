import React from 'react';
import { Check, Globe, Building2, Users, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Portal {
  id: string;
  name: string;
  enabled: boolean;
}

interface PortalChecklistProps {
  portals: Portal[];
  selectedPortals: string[];
  onToggle: (portalId: string) => void;
}

const PortalChecklist: React.FC<PortalChecklistProps> = ({ portals, selectedPortals, onToggle }) => {
  const getPortalConfig = (portalId: string) => {
    switch (portalId) {
      case 'immoscout24':
        return {
          gradient: 'from-orange-500 to-red-500',
          icon: Home,
          abbrev: 'IS24'
        };
      case 'immowelt':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          icon: Building2,
          abbrev: 'IW'
        };
      case 'wg-gesucht':
        return {
          gradient: 'from-green-500 to-emerald-500',
          icon: Users,
          abbrev: 'WG'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          icon: Globe,
          abbrev: '?'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Zielportale</h3>
      </div>
      <div className="space-y-2">
        {portals.map((portal, index) => {
          const isSelected = selectedPortals.includes(portal.id);
          const isDisabled = !portal.enabled;
          const config = getPortalConfig(portal.id);
          const IconComponent = config.icon;

          return (
            <motion.button
              key={portal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isDisabled && onToggle(portal.id)}
              disabled={isDisabled}
              className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isDisabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${config.gradient}`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white text-sm">{portal.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  {portal.enabled ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
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
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      {selectedPortals.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {selectedPortals.length} {selectedPortals.length === 1 ? 'Portal' : 'Portale'} ausgewählt
          </p>
        </div>
      )}
    </div>
  );
};

export default PortalChecklist;
