import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/config';
import { toast } from 'react-hot-toast';

interface PortalConfig {
  id: string;
  portal_name: string;
  portal_display_name: string;
  status: string;
  auto_sync: boolean;
  sync_images: boolean;
  max_images: number;
  last_sync: string | null;
  error_message: string | null;
  created_at: string;
}

interface PortalListing {
  id: string;
  property_title: string;
  property_id: string;
  portal_name: string;
  portal_display_name: string;
  status: string;
  external_id: string | null;
  external_url: string | null;
  last_sync: string | null;
  views: number;
  inquiries: number;
  created_at: string;
}

interface PortalAnalytics {
  total_listings: number;
  total_views: number;
  total_inquiries: number;
  portal_stats: Record<string, {
    listings: number;
    views: number;
    inquiries: number;
    active_listings: number;
  }>;
}

const IntegrationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'configurations' | 'listings' | 'analytics'>('configurations');
  const [configurations, setConfigurations] = useState<PortalConfig[]>([]);
  const [listings, setListings] = useState<PortalListing[]>([]);
  const [analytics, setAnalytics] = useState<PortalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateConfig, setShowCreateConfig] = useState(false);

  // New configuration form
  const [newConfig, setNewConfig] = useState({
    portal_name: 'immoscout24',
    api_key: '',
    api_secret: '',
    username: '',
    password: '',
    base_url: '',
    auto_sync: true,
    sync_images: true,
    max_images: 20
  });

  const tabs = [
    { id: 'configurations', label: 'Konfigurationen', icon: 'ri-settings-line' },
    { id: 'listings', label: 'Listings', icon: 'ri-list-check' },
    { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' }
  ];

  const portalOptions = [
    { value: 'immoscout24', label: 'ImmoScout24', icon: '🏠' },
    { value: 'immowelt', label: 'Immowelt', icon: '🌍' },
    { value: 'immonet', label: 'Immonet', icon: '🔗' },
    { value: 'ebay_kleinanzeigen', label: 'eBay Kleinanzeigen', icon: '📱' },
    { value: 'facebook_marketplace', label: 'Facebook Marketplace', icon: '📘' }
  ];

  // Load data
  useEffect(() => {
    if (activeTab === 'configurations') {
      loadConfigurations();
    } else if (activeTab === 'listings') {
      loadListings();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portals/portal-integration/configurations');
      if (response.data.success) {
        setConfigurations(response.data.configurations);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Fehler beim Laden der Konfigurationen');
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portals/portal-integration/listings');
      if (response.data.success) {
        setListings(response.data.listings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Fehler beim Laden der Listings');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portals/portal-integration/analytics?days=30');
      if (response.data.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Fehler beim Laden der Analytics');
    } finally {
      setLoading(false);
    }
  };

  const createConfiguration = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/portals/portal-integration/configurations', newConfig);
      if (response.data.success) {
        toast.success('Konfiguration erfolgreich erstellt');
        setShowCreateConfig(false);
        setNewConfig({
          portal_name: 'immoscout24',
          api_key: '',
          api_secret: '',
          username: '',
          password: '',
          base_url: '',
          auto_sync: true,
          sync_images: true,
          max_images: 20
        });
        loadConfigurations();
      }
    } catch (error: any) {
      console.error('Error creating configuration:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen der Konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const toggleConfiguration = async (configId: string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/portals/portal-integration/configurations/${configId}`, {
        status: newStatus
      });
      if (response.data.success) {
        toast.success(`Konfiguration ${newStatus === 'active' ? 'aktiviert' : 'deaktiviert'}`);
        loadConfigurations();
      }
    } catch (error: any) {
      console.error('Error toggling configuration:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Ändern der Konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const testConfiguration = async (configId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/portals/portal-integration/configurations/${configId}/test`);
      if (response.data.success) {
        toast.success('Verbindung erfolgreich getestet');
      } else {
        toast.error('Verbindungstest fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Error testing configuration:', error);
      toast.error(error.response?.data?.detail || 'Verbindungstest fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const syncConfiguration = async (configId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/portals/portal-integration/configurations/${configId}/sync`);
      if (response.data.success) {
        toast.success(`${response.data.synced_count} Immobilien synchronisiert`);
        loadListings();
      }
    } catch (error: any) {
      console.error('Error syncing configuration:', error);
      toast.error(error.response?.data?.detail || 'Synchronisation fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'configurations':
        return (
          <div className="space-y-6">
            {/* Configuration Creation Modal */}
            {showCreateConfig && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Neue Portal-Integration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Portal</label>
                      <select
                        value={newConfig.portal_name}
                        onChange={(e) => setNewConfig({...newConfig, portal_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {portalOptions.map((portal) => (
                          <option key={portal.value} value={portal.value}>
                            {portal.icon} {portal.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                        <input
                          type="text"
                          value={newConfig.api_key}
                          onChange={(e) => setNewConfig({...newConfig, api_key: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="API Schlüssel"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Secret</label>
                        <input
                          type="password"
                          value={newConfig.api_secret}
                          onChange={(e) => setNewConfig({...newConfig, api_secret: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="API Secret"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Benutzername</label>
                        <input
                          type="text"
                          value={newConfig.username}
                          onChange={(e) => setNewConfig({...newConfig, username: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Portal-Benutzername"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passwort</label>
                        <input
                          type="password"
                          value={newConfig.password}
                          onChange={(e) => setNewConfig({...newConfig, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Portal-Passwort"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Basis-URL (optional)</label>
                      <input
                        type="url"
                        value={newConfig.base_url}
                        onChange={(e) => setNewConfig({...newConfig, base_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://api.portal.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newConfig.auto_sync}
                          onChange={(e) => setNewConfig({...newConfig, auto_sync: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Auto-Sync</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newConfig.sync_images}
                          onChange={(e) => setNewConfig({...newConfig, sync_images: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Bilder synchronisieren</span>
                      </label>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max. Bilder</label>
                        <input
                          type="number"
                          value={newConfig.max_images}
                          onChange={(e) => setNewConfig({...newConfig, max_images: parseInt(e.target.value)})}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={() => setShowCreateConfig(false)}>Abbrechen</Button>
                    <Button onClick={createConfiguration} disabled={loading}>
                      {loading ? 'Erstelle...' : 'Erstellen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Portal Configurations */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portal-Konfigurationen</h3>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setShowCreateConfig(true)}
                  >
                    <i className="ri-add-line mr-2"></i>
                    Neue Integration
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {configurations.map((config) => (
                      <div key={config.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {portalOptions.find(p => p.value === config.portal_name)?.icon || '🏠'}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {config.portal_display_name}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    config.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    config.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {config.status === 'active' ? 'Aktiv' :
                                     config.status === 'inactive' ? 'Inaktiv' : 'Fehler'}
                                  </span>
                                  {config.auto_sync && <span>Auto-Sync aktiviert</span>}
                                  {config.last_sync && (
                                    <span>Letzte Sync: {new Date(config.last_sync).toLocaleDateString()}</span>
                                  )}
                                </div>
                                {config.error_message && (
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    {config.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => testConfiguration(config.id)}
                              disabled={loading}
                            >
                              <i className="ri-wifi-line mr-1"></i>
                              Test
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => syncConfiguration(config.id)}
                              disabled={loading || config.status !== 'active'}
                            >
                              <i className="ri-refresh-line mr-1"></i>
                              Sync
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleConfiguration(
                                config.id, 
                                config.status === 'active' ? 'inactive' : 'active'
                              )}
                              disabled={loading}
                              className={config.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            >
                              {config.status === 'active' ? (
                                <>
                                  <i className="ri-pause-line mr-1"></i>
                                  Deaktivieren
                                </>
                              ) : (
                                <>
                                  <i className="ri-play-line mr-1"></i>
                                  Aktivieren
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {configurations.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="ri-links-line text-4xl mb-4"></i>
                        <p>Noch keine Portal-Integrationen konfiguriert</p>
                        <p className="text-sm mt-1">Verbinden Sie Ihre Immobilien mit führenden Portalen</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'listings':
        return (
          <div className="space-y-6">
            {/* Portal Listings */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portal Listings</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={loadListings}>
                      <i className="ri-refresh-line mr-2"></i>
                      Aktualisieren
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg">
                                {portalOptions.find(p => p.value === listing.portal_name)?.icon || '🏠'}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {listing.property_title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {listing.portal_display_name}
                                  {listing.external_id && ` • ID: ${listing.external_id}`}
                                </p>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    listing.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                  }`}>
                                    {listing.status === 'active' ? 'Aktiv' :
                                     listing.status === 'pending' ? 'Ausstehend' : listing.status}
                                  </span>
                                  <span>{listing.views} Aufrufe</span>
                                  <span>{listing.inquiries} Anfragen</span>
                                  {listing.last_sync && (
                                    <span>Sync: {new Date(listing.last_sync).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {listing.external_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(listing.external_url!, '_blank')}
                              >
                                <i className="ri-external-link-line mr-1"></i>
                                Ansehen
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <i className="ri-edit-line mr-1"></i>
                              Bearbeiten
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {listings.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="ri-list-check text-4xl mb-4"></i>
                        <p>Noch keine Listings vorhanden</p>
                        <p className="text-sm mt-1">Synchronisieren Sie Ihre Immobilien mit den Portalen</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Dashboard */}
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                          <i className="ri-list-check text-xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktive Listings</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {analytics.total_listings}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Gesamt</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                          <i className="ri-eye-line text-xl text-green-600 dark:text-green-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aufrufe</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {analytics.total_views.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {analytics.total_listings > 0 ? 
                              Math.round(analytics.total_views / analytics.total_listings) : 0} ⌀ pro Listing
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                          <i className="ri-mail-line text-xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anfragen</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {analytics.total_inquiries}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {analytics.total_views > 0 ? 
                              ((analytics.total_inquiries / analytics.total_views) * 100).toFixed(1) : 0}% Conversion
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Portal Performance */}
                <Card className="bg-white dark:bg-gray-800">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portal Performance</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.portal_stats).map(([portalName, stats]) => (
                        <div key={portalName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-xl">
                              {portalOptions.find(p => p.value === portalName)?.icon || '🏠'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {portalOptions.find(p => p.value === portalName)?.label || portalName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {stats.active_listings} aktive Listings
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex space-x-4 text-sm">
                              <span className="text-green-600 dark:text-green-400">
                                {stats.views} Aufrufe
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {stats.inquiries} Anfragen
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}

            {!analytics && loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Portal Integrationen</h1>
          <p className="text-gray-600 dark:text-gray-400">Verbinden Sie Ihre Immobilien mit führenden Portalen wie ImmoScout24 und Immowelt</p>
        </div>
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default IntegrationsPage;
