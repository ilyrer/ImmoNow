# Admin-Konsole, Chatbot & Profil-Erweiterung

## 📋 Übersicht

Diese Erweiterung fügt drei Hauptbereiche zur ImmoNow-Plattform hinzu:

1. **Admin-Konsole** (`/admin`) - Umfassende Verwaltung für Geschäftsführer
2. **Enhanced Chatbot** - KI-gestützter Assistent mit Kontext-Bewusstsein
3. **Erweitertes Profil** (`/profile`) - Vollständiges Profil-Management-System

---

## 🏗️ Architektur

### Ordnerstruktur

```
src/
├── components/
│   ├── admin/                      # Admin-Konsole
│   │   ├── AdminConsole.tsx        # Haupt-Container
│   │   ├── GlassUI.tsx            # Wiederverwendbare UI-Komponenten
│   │   ├── tabs/                  # 6 Admin-Tabs
│   │   │   ├── EmployeesTab.tsx   # Mitarbeiterverwaltung
│   │   │   ├── RolesTab.tsx       # Rollen & Rechte
│   │   │   ├── PayrollTab.tsx     # Lohnabrechnung (UI)
│   │   │   ├── DocumentsTab.tsx   # Dokumente & Verträge
│   │   │   ├── AuditTab.tsx       # Aktivitätsprotokolle
│   │   │   └── OrganizationTab.tsx # Organisationseinstellungen
│   │   └── drawers/
│   │       └── EmployeeDrawer.tsx # Edit-Drawer für Mitarbeiter
│   │
│   ├── chatbot/
│   │   └── ChatbotPanel.tsx       # Enhanced Chatbot-Panel
│   │
│   ├── profile/                   # Profil-System
│   │   ├── ProfilePage.tsx        # Haupt-Container
│   │   └── tabs/                  # 7 Profil-Tabs
│   │       ├── ProfileOverviewTab.tsx
│   │       ├── ProfilePersonalTab.tsx
│   │       ├── ProfileSecurityTab.tsx
│   │       ├── ProfileNotificationsTab.tsx
│   │       ├── ProfileLinkedAccountsTab.tsx
│   │       ├── ProfilePreferencesTab.tsx
│   │       └── ProfileApiTokensTab.tsx
│   │
│   └── common/
│       └── ChatbotFAB.tsx         # Floating Action Button
│
├── hooks/
│   ├── useAdminMocks.ts           # Admin Mock-Daten & Services
│   ├── useChatbotMock.ts          # Chatbot Mock-Service
│   └── useProfileMocks.ts         # Profil Mock-Services
│
└── types/
    ├── admin.ts                   # Admin TypeScript Interfaces
    ├── chatbot.ts                 # Chatbot TypeScript Interfaces
    └── profile.ts                 # Profil TypeScript Interfaces
```

---

## 🎨 Design-System

### Glass-Morphism Pattern

Alle neuen Komponenten verwenden ein einheitliches Apple-inspiriertes Glass-Design:

- **GlassCard**: `bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl`
- **GlassButton**: Kontextabhängige Farben mit Blur-Effekt
- **Badge**: Statusanzeigen mit semi-transparentem Hintergrund
- **Rounded Corners**: `rounded-3xl` für Cards, `rounded-xl` für Inputs

### Dark Mode Support

Alle Komponenten unterstützen vollständig Dark Mode mit:
- `dark:` Tailwind-Prefixes
- Automatische Farbumschaltung
- Optimierte Kontraste

---

## 🔧 Mock-Daten & Services

### Admin Mocks (`useAdminMocks.ts`)

**Employees (Mitarbeitende)**
```typescript
useEmployeesMock()
- employees: Employee[]
- updateEmployee(id, updates)
- deleteEmployee(id)
- bulkUpdateRole(ids, roleId)
- bulkUpdateTeam(ids, team)
```

**Roles (Rollen)**
```typescript
useRolesMock()
- roles: Role[]
- updateRole(id, updates)
- createRole(role)
- deleteRole(id)
```

**Payroll (Lohnabrechnung)**
```typescript
usePayrollMock()
- payrollRuns: PayrollRun[]
- approvePayroll(id)
- markAsPaid(id)
```

**Employee Documents**
```typescript
useEmployeeDocsMock()
- documents: EmployeeDocument[]
- uploadDocument(doc)
```

**Audit Logs**
```typescript
useAuditLogMock()
- logs: AuditLog[]
- filters: FilterState
- setFilters(filters)
```

**Organization Settings**
```typescript
useOrgSettingsMock()
- settings: OrganizationSettings
- updateSettings(updates)
```

### Chatbot Mock (`useChatbotMock.ts`)

```typescript
useChatbotMock()
- send(message, context): Promise<BotResponse>
- conversations: BotConversation[]
- currentConversation: BotConversation | null
- currentContext: BotContext
- switchContext(context)
- newConversation()
- clearAll()
```

**Unterstützte Kontexte:**
- `properties` - Immobilien
- `contacts` - Kontakte
- `kanban` - Aufgaben
- `investor` - Investoren
- `social` - Social Media
- `comms` - Kommunikation
- `finance` - Finanzen
- `documents` - Dokumente
- `general` - Allgemein

### Profil Mocks (`useProfileMocks.ts`)

```typescript
useProfileMock() - Basisprofil
useSessionsMock() - Aktive Sitzungen
useNotificationPrefsMock() - Benachrichtigungen
useLinkedAccountsMock() - Verknüpfte Konten
useApiTokensMock() - API-Tokens
useSecuritySettingsMock() - Sicherheitseinstellungen
useUserPreferencesMock() - Benutzer-Präferenzen
useActivityLogMock() - Aktivitätsprotokoll
```

---

## 🔄 API-Integration (Zukünftig)

### Mock-zu-API-Migration

Alle Mock-Hooks können direkt durch echte API-Calls ersetzt werden:

**Vorher (Mock):**
```typescript
const { employees, updateEmployee } = useEmployeesMock();
```

**Nachher (API):**
```typescript
const { employees, updateEmployee } = useEmployees(); // Echter API-Hook

// Implementierung:
const updateEmployee = async (id: string, updates: Partial<Employee>) => {
  const response = await fetch(`/api/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return response.json();
};
```

### API-Endpunkte (Backend TODO)

```
Admin:
- GET    /api/admin/employees
- POST   /api/admin/employees
- PATCH  /api/admin/employees/:id
- DELETE /api/admin/employees/:id

- GET    /api/admin/roles
- POST   /api/admin/roles
- PATCH  /api/admin/roles/:id

- GET    /api/admin/payroll
- POST   /api/admin/payroll/:id/approve
- POST   /api/admin/payroll/:id/pay

- GET    /api/admin/audit-logs
- GET    /api/admin/settings
- PATCH  /api/admin/settings

Chatbot:
- POST   /api/chatbot/send
- GET    /api/chatbot/conversations
- DELETE /api/chatbot/conversations/:id

Profile:
- GET    /api/profile
- PATCH  /api/profile
- GET    /api/profile/sessions
- DELETE /api/profile/sessions/:id
- GET    /api/profile/notifications
- PATCH  /api/profile/notifications
- GET    /api/profile/linked-accounts
- POST   /api/profile/linked-accounts
- DELETE /api/profile/linked-accounts/:id
- GET    /api/profile/api-tokens
- POST   /api/profile/api-tokens
- DELETE /api/profile/api-tokens/:id
- GET    /api/profile/activity
```

---

## 🌐 Internationalisierung (i18n)

### Übersetzungskeys

**Admin (`admin.*`)**
```json
{
  "admin.title": "Admin-Konsole",
  "admin.employees.title": "Mitarbeitende",
  "admin.employees.add": "Mitarbeiter hinzufügen",
  "admin.employees.status.active": "Aktiv",
  "admin.employees.status.inactive": "Inaktiv",
  "admin.roles.title": "Rollen & Rechte",
  "admin.roles.permissions": "Berechtigungen",
  "admin.payroll.title": "Lohn & Abrechnung",
  "admin.payroll.status.draft": "Entwurf",
  "admin.payroll.status.approved": "Freigegeben",
  "admin.payroll.status.paid": "Ausgezahlt",
  "admin.documents.title": "Dokumente & Verträge",
  "admin.audit.title": "Aktivitätsprotokolle",
  "admin.organization.title": "Organisation"
}
```

**Chatbot (`bot.*`)**
```json
{
  "bot.title": "ImmoNow Assistent",
  "bot.context.properties": "Immobilien",
  "bot.context.contacts": "Kontakte",
  "bot.context.kanban": "Aufgaben",
  "bot.action.createTask": "Aufgabe erstellen",
  "bot.action.generateExpose": "Exposé generieren",
  "bot.placeholder": "Nachricht eingeben..."
}
```

**Profil (`profile.*`)**
```json
{
  "profile.title": "Mein Profil",
  "profile.overview": "Übersicht",
  "profile.personal": "Persönliche Daten",
  "profile.security": "Sicherheit",
  "profile.security.2fa": "Zwei-Faktor-Authentifizierung",
  "profile.security.sessions": "Aktive Sitzungen",
  "profile.notifications": "Benachrichtigungen",
  "profile.linked": "Verknüpfte Konten",
  "profile.preferences": "Präferenzen",
  "profile.tokens": "API-Tokens"
}
```

---

## 🎯 Features

### Admin-Konsole

✅ **Mitarbeitende**
- Tabellenansicht mit Suche & Filter
- Inline-Bearbeitung & Drawer
- Bulk-Aktionen (Aktivieren/Deaktivieren)
- Rollen- & Team-Zuweisung
- Status-Tracking (Active/Inactive/On Leave)

✅ **Rollen & Rechte**
- Matrix-UI für Berechtigungsverwaltung
- Scopes pro Modul (read/write/delete/export)
- System-Rollen vs Custom-Rollen
- Preset-Speicherung

✅ **Lohn & Abrechnung**
- Lohnlauf-Übersicht (Draft/Approved/Paid)
- Mitarbeiter-Kompensation (Fixum/Provision)
- Status-Workflow (Freigabe → Auszahlung)
- Export-Funktionen (disabled in Mock)

✅ **Dokumente & Verträge**
- Document-Liste mit Typen (Contract, NDA, etc.)
- E-Sign Status-Tracking
- Version-Management
- Vorschau-Drawer

✅ **Aktivitätsprotokolle**
- Audit-Log mit Filter (User, Module, Zeitraum)
- Action-Tracking
- IP/UserAgent-Logging
- Export-Funktion

✅ **Organisation**
- Firmenprofil & Adresse
- Branding (Farben, Logo)
- Standard-Einstellungen (Währung, Zeitzone, Sprache)
- Integrationen (Google, Outlook, Portale, Push)

### Enhanced Chatbot

✅ **Kontext-Bewusstsein**
- 9 Module-Kontexte
- Kontextspezifische Suggestions
- Kontextspezifische Actions

✅ **UI/UX**
- Floating Action Button
- Docked Panel (rechts)
- Konversations-History
- Quick Actions mit vorbefüllten Forms

✅ **Features**
- Conversational Memory (localStorage)
- Multiple Conversations
- Context-Switching
- Clear-Funktion

### Erweitertes Profil

✅ **Übersicht**
- Avatar & Basisinfo
- Letzte Aktivitäten (Mini-Log)

✅ **Persönliche Daten**
- Name, Email, Telefon
- Company, Position

✅ **Sicherheit**
- 2FA Setup (App/SMS/Email)
- Aktive Sitzungen-Verwaltung
- Session-Termination
- Passwort-Änderung UI

✅ **Benachrichtigungen**
- Granular pro Modul
- Multi-Channel (In-App, Email, Push)
- Frequency-Settings

✅ **Verknüpfte Konten**
- Google, Outlook, Social Media
- Connect/Disconnect
- Sync-Status

✅ **Präferenzen**
- Sprache, Zeitzone, Währung
- Theme (Light/Dark/Auto)
- Layout-Optionen (Compact, Animations)

✅ **API-Tokens**
- Token-Generierung
- Scope-Management (read/write/admin)
- Revoke/Delete
- Last-Used Tracking

---

## 🚀 Verwendung

### Admin-Konsole öffnen

```typescript
navigate('/admin');
```

Oder über die Sidebar: **Admin-Konsole** (Shield-Icon)

### Chatbot verwenden

1. Klick auf Floating Button (rechts unten)
2. Kontext wählen (z.B. "Immobilien")
3. Frage stellen oder Suggestion wählen
4. Actions ausführen (öffnet Forms)

### Profil verwalten

```typescript
navigate('/profile');
```

Oder über die Sidebar: **Mein Profil** (UserCircle-Icon)

---

## 🔐 Berechtigungen

### Admin-Zugriff

Die Admin-Konsole sollte nur für Benutzer mit `role: 'admin'` oder `role: 'geschaeftsfuehrer'` zugänglich sein.

**TODO: Implementierung**
```typescript
// In PrivateRoute oder AdminConsole
const hasAdminAccess = ['admin', 'geschaeftsfuehrer'].includes(user?.role);
if (!hasAdminAccess) {
  return <Navigate to="/unauthorized" />;
}
```

---

## 📝 Mock-Daten Seeds

### Employees
- 6 Mitarbeiter (5 aktiv, 1 inaktiv)
- Verschiedene Rollen (GF, Makler, Backoffice, Praktikant)
- Teams: Management, Sales, Administration

### Roles
- 5 vordefinierte Rollen
- Scope-Sets für verschiedene Permission-Levels

### Payroll
- 3 Lohnläufe (Paid, Approved, Draft)
- Zeitraum: Sept-Nov 2024

### Audit Logs
- 4 Log-Einträge
- Verschiedene Aktionen & Module

---

## 🛠️ Entwicklung

### Neue Mock-Daten hinzufügen

```typescript
// In useAdminMocks.ts
const MOCK_EMPLOYEES: Employee[] = [
  // ... bestehende
  {
    id: 'emp-new',
    name: 'Neuer Mitarbeiter',
    email: 'neu@immonow.de',
    roleId: 'role-3',
    status: 'active',
    // ...
  }
];
```

### Neue Chatbot-Kontexte

```typescript
// In useChatbotMock.ts
const CONTEXT_RESPONSES: Record<BotContext, string[]> = {
  // ...
  newContext: [
    'Response 1',
    'Response 2',
  ]
};
```

### Neue Profil-Tabs

1. Erstelle `ProfileNewTab.tsx` in `components/profile/tabs/`
2. Import in `ProfilePage.tsx`
3. Füge Tab-Config hinzu
4. Implementiere Switch-Case

---

## 📦 Dependencies

Alle Features nutzen bestehende Dependencies:
- **React** (Hooks: useState, useCallback, useEffect)
- **TypeScript** (Typsicherheit)
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **React Router** (Navigation)

Keine zusätzlichen Packages erforderlich! ✨

---

## ✅ Checkliste: API-Integration

Wenn das Backend bereit ist:

- [ ] Admin-Endpoints erstellen (siehe oben)
- [ ] Mock-Hooks durch API-Hooks ersetzen
- [ ] localStorage-Persistierung durch Backend-State ersetzen
- [ ] Authentifizierung & Authorization implementieren
- [ ] Chatbot an AI-Backend anbinden (OpenAI, etc.)
- [ ] Websockets für Real-Time Updates (Audit-Logs, Notifications)
- [ ] File-Upload für Dokumente & Avatare
- [ ] E-Sign Integration (DocuSign, etc.)
- [ ] 2FA-Backend (TOTP, SMS-Gateway)
- [ ] API-Token-Management im Backend

---

## 📚 Weitere Dokumentation

- [APPLE_GLASS_DARKMODE.md](./docs/APPLE_GLASS_DARKMODE.md) - Design-System Details
- [COMMUNICATIONS_README.md](./docs/COMMUNICATIONS_README.md) - Kommunikations-Module
- [MOCK_SYSTEM_README.md](./docs/MOCK_SYSTEM_README.md) - Mock-System Architektur

---

## 🎉 Zusammenfassung

Diese Erweiterung fügt **3 Hauptfeatures** mit **20+ Komponenten**, **15+ Mock-Hooks** und **100+ TypeScript Interfaces** hinzu - alles vollständig implementiert, dokumentiert und bereit für die API-Integration!

**Entwickelt mit ❤️ für ImmoNow**
