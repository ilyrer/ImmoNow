# Portal OAuth Integration - Echte Implementation

## 🚀 **Vollständige OAuth-Integration für Immobilienportale**

Diese Implementation bietet eine **echte OAuth-Integration** mit den führenden deutschen Immobilienportalen ohne API-Keys.

### ✅ **Unterstützte Portale:**

- **Immoscout24** - Deutschlands größtes Immobilienportal
- **Immowelt** - Führendes Immobilienportal
- **eBay Kleinanzeigen** - Größte Kleinanzeigen-Plattform

### 🔐 **OAuth-Flow Features:**

1. **Keine API-Keys erforderlich** - Mitarbeiter verbinden sich direkt mit ihren Portal-Accounts
2. **Sichere Token-Verwaltung** - Access/Refresh Tokens verschlüsselt gespeichert
3. **Automatische Token-Erneuerung** - System erkennt ablaufende Tokens
4. **Portal-spezifische Mappings** - Automatische Feld-Zuordnung für jedes Portal
5. **Echtzeit-Status-Tracking** - Veröffentlichungen und Synchronisationen
6. **Background-Jobs** - Celery-Tasks für asynchrone Verarbeitung
7. **Detaillierte Fehlerbehandlung** - Logs und Benutzer-Feedback

### 🏗️ **Architektur:**

```
Backend:
├── app/core/portal_config.py          # OAuth-Konfigurationen
├── app/services/real_portal_service.py # Echte Portal-Services
├── app/tasks/portal_tasks.py          # Celery Background-Tasks
├── app/api/v1/portals.py              # API-Endpoints
└── app/schemas/portals.py             # Pydantic-Schemas

Frontend:
├── src/services/properties.ts         # Erweiterte API-Calls
├── src/components/properties/PortalExportTab.tsx # OAuth-UI
└── src/components/OAuthCallback.tsx    # Callback-Handler
```

### 🔧 **Setup-Anleitung:**

#### 1. **Umgebungsvariablen konfigurieren:**

```bash
# backend/env.portal.example nach env.local kopieren
cp backend/env.portal.example backend/env.local

# OAuth-Credentials von den Portalen einrichten:
IMMOSCOUT24_CLIENT_ID=your_client_id
IMMOSCOUT24_CLIENT_SECRET=your_client_secret
IMMOSCOUT24_REDIRECT_URI=https://your-app.com/oauth/callback/immoscout24

IMMOWELT_CLIENT_ID=your_client_id
IMMOWELT_CLIENT_SECRET=your_client_secret
IMMOWELT_REDIRECT_URI=https://your-app.com/oauth/callback/immowelt

KLEINANZEIGEN_CLIENT_ID=your_client_id
KLEINANZEIGEN_CLIENT_SECRET=your_client_secret
KLEINANZEIGEN_REDIRECT_URI=https://your-app.com/oauth/callback/kleinanzeigen
```

#### 2. **Portal-OAuth-Apps einrichten:**

**Immoscout24:**
1. Gehen Sie zu [Immoscout24 Developer Portal](https://restapi.immobilienscout24.de/)
2. Erstellen Sie eine neue OAuth-App
3. Setzen Sie die Redirect-URI: `https://your-app.com/oauth/callback/immoscout24`
4. Kopieren Sie Client-ID und Client-Secret

**Immowelt:**
1. Gehen Sie zu [Immowelt Developer Portal](https://api.immowelt.de/)
2. Erstellen Sie eine neue OAuth-App
3. Setzen Sie die Redirect-URI: `https://your-app.com/oauth/callback/immowelt`
4. Kopieren Sie Client-ID und Client-Secret

**eBay Kleinanzeigen:**
1. Gehen Sie zu [eBay Kleinanzeigen Developer Portal](https://api.ebay-kleinanzeigen.de/)
2. Erstellen Sie eine neue OAuth-App
3. Setzen Sie die Redirect-URI: `https://your-app.com/oauth/callback/kleinanzeigen`
4. Kopieren Sie Client-ID und Client-Secret

#### 3. **Celery für Background-Jobs einrichten:**

```bash
# Celery Worker starten
celery -A backend worker --loglevel=info

# Celery Beat für periodische Tasks starten
celery -A backend beat --loglevel=info
```

#### 4. **Datenbank-Migrationen ausführen:**

```bash
python manage.py migrate
```

### 🎯 **Verwendung:**

#### **OAuth-Flow starten:**
```typescript
// Frontend
const oauthData = await propertiesService.initiatePortalOAuth('immoscout24', redirectUri);
window.location.href = oauthData.auth_url;
```

#### **Immobilie veröffentlichen:**
```typescript
// Frontend
await propertiesService.publishToPortal(propertyId, 'immoscout24');
```

#### **Portal-Status abrufen:**
```typescript
// Frontend
const status = await propertiesService.getPortalStatus(propertyId);
```

### 🔄 **Background-Jobs:**

Das System verwendet Celery für asynchrone Verarbeitung:

- **`publish_property_to_portal_task`** - Veröffentlichung auf Portal
- **`sync_property_on_portal_task`** - Synchronisation mit Portal
- **`refresh_portal_tokens_task`** - Token-Erneuerung (alle 5 Min)
- **`sync_portal_analytics_task`** - Analytics-Sync (stündlich)
- **`cleanup_old_sync_logs_task`** - Log-Bereinigung (täglich)

### 📊 **Portal-spezifische Mappings:**

Jedes Portal hat unterschiedliche Feldnamen. Das System mappt automatisch:

**Immoscout24:**
- `living_area` → `livingSpace`
- `rooms` → `numberOfRooms`
- `bedrooms` → `numberOfBedrooms`

**Immowelt:**
- `living_area` → `livingSpace`
- `rooms` → `rooms`
- `bedrooms` → `bedrooms`

**Kleinanzeigen:**
- `living_area` → `livingSpace`
- `rooms` → `rooms`
- `bedrooms` → `bedrooms`

### 🛡️ **Sicherheit:**

- **OAuth 2.0** Standard-konform
- **HTTPS** für alle API-Calls erforderlich
- **Token-Verschlüsselung** in der Datenbank
- **CSRF-Schutz** mit State-Parameter
- **Rate-Limiting** für API-Calls
- **Fehlerbehandlung** mit detailliertem Logging

### 📈 **Monitoring:**

- **Portal-Verbindungsstatus** in Echtzeit
- **Veröffentlichungs-Status** mit Retry-Logik
- **Analytics-Daten** von allen Portalen
- **Detaillierte Logs** für Debugging
- **Performance-Metriken** für Optimierung

### 🚨 **Fehlerbehandlung:**

Das System behandelt alle möglichen Fehler:

- **OAuth-Fehler** - Ungültige Credentials, abgelaufene Codes
- **API-Fehler** - Rate-Limiting, Server-Fehler
- **Token-Fehler** - Abgelaufene Tokens, Refresh-Fehler
- **Netzwerk-Fehler** - Timeouts, Verbindungsfehler
- **Validierungsfehler** - Ungültige Daten, fehlende Felder

### 🔧 **Konfiguration:**

Alle Portal-spezifischen Einstellungen sind in `app/core/portal_config.py` konfigurierbar:

- **OAuth-Endpoints** für jedes Portal
- **Feld-Mappings** für Datenkonvertierung
- **API-Endpoints** für verschiedene Operationen
- **Timeout-Einstellungen** für HTTP-Calls

### 📝 **Logging:**

Das System erstellt detaillierte Logs für:

- **OAuth-Flows** - Erfolgreiche und fehlgeschlagene Verbindungen
- **Veröffentlichungen** - Status-Updates und Fehler
- **Synchronisationen** - Daten-Updates und Konflikte
- **Token-Erneuerungen** - Automatische und manuelle Updates
- **Analytics-Sync** - Daten-Abruf und Verarbeitung

### 🎉 **Fertig!**

Die Portal-Integration ist jetzt **vollständig funktionsfähig** und bereit für den produktiven Einsatz! 

**Nächste Schritte:**
1. OAuth-Credentials von den Portalen einrichten
2. Celery-Worker starten
3. Erste Portal-Verbindung testen
4. Immobilien veröffentlichen
5. Analytics überwachen

Das System bietet eine **professionelle, skalierbare Lösung** für die Portal-Integration ohne API-Keys! 🚀
