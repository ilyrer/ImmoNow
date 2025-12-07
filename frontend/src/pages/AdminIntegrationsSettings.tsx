/**
 * Admin Integrations Settings Page
 * 
 * Provides secure management of API keys and integration settings
 * for Google Maps, ImmoScout24, and other third-party services.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Key, 
  MapPin, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  TestTube,
  ExternalLink,
  Info,
  Shield,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminSettingsService, IntegrationSettings, IntegrationSettingsUpdate } from '../services/adminSettings';

const AdminIntegrationsSettings: React.FC = () => {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<IntegrationSettingsUpdate>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await AdminSettingsService.getIntegrationSettings();
      setSettings(response);
    } catch (error: any) {
      console.error('Error loading integration settings:', error);
      toast.error('Fehler beim Laden der Integrationseinstellungen');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await AdminSettingsService.updateIntegrationSettings(formData);
      toast.success('Integrationseinstellungen erfolgreich gespeichert!');
      await loadSettings();
      setFormData({});
    } catch (error: any) {
      console.error('Error saving integration settings:', error);
      toast.error('Fehler beim Speichern der Integrationseinstellungen');
    } finally {
      setSaving(false);
    }
  };

  const testGoogleMaps = async () => {
    const apiKey = formData.google_maps_api_key || settings?.google_maps_api_key;
    if (!apiKey) {
      toast.error('Bitte geben Sie einen Google Maps API-Schlüssel ein');
      return;
    }

    try {
      setTesting('google-maps');
      const response = await AdminSettingsService.testGoogleMapsApiKey(apiKey);
      
      if (response.status === 'success') {
        toast.success('Google Maps API-Schlüssel ist gültig!');
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error testing Google Maps:', error);
      toast.error('Fehler beim Testen des Google Maps API-Schlüssels');
    } finally {
      setTesting(null);
    }
  };

  const testImmoScout = async () => {
    const clientId = formData.immoscout_client_id || settings?.immoscout_client_id;
    const clientSecret = formData.immoscout_client_secret || settings?.immoscout_client_secret;
    
    if (!clientId || !clientSecret) {
      toast.error('Bitte geben Sie Client ID und Client Secret ein');
      return;
    }

    try {
      setTesting('immoscout');
      const response = await AdminSettingsService.testImmoScoutCredentials(clientId, clientSecret);
      
      if (response.status === 'success') {
        toast.success('ImmoScout24 API-Zugangsdaten sind gültig!');
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error testing ImmoScout24:', error);
      toast.error('Fehler beim Testen der ImmoScout24 API-Zugangsdaten');
    } finally {
      setTesting(null);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateFormData = (field: keyof IntegrationSettingsUpdate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Integrationseinstellungen
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalten Sie API-Schlüssel und Integrationen für externe Dienste
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Sicherheitshinweis
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Alle API-Schlüssel werden verschlüsselt gespeichert und sind nur für Administratoren sichtbar. 
                Maskierte Schlüssel werden zur Anzeige verwendet.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Google Maps Integration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Google Maps</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kartenintegration und Geocoding</p>
              </div>
              <div className="ml-auto">
                {settings?.google_maps_configured ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Konfiguriert</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Nicht konfiguriert</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API-Schlüssel
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.google_maps ? 'text' : 'password'}
                    value={formData.google_maps_api_key || ''}
                    onChange={(e) => updateFormData('google_maps_api_key', e.target.value)}
                    placeholder={settings?.google_maps_api_key || 'AIza...'}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('google_maps')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets.google_maps ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktuell: {settings?.google_maps_api_key || 'Nicht gesetzt'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testGoogleMaps}
                  disabled={testing === 'google-maps'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <TestTube className="h-4 w-4" />
                  {testing === 'google-maps' ? 'Teste...' : 'Testen'}
                </button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Console
                </a>
              </div>
            </div>
          </motion.div>

          {/* ImmoScout24 Integration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">ImmoScout24</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Immobilienveröffentlichung</p>
              </div>
              <div className="ml-auto">
                {settings?.immoscout_configured ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Konfiguriert</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Nicht konfiguriert</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client ID
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.immoscout_client_id ? 'text' : 'password'}
                    value={formData.immoscout_client_id || ''}
                    onChange={(e) => updateFormData('immoscout_client_id', e.target.value)}
                    placeholder={settings?.immoscout_client_id || 'IS24-...'}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('immoscout_client_id')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets.immoscout_client_id ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktuell: {settings?.immoscout_client_id || 'Nicht gesetzt'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.immoscout_client_secret ? 'text' : 'password'}
                    value={formData.immoscout_client_secret || ''}
                    onChange={(e) => updateFormData('immoscout_client_secret', e.target.value)}
                    placeholder={settings?.immoscout_client_secret || '••••••••'}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('immoscout_client_secret')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecrets.immoscout_client_secret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktuell: {settings?.immoscout_client_secret || 'Nicht gesetzt'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testImmoScout}
                  disabled={testing === 'immoscout'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <TestTube className="h-4 w-4" />
                  {testing === 'immoscout' ? 'Teste...' : 'Testen'}
                </button>
                <a
                  href="https://api.immobilienscout24.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  API Docs
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-end"
        >
          <button
            onClick={saveSettings}
            disabled={saving || Object.keys(formData).length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </motion.div>

        {/* Additional Integrations Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Weitere Integrationen</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Immowelt, eBay Kleinanzeigen und mehr</p>
            </div>
          </div>
          
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Weitere Integrationen werden in zukünftigen Updates verfügbar sein.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminIntegrationsSettings;
