import React from 'react';
import { Activity, MapPin, Calendar, TrendingUp, Users, Home, CheckCircle } from 'lucide-react';
import { GlassCard, Badge } from '../../admin/GlassUI';
import { useProfile, useActivityLogs, useUserStats } from '../../../api/hooks';

const ProfileOverviewTab: React.FC = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: activities = [], isLoading: activitiesLoading } = useActivityLogs(5);
  const { data: stats, isLoading: statsLoading } = useUserStats();

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="animate-pulse">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = () => {
    // This would come from tenant user data in a real implementation
    return <Badge variant="info">Geschäftsführer</Badge>;
  };

  const getStatusBadge = () => {
    return profile?.is_active ? (
      <Badge variant="success">Aktiv</Badge>
    ) : (
      <Badge variant="danger">Inaktiv</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <GlassCard className="p-8">
        <div className="flex items-start gap-6">
          <div className="relative">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-gray-700 shadow-lg">
                {getInitials(profile?.first_name || '', profile?.last_name || '')}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-700"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Unbekannter Benutzer'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {profile?.email}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {getRoleBadge()}
              {getStatusBadge()}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Mitglied seit {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Letzter Login: {profile?.last_login ? new Date(profile.last_login).toLocaleDateString('de-DE') : 'Nie'}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.properties_managed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Immobilien</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.contacts_managed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Kontakte</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.tasks_completed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Aufgaben</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.appointments_scheduled}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Termine</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Letzte Aktivitäten
        </h3>
        <div className="space-y-3">
          {activitiesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{activity.action}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.description || `${activity.resource_type} ${activity.resource_id}`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString('de-DE')}
                  </div>
                </div>
                {activity.metadata?.module && (
                  <Badge variant="info" size="sm">{activity.metadata.module}</Badge>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Aktivitäten gefunden</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileOverviewTab;
