import React from 'react';
import { Save } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton } from '../../admin/GlassUI';

interface NotificationPreference {
  module: string;
  channel: string;
  enabled: boolean;
}

// Mock hook for notification preferences
const useNotificationPrefsMock = () => {
  const preferences: NotificationPreference[] = [];
  
  const updatePreference = (channel: string, module: string, enabled: boolean) => {
    console.log('Updating preference:', channel, module, enabled);
    return Promise.resolve();
  };
  
  return { preferences, updatePreference };
};

const ProfileNotificationsTab: React.FC = () => {
  const { preferences, updatePreference } = useNotificationPrefsMock();

  const modules = Array.from(new Set(preferences.map((p: NotificationPreference) => p.module)));

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Benachrichtigungseinstellungen</h3>
      <div className="space-y-6">
        {modules.map((module: string) => (
          <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">{module}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['inapp', 'email', 'push'].map((channel) => {
                const pref = preferences.find((p: NotificationPreference) => p.module === module && p.channel === channel);
                return (
                  <label key={channel} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref?.enabled || false}
                      onChange={(e) => updatePreference(channel, module, e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{channel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <GlassButton variant="primary" icon={Save}>Einstellungen speichern</GlassButton>
      </div>
    </GlassCard>
  );
};

export default ProfileNotificationsTab;
