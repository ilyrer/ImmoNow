import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthRequiredWidgetProps {
  title: string;
  icon: string;
  message?: string;
}

/**
 * Gemeinsame Komponente für Widgets die Authentifizierung erfordern
 */
const AuthRequiredWidget: React.FC<AuthRequiredWidgetProps> = ({ 
  title, 
  icon, 
  message = 'Diese Daten erfordern eine Anmeldung' 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className={`${icon} mr-2 text-blue-600 dark:text-blue-400`}></i>
          {title}
        </h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
          <i className="ri-lock-line text-3xl text-yellow-600 dark:text-yellow-400"></i>
        </div>
        
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Anmeldung erforderlich
        </h4>
        
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {message}
        </p>

        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Jetzt anmelden
        </button>
      </div>
    </div>
  );
};

export default AuthRequiredWidget;
