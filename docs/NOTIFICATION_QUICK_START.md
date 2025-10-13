# 🚀 Notification System - Quick Start Guide

## ⚡ Schnellstart in 5 Minuten

### 1. Backend Migration (1 Minute)

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

Das war's! Die Notification-Tabellen sind nun erstellt.

---

### 2. Frontend Integration - Notification Badge (2 Minuten)

Fügen Sie einen Notification-Badge zu Ihrem Header hinzu:

```typescript
// In GlobalHeader.tsx oder einer ähnlichen Datei
import { useUnreadCount } from '../hooks/useNotifications';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { NotificationCenter } from '../components/notifications';

function YourHeader() {
  const { data: unreadCount } = useUnreadCount(60000); // Poll every minute
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div>
      {/* Notification Bell Button */}
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-96 z-50">
          <NotificationCenter 
            onClose={() => setShowNotifications(false)}
            maxHeight="500px"
          />
        </div>
      )}
    </div>
  );
}
```

---

### 3. Test-Notification erstellen (2 Minuten)

#### Option A: Über Django Admin oder Python Shell

```python
from app.models import User, Tenant, Notification
from app.db.models.notification import NotificationType, NotificationCategory, NotificationPriority

# Hole einen User und Tenant
user = User.objects.first()
tenant = Tenant.objects.first()

# Erstelle eine Test-Notification
notification = Notification.objects.create(
    tenant=tenant,
    user=user,
    type=NotificationType.SUCCESS.value,
    category=NotificationCategory.SYSTEM.value,
    priority=NotificationPriority.NORMAL.value,
    title="Willkommen!",
    message="Ihr Notification-System ist jetzt aktiv!",
    action_url="/dashboard",
    action_label="Zum Dashboard",
    metadata={"icon": "ri-checkbox-circle-line", "color": "green"}
)

print(f"✅ Notification erstellt: {notification.id}")
```

#### Option B: Über API (mit curl)

```bash
curl -X POST http://localhost:8000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "USER_UUID_HIER",
    "type": "success",
    "category": "system",
    "priority": "normal",
    "title": "Willkommen!",
    "message": "Ihr Notification-System ist jetzt aktiv!",
    "action_url": "/dashboard",
    "action_label": "Zum Dashboard"
  }'
```

---

## 🎯 Häufigste Anwendungsfälle

### 1. Notification bei neuer Property

```python
# In properties/api.py nach property.save()
from app.services.notification_service import NotificationService

NotificationService.notify_property_status_change(
    property_obj=property,
    old_status="draft",
    new_status="active",
    user=request.user
)
```

### 2. Notification bei Task-Zuweisung

```python
# In tasks/api.py
NotificationService.notify_task_assigned(
    task=task,
    assignee=task.assignee,
    assigner=request.user
)
```

### 3. Notification bei Termin (30 Min vorher)

```python
# In einem Cronjob
from django.utils import timezone
from datetime import timedelta

appointments_soon = Appointment.objects.filter(
    start_datetime__gte=timezone.now(),
    start_datetime__lte=timezone.now() + timedelta(minutes=30)
)

for appointment in appointments_soon:
    NotificationService.notify_appointment_reminder(
        appointment=appointment,
        user=appointment.created_by,
        minutes_before=30
    )
```

### 4. System-Nachricht an alle User

```python
# Maintenance-Nachricht oder Announcement
from app.models import User, Tenant
from app.services.notification_service import NotificationService
from app.db.models.notification import NotificationPriority

tenant = Tenant.objects.get(id="your-tenant-id")
users = User.objects.filter(tenantuser__tenant=tenant, is_active=True)

NotificationService.notify_system_message(
    tenant=tenant,
    users=list(users),
    title="Wartungsarbeiten",
    message="Das System wird morgen zwischen 02:00 und 04:00 Uhr gewartet",
    priority=NotificationPriority.HIGH,
    action_url="/announcements/maintenance"
)
```

---

## 📊 Frontend - Notification anzeigen

### Basic List

```typescript
import { useNotifications } from '../hooks/useNotifications';

function NotificationList() {
  const { notifications, isLoading } = useNotifications({
    page: 1,
    size: 10,
    filters: { read: false } // Nur ungelesene
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {notifications.map(n => (
        <div key={n.id}>
          <h4>{n.title}</h4>
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
}
```

### Mit Filtering

```typescript
import { useNotificationManager } from '../hooks/useNotifications';
import { NotificationCategory } from '../types/notification';

function FilteredNotifications() {
  const { notifications, setFilters } = useNotificationManager();

  return (
    <div>
      <button onClick={() => setFilters({ category: NotificationCategory.TASK })}>
        Nur Aufgaben
      </button>
      <button onClick={() => setFilters({ priority: 'high' })}>
        Nur Hohe Priorität
      </button>
      <button onClick={() => setFilters({})}>
        Alle
      </button>

      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

### Mit Actions

```typescript
import { useNotificationManager } from '../hooks/useNotifications';

function NotificationsWithActions() {
  const { 
    notifications, 
    markAsRead, 
    deleteNotification,
    markAllAsRead 
  } = useNotificationManager();

  return (
    <div>
      <button onClick={() => markAllAsRead()}>
        Alle als gelesen markieren
      </button>

      {notifications.map(n => (
        <div key={n.id}>
          <h4>{n.title}</h4>
          <button onClick={() => markAsRead([n.id])}>
            Als gelesen
          </button>
          <button onClick={() => deleteNotification(n.id)}>
            Löschen
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Wichtige Konfigurationen

### Backend: Automatisches Cleanup

Fügen Sie einen Cronjob oder Celery Task hinzu:

```python
# In einer scheduled task
from app.services.notification_service import NotificationService

# Abgelaufene Notifications löschen
NotificationService.cleanup_expired_notifications()

# Alte gelesene Notifications löschen (älter als 30 Tage)
NotificationService.cleanup_old_read_notifications(days=30)
```

### Frontend: Polling-Intervall anpassen

```typescript
// Schneller Poll (alle 30 Sekunden)
const { data: unreadCount } = useUnreadCount(30000);

// Langsamer Poll (alle 5 Minuten)
const { data: unreadCount } = useUnreadCount(300000);

// Kein Polling (nur manuelles Refresh)
const { data: unreadCount } = useUnreadCount(false);
```

---

## 🎨 Notification Types & Icons

### Icons customizen

```python
# Beim Erstellen der Notification
notification = Notification.objects.create(
    # ... andere Felder ...
    metadata={
        "icon": "ri-heart-fill",      # Remix Icon class
        "color": "red",                # Custom color
        "badge": "VIP",                # Badge text
        "importance": "critical"       # Custom field
    }
)
```

### Frontend: Custom Icon Rendering

```typescript
// In NotificationCenter.tsx anpassen
const getIcon = (notification: Notification) => {
  // 1. Prüfe custom icon in metadata
  if (notification.metadata?.icon) {
    return notification.metadata.icon;
  }
  
  // 2. Fallback auf Type-Config
  return NOTIFICATION_TYPE_CONFIG[notification.type].icon;
};
```

---

## 📱 Notification Preferences

### User kann Einstellungen ändern

```typescript
import { NotificationSettings } from '../components/notifications';

function SettingsPage() {
  return (
    <div>
      <h1>Einstellungen</h1>
      <NotificationSettings />
    </div>
  );
}
```

### Programmatisch Präferenz setzen

```python
from app.models import NotificationPreference, User
from app.db.models.notification import NotificationCategory, NotificationPriority

user = User.objects.get(email="user@example.com")
tenant = user.tenantuser_set.first().tenant

# Nur High-Priority Tasks
pref, created = NotificationPreference.objects.get_or_create(
    tenant=tenant,
    user=user,
    category=NotificationCategory.TASK.value,
    defaults={
        'min_priority': NotificationPriority.HIGH.value,
        'email_enabled': True,
        'push_enabled': False,
        'in_app_enabled': True
    }
)
```

---

## 🐛 Troubleshooting

### Keine Notifications sichtbar?

1. **Prüfe ob User/Tenant korrekt:**
```python
# In Django Shell
from app.models import Notification, User
user = User.objects.get(email="your-email")
notifications = Notification.objects.filter(user=user)
print(f"User hat {notifications.count()} Notifications")
```

2. **Prüfe Frontend Auth:**
```typescript
// In Browser Console
const token = localStorage.getItem('token');
console.log('Token:', token);
```

3. **Prüfe API Response:**
```bash
curl -X GET http://localhost:8000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Polling funktioniert nicht?

```typescript
// Manuelles Refresh-Intervall checken
import { useUnreadCount } from '../hooks/useNotifications';

function Debug() {
  const { data, isLoading, error, refetch } = useUnreadCount(5000);
  
  console.log('Unread Count:', data);
  console.log('Loading:', isLoading);
  console.log('Error:', error);
  
  return <button onClick={() => refetch()}>Force Refresh</button>;
}
```

---

## ✅ Checkliste für Produktions-Deployment

- [ ] Migrations ausgeführt
- [ ] Test-Notification erstellt und sichtbar
- [ ] Frontend Badge zeigt unread count
- [ ] Clicking auf Notification navigiert korrekt
- [ ] "Alle als gelesen" funktioniert
- [ ] Filtering funktioniert
- [ ] Preferences werden gespeichert
- [ ] Cleanup-Cronjob eingerichtet
- [ ] API-Endpoints sind geschützt (Auth)
- [ ] Error Handling implementiert
- [ ] Loading States vorhanden

---

## 📚 Weitere Ressourcen

- Vollständige Dokumentation: `docs/NOTIFICATION_SYSTEM_COMPLETE.md`
- API Endpoints: `/api/docs` (Swagger UI)
- Type Definitions: `src/types/notification.ts`
- Backend Models: `backend/app/db/models/notification.py`

---

**Happy Notifying! 🎉**
