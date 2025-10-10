import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download, 
  Trash2, 
  Save, 
  Check,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  Camera,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  
  // Privacy & Security
  twoFactorAuth: boolean;
  sessionTimeout: number;
  dataExport: boolean;
  
  // Profile
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<UserSettings>({
    // Appearance
    theme: 'system',
    language: 'de',
    fontSize: 'medium',
    compactMode: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    
    // Privacy & Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    dataExport: false,
    
    // Profile
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 123 456789',
    company: 'Mustermann Immobilien',
    position: 'Geschäftsführer'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
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
    };
    
    applyTheme();
    localStorage.setItem('darkMode', (settings.theme === 'dark').toString());
  }, [settings.theme]);

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    setIsSaving(false);
    setSavedMessage('Einstellungen erfolgreich gespeichert!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const exportData = () => {
    const data = {
      settings,
      exportDate: new Date().toISOString(),
      user: 'Max Mustermann'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immonow-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'appearance', label: 'Darstellung', icon: Palette },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'security', label: 'Sicherheit', icon: Shield },
    { id: 'data', label: 'Daten', icon: Download }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil-Informationen</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vorname
                  </label>
                  <input
                    type="text"
                    value={settings.firstName}
                    onChange={(e) => updateSetting('firstName', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nachname
                  </label>
                  <input
                    type="text"
                    value={settings.lastName}
                    onChange={(e) => updateSetting('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    value={settings.company}
                    onChange={(e) => updateSetting('company', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={settings.position}
                    onChange={(e) => updateSetting('position', e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Profilbild</h4>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {settings.firstName[0]}{settings.lastName[0]}
                  </span>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Bild ändern</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Darstellung</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Design-Modus
                  </label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'light', label: 'Hell', icon: Sun },
                      { value: 'dark', label: 'Dunkel', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => updateSetting('theme', value)}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          settings.theme === value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Sprache
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full max-w-xs px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Schriftgröße
                  </label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'small', label: 'Klein' },
                      { value: 'medium', label: 'Normal' },
                      { value: 'large', label: 'Groß' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateSetting('fontSize', value)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          settings.fontSize === value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Kompakter Modus
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reduziert Abstände für mehr Inhalt auf dem Bildschirm
                    </p>
                  </div>
                  <button
                    onClick={() => updateSetting('compactMode', !settings.compactMode)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.compactMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benachrichtigungen</h3>
              
              <div className="space-y-4">
                {[
                  {
                    key: 'emailNotifications',
                    label: 'E-Mail Benachrichtigungen',
                    description: 'Erhalten Sie wichtige Updates per E-Mail',
                    icon: Mail
                  },
                  {
                    key: 'pushNotifications',
                    label: 'Push Benachrichtigungen',
                    description: 'Browser-Benachrichtigungen für sofortige Updates',
                    icon: Bell
                  },
                  {
                    key: 'marketingEmails',
                    label: 'Marketing E-Mails',
                    description: 'Newsletter und Produktupdates erhalten',
                    icon: Mail
                  },
                  {
                    key: 'weeklyReports',
                    label: 'Wöchentliche Berichte',
                    description: 'Zusammenfassung Ihrer Aktivitäten per E-Mail',
                    icon: Bell
                  }
                ].map(({ key, label, description, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                          {label}
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting(key as keyof UserSettings, !settings[key as keyof UserSettings])}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings[key as keyof UserSettings] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        settings[key as keyof UserSettings] ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sicherheit & Datenschutz</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        Zwei-Faktor-Authentifizierung
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Zusätzliche Sicherheit für Ihr Konto
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.twoFactorAuth ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Session-Timeout (Minuten)
                  </label>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    className="w-full max-w-xs px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 Minuten</option>
                    <option value={30}>30 Minuten</option>
                    <option value={60}>1 Stunde</option>
                    <option value={120}>2 Stunden</option>
                    <option value={0}>Niemals</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">Passwort ändern</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Aktuelles Passwort
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Neues Passwort
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Passwort bestätigen
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Passwort ändern
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daten & Export</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <Download className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Daten exportieren
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Laden Sie eine Kopie Ihrer Daten herunter
                      </p>
                      <button
                        onClick={exportData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Export starten
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                        Konto löschen
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Löschen Sie Ihr Konto und alle zugehörigen Daten dauerhaft
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Konto löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre Konto-Einstellungen und Präferenzen
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {savedMessage && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm">{savedMessage}</span>
              </div>
            )}
            
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Speichert...' : 'Speichern'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-xl p-6 shadow-glass">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
