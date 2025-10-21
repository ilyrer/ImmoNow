import React, { useState, useEffect } from 'react';
import { marketService } from '../../../../services/market.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketData {
  month: string;
  avgPrice: number;
  avgDaysOnMarket: number;
  salesVolume: number;
  priceChange: number;
}

interface RegionalData {
  region: string;
  avgPrice: number;
  change: number;
  volume: number;
}

interface PropertyTypeData {
  type: string;
  avgPrice: number;
  demand: number;
  supply: number;
}

const MarketTrendsWidget: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [propertyTypeData, setPropertyTypeData] = useState<PropertyTypeData[]>([]);
  const [activeTab, setActiveTab] = useState<'trends' | 'regional' | 'types'>('trends');
  const [timeframe, setTimeframe] = useState<'6m' | '1y' | '2y'>('1y');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Default-Region (kann später aus User-/Tenant-Settings kommen)
        const city = 'München';
        const postal = '80331';
        const data = await marketService.getTrends(city, postal);
        if (!mounted) return;

        const monthly = (data.trends || []).map((t: any) => ({
          month: t.date,
          avgPrice: t.average_price,
          avgDaysOnMarket: 60,
          salesVolume: t.transaction_count,
          priceChange: 0,
        }));
        setMarketData(monthly as any);

        // Einfache Ableitungen für Regional/Types Tabs (können später mit echten Endpunkten ersetzt werden)
        const latest = data.trends?.[data.trends.length - 1];
        const avg = latest?.average_price || 0;
        setRegionalData([
          { region: data.city, avgPrice: avg, change: 0, volume: (latest?.transaction_count || 0) },
        ] as any);
        setPropertyTypeData([
          { type: 'Wohnung', avgPrice: avg, demand: 60, supply: 40 },
          { type: 'Haus', avgPrice: avg * 1.4, demand: 55, supply: 45 },
        ] as any);
      } catch (e) {
        console.error('Fehler beim Laden der Markttrend-Daten:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return 'ri-arrow-up-line';
    if (change < 0) return 'ri-arrow-down-line';
    return 'ri-subtract-line';
  };

  const getDemandSupplyRatio = (demand: number, supply: number) => {
    const ratio = demand / supply;
    if (ratio > 1.5) return { text: 'Hohe Nachfrage', color: 'text-red-600 dark:text-red-400' };
    if (ratio > 1.2) return { text: 'Erhöhte Nachfrage', color: 'text-orange-600 dark:text-orange-400' };
    if (ratio > 0.8) return { text: 'Ausgewogen', color: 'text-green-600 dark:text-green-400' };
    return { text: 'Überangebot', color: 'text-blue-600 dark:text-blue-400' };
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-line-chart-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Marktanalyse
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="6m">6 Monate</option>
            <option value="1y">1 Jahr</option>
            <option value="2y">2 Jahre</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'trends', label: 'Trends', icon: 'ri-line-chart-line' },
          { key: 'regional', label: 'Regional', icon: 'ri-map-pin-line' },
          { key: 'types', label: 'Objekttypen', icon: 'ri-building-line' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <i className={`${tab.icon} mr-1`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="h-80">
        {activeTab === 'trends' && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(marketData[marketData.length - 1]?.avgPrice || 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ø Preis</div>
                <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(0.4)}`}>
                  <i className={`${getChangeIcon(0.4)} mr-1`}></i>
                  +0.4%
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {marketData[marketData.length - 1]?.avgDaysOnMarket || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ø Tage</div>
                <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(-2)}`}>
                  <i className={`${getChangeIcon(-2)} mr-1`}></i>
                  -2 Tage
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {marketData[marketData.length - 1]?.salesVolume || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Verkäufe</div>
                <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(-7)}`}>
                  <i className={`${getChangeIcon(-7)} mr-1`}></i>
                  -7 vs. Okt
                </div>
              </div>
            </div>

            {/* Price Trend Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#F9FAFB',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [formatPrice(value), 'Durchschnittspreis']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgPrice" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'regional' && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {regionalData.map((region, index) => (
              <div key={region.region} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {region.region}
                  </h4>
                  <div className={`flex items-center text-xs font-medium ${getChangeColor(region.change)}`}>
                    <i className={`${getChangeIcon(region.change)} mr-1`}></i>
                    {region.change > 0 ? '+' : ''}{region.change}%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(region.avgPrice)}
                  </span>
                  <span>
                    {region.volume} Verkäufe (12M)
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((region.volume / 200) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {propertyTypeData.map((type) => {
              const ratio = getDemandSupplyRatio(type.demand, type.supply);
              return (
                <div key={type.type} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {type.type}
                    </h4>
                    <span className={`text-xs font-medium ${ratio.color}`}>
                      {ratio.text}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(type.avgPrice)}
                    </span>
                    <span>
                      Nachfrage: {type.demand} | Angebot: {type.supply}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nachfrage</div>
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${type.demand}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Angebot</div>
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${type.supply}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Insights */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-start space-x-2">
          <i className="ri-lightbulb-line text-blue-600 dark:text-blue-400 mt-0.5"></i>
          <div>
            <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Markt-Insight
            </h5>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {activeTab === 'trends' && 'Preise steigen moderat (+0.4%), aber Verkaufszeit verkürzt sich. Guter Zeitpunkt für Verkäufer.'}
              {activeTab === 'regional' && 'Landshut Stadt zeigt stärkste Preisentwicklung. Landkreis bietet noch Potenzial.'}
              {activeTab === 'types' && 'Eigentumswohnungen haben höchste Nachfrage. Einfamilienhäuser bleiben Premiumsegment.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrendsWidget; 
