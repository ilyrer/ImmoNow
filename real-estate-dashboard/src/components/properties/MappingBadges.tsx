import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { PortalValidation, MappingStatus } from '../../types/publish';

interface MappingBadgesProps {
  validations: PortalValidation[];
}

const MappingBadges: React.FC<MappingBadgesProps> = ({ validations }) => {
  const getStatusIcon = (status: MappingStatus) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'warn': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'missing': return <Info className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: MappingStatus) => {
    switch (status) {
      case 'ok': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'warn': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'error': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'missing': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  // Sicherheitsprüfung für validations - aber immer live anzeigen
  const safeValidations = validations || [];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Feld-Validierung</h3>
      {safeValidations.map(validation => (
        <div key={validation.portal} className="mb-6 last:mb-0">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {validation.portal === 'scout24' ? 'ImmoScout24' : validation.portal === 'immowelt' ? 'Immowelt' : 'eBay Kleinanzeigen'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(validation.mappings || []).map(mapping => (
              <div
                key={mapping.field}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(mapping.status)}`}
                title={mapping.message}
              >
                {getStatusIcon(mapping.status)}
                <span className="text-xs font-medium truncate">{mapping.label}</span>
              </div>
            ))}
          </div>
          {((validation.errors || []).length > 0 || (validation.warnings || []).length > 0) && (
            <div className="mt-3 space-y-1">
              {(validation.errors || []).map((err, i) => (
                <div key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
              {(validation.warnings || []).map((warn, i) => (
                <div key={i} className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MappingBadges;
