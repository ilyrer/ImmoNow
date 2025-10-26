import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../../lib/api/client';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  target: number;
  color: string;
}

const RevenueChartWidget: React.FC = () => {
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null);
  const [isUserHovering, setIsUserHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetValue, setTargetValue] = useState(120000); // Default target

  // Hilfsfunktion für Zahlenformatierung
  const formatCurrency = (value: number, showCurrency = true) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${showCurrency ? ' €' : ''}`;
    } else {
      return `${(value / 1000).toFixed(0)}k${showCurrency ? ' €' : ''}`;
    }
  };

  // Lade Widget-Konfiguration aus localStorage
  const loadWidgetConfig = () => {
    try {
      const config = localStorage.getItem('widget_config_revenue_chart');
      if (config) {
        const parsedConfig = JSON.parse(config);
        if (parsedConfig.target) {
          setTargetValue(parsedConfig.target);
        }
      }
    } catch (error) {
      console.error('Error loading widget config:', error);
    }
  };

  // Fetch real revenue data from backend
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setIsLoading(true);
        
        // Lade Konfiguration
        loadWidgetConfig();
        
        const response = await apiClient.get('/api/v1/analytics/dashboard');
        const data = response as any || {};  // Type assertion für TypeScript
        
        console.log('📊 Revenue Chart - Raw response:', response);
        console.log('📊 Revenue Chart - Monthly trends:', data.monthly_revenue_trends);
        
        // Get monthly revenue trends
        const monthlyTrends = data.monthly_revenue_trends || [];
        
        // Month names
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        const colors = [
          'from-blue-500 to-blue-600',
          'from-purple-500 to-purple-600',
          'from-pink-500 to-pink-600',
          'from-green-500 to-green-600',
          'from-emerald-500 to-emerald-600',
          'from-cyan-500 to-cyan-600',
          'from-teal-500 to-teal-600',
          'from-indigo-500 to-indigo-600',
          'from-violet-500 to-violet-600',
          'from-orange-500 to-orange-600',
          'from-red-500 to-red-600',
          'from-amber-500 to-amber-600'
        ];
        
        // Map backend data to chart format
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        const revenues: MonthlyRevenue[] = monthNames.map((monthName, index) => {
          // Find data for this month from backend
          const monthData = monthlyTrends.find((m: any) => {
            const trendDate = new Date(m.month);
            return trendDate.getMonth() === index && trendDate.getFullYear() === currentYear;
          });
          
          // Determine if month is in the future
          const isFuture = index > currentMonth;
          
          return {
            month: monthName,
            revenue: isFuture ? 0 : (monthData?.revenue || 0),
            target: targetValue,  // Use configured target, not backend target
            color: colors[index]
          };
        });
        
        setMonthlyData(revenues);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        // Fallback to empty data
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        const colors = [
          'from-blue-500 to-blue-600',
          'from-purple-500 to-purple-600',
          'from-pink-500 to-pink-600',
          'from-green-500 to-green-600',
          'from-emerald-500 to-emerald-600',
          'from-cyan-500 to-cyan-600',
          'from-teal-500 to-teal-600',
          'from-indigo-500 to-indigo-600',
          'from-violet-500 to-violet-600',
          'from-orange-500 to-orange-600',
          'from-red-500 to-red-600',
          'from-amber-500 to-amber-600'
        ];
        
        setMonthlyData(monthNames.map((month, index) => ({
          month,
          revenue: 0,
          target: targetValue,
          color: colors[index]
        })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRevenueData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [targetValue]); // targetValue als Dependency hinzufügen

  // Event Listener für localStorage Änderungen (Custom Event)
  useEffect(() => {
    const handleConfigChange = (e: CustomEvent) => {
      if (e.detail?.widgetType === 'revenue_chart' && e.detail?.config?.target) {
        setTargetValue(e.detail.config.target);
        console.log('🎯 Revenue Chart: Target updated to', e.detail.config.target);
      }
    };

    window.addEventListener('widgetConfigChanged', handleConfigChange as EventListener);
    return () => window.removeEventListener('widgetConfigChanged', handleConfigChange as EventListener);
  }, []);

  // Aktuelle Daten (nur Monate mit Umsatz) - mit sicheren Defaults
  const actualData = monthlyData.length > 0 ? monthlyData.filter(m => m.revenue > 0) : [];
  const currentMonth = actualData.length > 0 ? actualData[actualData.length - 1] : { revenue: 0, target: targetValue, month: 'Okt', color: 'from-orange-500 to-orange-600' };
  const totalRevenue = actualData.length > 0 ? actualData.reduce((sum, month) => sum + month.revenue, 0) : 0;
  const avgRevenue = actualData.length > 0 ? Math.round(totalRevenue / actualData.length) : 0;
  const growth = actualData.length > 1 ? 
    ((currentMonth.revenue - actualData[actualData.length - 2].revenue) / actualData[actualData.length - 2].revenue * 100) : 0;

  const maxValue = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => Math.max(m.revenue, m.target))) : targetValue;

  // Animation Logic mit Auto-Scroll
  useEffect(() => {
    if (isAnimationPaused) return;

    const interval = setInterval(() => {
      setHighlightedMonth((prev) => {
        const nextMonth = prev === null ? 0 : (prev + 1) % actualData.length;
        
        // Auto-Scroll nur wenn Benutzer nicht hoviert - nur innerhalb der Widget-Box
        if (!isUserHovering) {
          setTimeout(() => {
            if (scrollContainerRef.current) {
              const monthElement = scrollContainerRef.current.children[nextMonth] as HTMLElement;
              if (monthElement) {
                // Scroll nur innerhalb des Containers, nicht die ganze Seite
                const container = scrollContainerRef.current;
                const containerRect = container.getBoundingClientRect();
                const elementRect = monthElement.getBoundingClientRect();
                
                const scrollTop = monthElement.offsetTop - container.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
                
                container.scrollTo({
                  top: scrollTop,
                  behavior: 'smooth'
                });
              }
            }
          }, 100); // Kurze Verzögerung für smoothes Scrolling
        }
        
        return nextMonth;
      });
    }, 1500); // Animation alle 1.5 Sekunden

    return () => clearInterval(interval);
  }, [isAnimationPaused, actualData.length, isUserHovering]);

  // Auto-Scroll nur bei automatischer Animation, nicht bei Hover - nur innerhalb der Widget-Box
  useEffect(() => {
    if (highlightedMonth !== null && scrollContainerRef.current && !isUserHovering) {
      const monthElement = scrollContainerRef.current.children[highlightedMonth] as HTMLElement;
      if (monthElement) {
        // Scroll nur innerhalb des Containers, nicht die ganze Seite
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = monthElement.getBoundingClientRect();
        
        const scrollTop = monthElement.offsetTop - container.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedMonth, isUserHovering]);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Umsatzdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 h-full flex flex-col overflow-hidden"
      onMouseEnter={() => {
        setIsAnimationPaused(true);
        setIsUserHovering(true);
      }}
      onMouseLeave={() => {
        setIsAnimationPaused(false);
        setIsUserHovering(false);
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <i className="ri-line-chart-line mr-2 text-blue-600 dark:text-blue-400"></i>
            Umsatz-Entwicklung
          </h3>
          <div className="ml-2 flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full ${isAnimationPaused ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-bounce'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {isAnimationPaused ? 'Pausiert' : 'Live'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Wachstum</div>
          <div className={`text-sm font-bold ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Kompakte Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Aktuell</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentMonth.revenue)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Durchschnitt</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(avgRevenue)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Ziel</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentMonth.target)}
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart mit Animation und Auto-Scroll */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 space-y-1 overflow-y-auto scroll-smooth">
        {monthlyData.map((month, index) => {
          const isHighlighted = highlightedMonth === index;
          const isFutureMonth = month.revenue === 0;
          const isCurrentlyAnimated = highlightedMonth !== null && index <= highlightedMonth && !isFutureMonth;
          
          return (
            <div 
              key={month.month} 
              className={`flex items-center space-x-2 transition-all duration-500 rounded-lg p-1.5 ${
                isHighlighted ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 transform scale-102' : 
                isCurrentlyAnimated ? 'bg-gray-50 dark:bg-gray-700/30' : 
                'hover:bg-gray-50 dark:hover:bg-gray-700/20'
              } ${isFutureMonth ? 'opacity-50' : ''}`}
              onMouseEnter={() => {
                setHighlightedMonth(index);
              }}
              onMouseLeave={() => {
                // Animation bleibt pausiert bei Widget-Hover
              }}
            >
              <div className={`text-xs font-medium w-7 transition-colors ${
                isHighlighted ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {month.month}
              </div>
              
              <div className="flex-1 relative">
                {/* Target Line */}
                <div className="absolute inset-0 flex items-center z-10">
                  <div 
                    className={`h-px bg-red-400 dark:bg-red-500 transition-all duration-500 ${
                      isHighlighted ? 'h-0.5 bg-red-500' : ''
                    }`}
                    style={{ width: `${(month.target / maxValue) * 100}%` }}
                  ></div>
                </div>
                
                {/* Revenue Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isFutureMonth 
                        ? 'bg-gray-300 dark:bg-gray-500' 
                        : month.revenue >= month.target 
                          ? `bg-gradient-to-r from-green-500 to-green-600 ${isHighlighted ? 'shadow-lg shadow-green-500/50' : ''}` 
                          : `bg-gradient-to-r ${month.color} ${isHighlighted ? 'shadow-lg shadow-blue-500/50' : ''}`
                    } ${isCurrentlyAnimated ? 'animate-pulse' : ''}`}
                    style={{ 
                      width: isFutureMonth ? '0%' : `${(month.revenue / maxValue) * 100}%`,
                      transition: 'width 1s ease-out, box-shadow 0.3s ease'
                    }}
                  >
                    {isHighlighted && !isFutureMonth && (
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    )}
                  </div>
                </div>

                {/* Kompakter Tooltip */}
                {isHighlighted && (
                  <div className="absolute -top-6 left-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-0.5 rounded text-xs whitespace-nowrap z-20">
                    {isFutureMonth ? 'Geplant' : `${formatCurrency(month.revenue)} (${((month.revenue / month.target) * 100).toFixed(1)}%)`}
                  </div>
                )}
              </div>
              
              <div className={`text-xs font-medium w-10 text-right transition-colors ${
                isHighlighted ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {isFutureMonth ? '---' : formatCurrency(month.revenue, false)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kompakte Legend & Controls */}
      <div className="flex items-center justify-between mt-2 text-xs flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Umsatz</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-px bg-red-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Ziel</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsAnimationPaused(!isAnimationPaused)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            isAnimationPaused 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {isAnimationPaused ? '▶️' : '⏸️'}
        </button>
      </div>
    </div>
  );
};

export default RevenueChartWidget;
