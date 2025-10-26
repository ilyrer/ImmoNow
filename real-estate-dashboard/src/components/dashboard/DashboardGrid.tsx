import React, { useState, useRef, useCallback } from 'react';
import { Plus, Grip, X, Eye, EyeOff, Settings, RotateCcw } from 'lucide-react';
import WidgetSettingsModal from '../CIM/WidgetSettingsModal';

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

interface DashboardGridProps {
  widgets: DashboardWidget[];
  onAddWidget: (widget: DashboardWidget, position?: { x: number; y: number }) => void;
  onRemoveWidget: (widgetId: string) => void;
  onToggleWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, newPosition: { x: number; y: number; w: number; h: number }) => void;
  onOpenWidgetManager: () => void;
  onLoadDefaultLayout: () => void;
  onRearrangeLayout?: () => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
  isCustomizing: boolean;
  className?: string;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  onAddWidget,
  onRemoveWidget,
  onToggleWidget,
  onMoveWidget,
  onOpenWidgetManager,
  onLoadDefaultLayout,
  onRearrangeLayout,
  renderWidget,
  isCustomizing,
  className = ""
}) => {
  const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeWidget, setResizeWidget] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Grid-Konfiguration (12 Spalten)
  const GRID_COLUMNS = 12;
  const GRID_ROWS = 12;
  const CELL_HEIGHT = 80; // Höhe einer Grid-Zelle in px

  // Resize-Handler-Funktionen
  const handleResizeStart = useCallback((e: React.MouseEvent, widgetId: string, handle: string) => {
    if (!isCustomizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    setIsResizing(true);
    setResizeWidget(widgetId);
    setResizeHandle(handle);
    setResizeStart({
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h
    });
  }, [isCustomizing, widgets]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeWidget || !resizeStart || !resizeHandle) return;
    
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / GRID_COLUMNS;
    const cellHeight = CELL_HEIGHT;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const gridX = Math.floor(mouseX / cellWidth);
    const gridY = Math.floor(mouseY / cellHeight);
    
    let newX = resizeStart.x;
    let newY = resizeStart.y;
    let newW = resizeStart.w;
    let newH = resizeStart.h;
    
    // Berechne neue Größe basierend auf Handle
    switch (resizeHandle) {
      case 'se': // Süd-Ost (rechts-unten)
        newW = Math.max(2, Math.min(12, gridX - resizeStart.x + 1));
        newH = Math.max(1, Math.min(8, gridY - resizeStart.y + 1));
        break;
      case 'sw': // Süd-West (links-unten)
        newX = Math.max(0, Math.min(resizeStart.x + resizeStart.w - 2, gridX));
        newW = Math.max(2, Math.min(12, resizeStart.x + resizeStart.w - newX));
        newH = Math.max(1, Math.min(8, gridY - resizeStart.y + 1));
        break;
      case 'ne': // Nord-Ost (rechts-oben)
        newY = Math.max(0, Math.min(resizeStart.y + resizeStart.h - 1, gridY));
        newW = Math.max(2, Math.min(12, gridX - resizeStart.x + 1));
        newH = Math.max(1, Math.min(8, resizeStart.y + resizeStart.h - newY));
        break;
      case 'nw': // Nord-West (links-oben)
        newX = Math.max(0, Math.min(resizeStart.x + resizeStart.w - 2, gridX));
        newY = Math.max(0, Math.min(resizeStart.y + resizeStart.h - 1, gridY));
        newW = Math.max(2, Math.min(12, resizeStart.x + resizeStart.w - newX));
        newH = Math.max(1, Math.min(8, resizeStart.y + resizeStart.h - newY));
        break;
    }
    
    // Prüfe ob neue Position frei ist
    if (isPositionFree(newX, newY, newW, newH, resizeWidget)) {
      onMoveWidget(resizeWidget, { x: newX, y: newY, w: newW, h: newH });
    }
  }, [isResizing, resizeWidget, resizeStart, resizeHandle, onMoveWidget]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeWidget(null);
    setResizeHandle(null);
    setResizeStart(null);
  }, []);

  // Event Listeners für Resize
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Settings Modal Handler
  const handleOpenSettings = (widgetId: string) => {
    setSettingsWidgetId(widgetId);
    setSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsModalOpen(false);
    setSettingsWidgetId(null);
  };

  const handleConfigChange = (widgetId: string, config: any) => {
    // Config wird bereits in localStorage gespeichert
    console.log('Widget config changed:', widgetId, config);
    
    // Dispatch Custom Event für Live-Updates
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      const event = new CustomEvent('widgetConfigChanged', {
        detail: {
          widgetType: widget.type,
          widgetId,
          config
        }
      });
      window.dispatchEvent(event);
    }
  };

  // Bestimme ob Widget konfigurierbar ist
  const isConfigurableWidget = (widgetType: string) => {
    return [
      'lead_conversion', 
      'revenue_chart', 
      'property_performance', 
      'market_trends', 
      'analytics', 
      'performance',
      'storage_usage',
      'subscription_limits',
      'document_analytics',
      'hr_overview',
      'payroll_summary',
      'appointment_calendar',
      'notifications_center',
      'social_performance',
      'property_inquiry',
      'team_communication'
    ].includes(widgetType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Berechne Grid-Position
    const cellWidth = rect.width / GRID_COLUMNS;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / CELL_HEIGHT);
    
    const clampedPosition = {
      x: Math.max(0, Math.min(gridX, GRID_COLUMNS - 1)),
      y: Math.max(0, Math.min(gridY, GRID_ROWS - 1))
    };
    
    setDragOverPosition(clampedPosition);
    setIsDragging(true);

    // Prüfe für Swap-Feedback
    const targetWidget = findWidgetAtPosition(clampedPosition.x, clampedPosition.y);
    if (targetWidget && isCustomizing) {
      setSwapTarget(targetWidget.id);
    } else {
      setSwapTarget(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Nur wenn wir das Grid komplett verlassen
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverPosition(null);
      setIsDragging(false);
      setSwapTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);
    setIsDragging(false);
    setSwapTarget(null);

    try {
      const widgetData = JSON.parse(e.dataTransfer.getData('application/json')) as DashboardWidget & { isDraggingExisting?: boolean };
      
      if (!gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Berechne Grid-Position
      const cellWidth = rect.width / GRID_COLUMNS;
      const gridX = Math.floor(x / cellWidth);
      const gridY = Math.floor(y / CELL_HEIGHT);
      
      const dropPosition = {
        x: Math.max(0, Math.min(gridX, GRID_COLUMNS - widgetData.position.w)),
        y: Math.max(0, Math.min(gridY, GRID_ROWS - widgetData.position.h))
      };

      if (widgetData.isDraggingExisting) {
        // Bewegung eines bestehenden Widgets
        const excludeId = widgetData.id;
        
        // Prüfe ob Drop-Position frei ist
        if (isPositionFree(dropPosition.x, dropPosition.y, widgetData.position.w, widgetData.position.h, excludeId)) {
          onMoveWidget(widgetData.id, {
            ...widgetData.position,
            x: dropPosition.x,
            y: dropPosition.y
          });
        } else {
          // Prüfe ob Widget-Vertauschen möglich ist
          const targetWidget = findWidgetAtPosition(dropPosition.x, dropPosition.y);
          if (targetWidget && canSwapWidgets(widgetData, targetWidget)) {
            // Vertausche die beiden Widgets
            swapWidgets(widgetData, targetWidget);
          } else {
            // Finde nächste freie Position für das verschobene Widget
            const freePosition = findFreePositionExcluding(widgetData.position.w, widgetData.position.h, excludeId);
            if (freePosition) {
              onMoveWidget(widgetData.id, {
                ...widgetData.position,
                x: freePosition.x,
                y: freePosition.y
              });
            }
          }
        }
      } else {
        // Hinzufügung eines neuen Widgets
        if (isPositionFree(dropPosition.x, dropPosition.y, widgetData.position.w, widgetData.position.h)) {
          onAddWidget(widgetData, dropPosition);
        } else {
          // Finde nächste freie Position
          const freePosition = findFreePosition(widgetData.position.w, widgetData.position.h);
          if (freePosition) {
            onAddWidget(widgetData, freePosition);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing dropped widget:', error);
    }
  };

  const findFreePositionExcluding = (w: number, h: number, excludeId: string): { x: number; y: number } | null => {
    for (let y = 0; y <= GRID_ROWS - h; y++) {
      for (let x = 0; x <= GRID_COLUMNS - w; x++) {
        if (isPositionFree(x, y, w, h, excludeId)) {
          return { x, y };
        }
      }
    }
    return null;
  };

  // Widget-Vertausch Hilfsfunktionen
  const findWidgetAtPosition = (x: number, y: number): DashboardWidget | null => {
    return widgets.find(widget => 
      widget.visible &&
      x >= widget.position.x && 
      x < widget.position.x + widget.position.w &&
      y >= widget.position.y && 
      y < widget.position.y + widget.position.h
    ) || null;
  };

  const canSwapWidgets = (widget1: DashboardWidget, widget2: DashboardWidget): boolean => {
    // Prüfe ob beide Widgets ähnliche Größen haben (für besseres Vertauschen)
    const size1 = widget1.position.w * widget1.position.h;
    const size2 = widget2.position.w * widget2.position.h;
    const sizeDifference = Math.abs(size1 - size2) / Math.max(size1, size2);
    
    // Erlaube Vertauschen wenn Größenunterschied < 50%
    return sizeDifference < 0.5;
  };

  const swapWidgets = (widget1: DashboardWidget, widget2: DashboardWidget) => {
    const pos1 = { ...widget1.position };
    const pos2 = { ...widget2.position };
    
    // Vertausche nur x,y Positionen, behalte w,h bei
    onMoveWidget(widget1.id, { ...pos1, x: pos2.x, y: pos2.y });
    onMoveWidget(widget2.id, { ...pos2, x: pos1.x, y: pos1.y });
  };

  const isPositionFree = (x: number, y: number, w: number, h: number, excludeId?: string) => {
    return !widgets.some(widget => {
      if (excludeId && widget.id === excludeId) return false;
      if (!widget.visible) return false;
      
      const widgetRight = widget.position.x + widget.position.w;
      const widgetBottom = widget.position.y + widget.position.h;
      const newRight = x + w;
      const newBottom = y + h;
      
      return !(
        x >= widgetRight || 
        newRight <= widget.position.x || 
        y >= widgetBottom || 
        newBottom <= widget.position.y
      );
    });
  };

  const findFreePosition = (w: number, h: number): { x: number; y: number } | null => {
    // Versuche zuerst die beste Position basierend auf bereits platzierten Widgets zu finden
    const occupiedPositions = widgets
      .filter(widget => widget.visible)
      .map(widget => ({
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        bottom: widget.position.y + widget.position.h,
        right: widget.position.x + widget.position.w
      }))
      .sort((a, b) => a.y - b.y || a.x - b.x);

    // Wenn keine Widgets vorhanden, starte bei (0, 0)
    if (occupiedPositions.length === 0) {
      return { x: 0, y: 0 };
    }

    // Versuche rechts neben dem letzten Widget in der aktuellen Reihe
    for (const pos of occupiedPositions) {
      const nextX = pos.right;
      if (nextX + w <= GRID_COLUMNS && isPositionFree(nextX, pos.y, w, h)) {
        return { x: nextX, y: pos.y };
      }
    }

    // Versuche unter dem tiefsten Widget
    const maxBottom = Math.max(...occupiedPositions.map(pos => pos.bottom));
    if (maxBottom + h <= GRID_ROWS && isPositionFree(0, maxBottom, w, h)) {
      return { x: 0, y: maxBottom };
    }

    // Fallback: Systematische Suche
    for (let y = 0; y <= GRID_ROWS - h; y++) {
      for (let x = 0; x <= GRID_COLUMNS - w; x++) {
        if (isPositionFree(x, y, w, h)) {
          return { x, y };
        }
      }
    }
    
    return null;
  };

  // Neue Funktion für automatisches Layout-Rearrangement
  const rearrangeLayout = () => {
    const visibleWidgets = widgets.filter(w => w.visible);
    if (visibleWidgets.length <= 1) return;

    // Sortiere Widgets nach Priorität (größere zuerst, dann nach ID)
    const sortedWidgets = [...visibleWidgets].sort((a, b) => {
      const aSize = a.position.w * a.position.h;
      const bSize = b.position.w * b.position.h;
      if (aSize !== bSize) return bSize - aSize;
      return a.id.localeCompare(b.id);
    });

    const newPositions: Array<{id: string, position: {x: number, y: number, w: number, h: number}}> = [];
    let currentY = 0;
    let currentRowHeight = 0;
    let currentX = 0;

    for (const widget of sortedWidgets) {
      const { w, h } = widget.position;
      
      // Prüfe ob Widget in aktuelle Reihe passt
      if (currentX + w <= GRID_COLUMNS) {
        newPositions.push({
          id: widget.id,
          position: { x: currentX, y: currentY, w, h }
        });
        currentX += w;
        currentRowHeight = Math.max(currentRowHeight, h);
      } else {
        // Neue Reihe beginnen
        currentY += currentRowHeight;
        currentX = 0;
        currentRowHeight = h;
        
        newPositions.push({
          id: widget.id,
          position: { x: currentX, y: currentY, w, h }
        });
        currentX += w;
      }
    }

    // Widgets mit neuen Positionen aktualisieren
    newPositions.forEach(({ id, position }) => {
      onMoveWidget(id, position);
    });
  };

  const getGridStyle = (widget: DashboardWidget) => {
    if (!widget.visible) return { display: 'none' };
    
    return {
      gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
      gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
      minHeight: `${widget.position.h * CELL_HEIGHT}px`
    };
  };

  const renderDropZone = () => {
    if (!isDragging || !dragOverPosition) return null;
    
    return (
      <div
        className="absolute bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none z-50 flex items-center justify-center animate-pulse shadow-lg"
        style={{
          gridColumn: `${dragOverPosition.x + 1} / span 4`,
          gridRow: `${dragOverPosition.y + 1} / span 2`,
          minHeight: `${2 * CELL_HEIGHT}px`,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="text-center">
          <div className="text-white text-lg font-semibold mb-1 flex items-center justify-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm">+</span>
            </div>
            <span>Widget hier ablegen</span>
          </div>
          <div className="text-white/80 text-sm">
            Loslassen zum Hinzufügen
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    const visibleWidgets = widgets.filter(w => w.visible);
    
    if (visibleWidgets.length > 0) return null;
    
    return (
      <div 
        className="col-span-full row-span-full flex items-start justify-center pt-16"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Dashboard ist leer
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Ziehen Sie Widgets aus dem Widget-Manager hierher oder wählen Sie eine der Optionen unten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={onOpenWidgetManager}
              className={`inline-flex flex-col items-center space-y-2 px-8 py-6 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[180px] ${
                isDragging ? 'border-solid bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Plus className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-medium">
                  {isDragging ? 'Hier ablegen' : 'Widget Manager'}
                </div>
                <div className="text-xs opacity-75">
                  {isDragging ? '' : 'öffnen'}
                </div>
              </div>
            </button>
            
            <button
              onClick={onLoadDefaultLayout}
              className="inline-flex flex-col items-center space-y-2 px-8 py-6 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-w-[180px]"
            >
              <RotateCcw className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-medium">Standard Layout</div>
                <div className="text-xs opacity-90">laden</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={gridRef}
      className={`dashboard-grid relative transition-all duration-300 z-[10001] ${className} ${
        isDragging 
          ? 'bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 ring-2 ring-blue-300/50 dark:ring-blue-500/50 ring-inset' 
          : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_HEIGHT}px)`,
        gap: '24px',
        minHeight: `${GRID_ROWS * CELL_HEIGHT + (GRID_ROWS - 1) * 24}px`
      }}
    >
      {/* Drop Zone Indicator */}
      {renderDropZone()}
      
      {/* Empty State */}
      {renderEmptyState()}
      
      {/* Widgets */}
      {widgets.map((widget) => {
        console.log('🔍 DashboardGrid processing widget:', widget.id, widget.type, 'visible:', widget.visible);
        if (!widget.visible) {
          console.log('⏭️ Skipping hidden widget:', widget.type);
          return null;
        }
        
        console.log('✅ Rendering visible widget:', widget.type);
        return (
          <div
            key={widget.id}
            className={`widget-container relative group ${isCustomizing ? 'customizing cursor-move' : ''} ${
              swapTarget === widget.id ? 'swap-target ring-2 ring-blue-500 ring-opacity-60 bg-blue-50/50' : ''
            }`}
            style={getGridStyle(widget)}
            draggable={isCustomizing}
            onDragStart={(e) => {
              if (isCustomizing) {
                console.log('🚀 Starting drag for widget:', widget.type);
                e.dataTransfer.setData('application/json', JSON.stringify({
                  ...widget,
                  isDraggingExisting: true
                }));
                e.dataTransfer.effectAllowed = 'move';
                setIsDragging(true);
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={() => setIsDragging(false)}
          >
            {/* Drag Handle (nur im Customizing-Modus) */}
            {isCustomizing && (
              <div className="absolute inset-0 bg-transparent z-30 cursor-move" />
            )}
            
            {/* Widget Content */}
            <div className={`h-full ${isCustomizing ? 'pointer-events-none' : ''}`}>
              {(() => {
                console.log('🎨 About to render widget content for:', widget.type);
                return renderWidget(widget);
              })()}
            </div>
            
            {/* Resize Handles (nur im Customizing-Modus) */}
            {isCustomizing && (
              <>
                {/* Süd-Ost (rechts-unten) */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-blue-500/80 hover:bg-blue-600 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'se')}
                  title="Größe ändern"
                />
                {/* Süd-West (links-unten) */}
                <div
                  className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-blue-500/80 hover:bg-blue-600 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'sw')}
                  title="Größe ändern"
                />
                {/* Nord-Ost (rechts-oben) */}
                <div
                  className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-blue-500/80 hover:bg-blue-600 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'ne')}
                  title="Größe ändern"
                />
                {/* Nord-West (links-oben) */}
                <div
                  className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize bg-blue-500/80 hover:bg-blue-600 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'nw')}
                  title="Größe ändern"
                />
              </>
            )}
            
            {/* Widget Controls (nur im Customizing-Modus) */}
            {isCustomizing && (
              <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto">
                <div className="flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                  {/* Size Controls */}
                  <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 pl-2">
                    <button
                      onClick={() => {
                        const newW = Math.max(2, widget.position.w - 1);
                        onMoveWidget(widget.id, { ...widget.position, w: newW });
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Schmaler machen"
                    >
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">W-</span>
                    </button>
                    <span className="px-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {widget.position.w}×{widget.position.h}
                    </span>
                    <button
                      onClick={() => {
                        const newW = Math.min(12, widget.position.w + 1);
                        onMoveWidget(widget.id, { ...widget.position, w: newW });
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Breiter machen"
                    >
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">W+</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center px-2">
                    <button
                      onClick={() => {
                        const newH = Math.max(1, widget.position.h - 1);
                        onMoveWidget(widget.id, { ...widget.position, h: newH });
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Niedriger machen"
                    >
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">H-</span>
                    </button>
                    <button
                      onClick={() => {
                        const newH = Math.min(8, widget.position.h + 1);
                        onMoveWidget(widget.id, { ...widget.position, h: newH });
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Höher machen"
                    >
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">H+</span>
                    </button>
                  </div>
                </div>
                
                {/* Settings Button (nur für konfigurierbare Widgets) */}
                {isConfigurableWidget(widget.type) && (
                  <button
                    onClick={() => handleOpenSettings(widget.id)}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-lg"
                    title="Widget-Einstellungen"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                
                <button
                  onClick={() => onToggleWidget(widget.id)}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                  title={widget.visible ? 'Widget ausblenden' : 'Widget anzeigen'}
                >
                  {widget.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                <button
                  onClick={() => onRemoveWidget(widget.id)}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-lg"
                  title="Widget entfernen"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
            
            {/* Drag Handle (nur im Customizing-Modus) */}
            {isCustomizing && (
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto">
                <div className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing shadow-lg">
                  <Grip className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            )}
            
            {/* Widget Info (nur im Customizing-Modus) */}
            {isCustomizing && (
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto">
                <div className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {widget.title}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Grid Helper (nur im Customizing-Modus sichtbar) */}
      {isCustomizing && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {Array.from({ length: GRID_COLUMNS + 1 }).map((_, i) => (
            <div
              key={`col-${i}`}
              className="absolute top-0 bottom-0 border-l border-blue-300 dark:border-blue-600"
              style={{ left: `${(i / GRID_COLUMNS) * 100}%` }}
            />
          ))}
          {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="absolute left-0 right-0 border-t border-blue-300 dark:border-blue-600"
              style={{ top: `${i * (CELL_HEIGHT + 24)}px` }}
            />
          ))}
        </div>
      )}
      
      {/* Settings Modal */}
      {settingsModalOpen && settingsWidgetId && (
        <WidgetSettingsModal
          isOpen={settingsModalOpen}
          onClose={handleCloseSettings}
          widgetId={settingsWidgetId}
          widgetType={widgets.find(w => w.id === settingsWidgetId)?.type || ''}
          widgetTitle={widgets.find(w => w.id === settingsWidgetId)?.title || ''}
          onConfigChange={handleConfigChange}
        />
      )}
    </div>
  );
};

export default DashboardGrid;
