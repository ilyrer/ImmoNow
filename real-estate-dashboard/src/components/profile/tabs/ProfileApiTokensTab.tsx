import React, { useState } from 'react';
import { Plus, Copy, Trash2, AlertCircle, Key, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';
import { toast } from 'react-hot-toast';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

const ProfileApiTokensTab: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([
    {
      id: '1',
      name: 'Development Token',
      token: 'sk-1234567890abcdef',
      scopes: ['read', 'write'],
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isActive: true,
    },
  ]);
  const [showNewToken, setShowNewToken] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  const availableScopes = [
    { id: 'read', name: 'Lesen', description: 'Daten lesen' },
    { id: 'write', name: 'Schreiben', description: 'Daten ändern' },
    { id: 'admin', name: 'Admin', description: 'Vollzugriff' },
    { id: 'billing', name: 'Abrechnung', description: 'Abrechnungsdaten' },
  ];

  const handleCreateToken = () => {
    if (!newTokenName.trim()) {
      toast.error('Bitte geben Sie einen Token-Namen ein');
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error('Bitte wählen Sie mindestens einen Scope aus');
      return;
    }

    const newToken = `sk-${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
    const token: ApiToken = {
      id: Date.now().toString(),
      name: newTokenName,
      token: newToken,
      scopes: selectedScopes,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    setTokens(prev => [token, ...prev]);
    setShowNewToken(newToken);
    setShowCreateForm(false);
    setNewTokenName('');
    setSelectedScopes(['read']);
    toast.success('Token erfolgreich erstellt');
  };

  const handleRevokeToken = (id: string) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, isActive: false } : token
    ));
    toast.success('Token erfolgreich widerrufen');
  };

  const handleDeleteToken = (id: string) => {
    setTokens(prev => prev.filter(token => token.id !== id));
    toast.success('Token erfolgreich gelöscht');
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token in Zwischenablage kopiert');
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    return token.substring(0, 8) + '•'.repeat(token.length - 12) + token.substring(token.length - 4);
  };

  const handleScopeToggle = (scopeId: string) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  return (
    <div className="space-y-6">
      {/* New Token Alert */}
      {showNewToken && (
        <GlassCard className="p-6 bg-green-50/50 dark:bg-green-900/20 border-2 border-green-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Neuer Token erstellt</h4>
              <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                Kopieren Sie diesen Token jetzt. Er wird nicht erneut angezeigt.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={showNewToken} 
                  readOnly 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm" 
                />
                <GlassButton 
                  variant="primary" 
                  size="sm" 
                  icon={Copy} 
                  onClick={() => handleCopyToken(showNewToken)}
                >
                  Kopieren
                </GlassButton>
              </div>
              <GlassButton 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowNewToken(null)}
                className="mt-3"
              >
                Schließen
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Create Token Form */}
      {showCreateForm && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Neuen Token erstellen
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token-Name
              </label>
              <input
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="z.B. Development Token"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Berechtigungen (Scopes)
              </label>
              <div className="space-y-2">
                {availableScopes.map((scope) => (
                  <label key={scope.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope.id)}
                      onChange={() => handleScopeToggle(scope.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{scope.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{scope.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <GlassButton
                variant="primary"
                onClick={handleCreateToken}
                disabled={!newTokenName.trim() || selectedScopes.length === 0}
              >
                Token erstellen
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Abbrechen
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tokens List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            API-Tokens
          </h3>
          <GlassButton 
            variant="primary" 
            icon={Plus} 
            onClick={() => setShowCreateForm(true)}
          >
            Neuer Token
          </GlassButton>
        </div>
        
        {tokens.length > 0 ? (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">{token.name}</div>
                    {token.isActive ? (
                      <Badge variant="success">Aktiv</Badge>
                    ) : (
                      <Badge variant="danger">Widerrufen</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                    </span>
                    <button
                      onClick={() => toggleTokenVisibility(token.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {visibleTokens.has(token.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopyToken(token.token)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    Erstellt: {new Date(token.createdAt).toLocaleDateString('de-DE')}
                    {token.lastUsedAt && ` • Zuletzt verwendet: ${new Date(token.lastUsedAt).toLocaleDateString('de-DE')}`}
                  </div>
                  
                  <div className="flex gap-1">
                    {token.scopes.map((scope) => (
                      <Badge key={scope} variant="info" size="sm">
                        {availableScopes.find(s => s.id === scope)?.name || scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {token.isActive ? (
                    <GlassButton 
                      variant="warning" 
                      size="sm" 
                      onClick={() => handleRevokeToken(token.id)}
                    >
                      Widerrufen
                    </GlassButton>
                  ) : (
                    <Badge variant="danger">Widerrufen</Badge>
                  )}
                  <GlassButton 
                    variant="danger" 
                    size="sm" 
                    icon={Trash2} 
                    onClick={() => handleDeleteToken(token.id)}
                  >
                    Löschen
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">Keine API-Tokens</h4>
            <p className="text-sm">Erstellen Sie Ihren ersten API-Token für die Integration</p>
          </div>
        )}
      </GlassCard>

      {/* Security Notice */}
      <GlassCard className="p-6 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Sicherheitshinweis</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              API-Tokens gewähren Zugriff auf Ihre Daten. Bewahren Sie sie sicher auf und teilen Sie sie nicht mit anderen. 
              Widerrufen Sie nicht mehr benötigte Tokens umgehend.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileApiTokensTab;
