import React, { useMemo } from 'react';
import { useContactAnalytics, useContacts } from '../../../../api/hooks';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Users, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

const LoadingState = () => (
  <div className="p-6 h-full flex flex-col space-y-4">
    <div className="flex items-center mb-2 space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="glass p-4 rounded-xl space-y-2 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
  </div>
);

const LiveContactsWidget: React.FC = () => {
  const { data: contactAnalytics, isLoading: analyticsLoading } = useContactAnalytics();
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page: 1, size: 8, sort_by: 'created_at', sort_order: 'desc' });

  const isLoading = analyticsLoading || contactsLoading;
  const contacts = contactsData?.items ?? [];
  const totalContacts = contactAnalytics?.total_contacts ?? contactsData?.total ?? contacts.length;
  const conversionRate = contactAnalytics?.conversion_rate ?? 0;
  const avgResponse = contactAnalytics?.average_response_time ?? 0;

  const sourceData = useMemo(
    () =>
      Object.entries(contactAnalytics?.contacts_by_source ?? {}).map(([name, value], idx) => ({
        name,
        value,
        fill: COLORS[idx % COLORS.length]
      })),
    [contactAnalytics]
  );

  const statusData = useMemo(
    () =>
      Object.entries(contactAnalytics?.contacts_by_status ?? {}).map(([name, value], idx) => ({
        name,
        value,
        fill: COLORS[(idx + 2) % COLORS.length]
      })),
    [contactAnalytics]
  );

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Leads & Kontakte</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quellen, Status & Conversion</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
          <Activity className="w-3.5 h-3.5" />
          <span>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gesamt</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalContacts}</div>
          <div className="text-xs text-blue-500 dark:text-blue-300">+ neue Leads in Echtzeit</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversion</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{(conversionRate * 100).toFixed(1)}%</div>
          <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${Math.min(100, conversionRate * 100)}%` }}
            />
          </div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ø Antwortzeit</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(avgResponse)} min</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">SLA Trend</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quellen</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">Top Channels</span>
          </div>
          {sourceData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Keine Quelldaten</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sourceData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">Pipeline</span>
          </div>
          {statusData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Keine Statusdaten</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          {contacts.length > 0 && (
            <div className="mt-3 space-y-2 max-h-24 overflow-y-auto pr-1">
              {contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between text-xs glass rounded-lg px-2 py-1.5">
                  <span className="text-gray-800 dark:text-gray-200 truncate">{contact.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{contact.status || 'neu'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveContactsWidget;

