# 🚀 Kommunikationszentrale - Quick Start Guide

## Schnellstart in 3 Schritten

### 1. Navigation öffnen

```
Sidebar → Kommunikation (MessageSquare Icon)
```

Die Kommunikationszentrale öffnet sich mit 4 Tabs:
- **Chat** - Unterhaltungen & Nachrichten
- **Calls** - Video-Anrufe (UI-Stub)
- **Termine** - Besichtigungen & Kalender
- **Kampagnen** - Push-Benachrichtigungen

### 2. Chat ausprobieren

Die Chat-Ansicht hat **3 Spalten**:

#### Links: Inbox
- 4 vorgenerierte Unterhaltungen:
  - 👤 **Maria Schmidt** (1:1 Direct Message)
  - 🏠 **#OBJ-123** (Objekt-Thread)
  - 👥 **Sales Team Q4** (Gruppen-Chat)
  - 👤 **#KND-456 Familie Hoffmann** (Kunden-Thread)

- **Aktionen**:
  - Klick auf Unterhaltung → öffnet Thread
  - Rechtsklick → Kontext-Menü (Pin, Archiv)
  - Badge zeigt ungelesene Nachrichten

#### Mitte: Message Thread
- Wird nach Auswahl einer Unterhaltung angezeigt
- **Geplante Features** (dokumentiert):
  - Virtualisiertes Scrolling
  - Message Composer mit Attachments
  - Edit/Delete/Quote/Pin
  - Typing Indicators
  - Read Receipts

#### Rechts: Info Panel
- Details zur Unterhaltung
- Beteiligte Personen
- Verknüpfte Immobilie/Kunde
- Letzte Aktivitäten

### 3. Mock-Daten erkunden

Alle Daten sind in **localStorage** gespeichert:

```javascript
// Browser DevTools Console:
localStorage.getItem('communications_conversations')
localStorage.getItem('communications_drafts')
```

**Daten zurücksetzen:**
```javascript
localStorage.removeItem('communications_conversations')
localStorage.removeItem('communications_drafts')
// Seite neu laden → neue Mock-Daten werden generiert
```

## 🎨 UI-Features

### Apple Glass Design

Alle Components nutzen:
- ✨ **Backdrop Blur** - Glastransparenz
- 🎭 **Smooth Shadows** - Weiche Schatten
- 🌈 **Gradient Borders** - Feine Akzente
- 🔄 **Micro Animations** - Hover, Scale, Fade

### Dark/Light Mode

Automatisch synchronisiert mit System-Theme:
- Toggle in Settings
- Alle Components unterstützen beide Modi
- Optimierte Kontraste

### Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Cmd/Ctrl + K` | Quick Switcher (Jump to Conversation) |
| `Cmd/Ctrl + Enter` | Send Message |
| `↑` | Edit last message |
| `Escape` | Close panels/modals |

## 📊 Konversationstypen

### 1. Direct Messages (DM)
- **Icon**: 👤 Badge unten rechts am Avatar
- **Use Case**: 1:1 Kommunikation mit Kunden/Kollegen
- **Features**: Status (online/offline), Typing-Indikator

### 2. Gruppen
- **Icon**: 👥 Badge unten rechts am Avatar
- **Use Case**: Team-Kommunikation (z.B. "Sales Team Q4")
- **Features**: Mehrere Teilnehmer, @Mentions, Rollen

### 3. Objekt-Threads
- **Icon**: 🏠 Badge unten rechts am Avatar
- **Prefix**: `#OBJ-123`
- **Use Case**: Alle Kommunikation rund um eine Immobilie
- **Metadata**: Verknüpfung zur Property, Priorität

### 4. Kunden-Threads
- **Icon**: 👤 Badge unten rechts am Avatar
- **Prefix**: `#KND-456`
- **Use Case**: Zentrale Kommunikation mit einem Kunden
- **Metadata**: Verknüpfung zum Customer, Priorität

## 🔧 Entwickler-Features

### Type-Safety

Alle Types sind in TypeScript definiert:

```typescript
import type { 
  Conversation, 
  Message, 
  Call, 
  Appointment, 
  Campaign 
} from '../types/communications';
```

### Custom Hooks

```typescript
// Conversations
const { 
  conversations, 
  createConversation, 
  markAsRead 
} = useConversationsMock();

// Messages
const { 
  messages, 
  sendMessage, 
  editMessage 
} = useMessagesMock(conversationId);

// Presence
const { 
  presence, 
  updateStatus 
} = usePresenceMock();
```

### Komponenten importieren

```typescript
import { ConversationList } from '../components/communications/ConversationList';
import { Avatar, AvatarGroup } from '../components/common/Avatar';
import { Tabs, TabPanel } from '../components/common/Tabs';
import { Drawer } from '../components/common/Drawer';
import { DatePicker } from '../components/common/DatePicker';
```

## 📱 Responsive Breakpoints

```scss
// Mobile
@media (max-width: 768px) {
  // Single pane, full screen
}

// Tablet
@media (min-width: 769px) and (max-width: 1024px) {
  // 2 panes, hide info panel
}

// Desktop
@media (min-width: 1025px) {
  // Full 3-pane layout
}
```

## 🐛 Bekannte Limitierungen (v1.0)

1. **Message Thread**: Zeigt aktuell nur Placeholder
   - Vollständige Implementierung in Dokumentation beschrieben
   - Alle Types & Hooks sind fertig

2. **Video Calls**: Nur UI-Stub
   - Kein echtes WebRTC
   - Signaling-Integration vorbereitet (siehe README)

3. **Calendar**: Basis-UI implementiert
   - Drag & Drop vorbereitet
   - ICS-Export: Button vorhanden, Funktion als Stub

4. **Campaigns**: Template-Editor als Placeholder
   - Audience-Builder: Struktur vorhanden
   - Analytics: Mock-Daten

## 🎯 Nächste Schritte

### Für Entwickler

1. **Message Thread vervollständigen**:
   ```
   src/components/communications/MessageThread.tsx
   src/components/communications/MessageComposer.tsx
   src/components/communications/MessageItem.tsx
   ```

2. **Video-Call Integration**:
   - Twilio Video SDK einbinden
   - Signaling Server implementieren
   - siehe `docs/COMMUNICATIONS_README.md` → "Migration"

3. **Kalender-Features**:
   - React Big Calendar oder FullCalendar integrieren
   - Drag & Drop aktivieren
   - ICS-Export implementieren

4. **Campaign-Builder**:
   - Rich Text Editor (TipTap/Slate)
   - Visual Filter Builder (React Flow)
   - Email-Template-Rendering

### Für Designer

1. **Icons & Illustrations**:
   - Empty States verfeinern
   - Loading-Skeleton-Animationen
   - Success/Error-Overlays

2. **Micro-Animations**:
   - Message Sent Animation
   - Typing Indicator Wave
   - Call-Ringing-Animation

3. **Accessibility**:
   - Kontrast-Check (WCAG AA)
   - Focus-Indikatoren
   - Screen-Reader-Texte

## 📚 Weiterführende Docs

- [Vollständige Dokumentation](./COMMUNICATIONS_README.md)
- [Type-Definitionen](../src/types/communications/)
- [Mock-Hooks](../src/hooks/useConversationsMock.ts)
- [Komponenten](../src/components/communications/)

## 💡 Tipps & Tricks

### Performance

```typescript
// Virtualisierung für große Listen
import { FixedSizeList } from 'react-window';

// Lazy Loading für schwere Components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Debugging

```typescript
// Mock-Daten inspizieren
console.table(localStorage);

// Hook-State tracken
const debug = useConversationsMock();
console.log('Conversations:', debug.conversations);
```

### Testing

```typescript
// Unit Tests
import { renderHook } from '@testing-library/react-hooks';
import { useConversationsMock } from '../hooks/useConversationsMock';

test('should create conversation', () => {
  const { result } = renderHook(() => useConversationsMock());
  act(() => {
    result.current.createConversation({
      kind: 'dm',
      title: 'Test Conv'
    });
  });
  expect(result.current.conversations).toHaveLength(5);
});
```

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfe [COMMUNICATIONS_README.md](./COMMUNICATIONS_README.md)
2. Checke Browser-Console auf Errors
3. Verifiziere localStorage-Daten
4. Erstelle ein GitHub Issue mit Details

---

**Viel Erfolg! 🚀**
