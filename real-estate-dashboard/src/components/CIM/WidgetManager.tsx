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
  Search,
  Layers,
  Sparkles,
  Palette,
  Zap
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
  category: 'analytics' | 'sales' | 'properties' | 'team' | 'activities' | 'finance' | 'system' | 'billing' | 'documents' | 'hr' | 'calendar' | 'notifications' | 'social' | 'communication';
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
      {/* Backdrop mit Click zum Schließen - Transparent für bessere Sichtbarkeit */}
      <div 
        className="fixed inset-0 bg-black/20 z-[10002] transition-all duration-300 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 z-[10003] w-[420px] h-screen bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border-r border-white/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Glasmorphismus Hintergrund */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
        
        {/* Scrollbar Container für den gesamten Inhalt */}
        <div className="flex-1 overflow-y-auto widget-manager-scroll">
        {/* Close button - Modernes Design */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-[10004] p-3 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white/80 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl group border border-white/20"
          title="Widget Manager schließen (ESC)"
        >
          <X className="w-5 h-5" />
          <span className="absolute -bottom-10 right-0 bg-slate-800/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-white/10">
            ESC zum Schließen
          </span>
        </button>
        
        {/* Header */}
        <div className="relative p-8 border-b border-white/10">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Widget Manager
                </h2>
                <p className="text-sm text-white/70 font-medium">
                  Dashboard anpassen und optimieren
                </p>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-sm text-white/90">
                <strong className="text-white font-semibold">Anleitung:</strong>
                <ol className="mt-2 space-y-1.5 text-xs text-white/80">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Widget aus der Liste auswählen</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Ins Dashboard ziehen & ablegen</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>Zum Verschieben: "Anpassen" aktivieren</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Widgets durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-white/60 transition-all duration-300"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onResetLayout}
              className="flex-1 px-4 py-3 text-sm font-medium bg-white/10 backdrop-blur-sm text-white/90 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Layout zurücksetzen</span>
              </div>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="relative p-6 border-b border-white/10">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const Icon = category.icon || Settings;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-white border border-white/30 shadow-lg'
                      : 'bg-white/5 backdrop-blur-sm text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20'
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
        <div className="relative p-6 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Eye className="w-3 h-3 text-green-300" />
            </div>
            <span>Aktive Widgets ({activeWidgets.length})</span>
          </h3>
          <div className="space-y-3">
            {activeWidgets.map((widget) => {
              const Icon = widget.icon || Settings;
              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      {Icon && <Icon className="w-4 h-4 text-white/80" />}
                    </div>
                    <span className="text-sm text-white/90 font-medium truncate">
                      {widget.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleWidget(widget.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                      title={widget.visible ? 'Ausblenden' : 'Anzeigen'}
                    >
                      {widget.visible ? (
                        <Eye className="w-4 h-4 text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-white/40" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                      title="Widget entfernen"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
            {activeWidgets.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Settings className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-sm text-white/60">
                  Keine aktiven Widgets
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Available Widgets */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Palette className="w-3 h-3 text-blue-300" />
            </div>
            <span>Verfügbare Widgets</span>
          </h3>
          <div className="space-y-4 pb-4">
              {filteredWidgets.map((widget) => {
                const Icon = widget.icon || Settings;
                const isActive = isWidgetActive(widget.type);
                
                return (
                  <div
                    key={widget.type}
                    draggable={!isActive}
                    onDragStart={(e) => handleDragStart(e, widget)}
                    className={`relative p-5 rounded-2xl border-2 border-dashed transition-all duration-300 group ${
                      isActive
                        ? 'border-white/20 bg-white/5 backdrop-blur-sm opacity-50 cursor-not-allowed'
                        : 'border-white/20 bg-white/5 backdrop-blur-sm hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 cursor-grab active:cursor-grabbing hover:shadow-xl hover:scale-[1.02] hover:shadow-blue-500/10'
                    }`}
                  >
                    {!isActive && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-white/30">
                          <Grip className="w-3 h-3" />
                          <span className="font-medium">Ziehen</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${widget.color} shadow-lg`}>
                          {Icon && <Icon className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-base mb-1">
                            {widget.title}
                          </h4>
                          <p className="text-sm text-white/70 leading-relaxed">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isActive ? (
                          <button
                            onClick={() => onAddWidget(widget)}
                            className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            title="Widget hinzufügen"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        ) : (
                          <div className="p-2 rounded-xl bg-white/10 cursor-not-allowed">
                            <Plus className="w-4 h-4 text-white/30" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className={`px-3 py-1.5 rounded-full font-medium ${
                        widget.category === 'analytics' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-400/30' :
                        widget.category === 'sales' ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-400/30' :
                        widget.category === 'properties' ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-400/30' :
                        widget.category === 'team' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border border-orange-400/30' :
                        widget.category === 'activities' ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-teal-300 border border-teal-400/30' :
                        'bg-gradient-to-r from-pink-500/20 to-pink-600/20 text-pink-300 border border-pink-400/30'
                      }`}>
                        {categories.find(c => c.id === widget.category)?.label}
                      </span>
                      <span className="text-white/60 font-medium">
                        {getWidgetSizeLabel(widget.position.w, widget.position.h)}
                      </span>
                    </div>
                    
                    {isActive && (
                      <div className="mt-3 text-sm text-white/60 text-center py-2 bg-white/5 rounded-xl border border-white/10">
                        Bereits im Dashboard
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredWidgets.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Settings className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-base text-white/60 font-medium">
                    Keine Widgets gefunden
                  </p>
                  <p className="text-sm text-white/40 mt-2">
                    Versuchen Sie eine andere Kategorie oder Suchbegriff
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - außerhalb des Scroll-Containers */}
        <div className="relative p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
          <div className="text-sm text-white/70">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Grip className="w-4 h-4 text-blue-300" />
              </div>
              <span className="font-medium">Ziehen Sie Widgets ins Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Plus className="w-4 h-4 text-green-300" />
              </div>
              <span className="font-medium">Oder klicken Sie auf + zum Hinzufügen</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetManager;
