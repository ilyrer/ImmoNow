import React, { useState } from 'react';
import { Shield, Smartphone, AlertTriangle, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';
import { useChangePassword } from '../../../api/hooks';
import { toast } from 'react-hot-toast';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  isCurrent: boolean;
}

const ProfileSecurityTab: React.FC = () => {
  const changePasswordMutation = useChangePassword();
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Mock data for now - would come from API in real implementation
  const settings: SecuritySettings = {
    twoFactorEnabled: false,
    twoFactorMethod: 'app'
  };
  
  const sessions: Session[] = [
    {
      id: '1',
      device: 'MacBook Pro',
      browser: 'Chrome 120.0',
      os: 'macOS 14.0',
      location: 'München, Deutschland',
      ip: '192.168.1.100',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari 17.0',
      os: 'iOS 17.0',
      location: 'München, Deutschland',
      ip: '192.168.1.101',
      isCurrent: false,
    },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Neue Passwörter stimmen nicht überein');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error('Neues Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      toast.success('Passwort erfolgreich geändert');
    } catch (error) {
      toast.error('Fehler beim Ändern des Passworts');
    }
  };

  const enable2FA = (method: string) => {
    console.log('Enabling 2FA with method:', method);
    toast.loading('2FA-Aktivierung wird implementiert...');
    return Promise.resolve();
  };
  
  const disable2FA = () => {
    console.log('Disabling 2FA');
    toast.loading('2FA-Deaktivierung wird implementiert...');
    return Promise.resolve();
  };
  
  const terminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
    toast.loading('Session wird beendet...');
    return Promise.resolve();
  };
  
  const terminateAllOthers = () => {
    console.log('Terminating all other sessions');
    toast.loading('Alle anderen Sessions werden beendet...');
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Passwort ändern
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aktuelles Passwort
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ihr aktuelles Passwort"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ihr neues Passwort (min. 8 Zeichen)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Neues Passwort bestätigen
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Neues Passwort bestätigen"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordForm.new_password && passwordForm.confirm_password && (
              <div className="flex items-center gap-2 mt-2">
                {passwordForm.new_password === passwordForm.confirm_password ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Passwörter stimmen überein</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">Passwörter stimmen nicht überein</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <GlassButton
            variant="primary"
            disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password || passwordForm.new_password !== passwordForm.confirm_password}
          >
            Passwort ändern
          </GlassButton>
        </form>
      </GlassCard>

      {/* Two-Factor Authentication */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Zwei-Faktor-Authentifizierung
        </h3>
        {settings.twoFactorEnabled ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                2FA Aktiviert
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Methode: {settings.twoFactorMethod}</div>
            </div>
            <GlassButton variant="danger" size="sm" onClick={disable2FA}>
              Deaktivieren
            </GlassButton>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                2FA Nicht Aktiviert
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Erhöhen Sie Ihre Sicherheit</div>
            </div>
            <GlassButton variant="success" size="sm" onClick={() => enable2FA('app')}>
              Aktivieren
            </GlassButton>
          </div>
        )}
      </GlassCard>

      {/* Active Sessions */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Aktive Sitzungen
          </h3>
          <GlassButton variant="danger" size="sm" onClick={terminateAllOthers}>
            Alle anderen abmelden
          </GlassButton>
        </div>
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {session.device}
                    {session.isCurrent && <Badge variant="success" size="sm">Aktuell</Badge>}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{session.browser} • {session.os}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{session.location} • {session.ip}</div>
                </div>
                {!session.isCurrent && (
                  <GlassButton variant="danger" size="sm" onClick={() => terminateSession(session.id)}>
                    Abmelden
                  </GlassButton>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine aktiven Sessions gefunden</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileSecurityTab;
