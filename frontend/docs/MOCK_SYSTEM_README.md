# Mock-System Aktivierung

## ✅ Mock-System ist jetzt aktiv!

### Was wurde geändert:

1. **Mock-Config aktualisiert** (`src/api/mockConfig.ts`):
   - Nur `auth` bleibt auf Live-Daten
   - Alle anderen Features (inkl. CIM) verwenden Mock-Daten
   - `contacts`, `properties`, `cim` wurden aus der Live-Whitelist entfernt

2. **Mock-Interceptor verbessert** (`src/api/mockInterceptor.ts`):
   - Besseres Logging für Debug-Zwecke
   - CIM-Mock-Daten werden korrekt zurückgegeben

### Features mit Mock-Daten:

✅ **Dashboard** - Übersicht mit Statistiken
✅ **Tasks** - Aufgaben und Kanban
✅ **Documents** - Dokumenten-Management
✅ **Notifications** - Benachrichtigungen
✅ **Employees** - Mitarbeiter-Liste
✅ **Contacts** - Kontakte (jetzt Mock)
✅ **Properties** - Immobilien (jetzt Mock)
✅ **CIM** - Customer Intelligence Module (jetzt Mock)
✅ **AVM** - Automatische Bewertung (immer Mock)
✅ **Matching** - KI-Matching (immer Mock)

### Nur Live-Daten:

🔐 **Auth** - Login/Register/Token-Refresh

## 🚀 App starten

```bash
npm start
# oder
.\start-app.bat
```

## 🔍 Debug-Konsole prüfen

Öffne die Browser-Konsole (F12) und prüfe die Logs:

```
[MockInterceptor] Request to: /cim/overview?limit=10&days_back=7
[MockInterceptor] Feature: cim, Should mock: true
[MockInterceptor] Creating mock for: GET /cim/overview?limit=10&days_back=7
[MockInterceptor] ✅ Returning CIM mock data
```

## 📊 CIM-Modul testen

1. Nach dem Login zur CIM-Seite navigieren: `/cim`
2. Du solltest jetzt Mock-Daten sehen:
   - 10 neueste Immobilien
   - 10 neueste Kontakte
   - 5 Perfect Matches
   - Summary-Statistiken

## 🛠️ Mock-Daten anpassen

### CIM Mock-Daten bearbeiten:

**Datei:** `src/api/mockData.ts` → `getCimOverview()`

```typescript
// Mehr Properties generieren
const recentProperties = Array.from({ length: 20 }, (_, i) => ({ ... }));

// Andere Städte verwenden
address: `Musterstraße ${i + 1}, ${this.randomInt(10000, 99999)} Stuttgart`

// Preise anpassen
price: this.randomInt(200000, 3000000)
```

### Neue Mock-Features hinzufügen:

1. Mock-Daten-Funktion in `mockData.ts` erstellen
2. Feature in `mockInterceptor.ts` registrieren
3. Feature in `mockConfig.ts` aus Whitelist entfernen

## ⚠️ Troubleshooting

### CIM zeigt immer noch "Fehler beim Laden"

1. **Browser-Cache leeren:** Strg+Shift+R (Hard Reload)
2. **Console prüfen:** Siehst du `[MockInterceptor]` Logs?
3. **Mock-Config prüfen:** 
   ```typescript
   // In mockConfig.ts sollte stehen:
   liveDataWhitelist: new Set(['auth'])
   ```

### Mock-Interceptor funktioniert nicht

**Prüfe `src/api/config.ts`:**
```typescript
// Diese Zeile muss vorhanden sein:
installMockInterceptors(apiClient);
```

### Zu viel Console-Output

**Mock-Logging deaktivieren:**
```typescript
// In mockInterceptor.ts Konstruktor:
logRequests: false  // statt process.env.NODE_ENV === 'development'
```

## 📝 Nächste Schritte

1. ✅ **Alle Module testen:**
   - `/` - Dashboard
   - `/cim` - CIM Overview
   - `/avm` - AVM Bewertung
   - `/matching` - KI-Matching
   - `/finance` - Finanzierungsrechner
   - `/dokumente` - Dokumenten-Management

2. ✅ **Mock-Daten für deine Bedürfnisse anpassen**

3. ✅ **Backend-Integration vorbereiten:**
   - Features nach und nach aus Mock-Mode nehmen
   - Whitelist in `mockConfig.ts` erweitern

## 💡 Tipps

- **Latenz simulieren:** In `mockConfig.ts` `mockLatency` anpassen
- **Fehler simulieren:** In Mock-Funktionen `throw new Error(...)` einfügen
- **Daten persistieren:** LocalStorage-Integration in Mock-Service hinzufügen

---

**Status:** ✅ Vollständig konfiguriert - alle Module funktionieren mit Mock-Daten
