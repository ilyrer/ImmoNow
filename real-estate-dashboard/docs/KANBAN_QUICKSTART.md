# 🚀 Kanban Board - Quick Start Guide

## Schnellstart in 3 Schritten

### 1. Installation überprüfen ✅
Alle benötigten Dependencies sind bereits installiert:
- ✅ `@hello-pangea/dnd` (Drag & Drop)
- ✅ `framer-motion` (Animationen)
- ✅ `react-query` (API-Integration)
- ✅ `tailwindcss` (Styling)

### 2. App starten 🚀
```bash
cd real-estate-dashboard
npm start
```

### 3. Kanban Board öffnen 📋
Navigiere zu: **http://localhost:3000/kanban**

---

## ⚡ Erste Schritte

### Aufgabe erstellen
1. Klicke auf **"+ Neue Aufgabe"** (oben rechts)
2. Gib einen Titel ein
3. Optional: Weitere Details über "Mehr Details ▶"
4. Klicke **"✓ Erstellen"**

### Aufgabe verschieben
- **Ziehen & Ablegen**: Task mit Maus greifen und in andere Spalte ziehen
- **Mobile**: Task antippen und halten, dann verschieben

### Aufgabe bearbeiten
- **Klick auf Task-Karte** → Detail-Modal öffnet sich
- Im Modal: **"✏️ Bearbeiten"** → Felder ändern → **"💾 Speichern"**

### Mehrere Aufgaben bearbeiten
1. **"☑️ Mehrfach"** aktivieren (oben rechts)
2. Tasks anklicken zum Auswählen
3. Bulk-Aktionen nutzen (Verschieben, Löschen, Zuweisen)
4. **"✕ Beenden"** wenn fertig

---

## 🎯 Hauptfunktionen im Überblick

### 🔍 Suche & Filter
- **Suchfeld**: Durchsuche Titel, Beschreibung, Standort
- **Prioritätsfilter**: Kritisch 🔴, Hoch 🟠, Mittel 🟡, Niedrig 🟢
- **Mitarbeiterfilter**: Nach zugewiesener Person filtern

### 📊 Spalten
1. **Zu erledigen** (📋) - Geplante Aufgaben
2. **In Arbeit** (⚡) - Aktiv bearbeitet (Max. 5 Tasks)
3. **Überprüfung** (👁️) - Zur Freigabe (Max. 3 Tasks)
4. **Abgeschlossen** (✅) - Erfolgreich erledigt

**WIP-Limit**: Wenn Spalte überfüllt → Rote Warnung erscheint

### 🏠 Immobilien-Features
- **Standort**: 📍 München, Schwabing
- **Preis**: 💶 450.000 €
- **Objekttyp**: 🏢 Wohnung, 🏡 Haus, 🏬 Gewerbe, 🌍 Grundstück
- **Finanzierung**: 💰 Status-Badge (Geprüft/Genehmigt/Abgelehnt)

---

## ⌨️ Tastatur-Shortcuts

| Taste | Aktion |
|-------|--------|
| `Enter` | Aufgabe speichern |
| `Esc` | Modal/Aktion abbrechen |
| `Ctrl+K` | Suche fokussieren |
| `Shift + Klick` | Mehrfachauswahl |

---

## 💡 Tipps & Tricks

### Produktivität
1. **Quick Add**: Klicke `+` in Spalten-Header für schnelle Erstellung
2. **Labels nutzen**: Kategorisiere Tasks mit farbigen Labels
3. **Subtasks**: Teile große Tasks in kleinere Schritte auf
4. **Kommentare**: Diskutiere Details direkt im Task

### Organisation
- **Prioritäten**: Kritische Tasks zuerst bearbeiten
- **WIP-Limit beachten**: Nicht zu viele Tasks gleichzeitig
- **Deadlines setzen**: Überfällige Tasks werden rot markiert
- **Fortschritt tracken**: Nutze den Progress-Slider (0-100%)

### Team-Arbeit
- **Mitarbeiter zuweisen**: Jede Person sieht eigene Aufgaben
- **Filter nutzen**: Zeige nur Tasks für bestimmte Person
- **Kommentare**: Halte Team auf dem Laufenden

---

## 🎨 Ansicht anpassen

### Dark Mode
- Automatisch basierend auf System-Einstellung
- Oder manuell in den Settings umschalten

### Filter speichern
- Deine Filter-Einstellungen bleiben erhalten
- Beim nächsten Besuch automatisch wiederhergestellt

---

## 📱 Mobile Nutzung

### Smartphone
- **1 Spalte**: Wische horizontal zwischen Spalten
- **Touch & Hold**: Um Task zu verschieben
- **Tap**: Um Task-Details zu öffnen

### Tablet
- **2-3 Spalten**: Gleichzeitig sichtbar
- **Touch-optimiert**: Größere Tap-Targets
- **Landscape empfohlen**: Beste Übersicht

---

## 🐛 Probleme?

### Task wird nicht verschoben
→ Prüfe Internet-Verbindung, dann Seite neu laden

### Filter zeigt keine Tasks
→ Klicke auf "Alle Prioritäten" & "Alle Mitarbeiter"

### Langsame Performance
→ Nutze Filter, um Tasks zu reduzieren (<50 pro Spalte)

### Blur-Effekt fehlt
→ Browser aktualisieren (Chrome, Firefox, Safari, Edge empfohlen)

---

## 📚 Weitere Dokumentation

- **Vollständige Doku**: `docs/KANBAN_README.md`
- **Implementierung**: `docs/KANBAN_IMPLEMENTATION.md`
- **API-Integration**: `docs/API_DOCUMENTATION.md`

---

## ✨ Best Practices

### Für Makler
1. **Viewing-Tasks**: Priorität "Hoch", Label "VIEWING"
2. **Vertragsverhandlungen**: In "Überprüfung", Deadline setzen
3. **Marketing**: Label "MARKETING", Fortschritt tracken

### Für Verwalter
1. **Maintenance**: Label "MAINTENANCE", Dringlichkeit festlegen
2. **Dokumentation**: Exposés an Tasks anhängen
3. **Client-Kommunikation**: Kommentare für Abstimmungen

### Für Team-Leads
1. **Sprint-Planning**: Bulk-Select für schnelle Zuweisung
2. **Workload**: WIP-Limits beachten (nicht überlasten)
3. **Reports**: Statistiken im Header monitoren

---

**Viel Erfolg mit dem Kanban Board! 🎉**

Bei Fragen: Siehe Hauptdokumentation oder kontaktiere das Dev-Team.
