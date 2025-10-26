import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, 
  AlertCircle, Play, Pause, Settings, Eye, Calendar,
  TrendingUp, BarChart3, Download, Upload, Link, Unlink,
  User, Mail, Key, Shield
} from 'lucide-react';
import { PropertyResponse } from '../../types/property';
import { propertiesService } from '../../services/properties';
import toast from 'react-hot-toast';

interface PortalExportTabProps {
  property: PropertyResponse;
  onUpdate: (updates: Partial<PropertyResponse>) => Promise<void>;
}

interface PortalStatus {
  status: 'not_published' | 'published' | 'pending' | 'error' | 'draft';
  last_sync: string | null;
  error_message?: string;
  views?: number;
  inquiries?: number;
}

interface PortalData {
  immoscout24: PortalStatus;
  immowelt: PortalStatus;
  kleinanzeigen: PortalStatus;
}

interface PortalConnection {
  id: string;
  portal: string;
  portal_user_id: string;
  portal_username?: string;
  portal_email?: string;
  is_active: boolean;
  last_sync_at?: string;
  last_error?: string;
}

interface PortalCardProps {
  name: string;
  status: PortalStatus;
  connection?: PortalConnection;
  onPublish: () => void;
  onSync: () => void;
  onPause: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
}

const PortalCard: React.FC<PortalCardProps> = ({ 
  name, 
  status, 
  connection,
  onPublish, 
  onSync, 
  onPause, 
  onConnect,
  onDisconnect,
  isLoading 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'draft': return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default: return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Veröffentlicht';
      case 'pending': return 'Wird veröffentlicht';
      case 'error': return 'Fehler';
      case 'draft': return 'Entwurf';
      default: return 'Nicht veröffentlicht';
    }
  };

  const getPortalIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'immoscout24': return '🏠';
      case 'immowelt': return '🏢';
      case 'kleinanzeigen': return '📱';
      default: return '🌐';
    }
  };

  const isConnected = connection?.is_active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getPortalIcon(name)}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">Verbunden</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Unlink className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Nicht verbunden</span>
                </div>
              )}
              {status.status !== 'not_published' && (
                <>
                  {getStatusIcon(status.status)}
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                    {getStatusLabel(status.status)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isConnected ? (
            <>
              <button
                onClick={onSync}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onDisconnect}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Unlink className="w-4 h-4 text-red-500" />
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Link className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>
      </div>

      {/* Connection Info */}
      {isConnected && connection && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>{connection.portal_username || connection.portal_user_id}</span>
            {connection.portal_email && (
              <>
                <Mail className="w-4 h-4 ml-2" />
                <span>{connection.portal_email}</span>
              </>
            )}
          </div>
          {connection.last_sync_at && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Calendar className="w-4 h-4" />
              <span>Letzte Synchronisation: {new Date(connection.last_sync_at).toLocaleString('de-DE')}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {isConnected && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {status.views || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Aufrufe</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {status.inquiries || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Anfragen</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status.error_message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              {status.error_message}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        {!isConnected ? (
          <button
            onClick={onConnect}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Link className="w-4 h-4" />
            <span>Verbinden</span>
          </button>
        ) : status.status === 'not_published' || status.status === 'draft' ? (
          <button
            onClick={onPublish}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Veröffentlichen</span>
          </button>
        ) : status.status === 'published' ? (
          <>
            <button
              onClick={onPause}
              className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center justify-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pausieren</span>
            </button>
            <button
              onClick={onSync}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aktualisieren</span>
            </button>
          </>
        ) : (
          <button
            onClick={onSync}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Erneut versuchen</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

const PortalExportTab: React.FC<PortalExportTabProps> = ({ property, onUpdate }) => {
  const [portalData, setPortalData] = useState<PortalData>({
    immoscout24: { status: 'not_published', last_sync: null },
    immowelt: { status: 'not_published', last_sync: null },
    kleinanzeigen: { status: 'not_published', last_sync: null },
  });
  const [connections, setConnections] = useState<PortalConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);

  // Load portal status and connections
  useEffect(() => {
    loadPortalData();
  }, [property.id]);

  const loadPortalData = async () => {
    try {
      setIsLoading(true);
      const [statusData, connectionsData] = await Promise.all([
        propertiesService.getPortalStatus(property.id),
        propertiesService.getPortalConnections(),
      ]);
      setPortalData(statusData);
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading portal data:', error);
      toast.error('Fehler beim Laden der Portal-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (portal: string) => {
    try {
      const redirectUri = `${window.location.origin}/oauth/callback/${portal}`;
      const oauthData = await propertiesService.initiatePortalOAuth(portal, redirectUri);
      
      // OAuth-Flow starten
      window.location.href = oauthData.auth_url;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error(`Fehler beim Verbinden mit ${portal}`);
    }
  };

  const handleDisconnect = async (portal: string) => {
    if (!window.confirm(`Möchten Sie die Verbindung zu ${portal} wirklich trennen?`)) {
      return;
    }

    try {
      await propertiesService.deletePortalConnection(portal);
      await loadPortalData();
      toast.success(`Verbindung zu ${portal} getrennt`);
    } catch (error) {
      console.error('Error disconnecting portal:', error);
      toast.error(`Fehler beim Trennen der Verbindung zu ${portal}`);
    }
  };

  const handlePublish = async (portal: string) => {
    try {
      setLoadingPortal(portal);
      await propertiesService.publishToPortal(property.id, portal);
      await loadPortalData();
      toast.success(`${portal} erfolgreich veröffentlicht`);
    } catch (error) {
      console.error('Error publishing to portal:', error);
      toast.error(`Fehler beim Veröffentlichen auf ${portal}`);
    } finally {
      setLoadingPortal(null);
    }
  };

  const handleSync = async (portal: string) => {
    try {
      setLoadingPortal(portal);
      await propertiesService.syncPortal(property.id, portal);
      await loadPortalData();
      toast.success(`${portal} erfolgreich synchronisiert`);
    } catch (error) {
      console.error('Error syncing portal:', error);
      toast.error(`Fehler beim Synchronisieren von ${portal}`);
    } finally {
      setLoadingPortal(null);
    }
  };

  const handlePause = async (portal: string) => {
    try {
      setLoadingPortal(portal);
      await propertiesService.unpublishFromPortal(property.id, portal);
      await loadPortalData();
      toast.success(`${portal} pausiert`);
    } catch (error) {
      console.error('Error pausing portal:', error);
      toast.error(`Fehler beim Pausieren von ${portal}`);
    } finally {
      setLoadingPortal(null);
    }
  };

  const getConnectionForPortal = (portal: string): PortalConnection | undefined => {
    return connections.find(conn => conn.portal === portal);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portal-Veröffentlichung
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verwalten Sie die Veröffentlichung auf verschiedenen Immobilienportalen
          </p>
        </div>
        
        <button
          onClick={loadPortalData}
          className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </button>
      </div>

      {/* Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PortalCard
          name="Immoscout24"
          status={portalData.immoscout24}
          connection={getConnectionForPortal('immoscout24')}
          onPublish={() => handlePublish('immoscout24')}
          onSync={() => handleSync('immoscout24')}
          onPause={() => handlePause('immoscout24')}
          onConnect={() => handleConnect('immoscout24')}
          onDisconnect={() => handleDisconnect('immoscout24')}
          isLoading={loadingPortal === 'immoscout24'}
        />
        
        <PortalCard
          name="Immowelt"
          status={portalData.immowelt}
          connection={getConnectionForPortal('immowelt')}
          onPublish={() => handlePublish('immowelt')}
          onSync={() => handleSync('immowelt')}
          onPause={() => handlePause('immowelt')}
          onConnect={() => handleConnect('immowelt')}
          onDisconnect={() => handleDisconnect('immowelt')}
          isLoading={loadingPortal === 'immowelt'}
        />
        
        <PortalCard
          name="Kleinanzeigen"
          status={portalData.kleinanzeigen}
          connection={getConnectionForPortal('kleinanzeigen')}
          onPublish={() => handlePublish('kleinanzeigen')}
          onSync={() => handleSync('kleinanzeigen')}
          onPause={() => handlePause('kleinanzeigen')}
          onConnect={() => handleConnect('kleinanzeigen')}
          onDisconnect={() => handleDisconnect('kleinanzeigen')}
          isLoading={loadingPortal === 'kleinanzeigen'}
        />
      </div>

      {/* Connection Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Verbindungsstatus
        </h4>
        
        <div className="space-y-3">
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <Unlink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Keine Portal-Verbindungen
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Verbinden Sie sich mit Immobilienportalen, um Ihre Immobilien zu veröffentlichen
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => handleConnect('immoscout24')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Immoscout24 verbinden
                </button>
                <button
                  onClick={() => handleConnect('immowelt')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Immowelt verbinden
                </button>
                <button
                  onClick={() => handleConnect('kleinanzeigen')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Kleinanzeigen verbinden
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <div key={connection.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-lg">
                      {connection.portal === 'immoscout24' ? '🏠' : 
                       connection.portal === 'immowelt' ? '🏢' : '📱'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {connection.portal}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {connection.portal_username || connection.portal_user_id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Aktiv</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Bulk-Aktionen
        </h4>
        
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Alle veröffentlichen
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            Alle synchronisieren
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            <Pause className="w-4 h-4 mr-2" />
            Alle pausieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalExportTab;
