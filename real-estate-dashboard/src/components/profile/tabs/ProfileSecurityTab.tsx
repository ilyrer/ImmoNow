import React from 'react';
import { Shield, Smartphone, AlertTriangle } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge } from '../../admin/GlassUI';

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

// Mock hooks
const useSecuritySettingsMock = () => {
  const settings: SecuritySettings = {
    twoFactorEnabled: false,
    twoFactorMethod: 'app'
  };
  
  const enable2FA = (method: string) => {
    console.log('Enabling 2FA with method:', method);
    return Promise.resolve();
  };
  
  const disable2FA = () => {
    console.log('Disabling 2FA');
    return Promise.resolve();
  };
  
  return { settings, enable2FA, disable2FA };
};

const useSessionsMock = () => {
  const sessions: Session[] = [];
  
  const terminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
    return Promise.resolve();
  };
  
  const terminateAllOthers = () => {
    console.log('Terminating all other sessions');
    return Promise.resolve();
  };
  
  return { sessions, terminateSession, terminateAllOthers };
};

const ProfileSecurityTab: React.FC = () => {
  const { settings, enable2FA, disable2FA } = useSecuritySettingsMock();
  const { sessions, terminateSession, terminateAllOthers } = useSessionsMock();

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Zwei-Faktor-Authentifizierung</h3>
        {settings.twoFactorEnabled ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">2FA Aktiviert</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Methode: {settings.twoFactorMethod}</div>
            </div>
            <GlassButton variant="danger" size="sm" onClick={disable2FA}>Deaktivieren</GlassButton>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                2FA Nicht Aktiviert
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Erhöhen Sie Ihre Sicherheit</div>
            </div>
            <GlassButton variant="success" size="sm" onClick={() => enable2FA('app')}>Aktivieren</GlassButton>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aktive Sitzungen</h3>
          <GlassButton variant="danger" size="sm" onClick={terminateAllOthers}>Alle anderen abmelden</GlassButton>
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {session.device}
                  {session.isCurrent && <Badge variant="success" size="sm">Aktuell</Badge>}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{session.browser} • {session.os}</div>
                <div className="text-xs text-gray-500 mt-1">{session.location} • {session.ip}</div>
              </div>
              {!session.isCurrent && (
                <GlassButton variant="danger" size="sm" onClick={() => terminateSession(session.id)}>Abmelden</GlassButton>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileSecurityTab;
