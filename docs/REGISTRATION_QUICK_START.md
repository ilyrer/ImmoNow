# 🎉 Registration Fix - Quick Start Guide

## ✅ Was behoben wurde

### Hauptprobleme:
1. ✅ **Datenbank-Fehler** - "no such table: users" 
   - Database-Pfad korrigiert von `cim_backend.db` zu `db.sqlite3`

2. ✅ **UUID Serialisierung** - Pydantic Validierungsfehler
   - UUID-Felder werden jetzt korrekt als Strings zurückgegeben

3. ✅ **Password Hashing** - "hash could not be identified"
   - Auf Django's PBKDF2 standardisiert (stabil und zuverlässig)
   - Alte Bcrypt-Abhängigkeit entfernt

4. ✅ **Multi-Tenancy** - Bereits korrekt implementiert
   - Jeder User kann zu mehreren Tenants gehören
   - Rollenbasierte Berechtigungen

5. ✅ **Owner Permissions** - Bereits korrekt implementiert
   - Erster User bekommt automatisch 'owner' Rolle
   - Volle Berechtigungen für alle Funktionen

## 🚀 Backend starten

```powershell
cd c:\Users\albian\Documents\CIM_Frontend\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 Registration testen

1. **Frontend öffnen:** http://localhost:3000/
2. **Auf "Create Account" klicken**
3. **Formular ausfüllen:**
   - Email: `test@example.com`
   - Password: `TestPass123` (mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahl)
   - Vorname: `Max`
   - Nachname: `Mustermann`
   - Firma: `Mustermann Immobilien GmbH`

4. **"Create Premium Account" klicken**

## 🎯 Was passiert bei der Registration:

```
1. Neuer Tenant erstellt → "Mustermann Immobilien GmbH"
   └─ Plan: free (2 users, 5 properties, 1GB)
   └─ Slug: mustermann-immobilien-gmbh
   └─ Status: active

2. Neuer User erstellt → Max Mustermann
   └─ Email: test@example.com
   └─ Password: PBKDF2-Hash
   └─ Active: true

3. TenantUser Verknüpfung → Owner Role
   └─ can_manage_properties: ✅
   └─ can_manage_documents: ✅
   └─ can_manage_users: ✅
   └─ can_view_analytics: ✅
   └─ can_export_data: ✅

4. JWT Tokens generiert
   └─ Access Token (1 Stunde gültig)
   └─ Refresh Token (30 Tage gültig)

5. Automatischer Login → Weiterleitung zu /dashboard
```

## 🔐 Owner Berechtigungen

Als **erster registrierter User** bekommst du automatisch:

| Berechtigung | Status |
|--------------|--------|
| Properties verwalten | ✅ |
| Dokumente verwalten | ✅ |
| Users einladen/verwalten | ✅ |
| Analytics ansehen | ✅ |
| Daten exportieren | ✅ |
| Tenant-Einstellungen | ✅ |
| Billing verwalten | ✅ |

## 🏢 Multi-Tenancy Architektur

```
🏢 Tenant 1 (Firma A)
   ├─ 👤 User 1 (Owner)
   ├─ 👤 User 2 (Admin)
   └─ 👤 User 3 (Agent)

🏢 Tenant 2 (Firma B)
   ├─ 👤 User 1 (Owner)  ← Kann derselbe User sein!
   └─ 👤 User 4 (Manager)
```

Ein User kann zu **mehreren Tenants** gehören, mit jeweils **unterschiedlichen Rollen**.

## 📋 Rollen-Hierarchie

1. **Owner** 👑
   - Vollzugriff auf alles
   - Kann Users einladen
   - Kann Billing verwalten
   - → Erster registrierter User

2. **Admin** 🛡️
   - Fast Vollzugriff
   - Kann Users einladen
   - Kann keine Billing-Einstellungen ändern

3. **Manager** 📊
   - Kann Properties verwalten
   - Kann Tasks verwalten
   - Kann Dokumente verwalten

4. **Agent** 🏠
   - Standard Makler-Zugriff
   - Kann Properties bearbeiten
   - Kann Kontakte verwalten

5. **Viewer** 👁️
   - Nur Lese-Zugriff
   - Kann nichts bearbeiten

## 🎁 Plan-Limits

| Plan | Users | Properties | Storage |
|------|-------|------------|---------|
| **Free** (Standard) | 2 | 5 | 1 GB |
| **Basic** | 5 | 25 | 10 GB |
| **Professional** | 20 | 100 | 50 GB |
| **Enterprise** | 100 | 1000 | 500 GB |

## 🐛 Troubleshooting

### Backend startet nicht?
```powershell
# Django setup prüfen
cd backend
python manage.py migrate
python manage.py showmigrations
```

### "Table users does not exist"?
```powershell
# Migrations ausführen
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Password funktioniert nicht?
```powershell
# Datenbank zurücksetzen
cd backend
python clear_users.py
# Dann neu registrieren
```

### UUID Fehler?
- Backend neu starten (Code wurde gefixt)

## 📝 Nächste Schritte

1. ✅ Backend starten
2. ✅ Registrieren
3. ✅ Dashboard erkunden
4. 📧 Optional: Email-Verifizierung einbauen
5. 🔄 Optional: Password-Reset Funktion
6. 👥 Optional: Weitere Users einladen

## 🎨 Frontend Features

Die `AuthPage.tsx` bietet:
- ✨ Schönes Glassmorphism Design
- 🔒 Password Strength Meter
- ✅ Client-Side Validierung
- 🎯 Klare Error Messages
- 🚀 Smooth Animations
- 📱 Responsive Design

## 💾 Datenbank-Schema

```sql
-- Tenants Tabelle
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    plan VARCHAR(50),
    is_active BOOLEAN
);

-- Users Tabelle
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),  -- PBKDF2 Hash
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN
);

-- Tenant-User Verknüpfung
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    role VARCHAR(20),
    can_manage_properties BOOLEAN,
    can_manage_documents BOOLEAN,
    can_manage_users BOOLEAN,
    can_view_analytics BOOLEAN,
    can_export_data BOOLEAN,
    UNIQUE(user_id, tenant_id)
);
```

## 🔑 API Endpoints

### Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "Max",
  "last_name": "Mustermann",
  "tenant_name": "Mustermann Immobilien GmbH",
  "plan": "free",
  "billing_cycle": "monthly"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

## ✨ Viel Erfolg!

Alles ist jetzt eingerichtet und bereit für die Registration. Die Multi-Tenancy-Architektur ist vollständig implementiert und der erste User bekommt automatisch Owner-Rechte! 🎉
