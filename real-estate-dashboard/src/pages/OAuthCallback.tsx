/**
 * OAuth Callback Page
 * Behandelt OAuth-Callbacks von Social Media Plattformen
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/common/Card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
        setMessage(errorDescription || 'OAuth-Autorisierung fehlgeschlagen');
        setTimeout(() => navigate('/social-hub'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Fehlende OAuth-Parameter');
        setTimeout(() => navigate('/social-hub'), 3000);
        return;
      }

      try {
        // Extract platform from state or URL
        const platform = window.location.pathname.split('/').pop()?.replace('-callback', '');
        
        if (!platform) {
          throw new Error('Plattform nicht erkannt');
        }

        // Send callback to backend
        const response = await fetch(`/api/v1/social/oauth/${platform}/callback?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('OAuth-Callback-Verarbeitung fehlgeschlagen');
        }

        const account = await response.json();
        
        setStatus('success');
        setMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)}-Konto erfolgreich verbunden!`);
        
        // Close OAuth window and notify parent
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              platform,
              account
            }, window.location.origin);
            window.close();
          } else {
            navigate('/social-hub');
          }
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unbekannter Fehler');
        setTimeout(() => navigate('/social-hub'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
              <h2 className="text-xl font-semibold mb-2">Verbindung wird hergestellt...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Bitte warten Sie, während wir Ihr Social Media Konto verbinden.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">
                Erfolgreich verbunden!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Dieses Fenster schließt sich automatisch...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">
                Verbindung fehlgeschlagen
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Sie werden zur Social Hub weitergeleitet...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
