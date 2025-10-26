/**
 * OAuth Connect Modal Component
 * Modal zum Verbinden von Social Media Konten über OAuth
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Button } from '../../common/Button';
import { 
  Facebook, 
  Instagram, 
  Music, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { SocialPlatform } from '../Types';
import { socialApi } from '../../../api/social';

interface OAuthConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (platform: SocialPlatform, account: any) => void;
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Verbinden Sie Ihr Facebook-Konto für Posts und Analytics',
    scopes: ['Seiten verwalten', 'Engagement lesen', 'Instagram Basic']
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Verbinden Sie Ihr Instagram-Konto für Posts und Stories',
    scopes: ['Profil lesen', 'Medien verwalten', 'Stories posten']
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    description: 'Verbinden Sie Ihr TikTok-Konto für Video-Posts',
    scopes: ['Profil lesen', 'Videos posten', 'Analytics']
  }
};

const OAuthConnectModal: React.FC<OAuthConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platform: SocialPlatform) => {
    setConnectingPlatform(platform);
    setError(null);

    try {
      // Start OAuth flow using the API
      const data = await socialApi.startOAuthFlow(platform);
      
      // Open OAuth window
      const oauthWindow = window.open(
        data.auth_url,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (oauthWindow?.closed) {
          clearInterval(checkClosed);
          setConnectingPlatform(null);
          
          // Check if account was connected successfully
          // This would typically be handled by a callback or polling
          setTimeout(() => {
            // Simulate successful connection
            onSuccess(platform, {
              id: `${platform}_${Date.now()}`,
              platform,
              account_name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
              is_active: true
            });
            onClose();
          }, 1000);
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
      setConnectingPlatform(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">+</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Neues Social Media Konto hinzufügen
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Wählen Sie eine Plattform, um loszulegen
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          )}

          <div className="grid gap-4">
            {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
              const IconComponent = config.icon;
              const isConnecting = connectingPlatform === platform;
              
              return (
                <div
                  key={platform}
                  className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                    isConnecting 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{config.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {config.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {config.scopes.map((scope, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleConnect(platform as SocialPlatform)}
                      disabled={isConnecting || connectingPlatform !== null}
                      className="min-w-[120px]"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verbinde...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Verbinden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConnectModal;
