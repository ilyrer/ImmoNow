import React, { useState } from 'react';
import {
  X,
  Plus,
  Grip,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  FileText,
  Calendar,
  MapPin,
  Target,
  Clock,
  PieChart,
  DollarSign,
  Home,
  Settings,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  visible: boolean;
  category: 'analytics' | 'sales' | 'properties' | 'team' | 'activities' | 'finance';
  icon: React.ElementType;
  color: string;
}

interface WidgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: DashboardWidget[];
  activeWidgets: DashboardWidget[];
  onAddWidget: (widget: DashboardWidget) => void;
  onRemoveWidget: (widgetId: string) => void;
  onToggleWidget: (widgetId: string) => void;
  onResetLayout: () => void;
}

const WidgetManager: React.FC<WidgetManagerProps> = ({
  isOpen,
  onClose,
  availableWidgets,
  activeWidgets,
  onAddWidget,
  onRemoveWidget,
  onToggleWidget,
  onResetLayout
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ESC-Taste zum Schließen
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Alle', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sales', label: 'Verkauf', icon: TrendingUp },
    { id: 'properties', label: 'Immobilien', icon: Home },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'activities', label: 'Aktivitäten', icon: Activity },
    { id: 'finance', label: 'Finanzen', icon: DollarSign }
  ];

  const filteredWidgets = availableWidgets.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, widget: DashboardWidget) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isWidgetActive = (widgetType: string) => {
    return activeWidgets.some(w => w.type === widgetType);
  };

  const getWidgetSizeLabel = (w: number, h: number) => {
    if (w <= 3 && h <= 2) return 'Klein';
    if (w <= 6 && h <= 3) return 'Mittel';
    if (w <= 8 && h <= 4) return 'Groß';
    return 'Extra Groß';
  };

  return (
    <>
      {/* Backdrop mit Click zum Schließen */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10002] transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 z-[10003] w-96 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Close button - Grau und sichtbar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[10004] p-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all shadow-lg hover:shadow-xl group"
          title="Widget Manager schließen (ESC)"
        >
          <X className="w-5 h-5" />
          <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ESC zum Schließen
          </span>
        </button>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 dark:border-gray-700/50">
          <div className="mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📊 Widget-Manager
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Widgets per Drag & Drop hinzufügen
              </p>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-2">
              <div className="text-blue-500 mt-0.5">💡</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>So geht's:</strong>
                <ol className="mt-1 space-y-1 text-xs">
                  <li>1. Widget aus der Liste unten auswählen</li>
                  <li>2. Widget ins Dashboard ziehen & ablegen</li>
                  <li>3. Zum Verschieben: "Anpassen" Button aktivieren</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Widgets durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={onResetLayout}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Layout zurücksetzen
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-white/10 dark:border-gray-700/50">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const Icon = category.icon || Settings;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Widgets */}
        <div className="p-4 border-b border-white/10 dark:border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Aktive Widgets ({activeWidgets.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeWidgets.map((widget) => {
              const Icon = widget.icon || Settings;
              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {widget.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onToggleWidget(widget.id)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title={widget.visible ? 'Ausblenden' : 'Anzeigen'}
                    >
                      {widget.visible ? (
                        <Eye className="w-3 h-3 text-green-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Widget entfernen"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
            {activeWidgets.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Keine aktiven Widgets
              </p>
            )}
          </div>
        </div>

        {/* Available Widgets */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Verfügbare Widgets
            </h3>
            <div className="space-y-3">
              {filteredWidgets.map((widget) => {
                const Icon = widget.icon || Settings;
                const isActive = isWidgetActive(widget.type);
                
                return (
                  <div
                    key={widget.type}
                    draggable={!isActive}
                    onDragStart={(e) => handleDragStart(e, widget)}
                    className={`relative p-4 rounded-xl border-2 border-dashed transition-all group ${
                      isActive
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-grab active:cursor-grabbing hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                    {!isActive && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          <Grip className="w-3 h-3" />
                          <span>Ziehen</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${widget.color}`}>
                          {Icon && <Icon className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {widget.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Grip className="w-4 h-4 text-gray-400" />
                        {!isActive ? (
                          <button
                            onClick={() => onAddWidget(widget)}
                            className="p-1 rounded bg-blue-500 hover:bg-blue-600 transition-colors"
                            title="Widget hinzufügen"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        ) : (
                          <div className="p-1 rounded bg-gray-400 cursor-not-allowed">
                            <Plus className="w-3 h-3 text-white opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        widget.category === 'analytics' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        widget.category === 'sales' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        widget.category === 'properties' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        widget.category === 'team' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        widget.category === 'activities' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
                        'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                      }`}>
                        {categories.find(c => c.id === widget.category)?.label}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {getWidgetSizeLabel(widget.position.w, widget.position.h)}
                      </span>
                    </div>
                    
                    {isActive && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Bereits im Dashboard
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredWidgets.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keine Widgets gefunden
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2 mb-2">
              <Grip className="w-3 h-3" />
              <span>Ziehen Sie Widgets ins Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plus className="w-3 h-3" />
              <span>Oder klicken Sie auf + zum Hinzufügen</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetManager;
