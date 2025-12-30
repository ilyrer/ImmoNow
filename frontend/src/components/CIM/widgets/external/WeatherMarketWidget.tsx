import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WeatherMarketWidget: React.FC = () => {
  const weatherData = {
    location: 'München',
    temperature: 18,
    condition: 'sunny',
    humidity: 65,
    windSpeed: 12
  };

  const marketData = {
    marketTrend: 'up',
    averagePrice: '4.250',
    priceChange: '+3.2',
    salesVolume: 124,
    volumeChange: '+8'
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'ri-sun-line';
      case 'cloudy': return 'ri-cloudy-line';
      case 'rainy': return 'ri-rainy-line';
      case 'snowy': return 'ri-snowy-line';
      default: return 'ri-sun-line';
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'yellow';
      case 'cloudy': return 'gray';
      case 'rainy': return 'blue';
      case 'snowy': return 'cyan';
      default: return 'yellow';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'Sonnig';
      case 'cloudy': return 'Bewölkt';
      case 'rainy': return 'Regnerisch';
      case 'snowy': return 'Schnee';
      default: return 'Sonnig';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wetter & Markt</CardTitle>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
            Live-Daten
          </Badge>
        </div>
      </CardHeader>
      <CardContent>

      {/* Weather Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Wetter - {weatherData.location}
          </h4>
          <div className={`text-2xl text-${getWeatherColor(weatherData.condition)}-500`}>
            <i className={getWeatherIcon(weatherData.condition)}></i>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {weatherData.temperature}°C
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getConditionText(weatherData.condition)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <i className="ri-drop-line text-blue-500"></i>
            <span className="text-gray-600 dark:text-gray-400">
              {weatherData.humidity}% Luftfeuchtigkeit
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="ri-windy-line text-gray-500"></i>
            <span className="text-gray-600 dark:text-gray-400">
              {weatherData.windSpeed} km/h Wind
            </span>
          </div>
        </div>
      </div>

      {/* Market Section */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Immobilienmarkt
          </h4>
          <div className={`text-xl ${marketData.marketTrend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            <i className={marketData.marketTrend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Durchschnittspreis/m²
            </span>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {marketData.averagePrice} €
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {marketData.priceChange}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Verkäufe (Monat)
            </span>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {marketData.salesVolume}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {marketData.volumeChange}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Indicators */}
        <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Käufermarkt</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Hohe Nachfrage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Impact on Business */}
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <i className="ri-lightbulb-line text-yellow-600 dark:text-yellow-400"></i>
          <div className="flex-1">
            <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
              Wetter-Tipp
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              {weatherData.condition === 'sunny' 
                ? 'Perfektes Wetter für Besichtigungen! Termine verfügbar.'
                : 'Virtuelle Besichtigungen empfohlen bei diesem Wetter.'
              }
            </div>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default WeatherMarketWidget;
