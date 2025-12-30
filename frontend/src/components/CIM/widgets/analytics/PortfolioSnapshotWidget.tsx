import React from 'react';
import { usePropertyAnalytics, useProperties } from '../../../../api/hooks';
import { Home, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#14b8a6'];

const LoadingState = () => (
  <Card className="h-full">
    <CardHeader>
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-24 mt-2" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="p-4 rounded-xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </CardContent>
  </Card>
);

const PortfolioSnapshotWidget: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = usePropertyAnalytics();
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties({ page: 1, size: 6, sort_by: 'created_at', sort_order: 'desc' });

  const isLoading = analyticsLoading || propertiesLoading;
  const properties = propertiesData?.items ?? [];
  const total = analytics?.total_properties ?? propertiesData?.total ?? properties.length;

  const statusData = Object.entries(analytics?.properties_by_status ?? {}).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length]
  }));

  const typeData = Object.entries(analytics?.properties_by_type ?? {}).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[(idx + 2) % COLORS.length]
  }));

  if (isLoading) return <LoadingState />;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Portfolio Snapshot</CardTitle>
              <CardDescription>Typen, Status & Neuheiten</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
            {total} Objekte
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktiv</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.properties_by_status?.active ?? 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Im Markt</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ø Preis</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{(analytics?.average_price ?? 0).toLocaleString('de-DE')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Marktpreis</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Neu (30d)</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{properties.length}</div>
          <div className="text-xs text-blue-500 dark:text-blue-300">Neueste Objekte</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Verteilung</span>
          </div>
          {statusData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Keine Statusdaten</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={40} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Typen</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Mix</span>
          </div>
          {typeData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Keine Typ-Daten</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={40} paddingAngle={4}>
                  {typeData.map((entry, index) => (
                    <Cell key={`type-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSnapshotWidget;

