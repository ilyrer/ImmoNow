import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const OAuthCallback: React.FC = () => {
  const { portal } = useParams<{ portal: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || `OAuth-Fehler: ${error}`);
        toast.error(`Fehler beim Verbinden mit ${portal}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Fehlende OAuth-Parameter');
        toast.error('OAuth-Callback fehlgeschlagen');
        return;
      }

      try {
        // Hier würde normalerweise der OAuth-Callback an das Backend gesendet werden
        // Für Demo-Zwecke simulieren wir den Erfolg
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('success');
        setMessage(`Erfolgreich mit ${portal} verbunden!`);
        toast.success(`Verbindung zu ${portal} hergestellt`);
        
        // Nach 3 Sekunden zurück zur Property-Detail-Seite
        setTimeout(() => {
          navigate('/properties');
        }, 3000);
        
      } catch (error) {
        setStatus('error');
        setMessage('Fehler beim Verarbeiten des OAuth-Callbacks');
        toast.error('OAuth-Callback fehlgeschlagen');
      }
    };

    handleCallback();
  }, [portal, searchParams, navigate]);

  const getPortalIcon = (portal: string) => {
    switch (portal?.toLowerCase()) {
      case 'immoscout24': return '🏠';
      case 'immowelt': return '🏢';
      case 'kleinanzeigen': return '📱';
      default: return '🌐';
    }
  };

  const getPortalName = (portal: string) => {
    switch (portal?.toLowerCase()) {
      case 'immoscout24': return 'Immoscout24';
      case 'immowelt': return 'Immowelt';
      case 'kleinanzeigen': return 'eBay Kleinanzeigen';
      default: return portal;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          {/* Portal Icon */}
          <div className="text-6xl mb-4">
            {getPortalIcon(portal || '')}
          </div>
          
          {/* Status Icon */}
          <div className="mb-4">
            {status === 'loading' && (
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-600 mx-auto" />
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {status === 'loading' && `Verbinde mit ${getPortalName(portal || '')}...`}
            {status === 'success' && 'Verbindung erfolgreich!'}
            {status === 'error' && 'Verbindung fehlgeschlagen'}
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          {/* Status-specific content */}
          {status === 'loading' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Bitte warten Sie, während wir Ihre Verbindung einrichten...
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-sm text-green-600 dark:text-green-400">
                Sie werden automatisch weitergeleitet...
              </div>
              <button
                onClick={() => navigate('/properties')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Zurück zu Immobilien
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/properties')}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Zurück zu Immobilien
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-2"
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
