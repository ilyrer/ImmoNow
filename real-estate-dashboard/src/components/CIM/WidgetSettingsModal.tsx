import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

interface WidgetConfig {
  target?: number;
  timeRange?: 7 | 30 | 90;
  customSettings?: Record<string, any>;
}

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string;
  widgetType: string;
  widgetTitle: string;
  onConfigChange: (widgetId: string, config: WidgetConfig) => void;
}

const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  isOpen,
  onClose,
  widgetId,
  widgetType,
  widgetTitle,
  onConfigChange
}) => {
  const [config, setConfig] = useState<WidgetConfig>({});
  const [activeTab, setActiveTab] = useState<'general' | 'targets' | 'display'>('general');

  // Lade Konfiguration aus localStorage
  useEffect(() => {
    if (isOpen) {
      const configKey = `widget_config_${widgetType}`;
      const savedConfig = localStorage.getItem(configKey);
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (error) {
          console.error('Error loading widget config:', error);
          setConfig({});
        }
      } else {
        setConfig({});
      }
    }
  }, [isOpen, widgetType]);

  // Speichere Konfiguration
  const handleSave = () => {
    const configKey = `widget_config_${widgetType}`;
    localStorage.setItem(configKey, JSON.stringify(config));
    
    // Dispatch Custom Event für Live-Updates
    const event = new CustomEvent('widgetConfigChanged', {
      detail: {
        widgetType,
        widgetId,
        config
      }
    });
    window.dispatchEvent(event);
    console.log('🚀 Dispatched widgetConfigChanged event:', { widgetType, widgetId, config });
    
    onConfigChange(widgetId, config);
    onClose();
  };

  // Reset Konfiguration
  const handleReset = () => {
    setConfig({});
    const configKey = `widget_config_${widgetType}`;
    localStorage.removeItem(configKey);
    onConfigChange(widgetId, {});
  };

  // Bestimme verfügbare Tabs basierend auf Widget-Typ
  const getAvailableTabs = () => {
    const tabs = ['general'];
    
    if (['lead_conversion', 'revenue_chart', 'property_performance'].includes(widgetType)) {
      tabs.push('targets');
    }
    
    if (['market_trends', 'analytics', 'performance'].includes(widgetType)) {
      tabs.push('display');
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Widget-Einstellungen
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {widgetTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'general' && 'Allgemein'}
              {tab === 'targets' && 'Ziele'}
              {tab === 'display' && 'Anzeige'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Widget-Titel
                </label>
                <input
                  type="text"
                  value={config.customSettings?.title || widgetTitle}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    customSettings: {
                      ...prev.customSettings,
                      title: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={config.customSettings?.description || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    customSettings: {
                      ...prev.customSettings,
                      description: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optionale Beschreibung für das Widget..."
                />
              </div>
            </div>
          )}

          {/* Targets Tab */}
          {activeTab === 'targets' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monatliches Ziel
                </label>
                <input
                  type="number"
                  value={config.target || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    target: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Zielwert eingeben..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {widgetType === 'lead_conversion' && 'Anzahl Abschlüsse pro Monat'}
                  {widgetType === 'revenue_chart' && 'Umsatz-Ziel in €'}
                  {widgetType === 'property_performance' && 'Anzahl Verkäufe pro Monat'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zielzeitraum
                </label>
                <select
                  value={config.customSettings?.targetPeriod || 'monthly'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    customSettings: {
                      ...prev.customSettings,
                      targetPeriod: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Quartalsweise</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zeitraum
                </label>
                <select
                  value={config.timeRange || 30}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    timeRange: Number(e.target.value) as 7 | 30 | 90
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={7}>Letzte 7 Tage</option>
                  <option value={30}>Letzte 30 Tage</option>
                  <option value={90}>Letzte 90 Tage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diagramm-Typ
                </label>
                <select
                  value={config.customSettings?.chartType || 'line'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    customSettings: {
                      ...prev.customSettings,
                      chartType: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="line">Liniendiagramm</option>
                  <option value="bar">Balkendiagramm</option>
                  <option value="area">Flächendiagramm</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.customSettings?.showTrends || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      customSettings: {
                        ...prev.customSettings,
                        showTrends: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trendlinien anzeigen
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zurücksetzen</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsModal;
