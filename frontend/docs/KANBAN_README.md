# 🚀 Premium Kanban Board - Glassmorphism Design

Ein modernes, professionelles Kanban Board System mit Apple-inspiriertem Glassmorphism-Design für Immobilien-Management.

## ✨ Features

### 🎨 Design & UX
- **Glassmorphism-Design**: Semi-transparente Oberflächen mit Blur-Effekten
- **Apple-inspiriert**: Klare Hierarchie, SF Pro Typografie, dezente Farben
- **Darkmode**: Vollständige Unterstützung für Hell- und Dunkel-Modus
- **Animationen**: Weiche Übergänge und Micro-Interactions (Framer Motion)
- **Responsive**: Desktop (4-6 Spalten), Tablet (2-3), Mobile (1 Spalte + Swipe)

### 📋 Kanban Funktionen
- **Drag & Drop**: Intuitive Aufgabenverwaltung zwischen Spalten
- **4 Standard-Spalten**: Zu erledigen, In Arbeit, Überprüfung, Abgeschlossen
- **WIP Limits**: Konfigurierbare Work-in-Progress Limits pro Spalte
- **Quick Add**: Schnelles Erstellen von Tasks direkt in Spalten
- **Mehrfachauswahl**: Bulk-Operationen für mehrere Tasks gleichzeitig

### 🏠 Immobilien-spezifisch
- **Objektverknüpfung**: Tasks mit Immobilien und Kunden verknüpfen
- **Standortanzeige**: Geografische Zuordnung auf Task-Karten
- **Preis-Badges**: Kaufpreis/Miete direkt sichtbar
- **Finanzierungsstatus**: Status-Badge (Geprüft, Genehmigt, Abgelehnt)
- **Dokumenten-Anhang**: Verträge, Exposés direkt an Tasks anhängen

### 🔍 Filter & Suche
- **Volltextsuche**: Durchsuche Titel, Beschreibung, Standort, IDs
- **Prioritätsfilter**: Kritisch, Hoch, Mittel, Niedrig
- **Mitarbeiterfilter**: Nach zugewiesenen Personen filtern
- **Objekttyp-Filter**: Wohnung, Haus, Gewerbe, Grundstück

### 📊 Task Details
- **Umfangreiches Modal**: Alle Informationen auf einen Blick
- **Tabs**: Details, Kommentare, Aktivität, Dokumente
- **Fortschrittsbalken**: Visueller Progress-Indicator
- **Subtasks**: Teilaufgaben mit Checkbox-Liste
- **Kommentare**: Diskussionsfaden pro Task
- **Zeiterfassung**: Geschätzte vs. tatsächliche Stunden
- **Labels & Tags**: Flexible Kategorisierung

### 🎯 Weitere Features
- **Prioritäts-Badges**: 🔴 Kritisch, 🟠 Hoch, 🟡 Mittel, 🟢 Niedrig
- **Deadline-Tracking**: Überfällige Tasks werden rot markiert
- **Avatar-Anzeige**: Verantwortliche Person auf jeder Karte
- **Statistiken**: Aktive Tasks, Erledigte, Überfällige in Header
- **Keyboard Navigation**: Schnelle Bedienung mit Tastatur
- **Empty States**: Hilfreiche Platzhalter für leere Spalten

## 🏗️ Architektur

### Komponenten-Struktur

```
src/components/dashboard/Kanban/
├── PremiumKanbanBoard.tsx       # Hauptkomponente
├── TaskDetailModal.tsx          # Task-Detail-Ansicht
├── QuickAddTask.tsx             # Schnell-Erstellung
└── TasksBoard.tsx               # Legacy (Fallback)

src/pages/
└── KanbanPage.tsx               # Page-Wrapper mit API-Integration

src/styles/
└── kanban.css                   # Glassmorphism & Custom Styles
```

### Technologie-Stack
- **React 18**: Hooks, Functional Components
- **TypeScript**: Vollständig typsicher
- **Framer Motion**: Animationen und Übergänge
- **@hello-pangea/dnd**: Drag & Drop Funktionalität
- **Tailwind CSS**: Utility-First Styling
- **Custom CSS**: Glassmorphism-Effekte

## 🎨 Design-System

### Farben (Apple-Style)

```typescript
const colors = {
  // Status-Farben (nur als Akzente)
  blue: '#0A84FF',      // In Arbeit
  green: '#32D74B',     // Abgeschlossen
  orange: '#FF9F0A',    // Überprüfung
  red: '#FF453A',       // Kritisch/Überfällig
  gray: '#8E8E93',      // Zu erledigen
  
  // Prioritäten
  critical: '#FF453A',  // 🔴
  high: '#FF9F0A',      // 🟠
  medium: '#FFD60A',    // 🟡
  low: '#32D74B'        // 🟢
};
```

### Glassmorphism-Werte

```css
/* Task-Karten */
background: rgba(255, 255, 255, 0.4);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);

/* Dark Mode */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Typografie

```css
/* Systemfont-Stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 
             "Roboto", "Helvetica Neue", Arial, sans-serif;

/* Hierarchie */
Task-Titel:    16px / font-semibold
Beschreibung:  14px / font-normal
Meta-Info:     12px / font-medium
Labels:        10px / font-bold
```

## 🚀 Verwendung

### Basis-Integration

```tsx
import PremiumKanbanBoard from '@/components/dashboard/Kanban/PremiumKanbanBoard';
import { Task } from '@/components/dashboard/Kanban/PremiumKanbanBoard';

function MyKanbanPage() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    todo: [],
    inProgress: [],
    review: [],
    done: []
  });

  const handleDragEnd = (result: DropResult) => {
    // Drag & Drop Logik
  };

  const handleTaskClick = (task: Task) => {
    // Task-Detail öffnen
  };

  const handleCreateTask = (columnId: string) => {
    // Neue Task erstellen
  };

  return (
    <PremiumKanbanBoard
      tasks={tasks}
      onDragEnd={handleDragEnd}
      onTaskClick={handleTaskClick}
      onCreateTask={handleCreateTask}
    />
  );
}
```

### Mit Backend-Integration

```tsx
import { useTasks, useUpdateTask, useMoveTask } from '@/hooks/useApi';

function KanbanWithAPI() {
  const { data: tasksData } = useTasks();
  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();

  // Tasks transformieren und organisieren
  const tasks = organizeTasks(tasksData);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    moveTask.mutate({
      taskId: draggableId,
      newStatus: destination.droppableId,
      position: destination.index
    });
  };

  return <PremiumKanbanBoard tasks={tasks} {...handlers} />;
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile: < 768px */
- 1 Spalte mit horizontalem Scrollen
- Touch-optimierte Drag & Drop
- Kompakte Task-Karten

/* Tablet: 768px - 1024px */
- 2-3 Spalten nebeneinander
- Mittlere Task-Karten
- Optimierte Touch-Targets

/* Desktop: > 1024px */
- 4-6 Spalten gleichzeitig sichtbar
- Volle Task-Details auf Karten
- Erweiterte Hover-Effekte
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Enter` | Task speichern/erstellen |
| `Esc` | Modal schließen/Aktion abbrechen |
| `Ctrl/Cmd + K` | Suche fokussieren |
| `←/→` | Zwischen Spalten navigieren |
| `↑/↓` | Tasks innerhalb Spalte navigieren |
| `Shift + Click` | Mehrfach-Auswahl |

## 🎯 Best Practices

### Performance
- Virtuelles Scrolling bei >50 Tasks pro Spalte
- Lazy Loading für Bilder/Dokumente
- Debounced Search (300ms)
- Memoized Filter-Funktionen

### UX-Guidelines
- Max. 8 Tasks in "Zu erledigen"
- Max. 5 Tasks in "In Arbeit" (WIP Limit)
- Max. 3 Tasks in "Überprüfung"
- Keine Limits für "Abgeschlossen"

### Accessibility
- ARIA Labels für Screen Reader
- Keyboard-Navigation vollständig
- Kontrast-Ratios WCAG AA konform
- Focus-Indikatoren sichtbar

## 🔧 Konfiguration

### Spalten anpassen

```typescript
const customColumns: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#6B7280',
    icon: '📝',
    description: 'Geplante Aufgaben',
    limit: null // Kein Limit
  },
  // ... weitere Spalten
];
```

### Eigene Prioritäten

```typescript
const customPriorities = [
  { value: 'urgent', label: 'Dringend', icon: '🚨', color: '#DC2626' },
  { value: 'high', label: 'Hoch', icon: '🔴', color: '#FF453A' },
  // ... weitere
];
```

## 🐛 Troubleshooting

### Tasks werden nicht angezeigt
- Prüfe Konsole auf API-Fehler
- Validiere Task-Datenstruktur
- Überprüfe Filter-Einstellungen

### Drag & Drop funktioniert nicht
- Stelle sicher, dass `@hello-pangea/dnd` installiert ist
- Prüfe Browser-Kompatibilität
- Mobile: Touch-Events aktiviert?

### Blur-Effekt nicht sichtbar
- Browser-Support prüfen (`backdrop-filter`)
- Fallback für ältere Browser aktivieren
- GPU-Beschleunigung in Browser-Settings

## 📈 Zukünftige Features (Roadmap)

- [ ] Gantt-Chart-Ansicht
- [ ] Timeline-View für Deadlines
- [ ] Team-Kapazitäts-Planung
- [ ] Sprint-Planning-Modus
- [ ] Automatische Task-Zuweisung (AI)
- [ ] Wiederkehrende Tasks
- [ ] Task-Templates
- [ ] Export (PDF, Excel)
- [ ] Erweiterte Statistiken
- [ ] Integration mit Kalender

## 🤝 Contributing

Beiträge sind willkommen! Bitte beachte:
- Code Style: Prettier + ESLint
- TypeScript: Strict Mode
- Tests: Jest + React Testing Library
- Commits: Conventional Commits

## 📄 Lizenz

Proprietär - Immonow CIM Frontend

---

**Entwickelt mit ❤️ für professionelles Immobilien-Management**

Bei Fragen oder Problemen: Erstelle ein Issue im Repository.
