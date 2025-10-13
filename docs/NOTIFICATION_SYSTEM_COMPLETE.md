# 🔔 Vollständiges Notification System - ImmoNow

## 📋 Übersicht

Ein professionelles, vollständig integriertes Benachrichtigungssystem mit Backend und Frontend, das alle modernen Features bietet:

- ✅ **Vollständige Backend-Integration** mit Django Models und FastAPI Endpoints
- ✅ **React Frontend** mit TypeScript, Hooks und modernen Komponenten
- ✅ **Kategorisierung** nach Property, Contact, Task, Appointment, Document, etc.
- ✅ **Prioritäten** (Low, Normal, High, Urgent)
- ✅ **Typen** (Info, Success, Warning, Error, Reminder)
- ✅ **Rich Metadata** mit Icons, Farben, Related Entities
- ✅ **Action URLs** für direkte Navigation
- ✅ **Read/Unread Status** mit Bulk-Operationen
- ✅ **Archivierung** und Auto-Cleanup
- ✅ **Filterung & Sortierung**
- ✅ **Notification Preferences** per Benutzer und Kategorie
- ✅ **Real-time Polling** mit konfigurierbaren Intervallen
- ✅ **Service Layer** für automatische Notifications

---

## 🗂️ Dateistruktur

### Backend

```
backend/
├── app/
│   ├── db/
│   │   └── models/
│   │       ├── notification.py          # Django Models (Notification, NotificationPreference)
│   │       └── __init__.py              # Updated imports
│   ├── schemas/
│   │   └── notification.py              # Pydantic Schemas (Request/Response)
│   ├── api/
│   │   └── v1/
│   │       ├── notifications.py         # API Endpoints
│   │       └── router.py                # Updated router
│   ├── services/
│   │   └── notification_service.py      # Business Logic & Helper Functions
│   └── models.py                        # Updated model exports
```

### Frontend

```
real-estate-dashboard/
└── src/
    ├── types/
    │   └── notification.ts              # TypeScript Types & Enums
    ├── lib/
    │   └── api/
    │       └── notifications.ts         # API Client
    ├── hooks/
    │   └── useNotifications.ts          # Custom Hooks
    └── components/
        └── notifications/
            └── NotificationCenter.tsx   # Hauptkomponente
```

---

## 🚀 Backend Setup

### 1. Datenbank Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Dies erstellt folgende Tabellen:
- `notifications` - Alle Benachrichtigungen
- `notification_preferences` - Benutzer-Einstellungen

### 2. API Endpoints

Alle Endpoints sind unter `/api/v1/notifications` verfügbar:

#### Benachrichtigungen abrufen
```http
GET /api/v1/notifications?page=1&size=20&read=false&category=task
```

**Query Parameters:**
- `page` - Seitennummer (default: 1)
- `size` - Anzahl pro Seite (default: 20, max: 100)
- `read` - Filter nach Gelesen-Status (true/false/null)
- `archived` - Archivierte anzeigen (default: false)
- `category` - Filter nach Kategorie
- `priority` - Filter nach Priorität
- `type` - Filter nach Typ
- `from_date` - Datum ab
- `to_date` - Datum bis
- `include_stats` - Statistiken einbeziehen (true/false)

#### Ungelesene Anzahl
```http
GET /api/v1/notifications/unread-count
```

#### Statistiken
```http
GET /api/v1/notifications/stats
```

#### Notification erstellen
```http
POST /api/v1/notifications
Content-Type: application/json

{
  "user_id": "uuid",
  "type": "info",
  "category": "task",
  "priority": "high",
  "title": "Neue Aufgabe",
  "message": "Sie haben eine neue Aufgabe erhalten",
  "action_url": "/tasks/123",
  "action_label": "Aufgabe anzeigen",
  "related_entity_type": "task",
  "related_entity_id": "123",
  "related_entity_title": "Vertragsüberprüfung",
  "metadata": {
    "icon": "task-line",
    "color": "blue"
  }
}
```

#### Als gelesen markieren
```http
POST /api/v1/notifications/mark-as-read
Content-Type: application/json

{
  "notification_ids": ["uuid1", "uuid2"]
}
```

#### Alle als gelesen markieren
```http
POST /api/v1/notifications/mark-all-as-read
```

#### Bulk-Aktionen
```http
POST /api/v1/notifications/bulk-action
Content-Type: application/json

{
  "notification_ids": ["uuid1", "uuid2"],
  "action": "mark_read" // oder "mark_unread", "archive", "delete"
}
```

#### Notification löschen
```http
DELETE /api/v1/notifications/{notification_id}
```

---

## 🎨 Frontend Integration

### 1. Notification Types & Enums

```typescript
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  Notification,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_PRIORITY_CONFIG,
} from '../types/notification';
```

### 2. Hooks verwenden

#### Basic Hook
```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { notifications, isLoading, refetch } = useNotifications({
    page: 1,
    size: 20,
    filters: { read: false, category: NotificationCategory.TASK },
  });

  return (
    <div>
      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

#### Manager Hook (Empfohlen)
```typescript
import { useNotificationManager } from '../hooks/useNotifications';

function NotificationComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    setPage,
  } = useNotificationManager();

  return (
    <div>
      <p>Ungelesen: {unreadCount}</p>
      <button onClick={() => markAllAsRead()}>
        Alle als gelesen markieren
      </button>
      {/* ... */}
    </div>
  );
}
```

#### Polling Hook
```typescript
import { useNotificationPolling } from '../hooks/useNotifications';

function Header() {
  const { unreadCount, hasNewNotifications, clearNewFlag } = 
    useNotificationPolling(60000); // Poll every 60 seconds

  return (
    <div>
      {hasNewNotifications && <Badge>Neu!</Badge>}
      <span>{unreadCount}</span>
    </div>
  );
}
```

### 3. NotificationCenter Component

```typescript
import NotificationCenter from '../components/notifications/NotificationCenter';

function App() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div>
      <button onClick={() => setShowNotifications(true)}>
        Benachrichtigungen
      </button>

      {showNotifications && (
        <NotificationCenter 
          onClose={() => setShowNotifications(false)}
          maxHeight="600px"
        />
      )}
    </div>
  );
}
```

---

## 🛠️ Notification Service (Backend)

Der `NotificationService` bietet Helper-Funktionen für häufige Notification-Szenarien:

### Property Status geändert
```python
from app.services.notification_service import NotificationService

NotificationService.notify_property_status_change(
    property_obj=property,
    old_status="draft",
    new_status="active",
    user=user
)
```

### Neuer Kontakt
```python
NotificationService.notify_new_contact(
    contact=contact,
    user=user
)
```

### Aufgabe zugewiesen
```python
NotificationService.notify_task_assigned(
    task=task,
    assignee=assignee_user,
    assigner=current_user
)
```

### Aufgabe fällig bald
```python
NotificationService.notify_task_due_soon(
    task=task,
    user=user
)
```

### Termin-Erinnerung
```python
NotificationService.notify_appointment_reminder(
    appointment=appointment,
    user=user,
    minutes_before=30
)
```

### Dokument hochgeladen
```python
NotificationService.notify_document_uploaded(
    document_title="Vertrag.pdf",
    document_id=str(document.id),
    uploader=current_user,
    recipient=recipient_user,
    tenant=tenant
)
```

### System-Nachricht an mehrere Benutzer
```python
NotificationService.notify_system_message(
    tenant=tenant,
    users=[user1, user2, user3],
    title="Wartungsarbeiten",
    message="Das System wird morgen gewartet",
    priority=NotificationPriority.HIGH,
    action_url="/announcements/123"
)
```

### Cleanup-Funktionen
```python
# Abgelaufene Notifications löschen
deleted_count = NotificationService.cleanup_expired_notifications()

# Alte gelesene Notifications löschen (älter als 30 Tage)
deleted_count = NotificationService.cleanup_old_read_notifications(days=30)
```

---

## ⚙️ Notification Preferences

Benutzer können Präferenzen pro Kategorie festlegen:

### API Endpoints

```http
# Alle Präferenzen abrufen
GET /api/v1/notifications/preferences/all

# Präferenz für Kategorie aktualisieren
PUT /api/v1/notifications/preferences/{category}
Content-Type: application/json

{
  "enabled": true,
  "email_enabled": true,
  "push_enabled": false,
  "in_app_enabled": true,
  "min_priority": "normal",
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00:00",
  "quiet_hours_end": "08:00:00"
}

# Bulk Update
POST /api/v1/notifications/preferences/bulk
Content-Type: application/json

{
  "preferences": [
    {
      "category": "task",
      "enabled": true,
      "min_priority": "high"
    },
    {
      "category": "message",
      "enabled": false
    }
  ]
}
```

### Frontend Hooks

```typescript
import { 
  useNotificationPreferences,
  useUpdateNotificationPreference 
} from '../hooks/useNotifications';

function SettingsPage() {
  const { data: preferences } = useNotificationPreferences();
  const updatePref = useUpdateNotificationPreference();

  const handleToggle = (category, enabled) => {
    updatePref.mutate({
      category,
      data: { enabled }
    });
  };

  return (
    <div>
      {preferences?.map(pref => (
        <div key={pref.id}>
          <label>
            {NOTIFICATION_CATEGORY_CONFIG[pref.category].label}
            <input
              type="checkbox"
              checked={pref.enabled}
              onChange={(e) => handleToggle(pref.category, e.target.checked)}
            />
          </label>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Features & Capabilities

### ✅ Kategorien (NotificationCategory)
- `system` - System-Benachrichtigungen
- `property` - Immobilien-Benachrichtigungen
- `contact` - Kontakt-Benachrichtigungen
- `task` - Aufgaben-Benachrichtigungen
- `appointment` - Termin-Benachrichtigungen
- `document` - Dokument-Benachrichtigungen
- `financial` - Finanz-Benachrichtigungen
- `message` - Nachrichten-Benachrichtigungen
- `team` - Team-Benachrichtigungen
- `cim` - CIM-Benachrichtigungen

### ✅ Prioritäten (NotificationPriority)
- `low` - Niedrige Priorität
- `normal` - Normale Priorität
- `high` - Hohe Priorität
- `urgent` - Dringende Priorität

### ✅ Typen (NotificationType)
- `info` - Information
- `success` - Erfolg
- `warning` - Warnung
- `error` - Fehler
- `reminder` - Erinnerung

### ✅ Bulk-Operationen
- Mehrere als gelesen markieren
- Mehrere archivieren
- Mehrere löschen
- Alle als gelesen markieren

### ✅ Filterung
- Nach Read-Status
- Nach Kategorie
- Nach Priorität
- Nach Typ
- Nach Datumsbereich
- Archivierte ein-/ausblenden

### ✅ Metadata & Customization
Jede Notification kann Custom-Metadata enthalten:
```json
{
  "metadata": {
    "icon": "custom-icon",
    "color": "custom-color",
    "badge": "VIP",
    "customField": "customValue"
  }
}
```

### ✅ Related Entities
Verknüpfung zu anderen Entities:
- `related_entity_type` - z.B. "property", "contact", "task"
- `related_entity_id` - Die ID der Entity
- `related_entity_title` - Display-Name

### ✅ Action URLs
Direkte Navigation beim Klick:
- `action_url` - Wohin navigieren
- `action_label` - Button-Text (z.B. "Aufgabe anzeigen")

### ✅ Auto-Cleanup
- `expires_at` - Automatisches Löschen nach Datum
- Service-Methoden für periodisches Cleanup

---

## 🔄 Integration in bestehende Features

### Beispiel: Property erstellt
```python
# In properties API endpoint
property = Property.objects.create(...)

# Notification an Team senden
team_members = User.objects.filter(
    tenantuser__tenant=tenant,
    tenantuser__role='employee'
)

for member in team_members:
    NotificationService.create_notification(
        tenant=tenant,
        user=member,
        type=NotificationType.SUCCESS,
        category=NotificationCategory.PROPERTY,
        priority=NotificationPriority.NORMAL,
        title="Neue Immobilie erstellt",
        message=f'Die Immobilie "{property.title}" wurde erstellt',
        action_url=f"/properties/{property.id}",
        action_label="Immobilie anzeigen",
        related_entity_type="property",
        related_entity_id=str(property.id),
        related_entity_title=property.title,
        created_by=current_user
    )
```

### Beispiel: Task Deadline in 24h
```python
from django.utils import timezone
from datetime import timedelta

# In einem Cronjob oder scheduled task
tasks_due_soon = Task.objects.filter(
    due_date__lte=timezone.now() + timedelta(hours=24),
    due_date__gte=timezone.now(),
    status__in=['todo', 'in_progress']
)

for task in tasks_due_soon:
    NotificationService.notify_task_due_soon(
        task=task,
        user=task.assignee
    )
```

---

## 📱 Frontend Best Practices

### 1. Globale Notification Badge im Header
```typescript
import { useUnreadCount } from '../hooks/useNotifications';

function GlobalHeader() {
  const { data: unreadCount } = useUnreadCount(60000); // Poll every minute

  return (
    <button className="notification-bell">
      <Bell />
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
    </button>
  );
}
```

### 2. Dropdown/Modal für Notifications
```typescript
import NotificationCenter from '../components/notifications/NotificationCenter';

function NotificationDropdown() {
  return (
    <div className="dropdown">
      <NotificationCenter 
        maxHeight="400px"
        className="w-96"
      />
    </div>
  );
}
```

### 3. Dedizierte Notifications-Seite
```typescript
function NotificationsPage() {
  return (
    <div className="page-container">
      <h1>Benachrichtigungen</h1>
      <NotificationCenter 
        maxHeight="none"
        className="w-full"
      />
    </div>
  );
}
```

---

## 🔧 Konfiguration

### Backend Settings (Django)

```python
# settings.py

NOTIFICATION_SETTINGS = {
    'DEFAULT_EXPIRY_DAYS': 90,  # Notifications expire after 90 days
    'CLEANUP_INTERVAL_HOURS': 24,  # Run cleanup every 24 hours
    'MAX_UNREAD_PER_USER': 1000,  # Limit unread notifications
}
```

### Frontend Polling Interval

```typescript
// In your config
export const NOTIFICATION_CONFIG = {
  pollInterval: 60000, // 1 minute
  maxNotificationsPerPage: 20,
  enableDesktopNotifications: true,
};
```

---

## 🎨 Styling & Theming

Das NotificationCenter verwendet Tailwind CSS und unterstützt Dark Mode automatisch.

### Custom Styling
```css
/* Custom notification styles */
.notification-item {
  @apply p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800;
}

.notification-unread {
  @apply bg-blue-50 dark:bg-blue-900/10;
}

.notification-urgent {
  @apply border-l-4 border-red-500;
}
```

---

## 🚀 Deployment Checklist

- [ ] Datenbank Migration ausführen
- [ ] API Endpoints testen
- [ ] Frontend Build erstellen
- [ ] Polling-Intervall konfigurieren
- [ ] Cleanup-Cronjob einrichten
- [ ] Notification Preferences für existierende User erstellen
- [ ] Email/Push Notification Integration (optional)

---

## 📞 Support & Erweiterungen

### Geplante Features
- [ ] Real-time WebSocket Updates
- [ ] Email Notifications
- [ ] Push Notifications (Browser/Mobile)
- [ ] SMS Notifications
- [ ] Notification Templates
- [ ] Notification Groups/Threads
- [ ] Rich Content (Images, Videos)
- [ ] Notification Scheduling

### Weitere Integration-Möglichkeiten
- Slack/Teams Integration
- WhatsApp Business Notifications
- Telegram Bot Notifications
- Custom Webhooks

---

## 📄 Lizenz

Dieses Notification-System ist Teil von ImmoNow und unterliegt der Projekt-Lizenz.

---

**Status: ✅ Produktionsbereit**

Erstellt: Oktober 2025
Version: 1.0.0
