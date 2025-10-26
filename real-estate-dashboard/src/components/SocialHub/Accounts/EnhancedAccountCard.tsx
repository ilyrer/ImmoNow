/**
 * Enhanced Account Management Component
 * Erweiterte Verwaltung von Social Media Konten mit OAuth und API-Integration
 */

import React, { useState } from 'react';
import { Card, CardContent } from '../../common/Card';
import { Button } from '../../common/Button';
import { 
  RefreshCw, 
  TestTube, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Settings,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { SocialAccount } from '../../../api/social';
import { socialApi } from '../../../api/social';
import { PLATFORM_INFO } from './types';

interface EnhancedAccountCardProps {
  account: SocialAccount;
  onUpdate: () => void;
  onDisconnect: (accountId: string) => void;
}

const EnhancedAccountCard: React.FC<EnhancedAccountCardProps> = ({
  account,
  onUpdate,
  onDisconnect
}) => {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const platformInfo = PLATFORM_INFO[account.platform as keyof typeof PLATFORM_INFO];

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus('idle');
    
    try {
      const result = await socialApi.testAccountConnection(account.id);
      setStatus(result.connected ? 'success' : 'error');
      setMessage(result.connected ? 'Verbindung erfolgreich!' : 'Verbindung fehlgeschlagen');
    } catch (error) {
      setStatus('error');
      setMessage('Test fehlgeschlagen');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setStatus('idle');
    
    try {
      await socialApi.syncAccountData(account.id);
      setStatus('success');
      setMessage('Daten erfolgreich synchronisiert!');
      onUpdate();
    } catch (error) {
      setStatus('error');
      setMessage('Synchronisation fehlgeschlagen');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    setStatus('idle');
    
    try {
      await socialApi.refreshOAuthToken(account.platform, account.id);
      setStatus('success');
      setMessage('Token erfolgreich aktualisiert!');
    } catch (error) {
      setStatus('error');
      setMessage('Token-Aktualisierung fehlgeschlagen');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm(`Möchten Sie ${platformInfo.name} wirklich trennen?`)) {
      onDisconnect(account.id);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${platformInfo.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${platformInfo.icon} text-2xl ${platformInfo.color}`}></i>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{account.account_name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {platformInfo.name} • {account.account_id}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  account.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {account.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
                {account.last_sync && (
                  <span className="text-xs text-gray-500">
                    Zuletzt synchronisiert: {new Date(account.last_sync).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncData}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshToken}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            status === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : status === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}>
            {getStatusIcon()}
            <span className={`text-sm ${
              status === 'success' 
                ? 'text-green-800 dark:text-green-200'
                : status === 'error'
                ? 'text-red-800 dark:text-red-200'
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {message}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Plattform:</span>
            <span className="ml-2 font-medium">{platformInfo.name}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Account ID:</span>
            <span className="ml-2 font-mono text-xs">{account.account_id}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Erstellt:</span>
            <span className="ml-2">{new Date(account.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`ml-2 font-medium ${
              account.status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>
              {account.status === 'active' ? 'Verbunden' : 'Getrennt'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAccountCard;
