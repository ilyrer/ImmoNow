/**
 * SocialHub Accounts View (Simplified)
 * Verwaltung von Social Media Konten mit OAuth-Simulation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../common/Card';
import { SimpleSocialAccount, SocialPlatform, Profile, PLATFORM_INFO } from './types';
// TODO: Implement real accounts API

interface AccountsViewProps {
  onBack: () => void;
}

const AccountsView: React.FC<AccountsViewProps> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<SimpleSocialAccount[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    // TODO: Load from real API
    setAccounts([]);
  };

  const handleConnectClick = (platform: SocialPlatform) => {
    setSelectedPlatform(platform);
    // TODO: Get profiles from real API
    setAvailableProfiles([]);
    setSelectedProfile('');
    setShowOAuthModal(true);
  };

  const handleOAuthConfirm = async () => {
    if (!selectedPlatform) return;
    
    setLoading(selectedPlatform);
    setShowOAuthModal(false);
    
    try {
      // TODO: Implement real OAuth connection
      const updatedAccount: SimpleSocialAccount = { 
        id: '1', 
        platform: selectedPlatform, 
        connected: true, 
        profiles: [],
        displayName: `${selectedPlatform} Account`
      };
      setAccounts(prev => prev.map(acc => 
        acc.platform === selectedPlatform ? updatedAccount : acc
      ));
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(null);
      setSelectedPlatform(null);
    }
  };

  const handleDisconnect = async (account: SimpleSocialAccount) => {
    if (!window.confirm(`Möchten Sie ${PLATFORM_INFO[account.platform].name} wirklich trennen?`)) {
      return;
    }
    
    setLoading(account.platform);
    
    try {
      // TODO: Implement real disconnect
      const updatedAccount = { ...account, isConnected: false };
      setAccounts(prev => prev.map(acc => 
        acc.id === account.id ? updatedAccount : acc
      ));
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleProfileChange = async (account: SimpleSocialAccount, profileName: string) => {
    setLoading(account.platform);
    
    try {
      // TODO: Implement real profile update
      const updatedAccount = { ...account, defaultProfile: profileName };
      setAccounts(prev => prev.map(acc => 
        acc.id === account.id ? updatedAccount : acc
      ));
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const connectedCount = accounts.filter(acc => acc.connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600 dark:text-gray-400"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Media Konten
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verbinden Sie Ihre Social Media Accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Verbunden</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {connectedCount} / {accounts.length}
            </p>
          </div>
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            <i className="ri-add-line text-lg"></i>
            <span className="font-medium">Neues Konto</span>
          </button>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const platformInfo = PLATFORM_INFO[account.platform];
          const isLoading = loading === account.platform;
          const profiles: any[] = []; // TODO: Get from real API

          return (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Platform Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platformInfo.bgColor}`}>
                      <i className={`${platformInfo.icon} text-2xl ${platformInfo.color}`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {platformInfo.name}
                      </h3>
                      {account.connected && account.displayName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.displayName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    account.connected 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {account.connected ? (
                      <><i className="ri-check-line mr-1"></i>Verbunden</>
                    ) : (
                      <>Nicht verbunden</>
                    )}
                  </span>
                </div>

                {/* Connected State */}
                {account.connected ? (
                  <div className="space-y-4">
                    {/* Default Profile Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Standard-Seite/Profil
                      </label>
                      <select
                        value={account.defaultProfileName || ''}
                        onChange={(e) => handleProfileChange(account, e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profiles.map((profile: any) => (
                          <option key={profile.id} value={profile.name}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => handleDisconnect(account)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Wird getrennt...
                        </>
                      ) : (
                        <>
                          <i className="ri-link-unlink-m mr-2"></i>
                          Trennen
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Disconnected State */
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Verbinden Sie Ihr {platformInfo.name}-Konto, um Beiträge zu veröffentlichen.
                    </p>
                    <button
                      onClick={() => handleConnectClick(account.platform)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Wird verbunden...
                        </>
                      ) : (
                        <>
                          <i className="ri-links-line mr-2"></i>
                          Verbinden
                        </>
                      )}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced OAuth Simulation Modal - Compact */}
      {showOAuthModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header with Platform Branding - Compact */}
            <div className={`${PLATFORM_INFO[selectedPlatform].bgColor} p-4 text-center relative overflow-hidden flex-shrink-0`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <i className={`${PLATFORM_INFO[selectedPlatform].icon} text-3xl ${PLATFORM_INFO[selectedPlatform].color}`}></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Mit {PLATFORM_INFO[selectedPlatform].name} verbinden
                </h3>
                <p className="text-white/90 text-xs">
                  Autorisieren Sie Immonow CIM den Zugriff auf Ihr Konto
                </p>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Permissions Section - Compact */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                  Diese Anwendung möchte:
                </h4>
                <div className="space-y-1.5">
                  {[
                    { icon: 'ri-file-text-line', text: 'Beiträge in Ihrem Namen erstellen und veröffentlichen' },
                    { icon: 'ri-image-line', text: 'Medien auf Ihr Konto hochladen' },
                    { icon: 'ri-calendar-line', text: 'Geplante Beiträge verwalten' },
                    { icon: 'ri-bar-chart-line', text: 'Performance-Daten und Insights abrufen' },
                  ].map((permission, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-6 h-6 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i className={`${permission.icon} text-xs text-blue-600 dark:text-blue-400`}></i>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                        {permission.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Selection - Compact */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2">
                  <i className="ri-user-line mr-1"></i>
                  Wählen Sie Ihr Profil/Ihre Seite:
                </label>
                <div className="space-y-2">
                  {availableProfiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile.name)}
                      className={`w-full p-2.5 border-2 rounded-lg text-left transition-all ${
                        selectedProfile === profile.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            selectedProfile === profile.name
                              ? PLATFORM_INFO[selectedPlatform].bgColor
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <i className={`${PLATFORM_INFO[selectedPlatform].icon} text-base ${
                              selectedProfile === profile.name
                                ? 'text-white'
                                : 'text-gray-400'
                            }`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {profile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {profile.type === 'page' ? 'Seite' : profile.type === 'channel' ? 'Kanal' : 'Profil'}
                            </p>
                          </div>
                        </div>
                        {selectedProfile === profile.name && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="ri-check-line text-white text-xs"></i>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Box - Compact */}
              <div className="mb-4 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 flex-shrink-0 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                    <i className="ri-information-line text-xs text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-0.5">
                      Demo-Modus
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-400 leading-tight">
                      Dies ist eine simulierte OAuth-Authentifizierung. In der Produktionsumgebung werden Sie zur offiziellen {PLATFORM_INFO[selectedPlatform].name}-Anmeldeseite weitergeleitet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowOAuthModal(false);
                    setSelectedPlatform(null);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleOAuthConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all text-white shadow-lg ${PLATFORM_INFO[selectedPlatform].bgColor} hover:opacity-90 hover:shadow-xl`}
                >
                  <i className="ri-shield-check-line mr-1"></i>
                  Autorisieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
              </div>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-add-circle-line text-5xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Neues Social Media Konto hinzufügen
                </h3>
                <p className="text-white/90 text-sm">
                  Wählen Sie eine Plattform, um loszulegen
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {accounts.filter(acc => !acc.connected).map((account) => {
                  const platformInfo = PLATFORM_INFO[account.platform];
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        setShowAddAccountModal(false);
                        handleConnectClick(account.platform);
                      }}
                      className="group relative bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl"
                    >
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${platformInfo.bgColor} shadow-lg group-hover:scale-110 transition-transform`}>
                        <i className={`${platformInfo.icon} text-3xl ${platformInfo.color}`}></i>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-center">
                        {platformInfo.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Already Connected Section */}
              {accounts.some(acc => acc.connected) && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                    Bereits verbunden
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {accounts.filter(acc => acc.connected).map((account) => {
                      const platformInfo = PLATFORM_INFO[account.platform];
                      return (
                        <div
                          key={account.id}
                          className="relative bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 opacity-60"
                        >
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${platformInfo.bgColor} opacity-50`}>
                            <i className={`${platformInfo.icon} text-3xl ${platformInfo.color}`}></i>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white text-center">
                            {platformInfo.name}
                          </p>
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-white text-xs"></i>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsView;
