import React, { useState } from 'react';
import { Plus, Copy, Trash2, AlertCircle } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

// Mock hook for API tokens
const useApiTokensMock = () => {
  const tokens: ApiToken[] = [];
  
  const createToken = (name: string, scopes: string[]) => {
    const token = `sk-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Creating token:', name, scopes);
    return token;
  };
  
  const revokeToken = (id: string) => {
    console.log('Revoking token:', id);
    return Promise.resolve();
  };
  
  const deleteToken = (id: string) => {
    console.log('Deleting token:', id);
    return Promise.resolve();
  };
  
  return { tokens, createToken, revokeToken, deleteToken };
};

const ProfileApiTokensTab: React.FC = () => {
  const { tokens, createToken, revokeToken, deleteToken } = useApiTokensMock();
  const [showNewToken, setShowNewToken] = useState<string | null>(null);

  const handleCreate = () => {
    const name = prompt('Token-Name:');
    if (name) {
      const token = createToken(name, ['read', 'write']);
      setShowNewToken(token);
    }
  };

  return (
    <div className="space-y-6">
      {showNewToken && (
        <GlassCard className="p-6 bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Neuer Token erstellt</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Kopieren Sie diesen Token jetzt. Er wird nicht erneut angezeigt.</p>
              <div className="flex gap-2">
                <input type="text" value={showNewToken} readOnly className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm" />
                <GlassButton variant="primary" size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(showNewToken)}>Kopieren</GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">API-Tokens</h3>
          <GlassButton variant="primary" icon={Plus} onClick={handleCreate}>Neuer Token</GlassButton>
        </div>
        <div className="space-y-3">
          {tokens.map((token: ApiToken) => (
            <div key={token.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{token.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">{token.token}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Erstellt: {new Date(token.createdAt).toLocaleDateString('de-DE')}
                  {token.lastUsedAt && ` • Zuletzt verwendet: ${new Date(token.lastUsedAt).toLocaleDateString('de-DE')}`}
                </div>
                <div className="flex gap-1 mt-2">
                  {token.scopes.map((scope: string) => (
                    <Badge key={scope} variant="info" size="sm">{scope}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {token.isActive ? (
                  <GlassButton variant="warning" size="sm" onClick={() => revokeToken(token.id)}>Widerrufen</GlassButton>
                ) : (
                  <Badge variant="danger">Widerrufen</Badge>
                )}
                <GlassButton variant="danger" size="sm" icon={Trash2} onClick={() => deleteToken(token.id)}>
                  Löschen
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileApiTokensTab;
