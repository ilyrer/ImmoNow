import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProfile, useUpdateNotificationPreferences } from '../../../hooks/useProfile';
import { GlassCard, GlassButton } from '../../admin/GlassUI';

const ProfileNotificationsTab: React.FC = () => {
  const { data: profile } = useProfile();
  const updateMutation = useUpdateNotificationPreferences();

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
  });

  useEffect(() => {
    if (profile) {
      setPreferences({
        email_notifications: profile.email_notifications ?? true,
        push_notifications: profile.push_notifications ?? true,
        sms_notifications: profile.sms_notifications ?? false,
        marketing_emails: profile.marketing_emails ?? false,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(preferences);
      toast.success('Benachrichtigungseinstellungen gespeichert');
    } catch (error: any) {
      toast.error('Fehler beim Speichern');
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Benachrichtigungseinstellungen</h3>
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">E-Mail-Benachrichtigungen</div>
                <div className="text-sm text-gray-600">Updates per E-Mail erhalten</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_notifications}
              onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
              className="rounded border-gray-300"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Push-Benachrichtigungen</div>
                <div className="text-sm text-gray-600">Browser-Benachrichtigungen aktivieren</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.push_notifications}
              onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
              className="rounded border-gray-300"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">SMS-Benachrichtigungen</div>
                <div className="text-sm text-gray-600">Wichtige Updates per SMS</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.sms_notifications}
              onChange={(e) => setPreferences({ ...preferences, sms_notifications: e.target.checked })}
              className="rounded border-gray-300"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Marketing-E-Mails</div>
                <div className="text-sm text-gray-600">Newsletter und Produktankündigungen</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing_emails}
              onChange={(e) => setPreferences({ ...preferences, marketing_emails: e.target.checked })}
              className="rounded border-gray-300"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <GlassButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Speichern...' : 'Einstellungen speichern'}
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};

export default ProfileNotificationsTab;
