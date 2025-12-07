# Kanban Board - Status Management Update

## Änderungsübersicht

Das Kanban Board wurde überarbeitet, um **horizontales Scrollen zu vermeiden** und eine bessere Übersicht zu bieten. Die Hauptänderungen:

### ✅ Vorher (6 Spalten mit Scrollen)
```
┌──────────────────────────────────────────────────────────────────────┐
│  [Backlog] [Todo] [In Progress] [Review] [Done] [Blocked] →→→ SCROLL │
└──────────────────────────────────────────────────────────────────────┘
```

### ✅ Nachher (5 Spalten, responsive)
```
┌──────────────────────────────────────────────────────────────────────┐
│  [Backlog]  [Todo]  [In Progress]  [Review]  [Done]                  │
│     ⬇️         ⬇️         ⬇️           ⬇️        ⬇️                     │
│  (zeigt auch onHold, cancelled, blocked tasks in passenden Spalten)  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Board-Spalten (Sichtbar)

Das Board zeigt jetzt nur **5 Hauptspalten**, die die volle Breite des Bildschirms nutzen:

| Spalte | Icon | Beschreibung | WIP-Limit |
|--------|------|--------------|-----------|
| **Backlog** | 📝 | Geplante Aufgaben | - |
| **Zu erledigen** | 📋 | Bereite Aufgaben | 8 |
| **In Arbeit** | ⚡ | Aktive Aufgaben | 5 |
| **Überprüfung** | 👁️ | Zur Freigabe | 3 |
| **Abgeschlossen** | ✅ | Erledigte Aufgaben | - |

---

## 📋 Alle Status (Dropdown)

Im **Task-Detail-Drawer** können Sie aus **8 verschiedenen Status** wählen:

### Haupt-Status (auf Board sichtbar)
1. **Backlog** 📝 - Geplant
2. **Todo** 📋 - Zu erledigen
3. **In Progress** ⚡ - In Arbeit
4. **Review** 👁️ - Überprüfung
5. **Done** ✅ - Abgeschlossen

### Zusatz-Status (nur in Task-Details)
6. **Blocked** 🚫 - Blockiert ➡️ *erscheint in "Todo"-Spalte*
7. **On Hold** ⏸️ - Pausiert ➡️ *erscheint in "Backlog"-Spalte*
8. **Cancelled** ❌ - Abgebrochen ➡️ *erscheint in "Done"-Spalte*

---

## 🔄 Status-Mapping

Tasks mit Zusatz-Status werden automatisch in die passenden Board-Spalten einsortiert:

```typescript
const STATUS_COLUMN_MAPPING = {
  'blocked': 'todo',      // Blockierte Tasks → Todo
  'onHold': 'backlog',    // Pausierte Tasks → Backlog
  'cancelled': 'done'     // Abgebrochene Tasks → Done
};
```

### Beispiel
```
Task: "Expose erstellen"
Status: "blocked" 🚫
➡️ Erscheint auf Board in Spalte: "Todo" 📋
➡️ Im Task-Detail steht: Status = "Blockiert" 🚫
```

---

## 💻 Responsive Design

Die Spalten passen sich automatisch an die Bildschirmbreite an:

```css
/* Alte Version (fixed width + scroll) */
.column {
  width: 320px;
  flex: 0 0 320px;
}

/* Neue Version (responsive) */
.column {
  flex: 1;                  /* Gleiche Breite für alle */
  min-width: 250px;         /* Mindestbreite */
  max-width: 400px;         /* Maximale Breite */
}
```

### Bildschirmgrößen
- **4K Monitor (3840px)**: Jede Spalte ~768px breit
- **Full HD (1920px)**: Jede Spalte ~384px breit
- **Laptop (1366px)**: Jede Spalte ~273px breit
- **Tablet (1024px)**: Jede Spalte minimiert sich auf 250px

---

## 🎨 Task-Detail Status-Dropdown

Im Task-Detail-Drawer finden Sie alle 8 Status:

```tsx
// Status ändern im Drawer
┌─────────────────────────────────────────┐
│ 📝 Status                               │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ In Arbeit              ▼         │ │
│ └─────────────────────────────────────┘ │
│   ↓ Dropdown öffnet sich                │
│ ┌─────────────────────────────────────┐ │
│ │ 📝 Backlog                          │ │
│ │ 📋 Zu erledigen                     │ │
│ │ ⚡ In Arbeit          ✓ [Selected] │ │
│ │ 👁️ Überprüfung                     │ │
│ │ ✅ Abgeschlossen                    │ │
│ │ ───────────────────                 │ │
│ │ 🚫 Blockiert                        │ │
│ │ ⏸️ Pausiert                         │ │
│ │ ❌ Abgebrochen                      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔧 Technische Details

### Dateien geändert

1. **`ProfessionalKanbanBoard.tsx`**
   - `DEFAULT_COLUMNS`: Reduziert auf 5 Spalten
   - `ALL_STATUSES`: Neue Export-Konstante mit 8 Status
   - `STATUS_COLUMN_MAPPING`: Mapping für Zusatz-Status
   - Responsive Spalten: `flex-1 min-w-[250px] max-w-[400px]`
   - Filter-Logik aktualisiert für Status-Mapping

2. **`TaskDetailDrawer.tsx`**
   - Import von `ALL_STATUSES` aus ProfessionalKanbanBoard
   - `STATUS_OPTIONS` verwendet jetzt `ALL_STATUSES`
   - Dropdown zeigt alle 8 Status mit Icons und Beschreibungen

3. **`types/kanban.ts`**
   - `TaskStatus` erweitert um: `'onHold'` | `'cancelled'`

---

## 🚀 Vorteile

### ✅ Kein horizontales Scrollen mehr
- Alle Spalten sofort sichtbar
- Bessere Übersicht
- Schnellere Navigation

### ✅ Mehr Flexibilität
- 8 verschiedene Status für detaillierte Workflows
- Tasks können pausiert oder abgebrochen werden
- Blockierte Tasks werden deutlich markiert

### ✅ Responsive
- Passt sich automatisch an Bildschirmgröße an
- Optimale Spaltenbreite auf allen Geräten
- Keine verschwendete Bildschirmfläche

### ✅ Übersichtlich
- Nur wichtige Spalten sichtbar
- Zusatz-Status im Dropdown verfügbar
- Smart-Mapping für optimale Darstellung

---

## 📖 Verwendung

### Status auf Board ändern (Drag & Drop)
```
1. Task anklicken und halten
2. Zur Ziel-Spalte ziehen
3. Loslassen
➡️ Status wird automatisch aktualisiert
```

### Status im Detail ändern (Dropdown)
```
1. Task anklicken (öffnet Drawer)
2. Tab "Details" auswählen
3. Status-Dropdown öffnen
4. Beliebigen Status auswählen (auch blocked, onHold, cancelled)
5. "Speichern" klicken
➡️ Task erscheint in der passenden Spalte
```

### Beispiel-Workflow
```
1. Neue Task: "Expose erstellen" → Backlog 📝
2. Bereit zum Arbeiten → Todo 📋 (Drag & Drop)
3. Arbeit begonnen → In Progress ⚡ (Drag & Drop)
4. Problem entdeckt → Blocked 🚫 (Detail-Dropdown)
   ➡️ Task bleibt in "Todo"-Spalte, aber rot markiert
5. Problem gelöst → In Progress ⚡ (Detail-Dropdown)
6. Arbeit fertig → Review 👁️ (Drag & Drop)
7. Freigegeben → Done ✅ (Drag & Drop)
```

---

## 🎯 Best Practices

### Wann welchen Status verwenden?

| Status | Wann verwenden? | Nächster Schritt |
|--------|----------------|------------------|
| **Backlog** | Task ist geplant, aber noch nicht bereit | Vorbereitung abschließen → Todo |
| **Todo** | Task ist bereit, kann bearbeitet werden | Arbeit beginnen → In Progress |
| **In Progress** | Aktiv in Bearbeitung | Arbeit abschließen → Review |
| **Review** | Wartet auf Freigabe/Prüfung | Prüfung durchführen → Done |
| **Done** | Task ist abgeschlossen | - |
| **Blocked** | Task kann nicht fortgesetzt werden (Blocker vorhanden) | Blocker entfernen → In Progress |
| **On Hold** | Task temporär pausiert (z.B. warten auf Kunde) | Weitermachen → Todo/In Progress |
| **Cancelled** | Task wird nicht mehr benötigt | - |

---

## 🎨 Visuelle Hinweise

### Status-Farben
- 📝 **Backlog**: Grau `#6B7280`
- 📋 **Todo**: Dunkelgrau `#8E8E93`
- ⚡ **In Progress**: Blau `#0A84FF`
- 👁️ **Review**: Orange `#FF9F0A`
- ✅ **Done**: Grün `#32D74B`
- 🚫 **Blocked**: Rot `#FF453A`
- ⏸️ **On Hold**: Braun `#AC8E68`
- ❌ **Cancelled**: Grau `#8E8E93`

### Task-Card Markierungen
- **Blocked tasks**: Roter Rand + 🚫 Badge
- **On Hold tasks**: Braun getönter Hintergrund + ⏸️ Badge
- **Cancelled tasks**: Durchgestrichen + ❌ Badge

---

## 🔍 Migration bestehender Tasks

Keine Aktion erforderlich! Bestehende Tasks mit Status "blocked" werden automatisch korrekt angezeigt:
- Auf dem Board: In der "Todo"-Spalte (mit rotem Rand)
- Im Detail: Status zeigt "Blocked"

---

## 📞 Support

Bei Fragen oder Problemen:
1. Siehe `KANBAN_QUICK_START.md` für Anleitungen
2. Siehe `PROFESSIONAL_KANBAN_README.md` für vollständige Dokumentation
3. Siehe `KANBAN_VISUAL_GUIDE.md` für visuelle Guides

---

**Version**: 2.0  
**Datum**: 1. Oktober 2025  
**Autor**: GitHub Copilot
