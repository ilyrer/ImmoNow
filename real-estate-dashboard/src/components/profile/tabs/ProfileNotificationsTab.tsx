import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, Smartphone, Monitor, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard, GlassButton } from '../../admin/GlassUI';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../../../api/hooks';
import { toast } from 'react-hot-toast';

const ProfileNotificationsTab: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferencesMutation = useUpdateNotificationPreferences();
  
  const [localPreferences, setLocalPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    property_updates: true,
    task_reminders: true,
    appointment_reminders: true,
    marketing_emails: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local preferences when data loads
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasChanges(false);
    }
  }, [preferences]);

  const handlePreferenceChange = (key: keyof typeof localPreferences, value: boolean) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePreferencesMutation.mutateAsync(localPreferences);
      setHasChanges(false);
      toast.success('Benachrichtigungseinstellungen erfolgreich gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen');
    }
  };

  const notificationCategories = [
    {
      title: 'Allgemeine Benachrichtigungen',
      description: 'Grundlegende Benachrichtigungseinstellungen',
      icon: Bell,
      items: [
        {
          key: 'email_notifications' as keyof typeof localPreferences,
          label: 'E-Mail-Benachrichtigungen',
          description: 'Wichtige Updates per E-Mail erhalten',
          icon: Mail,
        },
        {
          key: 'push_notifications' as keyof typeof localPreferences,
          label: 'Push-Benachrichtigungen',
          description: 'Benachrichtigungen im Browser erhalten',
          icon: Monitor,
        },
        {
          key: 'sms_notifications' as keyof typeof localPreferences,
          label: 'SMS-Benachrichtigungen',
          description: 'Kritische Updates per SMS erhalten',
          icon: Smartphone,
        },
      ],
    },
    {
      title: 'Immobilien-Updates',
      description: 'Benachrichtigungen zu Immobilienaktivitäten',
      icon: Bell,
      items: [
        {
          key: 'property_updates' as keyof typeof localPreferences,
          label: 'Immobilien-Updates',
          description: 'Updates zu Ihren Immobilien erhalten',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Aufgaben & Termine',
      description: 'Erinnerungen für Aufgaben und Termine',
      icon: Bell,
      items: [
        {
          key: 'task_reminders' as keyof typeof localPreferences,
          label: 'Aufgaben-Erinnerungen',
          description: 'Erinnerungen für fällige Aufgaben',
          icon: Bell,
        },
        {
          key: 'appointment_reminders' as keyof typeof localPreferences,
          label: 'Termin-Erinnerungen',
          description: 'Erinnerungen für bevorstehende Termine',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Marketing',
      description: 'Marketing- und Werbe-E-Mails',
      icon: Bell,
      items: [
        {
          key: 'marketing_emails' as keyof typeof localPreferences,
          label: 'Marketing-E-Mails',
          description: 'Newsletter und Werbe-E-Mails erhalten',
          icon: Mail,
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-3"></div>
                <div className="space-y-3">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Benachrichtigungseinstellungen
        </h3>
        
        <div className="space-y-6">
          {notificationCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={categoryIndex} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={itemIndex} className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ItemIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localPreferences[item.key]}
                            onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <GlassButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Einstellungen speichern
          </GlassButton>
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Ungespeicherte Änderungen</span>
            </div>
          )}
          {!hasChanges && updatePreferencesMutation.isSuccess && (
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

export default ProfileNotificationsTab;
