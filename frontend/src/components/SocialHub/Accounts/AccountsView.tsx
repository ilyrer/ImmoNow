/**
 * SocialHub Accounts View - Live OAuth Integration
 * Verbindet Social Media Konten über echte OAuth2 Flows
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../common/Card';
import {
  Link2,
  Unlink,
  Plus,
  ExternalLink,
  Loader2,
  RefreshCw,
  Building2,
  Users,
  ArrowLeft,
  Shield,
  Clock
} from 'lucide-react';
import {
  useSocialAccounts,
  useInitOAuth,
  useDisconnectSocialAccount,
  useOAuthPlatforms,
  useRateLimitStatus
} from '../../../api/hooks';
import toast from 'react-hot-toast';

interface AccountsViewProps {
  onBack: () => void;
}

// Platform configuration
const PLATFORM_CONFIG: Record<string, {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  category: 'social' | 'portal';
}> = {
  instagram: {
    name: 'Instagram',
    icon: 'ri-instagram-line',
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
    description: 'Bilder, Reels und Stories veröffentlichen',
    category: 'social',
  },
  facebook: {
    name: 'Facebook',
    icon: 'ri-facebook-fill',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    description: 'Posts und Updates auf Facebook Pages',
    category: 'social',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'ri-linkedin-fill',
    color: 'text-blue-700',
    bgColor: 'bg-blue-700',
    description: 'Professionelle Updates und Artikel',
    category: 'social',
  },
  youtube: {
    name: 'YouTube',
    icon: 'ri-youtube-fill',
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    description: 'Videos hochladen und verwalten',
    category: 'social',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'ri-tiktok-fill',
    color: 'text-gray-900',
    bgColor: 'bg-gradient-to-br from-cyan-400 via-pink-500 to-blue-600',
    description: 'Kurzvideos (Analytics only)',
    category: 'social',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'ri-twitter-x-fill',
    color: 'text-gray-900',
    bgColor: 'bg-gray-900',
    description: 'Tweets und Updates',
    category: 'social',
  },
  immoscout24: {
    name: 'ImmoScout24',
    icon: 'ri-home-4-fill',
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-br from-orange-500 to-red-600',
    description: 'Immobilien auf ImmoScout24 veröffentlichen',
    category: 'portal',
  },
  immowelt: {
    name: 'Immowelt',
    icon: 'ri-building-2-fill',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    description: 'Immobilien auf Immowelt veröffentlichen',
    category: 'portal',
  },
};

const AccountsView: React.FC<AccountsViewProps> = ({ onBack }) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountLabel, setAccountLabel] = useState('');

  // API Hooks
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useSocialAccounts();
  const { data: platforms } = useOAuthPlatforms();
  const { data: rateLimits } = useRateLimitStatus();
  const initOAuthMutation = useInitOAuth();
  const disconnectMutation = useDisconnectSocialAccount();

  // Handle OAuth initiation
  const handleConnect = async (platform: string) => {
    setSelectedPlatform(platform);

    try {
      const result = await initOAuthMutation.mutateAsync({
        platform,
        accountLabel: accountLabel || undefined
      });

      // Redirect to OAuth URL
      window.location.href = result.authorization_url;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Fehler beim Verbinden mit ${platform}`);
      setSelectedPlatform(null);
    }
  };

  // Handle account disconnection
  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Möchten Sie "${accountName}" wirklich trennen?`)) {
      return;
    }

    try {
      await disconnectMutation.mutateAsync(accountId);
      toast.success('Account erfolgreich getrennt');
      refetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Fehler beim Trennen');
    }
  };

  // Filter accounts by category
  const socialAccounts = accounts?.filter(acc =>
    PLATFORM_CONFIG[acc.platform]?.category === 'social'
  ) || [];
  const portalAccounts = accounts?.filter(acc =>
    PLATFORM_CONFIG[acc.platform]?.category === 'portal'
  ) || [];

  // Get available platforms
  const availablePlatforms = platforms?.platforms?.filter(p => p.is_configured) || [];

  const connectedCount = accounts?.filter(acc => acc.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verknüpfte Konten
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre Social Media und Portal-Verbindungen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refetchAccounts()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Verbunden</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {connectedCount}
            </p>
          </div>

          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Verbinden</span>
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {accountsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Social Media Accounts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Social Media
        </h3>

        {socialAccounts.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Noch keine Social Media Konten verbunden.
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Jetzt verbinden →
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialAccounts.map((account) => {
              const config = PLATFORM_CONFIG[account.platform];
              if (!config) return null;

              const rateLimit = rateLimits?.find(r => r.platform === account.platform);

              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className={`${config.bgColor} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <i className={`${config.icon} text-2xl text-white`}></i>
                          </div>
                          <div className="text-white">
                            <h4 className="font-semibold">{config.name}</h4>
                            <p className="text-sm text-white/80">{account.account_name}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {account.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Account Info */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {account.follower_count?.toLocaleString() || '-'}
                          </p>
                          <p className="text-xs text-gray-500">Follower</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {account.post_count?.toLocaleString() || '-'}
                          </p>
                          <p className="text-xs text-gray-500">Posts</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {account.following_count?.toLocaleString() || '-'}
                          </p>
                          <p className="text-xs text-gray-500">Following</p>
                        </div>
                      </div>

                      {/* Rate Limit Status */}
                      {rateLimit && (
                        <div className={`p-2 rounded-lg text-xs ${rateLimit.is_limited
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                          }`}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              API: {rateLimit.hourly_used}/{rateLimit.hourly_limit} Requests/h
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Last Sync */}
                      {account.last_sync && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Letzte Sync: {new Date(account.last_sync).toLocaleString('de-DE')}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDisconnect(account.id, account.account_name)}
                          disabled={disconnectMutation.isPending}
                          className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {disconnectMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlink className="w-4 h-4" />
                          )}
                          Trennen
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Portal Accounts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange-600" />
          Immobilien-Portale
        </h3>

        {portalAccounts.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Noch keine Portal-Verbindungen eingerichtet.
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Portal verbinden →
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portalAccounts.map((account) => {
              const config = PLATFORM_CONFIG[account.platform];
              if (!config) return null;

              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className={`${config.bgColor} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <i className={`${config.icon} text-2xl text-white`}></i>
                          </div>
                          <div className="text-white">
                            <h4 className="font-semibold">{config.name}</h4>
                            <p className="text-sm text-white/80">{account.account_name}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {account.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>

                      {/* Actions */}
                      <button
                        onClick={() => handleDisconnect(account.id, account.account_name)}
                        disabled={disconnectMutation.isPending}
                        className="w-full px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                        Trennen
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Connect Account Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConnectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Konto verbinden
                </h3>
                <p className="text-white/80 text-sm">
                  Wählen Sie eine Plattform aus
                </p>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Account Label Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account-Bezeichnung (optional)
                  </label>
                  <input
                    type="text"
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    placeholder="z.B. Firmenaccount, Privat..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Hilft bei mehreren Konten pro Plattform
                  </p>
                </div>

                {/* Social Media Platforms */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Social Media
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availablePlatforms
                      .filter(p => PLATFORM_CONFIG[p.platform]?.category === 'social')
                      .map((platform) => {
                        const config = PLATFORM_CONFIG[platform.platform];
                        if (!config) return null;

                        const isConnecting = initOAuthMutation.isPending && selectedPlatform === platform.platform;

                        return (
                          <button
                            key={platform.platform}
                            onClick={() => handleConnect(platform.platform)}
                            disabled={initOAuthMutation.isPending}
                            className="group p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-50"
                          >
                            <div className={`w-12 h-12 mx-auto mb-2 ${config.bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                              {isConnecting ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <i className={`${config.icon} text-2xl text-white`}></i>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                              {config.name}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Portal Platforms */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Immobilien-Portale
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availablePlatforms
                      .filter(p => PLATFORM_CONFIG[p.platform]?.category === 'portal')
                      .map((platform) => {
                        const config = PLATFORM_CONFIG[platform.platform];
                        if (!config) return null;

                        const isConnecting = initOAuthMutation.isPending && selectedPlatform === platform.platform;

                        return (
                          <button
                            key={platform.platform}
                            onClick={() => handleConnect(platform.platform)}
                            disabled={initOAuthMutation.isPending}
                            className="group p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 rounded-xl transition-all disabled:opacity-50"
                          >
                            <div className={`w-12 h-12 mx-auto mb-2 ${config.bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                              {isConnecting ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <i className={`${config.icon} text-2xl text-white`}></i>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                              {config.name}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Sichere Verbindung
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                        Ihre Zugangsdaten werden verschlüsselt gespeichert. Sie können die Verbindung jederzeit trennen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountsView;
