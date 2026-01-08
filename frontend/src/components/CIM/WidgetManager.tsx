import React, { useState, useMemo } from 'react';
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
  Search,
  Filter,
  Grid3x3,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  RotateCcw
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Fallback wenn keine Widgets verfügbar sind
  if (!availableWidgets || availableWidgets.length === 0) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] transition-opacity duration-300"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Keine Widgets verfügbar
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Es sind derzeit keine Widgets verfügbar. Bitte versuchen Sie es später erneut.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Schließen
            </button>
          </div>
        </div>
      </>
    );
  }

  const categories = [
    { id: 'all', label: 'Alle', icon: Grid3x3, count: availableWidgets.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: availableWidgets.filter(w => w.category === 'analytics').length },
    { id: 'sales', label: 'Verkauf', icon: TrendingUp, count: availableWidgets.filter(w => w.category === 'sales').length },
    { id: 'properties', label: 'Immobilien', icon: Home, count: availableWidgets.filter(w => w.category === 'properties').length },
    { id: 'team', label: 'Team', icon: Users, count: availableWidgets.filter(w => w.category === 'team').length },
    { id: 'activities', label: 'Aktivitäten', icon: Activity, count: availableWidgets.filter(w => w.category === 'activities').length },
    { id: 'finance', label: 'Finanzen', icon: DollarSign, count: availableWidgets.filter(w => w.category === 'finance').length }
  ];

  const filteredWidgets = useMemo(() => {
    return availableWidgets.filter(widget => {
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableWidgets, selectedCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent, widget: DashboardWidget) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isWidgetActive = (widgetType: string) => {
    return activeWidgets.some(w => w.type === widgetType && w.visible);
  };

  const getWidgetSizeLabel = (w: number, h: number) => {
    if (w <= 3 && h <= 2) return 'Klein';
    if (w <= 6 && h <= 3) return 'Mittel';
    if (w <= 8 && h <= 4) return 'Groß';
    return 'Extra Groß';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      analytics: 'from-blue-500 to-cyan-500',
      sales: 'from-green-500 to-emerald-500',
      properties: 'from-purple-500 to-pink-500',
      team: 'from-orange-500 to-amber-500',
      activities: 'from-teal-500 to-cyan-500',
      finance: 'from-emerald-500 to-green-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const activeCount = activeWidgets.filter(w => w.visible).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Widget Manager Modal - 80% Zoom Perspective */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
        <div 
          className="w-[90%] h-[90%] max-w-[1400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            transform: 'scale(0.8)',
            transformOrigin: 'center center'
          }}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-gray-800/50 dark:via-gray-800/50 dark:to-gray-800/50">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title="Schließen (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Section */}
            <div className="pr-20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Widget Manager
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Verwalte und füge Widgets zu deinem Dashboard hinzu
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {activeCount} Aktiv
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Grid3x3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {availableWidgets.length} Verfügbar
                  </span>
                </div>
                <button
                  onClick={onResetLayout}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-700 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">Layout zurücksetzen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Widgets durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Active Widgets Sidebar */}
            <div className="w-80 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30 flex flex-col">
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Aktive Widgets
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeCount} von {activeWidgets.length} sichtbar
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeWidgets.map((widget) => {
                  const Icon = widget.icon || Settings;
                  return (
                    <div
                      key={widget.id}
                      className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {widget.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {getWidgetSizeLabel(widget.position.w, widget.position.h)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onToggleWidget(widget.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            widget.visible 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }`}
                          title={widget.visible ? 'Ausblenden' : 'Anzeigen'}
                        >
                          {widget.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onRemoveWidget(widget.id)}
                          className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          title="Entfernen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {activeWidgets.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Keine aktiven Widgets
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Widgets Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredWidgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Keine Widgets gefunden
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Versuche einen anderen Suchbegriff oder wähle eine andere Kategorie aus.
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'space-y-3'
                }>
                  {filteredWidgets.map((widget) => {
                    const Icon = widget.icon || Settings;
                    const isActive = isWidgetActive(widget.type);
                    
                    return (
                      <div
                        key={widget.type}
                        draggable={!isActive}
                        onDragStart={(e) => handleDragStart(e, widget)}
                        className={`group relative p-5 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:scale-[1.02] cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {/* Active Badge */}
                        {isActive && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktiv</span>
                          </div>
                        )}

                        {/* Drag Hint */}
                        {!isActive && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center space-x-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              <Grip className="w-3 h-3" />
                              <span>Ziehen</span>
                            </div>
                          </div>
                        )}

                        {/* Widget Icon & Title */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${getCategoryColor(widget.category)} shadow-lg flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                              {widget.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {widget.description}
                            </p>
                          </div>
                        </div>

                        {/* Widget Meta */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              widget.category === 'analytics' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              widget.category === 'sales' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              widget.category === 'properties' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              widget.category === 'team' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              widget.category === 'activities' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                              'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                            }`}>
                              {categories.find(c => c.id === widget.category)?.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getWidgetSizeLabel(widget.position.w, widget.position.h)}
                            </span>
                          </div>
                          {!isActive && (
                            <button
                              onClick={() => onAddWidget(widget)}
                              className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all shadow-md hover:shadow-lg hover:scale-110"
                              title="Widget hinzufügen"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Grip className="w-4 h-4" />
                  <span>Ziehen Sie Widgets ins Dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Oder klicken Sie auf + zum Hinzufügen</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetManager;
