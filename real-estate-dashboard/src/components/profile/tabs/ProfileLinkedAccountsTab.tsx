import React, { useState } from 'react';
import { Link as LinkIcon, Unlink, Plus, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';
import { useProfile } from '../../../api/hooks';
import { toast } from 'react-hot-toast';

interface LinkedAccount {
  id: string;
  provider: string;
  email: string;
  status: 'active' | 'inactive' | 'error';
  connectedAt: string;
  permissions: string[];
}

const ProfileLinkedAccountsTab: React.FC = () => {
  const { data: profile } = useProfile();
  
  // Mock data for now - would come from API in real implementation
  const [accounts, setAccounts] = useState<LinkedAccount[]>([
    {
      id: '1',
      provider: 'google',
      email: profile?.email || 'user@example.com',
      status: 'active',
      connectedAt: new Date().toISOString(),
      permissions: ['profile', 'email'],
    },
  ]);

  const availableProviders = [
    {
      id: 'google',
      name: 'Google',
      description: 'Anmelden mit Google-Konto',
      icon: '🔍',
      color: 'bg-blue-500',
      connected: accounts.some(acc => acc.provider === 'google'),
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      description: 'Anmelden mit Microsoft-Konto',
      icon: '📧',
      color: 'bg-blue-600',
      connected: accounts.some(acc => acc.provider === 'microsoft'),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Anmelden mit Facebook-Konto',
      icon: '📘',
      color: 'bg-blue-700',
      connected: accounts.some(acc => acc.provider === 'facebook'),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Anmelden mit LinkedIn-Konto',
      icon: '💼',
      color: 'bg-blue-800',
      connected: accounts.some(acc => acc.provider === 'linkedin'),
    },
  ];

  const handleConnect = async (provider: string) => {
    try {
      // Simulate OAuth flow
      toast.loading(`Verbinde mit ${provider}...`);
      
      // In a real implementation, this would redirect to OAuth provider
      setTimeout(() => {
        const newAccount: LinkedAccount = {
          id: Date.now().toString(),
          provider,
          email: `${provider}@example.com`,
          status: 'active',
          connectedAt: new Date().toISOString(),
          permissions: ['profile', 'email'],
        };
        
        setAccounts(prev => [...prev, newAccount]);
        toast.success(`Erfolgreich mit ${provider} verbunden`);
      }, 2000);
    } catch (error) {
      toast.error(`Fehler beim Verbinden mit ${provider}`);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      toast.loading('Trenne Konto...');
      
      setTimeout(() => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        toast.success('Konto erfolgreich getrennt');
      }, 1000);
    } catch (error) {
      toast.error('Fehler beim Trennen des Kontos');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Aktiv</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inaktiv</Badge>;
      case 'error':
        return <Badge variant="danger">Fehler</Badge>;
      default:
        return <Badge variant="info">Unbekannt</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Verknüpfte Konten
        </h3>
        
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
                    {availableProviders.find(p => p.id === account.provider)?.icon || '🔗'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {availableProviders.find(p => p.id === account.provider)?.name || account.provider}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{account.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Verbunden: {new Date(account.connectedAt).toLocaleDateString('de-DE')}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {account.permissions.map((permission) => (
                        <span key={permission} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(account.status)}
                  <GlassButton
                    variant="danger"
                    size="sm"
                    icon={Unlink}
                    onClick={() => handleDisconnect(account.id)}
                  >
                    Trennen
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <LinkIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">Keine verknüpften Konten</h4>
            <p className="text-sm">Verbinden Sie Ihre Konten für einfachere Anmeldung</p>
          </div>
        )}
      </GlassCard>

      {/* Available Providers */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Verfügbare Anbieter
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProviders.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
                  {provider.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{provider.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {provider.connected ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Verbunden</span>
                  </div>
                ) : (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => handleConnect(provider.id)}
                  >
                    Verbinden
                  </GlassButton>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Security Notice */}
      <GlassCard className="p-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Sicherheitshinweis</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Verknüpfte Konten ermöglichen eine einfachere Anmeldung. Sie können jederzeit die Verbindung trennen. 
              Ihre Daten werden sicher übertragen und nur für die Anmeldung verwendet.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileLinkedAccountsTab;
