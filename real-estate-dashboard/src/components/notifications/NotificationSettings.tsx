/**
 * NotificationSettings Component
 * Benutzer-Einstellungen für Benachrichtigungen
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Mail, Smartphone, Clock } from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from '../../hooks/useNotifications';
import {
  NotificationCategory,
  NotificationPriority,
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_PRIORITY_CONFIG,
} from '../../types/notification';

const NotificationSettings: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleToggle = async (
    category: NotificationCategory,
    field: string,
    value: boolean
  ) => {
    try {
      await updatePreference.mutateAsync({
        category,
        data: { [field]: value },
      });
      setSavedMessage('Einstellungen gespeichert');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  const handlePriorityChange = async (
    category: NotificationCategory,
    priority: NotificationPriority
  ) => {
    try {
      await updatePreference.mutateAsync({
        category,
        data: { min_priority: priority },
      });
      setSavedMessage('Einstellungen gespeichert');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-500 rounded-xl">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Benachrichtigungs-Einstellungen
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Verwalten Sie Ihre Benachrichtigungspräferenzen
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-800 dark:text-green-200 font-medium flex items-center gap-2">
            <Save className="w-5 h-5" />
            {savedMessage}
          </p>
        </motion.div>
      )}

      {/* Global Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Globale Einstellungen
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  In-App Benachrichtigungen
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Benachrichtigungen im System anzeigen
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  E-Mail Benachrichtigungen
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wichtige Updates per E-Mail erhalten
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Push Benachrichtigungen
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browser-Push-Benachrichtigungen aktivieren
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Category Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Benachrichtigungen nach Kategorie
        </h3>

        <div className="space-y-6">
          {preferences?.map((pref) => (
            <div
              key={pref.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <i
                    className={`${
                      NOTIFICATION_CATEGORY_CONFIG[pref.category].icon
                    } text-xl text-gray-600 dark:text-gray-400`}
                  ></i>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {NOTIFICATION_CATEGORY_CONFIG[pref.category].label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Benachrichtigungen zu{' '}
                      {NOTIFICATION_CATEGORY_CONFIG[pref.category].label}
                    </p>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.enabled}
                    onChange={(e) =>
                      handleToggle(pref.category, 'enabled', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {pref.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Channels */}
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.in_app_enabled}
                        onChange={(e) =>
                          handleToggle(
                            pref.category,
                            'in_app_enabled',
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        App
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.email_enabled}
                        onChange={(e) =>
                          handleToggle(
                            pref.category,
                            'email_enabled',
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        E-Mail
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.push_enabled}
                        onChange={(e) =>
                          handleToggle(
                            pref.category,
                            'push_enabled',
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        Push
                      </span>
                    </label>
                  </div>

                  {/* Minimum Priority */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Minimale Priorität
                    </label>
                    <select
                      value={pref.min_priority}
                      onChange={(e) =>
                        handlePriorityChange(
                          pref.category,
                          e.target.value as NotificationPriority
                        )
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    >
                      {Object.values(NotificationPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {NOTIFICATION_PRIORITY_CONFIG[priority].label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Nur Benachrichtigungen mit dieser oder höherer Priorität
                      empfangen
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours (Coming Soon) */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ruhezeiten
          </h3>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
            Demnächst
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Legen Sie fest, zu welchen Zeiten Sie keine Benachrichtigungen
          erhalten möchten.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
