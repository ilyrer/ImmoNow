import React, { useState, useEffect } from 'react';
import { Save, Globe, Clock, DollarSign, Palette, Layout, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard, GlassButton } from '../../admin/GlassUI';
import { useProfile, useUpdateProfile } from '../../../api/hooks';
import { toast } from 'react-hot-toast';

interface Preferences {
  language: string;
  timezone: string;
  currency: string;
  theme: string;
  compactLayout: boolean;
  animationsEnabled: boolean;
}

const ProfilePreferencesTab: React.FC = () => {
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'de',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    theme: 'auto',
    compactLayout: false,
    animationsEnabled: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize preferences from profile
  useEffect(() => {
    if (profile) {
      setPreferences(prev => ({
        ...prev,
        language: profile.language || 'de',
        timezone: profile.timezone || 'Europe/Berlin',
      }));
    }
  }, [profile]);

  const handlePreferenceChange = (key: keyof Preferences, value: string | boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        language: preferences.language,
        timezone: preferences.timezone,
      });
      
      // Save other preferences to localStorage
      localStorage.setItem('userPreferences', JSON.stringify({
        currency: preferences.currency,
        theme: preferences.theme,
        compactLayout: preferences.compactLayout,
        animationsEnabled: preferences.animationsEnabled,
      }));
      
      setHasChanges(false);
      toast.success('Präferenzen erfolgreich gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern der Präferenzen');
    }
  };

  const preferenceCategories = [
    {
      title: 'Sprache & Region',
      description: 'Sprache und Zeitzone-Einstellungen',
      icon: Globe,
      items: [
        {
          key: 'language' as keyof Preferences,
          label: 'Sprache',
          description: 'Wählen Sie Ihre bevorzugte Sprache',
          type: 'select' as const,
          options: [
            { value: 'de', label: 'Deutsch' },
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'Français' },
            { value: 'es', label: 'Español' },
          ],
        },
        {
          key: 'timezone' as keyof Preferences,
          label: 'Zeitzone',
          description: 'Wählen Sie Ihre Zeitzone',
          type: 'select' as const,
          options: [
            { value: 'Europe/Berlin', label: 'Europa/Berlin' },
            { value: 'Europe/London', label: 'Europa/London' },
            { value: 'America/New_York', label: 'Amerika/New York' },
            { value: 'Asia/Tokyo', label: 'Asien/Tokio' },
          ],
        },
        {
          key: 'currency' as keyof Preferences,
          label: 'Währung',
          description: 'Standard-Währung für Preise',
          type: 'select' as const,
          options: [
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'USD', label: 'USD ($)' },
            { value: 'GBP', label: 'GBP (£)' },
            { value: 'CHF', label: 'CHF (CHF)' },
          ],
        },
      ],
    },
    {
      title: 'Erscheinungsbild',
      description: 'Design und Layout-Einstellungen',
      icon: Palette,
      items: [
        {
          key: 'theme' as keyof Preferences,
          label: 'Theme',
          description: 'Wählen Sie Ihr bevorzugtes Theme',
          type: 'select' as const,
          options: [
            { value: 'light', label: 'Hell' },
            { value: 'dark', label: 'Dunkel' },
            { value: 'auto', label: 'Automatisch' },
          ],
        },
        {
          key: 'compactLayout' as keyof Preferences,
          label: 'Kompaktes Layout',
          description: 'Reduziert Abstände für mehr Inhalt',
          type: 'checkbox' as const,
        },
        {
          key: 'animationsEnabled' as keyof Preferences,
          label: 'Animationen',
          description: 'Aktiviert Übergangsanimationen',
          type: 'checkbox' as const,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {preferenceCategories.map((category, categoryIndex) => {
        const Icon = category.icon;
        return (
          <GlassCard key={categoryIndex} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/50">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                  </div>
                  
                  <div className="ml-4">
                    {item.type === 'select' ? (
                      <select
                        value={preferences[item.key] as string}
                        onChange={(e) => handlePreferenceChange(item.key, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {item.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[item.key] as boolean}
                          onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}

      {/* Save Button */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <GlassButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Präferenzen speichern
          </GlassButton>
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Ungespeicherte Änderungen</span>
            </div>
          )}
          {!hasChanges && updateProfileMutation.isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Erfolgreich gespeichert</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfilePreferencesTab;
