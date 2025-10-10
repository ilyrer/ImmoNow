# Kommunikationszentrale - Complete Documentation

## 🎯 Überblick

Die **Kommunikationszentrale** ist ein umfassendes Modul für alle kommunikationsbezogenen Features der Real Estate Dashboard-Anwendung. Sie integriert vier Hauptbereiche:

1. **In-App Chat** - 1:1, Gruppen, Objekt- und Kunden-Threads
2. **Video-Calls** - WebRTC-UI mit Call-Management (Stub)
3. **Terminbuchung** - Besichtigungen mit Kalender-Integration
4. **Push/Benachrichtigungen** - Interessenten-Kampagnen mit Audience-Builder

## 🏗️ Architektur

### Struktur

```
src/
├── types/communications/
│   ├── conversation.ts    # Conversation & Participant Types
│   ├── message.ts         # Message, Attachment, Presence Types
│   ├── call.ts            # Call & WebRTC-related Types
│   ├── appointment.ts     # Appointment & Calendar Types
│   ├── campaign.ts        # Campaign & Notification Types
│   └── index.ts           # Central Exports
│
├── hooks/
│   ├── useConversationsMock.ts  # Conversation State & CRUD
│   ├── useMessagesMock.ts       # Messages with Realtime Mocks
│   ├── usePresenceMock.ts       # User Presence Status
│   ├── useTypingMock.ts         # Typing Indicators
│   ├── useCallMock.ts           # Call Management (Stub)
│   ├── useAppointmentsMock.ts   # Appointment CRUD & Scheduling
│   └── useCampaignsMock.ts      # Campaign & Audience Management
│
├── components/communications/
│   ├── ConversationList.tsx     # Inbox with Conversations
│   ├── MessageThread.tsx        # Virtualized Message List
│   ├── MessageComposer.tsx      # Rich Message Input
│   ├── MessageItem.tsx          # Single Message Display
│   ├── AttachmentPreview.tsx    # File Preview Component
│   ├── InfoPanel.tsx            # Conversation Details Sidebar
│   ├── CallLobby.tsx            # Pre-Call Setup UI
│   ├── CallRoom.tsx             # In-Call Interface
│   ├── ParticipantGrid.tsx      # Video Grid Layout
│   ├── CallControls.tsx         # Mute, Camera, Screen Share
│   ├── CalendarView.tsx         # Week/Month Calendar
│   ├── AppointmentForm.tsx      # Create/Edit Appointments
│   ├── SlotPicker.tsx           # Time Slot Selection
│   ├── AudienceBuilder.tsx      # Filter-based Audience Creation
│   ├── TemplateEditor.tsx       # Message Template Editor
│   └── CampaignTable.tsx        # Campaign List & Metrics
│
└── pages/communications/
    ├── CommunicationsHub.tsx    # Main Container with Tabs
    ├── ChatView.tsx             # 3-Pane Chat Interface
    ├── CallsView.tsx            # Call History & Management
    ├── ScheduleView.tsx         # Calendar & Appointments
    └── NotificationsView.tsx    # Campaign Management
```

## 🎨 Design-Prinzipien

### Apple Glass Morphism

Alle Components folgen dem Apple Glass Design:
- **Backdrop Blur**: `backdrop-blur-2xl` für glasartige Transparenz
- **Weiche Schatten**: `shadow-soft`, `shadow-apple-soft`
- **Sanfte Borders**: `border-white/20`, `border-apple-blue/40`
- **Smooth Transitions**: `transition-all duration-200`
- **Hover-Effekte**: `hover:scale-102`, `hover:shadow-card`

### Dark/Light Mode

Alle Components unterstützen vollständig:
- Dark Mode via `dark:` Tailwind-Klassen
- Kontextuelle Farben: `text-gray-900 dark:text-white`
- Glaseffekte in beiden Modi optimiert

### Accessibility

- **ARIA Labels**: Alle interaktiven Elemente haben aria-labels
- **Keyboard Navigation**: Tab, Enter, Escape funktionieren überall
- **Focus States**: Sichtbare Fokuszustände für Keyboard-User
- **Screen Reader**: Semantische HTML-Struktur

## 📦 Features im Detail

### 1. In-App Chat

#### Features
- **Konversationstypen**:
  - `dm`: 1:1 Direct Messages
  - `group`: Gruppen-Chats
  - `object`: Objekt-bezogene Threads (#OBJ-123)
  - `customer`: Kunden-Threads (#KND-456)

- **Rich Messaging**:
  - Attachments (Bilder, PDFs, Dokumente)
  - @Mentions mit Auto-Complete
  - Message Quotes/Replies
  - Emoji-Reactions
  - Edit & Delete (mit "edited" Marker)
  - Pin wichtige Nachrichten

- **Realtime Features (Mock)**:
  - Typing Indicators ("tippt...")
  - Presence Status (online/away/busy/offline)
  - Read Receipts (✓ sent, ✓✓ read)
  - Delivery Status

- **Search & Filter**:
  - Volltext-Suche über alle Messages
  - Filter nach Typ, Status, Priorität
  - Attachment-Filter

- **Draft System**:
  - Auto-Save von ungesendeten Messages
  - Draft-Indikator in Conversation List
  - LocalStorage-Persistenz

#### Keyboard Shortcuts
- `Cmd/Ctrl + K`: Quick Switcher (Jump to Conversation)
- `Cmd/Ctrl + Enter`: Send Message
- `↑`: Edit last message
- `Escape`: Close panels/modals

#### Usage Example

```tsx
import { useConversationsMock } from '../hooks/useConversationsMock';

const MyChat = () => {
  const {
    conversations,
    createConversation,
    markAsRead,
    togglePin,
    saveDraft,
    getDraft
  } = useConversationsMock({ kind: ['dm', 'group'] });

  return (
    <ConversationList
      conversations={conversations}
      onSelect={(id) => markAsRead(id)}
      onPin={(id) => togglePin(id)}
    />
  );
};
```

### 2. Video-Calls (WebRTC UI Stub)

#### Features
- **Call Lobby**:
  - Device Selection (Camera, Microphone, Speaker)
  - Preview mit Live-Feed
  - Display Name Eingabe
  - Background Blur Toggle

- **In-Call**:
  - Participant Grid (1-16 Teilnehmer)
  - Screen Sharing UI
  - Chat Sidebar
  - Participant List with Roles
  - Connection Quality Indicators
  - Recording Indicator

- **Call Controls**:
  - Mute/Unmute Audio
  - Camera On/Off
  - Screen Share
  - Leave Call
  - Toggle Chat
  - Toggle Participant List

#### Integration Points

```tsx
// Signaling Server Integration (Future)
const callService = {
  createRoom: async (callId: string) => {
    // POST /api/calls/rooms
  },
  joinRoom: async (roomId: string, peerId: string) => {
    // WebSocket connection
  },
  sendSignal: (signal: RTCSignalingData) => {
    // Send via WebSocket
  }
};
```

### 3. Terminbuchung

#### Features
- **Calendar Views**:
  - Day, Week, Month, Agenda
  - Resource Filtering (Agent, Property)
  - Drag & Drop Rescheduling
  - Color-Coding by Type

- **Appointment Types**:
  - Besichtigungen
  - Beratungen
  - Notartermine
  - Übergaben
  - Sonstige

- **Smart Scheduling**:
  - Slot Suggestions basierend auf Verfügbarkeit
  - Conflict Detection (Zeit, Ressource, Location)
  - Multi-Participant Coordination
  - Recurrence Rules

- **Integrations**:
  - ICS Export (Download)
  - Google Calendar Sync (Stub)
  - Outlook Sync (Stub)

#### Usage Example

```tsx
import { useAppointmentsMock } from '../hooks/useAppointmentsMock';

const MyScheduler = () => {
  const {
    appointments,
    createAppointment,
    suggestSlots,
    checkConflicts
  } = useAppointmentsMock();

  const handleCreate = async (data) => {
    const conflicts = checkConflicts(data);
    if (conflicts.length === 0) {
      await createAppointment(data);
    }
  };

  return <CalendarView appointments={appointments} />;
};
```

### 4. Push/Benachrichtigungen

#### Features
- **Audience Builder**:
  - Visual Filter Builder (Drag & Drop)
  - Filter Fields:
    - Standort
    - Budget-Range
    - Interessen (Property Types)
    - Letzter Kontakt
    - Engagement Score
  - AND/OR Logic Groups
  - Live Preview Count

- **Template Editor**:
  - Rich Text Editor
  - Variable Placeholders: `{name}`, `{property}`, `{price}`
  - Live Preview with Sample Data
  - Channel-Specific Content (Email vs. Push)
  - Subject Line (Email)
  - PreHeader Text (Email)

- **Campaign Management**:
  - Draft → Scheduled → Sending → Sent
  - Test Send to Recipients
  - Scheduling (Immediate/Scheduled/Recurring)
  - Throttling (Messages per Hour/Day)
  - A/B Testing (Future)

- **Analytics**:
  - Sent, Delivered, Failed Counts
  - Open Rate
  - Click Rate
  - Conversion Rate
  - Device Breakdown
  - Geographic Distribution

#### Campaign Channels
- **In-App**: Native notification center
- **Email**: HTML Templates
- **SMS**: Text-only (Stub)
- **Push**: Mobile push notifications (Stub)

## 🔧 Mock Data & Testing

### LocalStorage Keys

```typescript
// Conversations & Messages
'communications_conversations'
'communications_messages_{conversationId}'
'communications_drafts'

// Calls
'communications_calls'
'communications_call_history'

// Appointments
'communications_appointments'

// Campaigns
'communications_campaigns'
'communications_audiences'
'communications_templates'
```

### Mock Data Seeds

Die Mock-Hooks generieren automatisch realistische Seed-Daten beim ersten Load:

```tsx
// Seed 4 Conversations (DM, Group, Object, Customer)
generateMockConversations()

// Seed 20-50 Messages per Conversation
generateMockMessages(conversationId)

// Seed 10 Appointments über 2 Wochen
generateMockAppointments()

// Seed 5 Campaign Templates
generateMockTemplates()
```

### Resetting Data

```typescript
// Clear all communications data
localStorage.removeItem('communications_conversations');
localStorage.removeItem('communications_drafts');
// ... etc.

// Or use the reset utility
import { resetCommunicationsData } from '../utils/mockDataReset';
resetCommunicationsData();
```

## 🚀 Performance Optimierungen

### Virtualisierung

Für große Listen wird `react-window` verwendet:

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <MessageItem message={messages[index]} style={style} />
  )}
</FixedSizeList>
```

### Code Splitting

```tsx
const ChatView = lazy(() => import('./pages/communications/ChatView'));
const CallsView = lazy(() => import('./pages/communications/CallsView'));

<Suspense fallback={<LoadingSkeleton />}>
  <ChatView />
</Suspense>
```

### Memoization

```tsx
const MessageItem = React.memo(({ message }) => {
  // ...
}, (prev, next) => prev.message.id === next.message.id);

const filteredConversations = useMemo(() => {
  return conversations.filter(applyFilters);
}, [conversations, filters]);
```

## 🔌 Migration zu echtem Backend

### 1. WebSocket Integration

```typescript
// Replace Mock Hooks with Real WebSocket
import { io } from 'socket.io-client';

const socket = io('wss://api.example.com/chat');

socket.on('message:new', (message) => {
  // Update local state
});

socket.emit('message:send', {
  conversationId,
  body,
  attachments
});
```

### 2. API Endpoints

```typescript
// Conversations
GET    /api/conversations
POST   /api/conversations
PATCH  /api/conversations/:id
DELETE /api/conversations/:id

// Messages
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
PATCH  /api/messages/:id
DELETE /api/messages/:id

// Calls
POST   /api/calls/create
POST   /api/calls/:id/join
POST   /api/calls/:id/leave

// Appointments
GET    /api/appointments
POST   /api/appointments
PATCH  /api/appointments/:id
DELETE /api/appointments/:id

// Campaigns
GET    /api/campaigns
POST   /api/campaigns
POST   /api/campaigns/:id/send
GET    /api/campaigns/:id/analytics
```

### 3. Signaling Server (WebRTC)

```typescript
// Use a signaling service like Twilio, Agora, or custom
import { TwilioVideo } from '@twilio/video';

const connectToRoom = async (roomName: string, token: string) => {
  const room = await TwilioVideo.connect(token, {
    name: roomName,
    audio: true,
    video: true
  });

  room.on('participantConnected', (participant) => {
    // Handle new participant
  });
};
```

## 📱 Responsive Design

- **Desktop**: Full 3-pane layout
- **Tablet**: 2-pane (hide info panel by default)
- **Mobile**: Single pane with navigation

```tsx
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <MobileChatLayout />
) : (
  <DesktopChatLayout />
)}
```

## 🌐 Internationalisierung (i18n)

Alle UI-Texte sind i18n-ready:

```typescript
// de.json
{
  "communications": {
    "chat": {
      "title": "Unterhaltungen",
      "newMessage": "Neue Nachricht",
      "typing": "{name} tippt...",
      "readBy": "Gelesen von {count} Personen"
    },
    "calls": {
      "startCall": "Anruf starten",
      "endCall": "Anruf beenden"
    }
  }
}

// en.json
{
  "communications": {
    "chat": {
      "title": "Conversations",
      "newMessage": "New Message",
      "typing": "{name} is typing...",
      "readBy": "Read by {count} people"
    }
  }
}
```

## 🐛 Troubleshooting

### Chat-Nachrichten werden nicht angezeigt
- Prüfe LocalStorage: `localStorage.getItem('communications_messages_conv-1')`
- Clear Cache und neu laden
- Prüfe Browser-Console auf Errors

### Draft wird nicht gespeichert
- LocalStorage Quota kann voll sein (5MB Limit)
- Check: `console.log(localStorage.length)`

### Performance-Probleme bei vielen Messages
- Aktiviere Virtualisierung in MessageThread
- Reduziere Initial Load (nur letzte 50 Messages)
- Implementiere Pagination

## 📋 TODO & Roadmap

### v1.1 (Next)
- [ ] Message Reactions UI
- [ ] Thread Replies (nested)
- [ ] Voice Messages
- [ ] File Upload Progress

### v1.2
- [ ] Message Search mit Highlights
- [ ] Advanced Filters (Date Range, Attachments Only)
- [ ] Export Conversation as PDF

### v2.0
- [ ] Echtes WebSocket Backend
- [ ] WebRTC Video/Audio
- [ ] E2E Encryption
- [ ] Message Translation

## 📚 Resources

- [React Window Docs](https://react-window.vercel.app/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
