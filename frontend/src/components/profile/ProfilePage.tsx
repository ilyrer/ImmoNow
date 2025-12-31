import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Bell,
  Link as LinkIcon,
  Settings,
  Key,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileOverviewTab from './tabs/ProfileOverviewTab';
import ProfilePersonalTab from './tabs/ProfilePersonalTab';
import ProfileSecurityTab from './tabs/ProfileSecurityTab';
import ProfileNotificationsTab from './tabs/ProfileNotificationsTab';
import ProfileLinkedAccountsTab from './tabs/ProfileLinkedAccountsTab';
import ProfilePreferencesTab from './tabs/ProfilePreferencesTab';
import ProfileApiTokensTab from './tabs/ProfileApiTokensTab';

type ProfileTab = 'overview' | 'personal' | 'security' | 'notifications' | 'linked' | 'preferences' | 'tokens';

interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Übersicht', icon: Activity },
  { id: 'personal', label: 'Persönliche Daten', icon: User },
  { id: 'security', label: 'Sicherheit', icon: Shield },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
  { id: 'linked', label: 'Verknüpfte Konten', icon: LinkIcon },
  { id: 'preferences', label: 'Präferenzen', icon: Settings },
  { id: 'tokens', label: 'API-Tokens', icon: Key },
];

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // Stelle sicher, dass Dark Mode beim Laden der Seite beibehalten wird
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const theme = settings.theme || 'system';
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (e) {
        console.error('Error loading theme settings:', e);
      }
    }
    // Falls keine Settings vorhanden sind, aber darkMode im localStorage
    else if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProfileOverviewTab />;
      case 'personal':
        return <ProfilePersonalTab />;
      case 'security':
        return <ProfileSecurityTab />;
      case 'notifications':
        return <ProfileNotificationsTab />;
      case 'linked':
        return <ProfileLinkedAccountsTab />;
      case 'preferences':
        return <ProfilePreferencesTab />;
      case 'tokens':
        return <ProfileApiTokensTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mein Profil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalten Sie Ihre persönlichen Einstellungen und Präferenzen
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <TabsList className="flex flex-col space-y-1 w-full">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="w-full justify-start"
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {renderTabContent()}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
