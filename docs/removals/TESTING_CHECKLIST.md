# 🧪 Testing Checklist - PropertiesPage Backend-Integration

## ✅ Automatische Tests durchgeführt

### 1. Compilation
- [x] TypeScript kompiliert ohne Fehler ✅
- [x] Keine ESLint-Warnungen ✅
- [x] Import-Pfade korrekt ✅

### 2. Routing
- [x] App.jsx Import aktualisiert ✅
- [x] Route auf PropertiesPage gemappt ✅
- [x] User-Prop wird übergeben ✅

### 3. Code-Qualität
- [x] Alle Imports vorhanden ✅
- [x] Types korrekt verwendet ✅
- [x] Hooks richtig eingebunden ✅
- [x] Service-Methoden aufgerufen ✅

---

## 🔍 Manuelle Tests (bitte durchführen)

### Backend-Verbindung
- [ ] Backend läuft auf Port 8000
- [ ] GET /properties gibt Daten zurück
- [ ] GET /properties/{id}/metrics funktioniert
- [ ] Authentication Header wird gesendet

### PropertiesPage laden
1. [ ] Navigiere zu `/properties`
2. [ ] **Erwartung:** Spinner wird kurz angezeigt
3. [ ] **Erwartung:** Echte Immobilien vom Backend erscheinen
4. [ ] **Erwartung:** Keine "Neue Immobilie" Mock-Daten mehr

### Suche
1. [ ] Tippe in Suchfeld: "Berlin"
2. [ ] **Erwartung:** Nur Berliner Immobilien werden angezeigt
3. [ ] Lösche Suche
4. [ ] **Erwartung:** Alle Immobilien wieder da

### Filter
1. [ ] Wähle Type: "Wohnung"
2. [ ] **Erwartung:** Nur Wohnungen werden angezeigt
3. [ ] Wähle Status: "Aktiv"
4. [ ] **Erwartung:** Nur aktive Wohnungen
5. [ ] Klicke "Alle zurücksetzen"
6. [ ] **Erwartung:** Filter werden geleert

### Sortierung
1. [ ] Wähle "Preis aufsteigend"
2. [ ] **Erwartung:** Günstigste Immobilie zuerst
3. [ ] Wähle "Preis absteigend"
4. [ ] **Erwartung:** Teuerste Immobilie zuerst

### View Toggle
1. [ ] Klicke Grid-Icon (Standard)
2. [ ] **Erwartung:** Karten-Layout sichtbar
3. [ ] Klicke List-Icon
4. [ ] **Erwartung:** Listen-Layout sichtbar

### Pagination
1. [ ] Scrolle nach unten
2. [ ] Klicke "Weiter"
3. [ ] **Erwartung:** Seite 2 wird geladen
4. [ ] **Erwartung:** Scroll springt zu Seitenanfang
5. [ ] Klicke "Zurück"
6. [ ] **Erwartung:** Seite 1 wieder da

### Favoriten
1. [ ] Klicke Herz-Icon bei einer Immobilie
2. [ ] **Erwartung:** Herz wird rot gefüllt
3. [ ] **Erwartung:** Backend API-Call zu POST /properties/{id}/favorite
4. [ ] Klicke nochmal
5. [ ] **Erwartung:** Herz wird wieder leer

### Löschen
1. [ ] Klicke "Löschen" bei einer Immobilie
2. [ ] **Erwartung:** Confirm-Dialog erscheint
3. [ ] Klicke "Abbrechen"
4. [ ] **Erwartung:** Nichts passiert
5. [ ] Klicke "Löschen" nochmal
6. [ ] Klicke "OK"
7. [ ] **Erwartung:** Immobilie verschwindet sofort
8. [ ] **Erwartung:** Backend DELETE-Call

### Prefetch
1. [ ] Hover über eine Immobilien-Karte
2. [ ] **Erwartung:** (im Network Tab) GET /properties/{id} wird aufgerufen
3. [ ] Klicke auf Immobilie
4. [ ] **Erwartung:** Detail-Seite lädt instant (wegen Prefetch)

### Error Handling
1. [ ] Stoppe Backend-Server
2. [ ] Lade Seite neu
3. [ ] **Erwartung:** Error-Screen mit Retry-Button
4. [ ] Starte Backend wieder
5. [ ] Klicke "Erneut versuchen"
6. [ ] **Erwartung:** Daten werden geladen

### Empty State
1. [ ] Filtere nach etwas, das nicht existiert
2. [ ] **Erwartung:** "Keine Immobilien gefunden" Message
3. [ ] **Erwartung:** "Filter anpassen" Hinweis
4. [ ] Klicke "Alle zurücksetzen"
5. [ ] **Erwartung:** Immobilien wieder da

### Responsive Design
1. [ ] Öffne DevTools (F12)
2. [ ] Toggle Device Toolbar (Ctrl+Shift+M)
3. [ ] Teste iPhone 12
   - [ ] Grid-Layout funktioniert (1 Spalte)
   - [ ] Filter sind nutzbar
   - [ ] Buttons sind klickbar
4. [ ] Teste iPad
   - [ ] Grid-Layout (2 Spalten)
   - [ ] Alles gut lesbar
5. [ ] Teste Desktop
   - [ ] Grid-Layout (4 Spalten)
   - [ ] Alle Features nutzbar

### Dark Mode
1. [ ] Toggle Dark Mode im App
2. [ ] **Erwartung:** Alle Farben passen
3. [ ] **Erwartung:** Kontrast ist gut
4. [ ] **Erwartung:** Keine schwarze Schrift auf schwarzem Hintergrund

---

## 🐛 Fehlersuche

### Wenn keine Daten geladen werden:
1. Check Backend läuft: `http://localhost:8000/docs`
2. Check Network Tab: Welche API-Calls werden gemacht?
3. Check Console: Gibt es Fehler?
4. Check Token: Ist User eingeloggt?

### Wenn alte Mock-Daten noch da sind:
1. Hard-Refresh: Ctrl+Shift+R
2. Cache leeren: DevTools → Application → Clear Storage
3. Check: Ist Properties.tsx wirklich gelöscht?
4. Check: Verwendet App.jsx PropertiesPage?

### Wenn Filter nicht funktionieren:
1. Network Tab: Werden Query-Params gesendet?
2. Backend Logs: Werden Filter empfangen?
3. Console: useProperties Hook Fehler?

---

## 📊 Expected API Calls

### Initial Load (Seite öffnen):
```
GET /api/v1/properties?page=1&size=20&sort_by=created_at&sort_order=desc
GET /api/v1/users/me (User-Info)
GET /api/v1/tenants/me (Tenant-Info)
```

### Nach Suche "Berlin":
```
GET /api/v1/properties?page=1&size=20&search=Berlin&sort_by=created_at&sort_order=desc
```

### Nach Filter Type="Wohnung":
```
GET /api/v1/properties?page=1&size=20&property_type=apartment&sort_by=created_at&sort_order=desc
```

### Nach Favoriten-Toggle:
```
POST /api/v1/properties/{id}/favorite
```

### Nach Löschen:
```
DELETE /api/v1/properties/{id}
```

### Nach Hover (Prefetch):
```
GET /api/v1/properties/{id}
```

---

## ✅ Success Criteria

**PropertiesPage gilt als erfolgreich integriert, wenn:**

1. ✅ Keine Mock-Daten mehr sichtbar ("Neue Immobilie" weg)
2. ✅ Echte Daten vom Backend werden angezeigt
3. ✅ Suche filtert Backend-seitig
4. ✅ Filter ändern Query-Params
5. ✅ Pagination funktioniert
6. ✅ Grid/List Toggle wechselt View
7. ✅ Favoriten werden getoggelt
8. ✅ Löschen entfernt Immobilien
9. ✅ Prefetch lädt Daten on-hover
10. ✅ Error States werden angezeigt
11. ✅ Loading States geben Feedback
12. ✅ Dark Mode funktioniert
13. ✅ Responsive für Mobile/Tablet/Desktop

---

## 🎯 Next Steps nach erfolgreichen Tests

1. **PropertyDetail.tsx** - Metrics integrieren
2. **PropertyCreateWizard.tsx** - Form mit Backend verbinden
3. **Unit Tests** - Services/Hooks testen
4. **E2E Tests** - User-Flows automatisieren
5. **Performance** - Debouncing, Virtualization

---

## 📝 Test Results Log

**Datum:** _______________  
**Tester:** _______________

| Test | Status | Notizen |
|------|--------|---------|
| Backend-Verbindung | [ ] | |
| PropertiesPage laden | [ ] | |
| Suche | [ ] | |
| Filter | [ ] | |
| Sortierung | [ ] | |
| View Toggle | [ ] | |
| Pagination | [ ] | |
| Favoriten | [ ] | |
| Löschen | [ ] | |
| Prefetch | [ ] | |
| Error Handling | [ ] | |
| Empty State | [ ] | |
| Responsive Design | [ ] | |
| Dark Mode | [ ] | |

**Gesamtstatus:** [ ] Alle Tests bestanden ✅

**Gefundene Bugs:**
1. _______________
2. _______________
3. _______________

**Nächste Schritte:**
1. _______________
2. _______________
