import React from 'react';
import { Building2, Save, Upload } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton } from '../GlassUI';

// Mock hook for backward compatibility
const useOrgSettingsMock = () => {
  const settings = {
    companyName: 'Example Company',
    legalName: 'Example Company GmbH',
    email: 'contact@example.com',
    phone: '+49 123 456789',
    address: {
      street: 'Musterstraße 123',
      city: 'Musterstadt',
      zipCode: '12345',
      postalCode: '12345',
      country: 'Deutschland'
    },
    website: 'https://example.com',
    logo: null,
    taxId: 'DE123456789',
    registrationNumber: 'HRB 12345',
    ceo: 'Max Mustermann',
    foundedYear: '2020',
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logoUrl: null
    },
    defaults: {
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      language: 'de'
    },
    integrations: {
      google: { enabled: false },
      microsoft: { enabled: false },
      slack: { enabled: false }
    }
  };

  const updateSettings = async (data: any) => {
    console.warn('Mock updateSettings called');
    return { success: true };
  };

  return {
    settings,
    updateSettings
  };
};

const OrganizationTab: React.FC = () => {
  const { settings, updateSettings } = useOrgSettingsMock();

  return (
    <div className="space-y-6">
      {/* Company Profile */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Firmenprofil</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Firmenname
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => updateSettings({ companyName: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rechtlicher Name
            </label>
            <input
              type="text"
              value={settings.legalName}
              onChange={(e) => updateSettings({ legalName: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Steuernummer
            </label>
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => updateSettings({ taxId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo
            </label>
            <GlassButton variant="secondary" icon={Upload} size="sm">
              Logo hochladen
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Address */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Straße
            </label>
            <input
              type="text"
              value={settings.address?.street}
              onChange={(e) => updateSettings({ address: { ...settings.address!, street: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stadt
            </label>
            <input
              type="text"
              value={settings.address?.city}
              onChange={(e) => updateSettings({ address: { ...settings.address!, city: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PLZ
            </label>
            <input
              type="text"
              value={settings.address?.postalCode}
              onChange={(e) => updateSettings({ address: { ...settings.address!, postalCode: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
        </div>
      </GlassCard>

      {/* Branding */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primärfarbe
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.branding?.primaryColor}
                onChange={(e) => updateSettings({ branding: { ...settings.branding!, primaryColor: e.target.value } })}
                className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={settings.branding?.primaryColor}
                readOnly
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sekundärfarbe
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.branding?.secondaryColor}
                onChange={(e) => updateSettings({ branding: { ...settings.branding!, secondaryColor: e.target.value } })}
                className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                value={settings.branding?.secondaryColor}
                readOnly
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Defaults */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Standardeinstellungen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Währung
            </label>
            <select
              value={settings.defaults?.currency}
              onChange={(e) => updateSettings({ defaults: { ...settings.defaults!, currency: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zeitzone
            </label>
            <select
              value={settings.defaults?.timezone}
              onChange={(e) => updateSettings({ defaults: { ...settings.defaults!, timezone: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="Europe/Berlin">Europa/Berlin</option>
              <option value="Europe/London">Europa/London</option>
              <option value="America/New_York">Amerika/New York</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sprache
            </label>
            <select
              value={settings.defaults?.language}
              onChange={(e) => updateSettings({ defaults: { ...settings.defaults!, language: e.target.value } })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Integrations */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Integrationen</h3>
        <div className="space-y-4">
          {[
            { key: 'google', label: 'Google Workspace', icon: '🔍' },
            { key: 'outlook', label: 'Microsoft Outlook', icon: '📧' },
            { key: 'portals', label: 'Immobilienportale', icon: '🏠' },
            { key: 'push', label: 'Push-Benachrichtigungen', icon: '🔔' },
          ].map(integration => (
            <div key={integration.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white">{integration.label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings.integrations as any)?.[integration.key]?.enabled || false}
                  onChange={(e) => updateSettings({
                    integrations: {
                      ...settings.integrations,
                      [integration.key]: { enabled: e.target.checked }
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex gap-3">
        <GlassButton variant="primary" icon={Save} className="flex-1">
          Einstellungen speichern
        </GlassButton>
      </div>
    </div>
  );
};

export default OrganizationTab;
