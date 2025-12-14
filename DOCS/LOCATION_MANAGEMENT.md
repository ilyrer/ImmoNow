# Dynamic Location Management - AVM System

## Übersicht
Das AVM-System verwendet jetzt **dynamische Standortdaten** statt hardcodierter Städte. Städte, Dörfer und alle Ortschaften können flexibel hinzugefügt, bearbeitet und verwaltet werden.

## Was wurde geändert?

### Backend

1. **Neues Django-Modell: `LocationMarketData`**
   - Speichert Städte/Orte mit Marktdaten
   - Felder: Stadt, Bundesland, PLZ-Bereiche, Basispreis/m², Premium-Flag, Suburban-Flag, Einwohnerzahl
   - Datei: `backend/app/db/models/location.py`

2. **Location API-Endpoints** (`/api/v1/locations/`)
   - `GET /search?query=...` - Städte suchen (Autocomplete)
   - `GET /by-postal-code/{plz}` - Stadt per PLZ finden
   - `GET /` - Alle Locations (paginiert)
   - `GET /{id}` - Einzelne Location
   - `POST /` - Neue Location erstellen (Admin)
   - `PUT /{id}` - Location aktualisieren (Admin)
   - `DELETE /{id}` - Location löschen (Admin)
   - Datei: `backend/app/api/v1/locations.py`

3. **AVM Service angepasst**
   - `_get_base_price_per_sqm()` nutzt jetzt die Datenbank statt hardcodierte Preise
   - Automatische Anpassung für Premium/Suburban-Locations
   - Datei: `backend/app/services/avm_service.py`

4. **Seed-Command**
   - Initialisiert DB mit 78 deutschen Städten
   - Befehl: `python manage.py seed_locations`
   - Datei: `backend/app/management/commands/seed_locations.py`

### Frontend

1. **Location Service & Types**
   - API-Client für Location-Management
   - Dateien:
     - `frontend/src/services/location.ts`
     - `frontend/src/types/location.ts`

2. **Dynamisches City-Autocomplete**
   - AVM Wizard nutzt jetzt API statt statische Liste
   - Zeigt PLZ, Bundesland und Preis/m² an
   - Live-Suche mit Debouncing
   - Auto-Fill bei PLZ-Eingabe
   - Datei: `frontend/src/components/avm/wizard/Step1Location.tsx`

3. **Admin-UI für Location-Management**
   - Vollständiges CRUD-Interface
   - Suche, Filter, Bearbeiten, Löschen
   - Datei: `frontend/src/pages/LocationManagement.tsx`

## Neue Funktionen

### Für Benutzer
- ✅ **Jede Stadt, jedes Dorf eingeben**: Nicht mehr auf vordefinierte Liste beschränkt
- ✅ **Intelligentes Autocomplete**: Schlägt passende Städte vor basierend auf Eingabe
- ✅ **PLZ → Stadt**: Automatische Stadterkennung bei PLZ-Eingabe
- ✅ **Marktpreise live**: Zeigt aktuellen Marktpreis pro m² direkt im Autocomplete

### Für Admins
- ✅ **Neue Städte hinzufügen**: Über Admin-UI oder API
- ✅ **Marktpreise anpassen**: Preise pro m² individuell festlegen
- ✅ **Premium-Locations**: Spezielle Lagen mit +20% Aufschlag markieren
- ✅ **Vorstadtlagen**: Vororte mit -5% Abschlag kennzeichnen
- ✅ **Flexible PLZ-Bereiche**: PLZ-Ranges für akkurate Zuordnung

## Verwendung

### Backend starten
```bash
cd backend
python manage.py migrate
python manage.py seed_locations  # Initiale Städte laden
python manage.py runserver
```

### Neue Stadt hinzufügen (API)
```bash
POST /api/v1/locations/
{
  "city": "Musterstadt",
  "state": "Bayern",
  "postal_code_start": "85000",
  "postal_code_end": "85099",
  "base_price_per_sqm": 3500,
  "is_premium_location": false,
  "is_suburban": false,
  "population": 50000,
  "location_type": "city",
  "is_active": true
}
```

### Neue Stadt hinzufügen (Django Admin)
1. Gehe zu `/admin/`
2. Öffne "Location Market Data"
3. Klicke "Add Location Market Data"
4. Fülle Formular aus und speichere

### Neue Stadt hinzufügen (Frontend Admin-UI)
1. Navigiere zu `/locations` (Admin-Bereich)
2. Klicke "Neue Location"
3. Fülle Formular aus
4. Speichern

## Migration von Alt → Neu

Die alte `germanCities.ts` Datei ist nicht mehr erforderlich. Alle Städte sind jetzt in der Datenbank:

**Vorher:**
```typescript
// Hardcodiert in germanCities.ts
export const GERMAN_CITIES = [
  { name: 'München', state: 'Bayern', ... },
  ...
];
```

**Nachher:**
```typescript
// Dynamisch aus API geladen
const cities = await locationService.searchLocations('München');
```

## Datenbank-Schema

```sql
CREATE TABLE location_market_data (
    id INTEGER PRIMARY KEY,
    city VARCHAR(200) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Deutschland',
    postal_code_start VARCHAR(10),
    postal_code_end VARCHAR(10),
    base_price_per_sqm DECIMAL(10,2) NOT NULL,
    is_premium_location BOOLEAN DEFAULT FALSE,
    is_suburban BOOLEAN DEFAULT FALSE,
    population INTEGER,
    location_type VARCHAR(50) DEFAULT 'city',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Vorteile der neuen Lösung

1. **Flexibilität**: Keine Code-Änderungen nötig, um neue Orte hinzuzufügen
2. **Skalierbarkeit**: Unbegrenzte Anzahl von Locations möglich
3. **Aktualität**: Marktpreise können jederzeit angepasst werden
4. **Genauigkeit**: PLZ-basierte Preisanpassungen für Mikro-Lagen
5. **Admin-freundlich**: Einfache Verwaltung über UI ohne Entwickler-Know-how

## Nächste Schritte (Optional)

- [ ] Import-Funktion für CSV/Excel mit vielen Städten
- [ ] Automatische Preisanpassung basierend auf Marktdaten-APIs
- [ ] Historische Preisentwicklung tracken
- [ ] Karte mit allen verfügbaren Locations
- [ ] Bulk-Operationen (mehrere Locations gleichzeitig bearbeiten)

## Support

Bei Fragen oder Problemen:
- Backend-API-Docs: `/docs` (FastAPI Swagger UI)
- Django Admin: `/admin/`
- Location Management UI: `/locations`
