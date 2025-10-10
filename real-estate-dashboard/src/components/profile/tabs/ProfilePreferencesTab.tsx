import React from 'react';
import { Save } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton } from '../../admin/GlassUI';

interface Preferences {
  language: string;
  timezone: string;
  currency: string;
  theme: string;
  compactLayout: boolean;
  animationsEnabled: boolean;
}

// Mock hook for preferences
const useUserPreferencesMock = () => {
  const preferences: Preferences = {
    language: 'de',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    theme: 'auto',
    compactLayout: false,
    animationsEnabled: true
  };
  
  const updatePreferences = (updates: Partial<Preferences>) => {
    console.log('Updating preferences:', updates);
    return Promise.resolve();
  };
  
  return { preferences, updatePreferences };
};

const ProfilePreferencesTab: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferencesMock();

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Präferenzen</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sprache</label>
            <select value={preferences.language} onChange={(e) => updatePreferences({ language: e.target.value as any })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zeitzone</label>
            <select value={preferences.timezone} onChange={(e) => updatePreferences({ timezone: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <option value="Europe/Berlin">Europa/Berlin</option>
              <option value="Europe/London">Europa/London</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Währung</label>
            <select value={preferences.currency} onChange={(e) => updatePreferences({ currency: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
            <select value={preferences.theme} onChange={(e) => updatePreferences({ theme: e.target.value as any })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
              <option value="auto">Automatisch</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={preferences.compactLayout} onChange={(e) => updatePreferences({ compactLayout: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
            <span className="text-gray-700 dark:text-gray-300">Kompaktes Layout</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={preferences.animationsEnabled} onChange={(e) => updatePreferences({ animationsEnabled: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
            <span className="text-gray-700 dark:text-gray-300">Animationen aktiviert</span>
          </label>
        </div>
        <GlassButton variant="primary" icon={Save}>Einstellungen speichern</GlassButton>
      </div>
    </GlassCard>
  );
};

export default ProfilePreferencesTab;
