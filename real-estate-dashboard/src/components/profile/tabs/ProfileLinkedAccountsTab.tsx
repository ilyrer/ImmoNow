import React from 'react';
import { Link as LinkIcon, Unlink } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';

interface LinkedAccount {
  id: string;
  provider: string;
  email: string;
  status: string;
  connectedAt: string;
}

// Mock hook for linked accounts
const useLinkedAccountsMock = () => {
  const accounts: LinkedAccount[] = [];
  
  const disconnect = (id: string) => {
    console.log('Disconnecting account:', id);
    return Promise.resolve();
  };
  
  return { accounts, disconnect };
};

const ProfileLinkedAccountsTab: React.FC = () => {
  const { accounts, disconnect } = useLinkedAccountsMock();

  const providerIcons: Record<string, string> = {
    google: '🔍',
    outlook: '📧',
    facebook: '📘',
    instagram: '📷',
    linkedin: '💼',
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Verknüpfte Konten</h3>
      <div className="space-y-3">
        {accounts.map((account: LinkedAccount) => (
          <div key={account.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{providerIcons[account.provider]}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white capitalize">{account.provider}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{account.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Verbunden: {new Date(account.connectedAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={account.status === 'active' ? 'success' : 'danger'}>{account.status}</Badge>
              <GlassButton variant="danger" size="sm" icon={Unlink} onClick={() => disconnect(account.id)}>Trennen</GlassButton>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default ProfileLinkedAccountsTab;
